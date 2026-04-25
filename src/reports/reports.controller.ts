import { Controller, Get, Query } from "@nestjs/common";
import { ReportsService } from "./reports.service.js";

@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("errors/by-type")
  errorsByType(@Query() query: { filter?: string; language?: string; from?: string; to?: string }) {
    return this.reportsService.errorsByType(query);
  }

  @Get("errors/by-host")
  errorsByHost(@Query() query: { filter?: string; language?: string; from?: string; to?: string }) {
    return this.reportsService.errorsByHost(query);
  }

  @Get("errors/by-source")
  errorsBySource(@Query() query: { filter?: string; language?: string; from?: string; to?: string }) {
    return this.reportsService.errorsBySource(query);
  }

  @Get("errors/progression")
  errorsProgression(@Query() query: { filter?: string; language?: string; from?: string; to?: string; groupBy?: "hour" | "day" }) {
    return this.reportsService.errorsProgression(query, query.groupBy ?? "hour");
  }
}
