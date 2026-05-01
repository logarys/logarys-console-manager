import { Injectable } from "@nestjs/common";
import { Document, Filter, Sort } from "mongodb";
import { MongoService } from "../mongo/mongo.service.js";
import { QueryService } from "../query/query.service.js";
import { LogDocument } from "./log-document.js";

interface StoredNormalizedLogDocument extends Document {
  source?: string;
  createdAt?: Date;
  receivedAt?: Date;
  payload?: {
    pipelineId?: string;
    receivedAt?: string;
    normalizedLog?: {
      timestamp?: string | Date;
      level?: string;
      message?: string;
      source?: string;
      host?: string;
      context?: Record<string, unknown>;
    };
  };
}

const ROTATED_LOG_COLLECTION_PATTERN = /^logs_\d{4}_\d{2}_\d{2}$/;

const ROTATED_FIELD_MAP = new Map<string, string>([
  ["pipelineId", "payload.pipelineId"],
  ["timestamp", "payload.normalizedLog.timestamp"],
  ["level", "payload.normalizedLog.level"],
  ["message", "payload.normalizedLog.message"],
  ["normalizedMessage", "payload.normalizedLog.message"],
  ["source", "payload.normalizedLog.source"],
  ["host", "payload.normalizedLog.host"],
  ["service", "payload.normalizedLog.context.service"],
  ["environment", "payload.normalizedLog.context.env"],
  ["env", "payload.normalizedLog.context.env"],
  ["raw", "payload.normalizedLog.context.raw"],
]);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function remapFilterFields(value: unknown, fieldMap: Map<string, string>): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => remapFilterFields(entry, fieldMap));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const remapped: Record<string, unknown> = {};

  for (const [key, childValue] of Object.entries(value)) {
    const nextKey = key.startsWith("$") ? key : fieldMap.get(key) ?? key;
    remapped[nextKey] = remapFilterFields(childValue, fieldMap);
  }

  return remapped;
}

function andFilters<T extends Document>(...filters: Filter<T>[]): Filter<T> {
  const activeFilters = filters.filter((filter) => Object.keys(filter).length > 0);

  if (activeFilters.length === 0) {
    return {};
  }

  if (activeFilters.length === 1) {
    return activeFilters[0];
  }

  return { $and: activeFilters } as Filter<T>;
}

function toDate(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

function collectionNameForDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `logs_${year}_${month}_${day}`;
}

@Injectable()
export class LogsService {
  constructor(
    private readonly mongo: MongoService,
    private readonly queryService: QueryService,
  ) {}

  async search(params: {
    query?: string;
    text?: string;
    pipelineId?: string;
    level?: string;
    from?: string;
    to?: string;
    language?: string;
    limit: number;
    skip: number;
    sort?: Sort;
  }): Promise<LogDocument[]> {
    const converted = params.query
      ? this.queryService.convert(params.language ?? "rsql", "mongodb", params.query)
      : { filter: {} };

    const baseFilter: Filter<LogDocument> = { ...(converted.filter as Filter<LogDocument>) };
    const legacyFilter = this.buildLegacyFilter(baseFilter, params);
    const rotatedFilter = this.buildRotatedFilter(baseFilter, params);
    const collectionNames = await this.resolveLogCollections(params.from, params.to);
    const results: LogDocument[] = [];

    for (const collectionName of collectionNames) {
      const isRotatedCollection = ROTATED_LOG_COLLECTION_PATTERN.test(collectionName);
      const collection = this.mongo.collection<Document>(collectionName);
      const filter = isRotatedCollection ? rotatedFilter : legacyFilter;
      const sort = this.resolveSort(params.sort, isRotatedCollection);
      const documents = await collection
        .find(filter as Filter<Document>)
        .sort(sort)
        .limit(params.skip + params.limit)
        .toArray();

      results.push(
        ...documents.map((document) =>
          isRotatedCollection
            ? this.mapStoredLog(document as StoredNormalizedLogDocument)
            : (document as LogDocument),
        ),
      );
    }

    return results
      .sort((a, b) => this.getTimestampMs(b) - this.getTimestampMs(a))
      .slice(params.skip, params.skip + params.limit);
  }

  humanize(log: LogDocument): string {
    const source = log.source ? ` from ${log.source}` : "";
    const host = log.host ? ` on ${log.host}` : "";
    return `[${log.level}]${source}${host}: ${log.message}`;
  }

  private buildLegacyFilter(
    baseFilter: Filter<LogDocument>,
    params: {
      text?: string;
      pipelineId?: string;
      level?: string;
      from?: string;
      to?: string;
    },
  ): Filter<LogDocument> {
    const filters: Filter<LogDocument>[] = [baseFilter];

    if (params.pipelineId) {
      filters.push({ pipelineId: params.pipelineId });
    }

    if (params.level) {
      filters.push({ level: params.level });
    }

    const dateFilter = this.buildLegacyDateFilter(params.from, params.to);

    if (dateFilter) {
      filters.push({ timestamp: dateFilter });
    }

    if (params.text) {
      const regex = new RegExp(escapeRegex(params.text), "i");
      filters.push({
        $or: [
          { message: regex },
          { normalizedMessage: regex },
          { source: regex },
          { service: regex },
          { host: regex },
          { errorType: regex },
          { errorCode: regex },
        ],
      });
    }

    return andFilters(...filters);
  }

  private buildRotatedFilter(
    baseFilter: Filter<LogDocument>,
    params: {
      text?: string;
      pipelineId?: string;
      level?: string;
      from?: string;
      to?: string;
    },
  ): Filter<StoredNormalizedLogDocument> {
    const filters: Filter<StoredNormalizedLogDocument>[] = [
      remapFilterFields(baseFilter, ROTATED_FIELD_MAP) as Filter<StoredNormalizedLogDocument>,
    ];

    if (params.pipelineId) {
      filters.push({
        $or: [
          { "payload.pipelineId": params.pipelineId },
          { source: params.pipelineId },
          { "payload.normalizedLog.source": params.pipelineId },
        ],
      });
    }

    if (params.level) {
      filters.push({ "payload.normalizedLog.level": params.level });
    }

    const dateFilter = this.buildRotatedDateFilter(params.from, params.to);

    if (dateFilter) {
      filters.push({ "payload.normalizedLog.timestamp": dateFilter });
    }

    if (params.text) {
      const regex = new RegExp(escapeRegex(params.text), "i");
      filters.push({
        $or: [
          { "payload.normalizedLog.message": regex },
          { "payload.normalizedLog.source": regex },
          { "payload.normalizedLog.level": regex },
          { "payload.normalizedLog.host": regex },
          { "payload.normalizedLog.context.service": regex },
          { "payload.normalizedLog.context.env": regex },
          { "payload.normalizedLog.context.raw": regex },
          { source: regex },
        ],
      });
    }

    return andFilters(...filters);
  }

  private buildLegacyDateFilter(from?: string, to?: string): Filter<LogDocument>["timestamp"] | undefined {
    const fromDate = toDate(from);
    const toDateValue = toDate(to);
    const filter: Record<string, Date> = {};

    if (fromDate) {
      filter.$gte = fromDate;
    }

    if (toDateValue) {
      filter.$lt = toDateValue;
    }

    return Object.keys(filter).length > 0 ? filter as Filter<LogDocument>["timestamp"] : undefined;
  }

  private buildRotatedDateFilter(from?: string, to?: string): Record<string, string> | undefined {
    const fromDate = toDate(from);
    const toDateValue = toDate(to);
    const filter: Record<string, string> = {};

    if (fromDate) {
      filter.$gte = fromDate.toISOString();
    }

    if (toDateValue) {
      filter.$lt = toDateValue.toISOString();
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  private async resolveLogCollections(from?: string, to?: string): Promise<string[]> {
    const existingCollections = await this.mongo.listCollectionNames();
    const logCollections = existingCollections.filter(
      (name) => name === "logs" || ROTATED_LOG_COLLECTION_PATTERN.test(name),
    );

    if (!from && !to) {
      return logCollections.sort().reverse();
    }

    const expectedRotatedCollections = this.resolveRotatedCollectionNames(from, to);
    const expectedSet = new Set(["logs", ...expectedRotatedCollections]);

    return logCollections
      .filter((name) => expectedSet.has(name))
      .sort()
      .reverse();
  }

  private resolveRotatedCollectionNames(from?: string, to?: string): string[] {
    const fromDate = toDate(from);
    const toDateValue = toDate(to);

    if (!fromDate && !toDateValue) {
      return [];
    }

    const start = fromDate ?? toDateValue ?? new Date();
    const end = toDateValue ?? fromDate ?? new Date();
    const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    const max = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
    const names: string[] = [];

    while (cursor <= max) {
      names.push(collectionNameForDate(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return names;
  }

  private resolveSort(sort: Sort | undefined, isRotatedCollection: boolean): Sort {
    if (!sort) {
      return isRotatedCollection
        ? { "payload.normalizedLog.timestamp": -1, receivedAt: -1 }
        : { timestamp: -1 };
    }

    return isRotatedCollection ? remapFilterFields(sort, ROTATED_FIELD_MAP) as Sort : sort;
  }

  private mapStoredLog(doc: StoredNormalizedLogDocument): LogDocument {
    const normalizedLog = doc.payload?.normalizedLog ?? {};
    const context = normalizedLog.context ?? {};

    return {
      _id: doc._id,
      pipelineId: doc.payload?.pipelineId,
      timestamp: this.resolveLogTimestamp(normalizedLog.timestamp, doc.receivedAt, doc.createdAt),
      level: normalizedLog.level ?? "info",
      source: normalizedLog.source ?? doc.source,
      host: normalizedLog.host,
      service: typeof context.service === "string" ? context.service : undefined,
      environment: typeof context.env === "string" ? context.env : undefined,
      message: normalizedLog.message,
      normalizedMessage: normalizedLog.message,
      context,
      raw: context.raw,
    };
  }

  private resolveLogTimestamp(...values: Array<string | Date | undefined>): Date {
    for (const value of values) {
      if (!value) {
        continue;
      }

      const date = value instanceof Date ? value : new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    return new Date(0);
  }

  private getTimestampMs(log: LogDocument): number {
    const timestamp = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);

    return Number.isNaN(timestamp.getTime()) ? 0 : timestamp.getTime();
  }
}
