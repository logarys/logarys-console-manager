import { Body, Controller, Get, Post } from "@nestjs/common";
import { ConfigManagementService, PipelineConfig } from "./config-management.service.js";

@Controller("configs")
export class ConfigManagementController {
  constructor(private readonly service: ConfigManagementService) {}

  @Get("pipelines")
  listPipelines() {
    return this.service.listPipelines();
  }

  @Post("pipelines")
  createPipeline(@Body() body: Omit<PipelineConfig, "createdAt" | "updatedAt">) {
    return this.service.createPipeline(body);
  }
}
