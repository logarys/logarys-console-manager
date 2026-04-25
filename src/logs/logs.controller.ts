import { Controller, Get, Query } from "@nestjs/common";
import { parsePositiveInteger } from "../common/http-error.js";
import { LogsService } from "./logs.service.js";

@Controller("logs")
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  async search(
    @Query("filter") filter?: string,
    @Query("language") language = "rsql",
    @Query("limit") limitValue?: string,
    @Query("skip") skipValue?: string,
  ) {
    const limit = parsePositiveInteger(limitValue, 100, 1000);
    const skip = skipValue === undefined ? 0 : Number(skipValue);
    const logs = await this.logsService.search({ query: filter, language, limit, skip });

    return {
      count: logs.length,
      items: logs.map((log) => ({
        ...log,
        humanMessage: this.logsService.humanize(log),
      })),
    };
  }
}
