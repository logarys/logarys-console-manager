import { Injectable } from "@nestjs/common";
import { Filter } from "mongodb";
import { MongoService } from "../mongo/mongo.service.js";
import { QueryService } from "../query/query.service.js";
import { LogDocument } from "../logs/log-document.js";

export interface ReportParams {
  filter?: string;
  language?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly mongo: MongoService,
    private readonly queryService: QueryService,
  ) {}

  async errorsByType(params: ReportParams) {
    return this.groupErrorsBy(params, "$errorType");
  }

  async errorsByHost(params: ReportParams) {
    return this.groupErrorsBy(params, "$host");
  }

  async errorsBySource(params: ReportParams) {
    return this.groupErrorsBy(params, "$source");
  }

  async errorsProgression(params: ReportParams, groupBy: "hour" | "day" = "hour") {
    const match = this.buildMatch(params);
    const dateFormat = groupBy === "day" ? "%Y-%m-%d" : "%Y-%m-%dT%H:00:00Z";

    return this.mongo.collection<LogDocument>("logs").aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$timestamp" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1 } },
    ]).toArray();
  }

  private async groupErrorsBy(params: ReportParams, field: string) {
    const match = this.buildMatch(params);

    return this.mongo.collection<LogDocument>("logs").aggregate([
      { $match: match },
      { $group: { _id: field, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, value: "$_id", count: 1 } },
    ]).toArray();
  }

  private buildMatch(params: ReportParams): Filter<LogDocument> {
    const converted = params.filter
      ? this.queryService.convert(params.language ?? "rsql", "mongodb", params.filter)
      : { filter: {} };

    const match: Filter<LogDocument> = {
      ...(converted.filter as Filter<LogDocument>),
      level: { $in: ["error", "critical"] },
    };

    if (params.from || params.to) {
      match.timestamp = {} as never;

      if (params.from) {
        (match.timestamp as Record<string, Date>).$gte = new Date(params.from);
      }

      if (params.to) {
        (match.timestamp as Record<string, Date>).$lte = new Date(params.to);
      }
    }

    return match;
  }
}
