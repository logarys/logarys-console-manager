import { Injectable } from "@nestjs/common";
import { Filter, Sort } from "mongodb";
import { MongoService } from "../mongo/mongo.service.js";
import { QueryService } from "../query/query.service.js";
import { LogDocument } from "./log-document.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    language?: string;
    limit: number;
    skip: number;
    sort?: Sort;
  }): Promise<LogDocument[]> {
    const collection = this.mongo.collection<LogDocument>("logs");
    const converted = params.query
      ? this.queryService.convert(params.language ?? "rsql", "mongodb", params.query)
      : { filter: {} };

    const filter: Filter<LogDocument> = { ...(converted.filter as Filter<LogDocument>) };

    if (params.pipelineId) {
      filter.pipelineId = params.pipelineId;
    }

    if (params.level) {
      filter.level = params.level;
    }

    if (params.text) {
      const regex = new RegExp(escapeRegex(params.text), "i");
      filter.$or = [
        { message: regex },
        { normalizedMessage: regex },
        { source: regex },
        { service: regex },
        { host: regex },
        { errorType: regex },
        { errorCode: regex },
      ];
    }

    return collection
      .find(filter)
      .sort(params.sort ?? { timestamp: -1 })
      .skip(params.skip)
      .limit(params.limit)
      .toArray();
  }

  humanize(log: LogDocument): string {
    const source = log.source ? ` from ${log.source}` : "";
    const host = log.host ? ` on ${log.host}` : "";
    return `[${log.level}]${source}${host}: ${log.message}`;
  }
}
