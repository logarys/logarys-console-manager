import { Injectable } from "@nestjs/common";
import { Filter, Sort } from "mongodb";
import { MongoService } from "../mongo/mongo.service.js";
import { QueryService } from "../query/query.service.js";
import { LogDocument } from "./log-document.js";
import { ObjectId } from "mongodb";

@Injectable()
export class LogsService {
  constructor(
    private readonly mongo: MongoService,
    private readonly queryService: QueryService,
  ) {}

  async search(params: {
    query?: string;
    language?: string;
    limit: number;
    skip: number;
    sort?: Sort;
  }): Promise<LogDocument[]> {
    const collection = this.mongo.collection<LogDocument>("logs");
    const converted = params.query
      ? this.queryService.convert(params.language ?? "rsql", "mongodb", params.query)
      : { filter: {} };

    return collection
      .find(converted.filter as Filter<LogDocument>)
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
