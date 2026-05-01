import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { parsePositiveInteger } from "../common/http-error.js";
import { LogsService } from "./logs.service.js";

function looksLikeRsql(value?: string): boolean {
  if (!value) {
    return false;
  }

  return [
    "==",
    "!=",
    ">=",
    "<=",
    "=gt=",
    "=ge=",
    "=lt=",
    "=le=",
    "=in=",
    "=out=",
    "=contains=",
    "=starts=",
    "=ends=",
    "=exists=",
    "=regex=",
  ].some((operator) => value.includes(operator));
}

function resolveSearchInputs(filter?: string, query?: string, q?: string, search?: string): { filter?: string; text?: string } {
  if (filter) {
    return {
      filter,
      text: query ?? q ?? search,
    };
  }

  if (looksLikeRsql(query)) {
    return {
      filter: query,
      text: q ?? search,
    };
  }

  return {
    text: query ?? q ?? search,
  };
}

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
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("language") language = "rsql",
    @Query("limit") limitValue?: string,
    @Query("skip") skipValue?: string,
  ) {
    const limit = parsePositiveInteger(limitValue, 100, 1000);
    const skip = skipValue === undefined ? 0 : Number(skipValue);
    const resolved = resolveSearchInputs(filter, query, q, search);
    const logs = await this.logsService.search({
      query: resolved.filter,
      text: resolved.text,
      pipelineId,
      level,
      from,
      to,
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
    @Body("from") from?: string,
    @Body("to") to?: string,
    @Body("language") language = "rsql",
    @Body("limit") limitValue?: number,
    @Body("skip") skipValue?: number,
  ) {
    const resolved = resolveSearchInputs(filter, query, q, search);
    const logs = await this.logsService.search({
      query: resolved.filter,
      text: resolved.text,
      pipelineId,
      level,
      from,
      to,
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
