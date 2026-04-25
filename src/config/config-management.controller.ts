import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ConfigManagementService, PipelineConfig } from "./config-management.service.js";
import { parsePositiveInteger } from "../common/http-error.js";

@Controller()
export class ConfigManagementController {
  constructor(private readonly service: ConfigManagementService) {}

  @Get(["pipelines", "api/pipelines", "configs/pipelines", "api/configs/pipelines"])
  listPipelines(
    @Query("query") query?: string,
    @Query("q") q?: string,
    @Query("name") name?: string,
    @Query("inputType") inputType?: string,
    @Query("enabled") enabled?: string,
    @Query("limit") limitValue?: string,
    @Query("skip") skipValue?: string,
  ) {
    return this.service.listPipelines({
      query: query ?? q,
      name,
      inputType,
      enabled,
      limit: parsePositiveInteger(limitValue, 100, 1000),
      skip: skipValue === undefined ? 0 : Number(skipValue),
    });
  }

  @Get(["pipelines/:id", "api/pipelines/:id", "configs/pipelines/:id", "api/configs/pipelines/:id"])
  getPipeline(@Param("id") id: string) {
    return this.service.getPipeline(id);
  }

  @Post(["pipelines", "api/pipelines", "configs/pipelines", "api/configs/pipelines"])
  createPipeline(@Body() body: Omit<PipelineConfig, "_id" | "createdAt" | "updatedAt">) {
    return this.service.createPipeline(body);
  }
}
