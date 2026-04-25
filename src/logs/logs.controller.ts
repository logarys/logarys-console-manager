import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { parsePositiveInteger } from "../common/http-error.js";
import { LogsService } from "./logs.service.js";

@Controller()
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get(["logs", "api/logs"])
  async search(
    @Query("filter") filter?: string,
    @Query("query") query?: string,
    @Query("q") q?: string,
    @Query("search") search?: string,
    @Query("pipelineId") pipelineId?: string,
    @Query("level") level?: string,
    @Query("language") language = "rsql",
    @Query("limit") limitValue?: string,
    @Query("skip") skipValue?: string,
  ) {
    const limit = parsePositiveInteger(limitValue, 100, 1000);
    const skip = skipValue === undefined ? 0 : Number(skipValue);
    const logs = await this.logsService.search({
      query: filter,
      text: query ?? q ?? search,
      pipelineId,
      level,
      language,
      limit,
      skip,
    });

    return {
      count: logs.length,
      items: logs.map((log) => ({
        ...log,
        humanMessage: this.logsService.humanize(log),
      })),
    };
  }

  @Post(["logs/search", "api/logs/search"])
  async searchWithBody(
    @Body("filter") filter?: string,
    @Body("query") query?: string,
    @Body("q") q?: string,
    @Body("search") search?: string,
    @Body("pipelineId") pipelineId?: string,
    @Body("level") level?: string,
    @Body("language") language = "rsql",
    @Body("limit") limitValue?: number,
    @Body("skip") skipValue?: number,
  ) {
    const logs = await this.logsService.search({
      query: filter,
      text: query ?? q ?? search,
      pipelineId,
      level,
      language,
      limit: Math.min(Math.max(limitValue ?? 100, 1), 1000),
      skip: skipValue ?? 0,
    });

    return {
      count: logs.length,
      items: logs.map((log) => ({
        ...log,
        humanMessage: this.logsService.humanize(log),
      })),
    };
  }
}
