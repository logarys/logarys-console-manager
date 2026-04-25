import { Body, Controller, Post } from "@nestjs/common";
import { MaintenanceService } from "./maintenance.service.js";

@Controller("maintenance")
export class MaintenanceController {
  constructor(private readonly maintenance: MaintenanceService) {}

  @Post("reload-pipelines")
  reloadPipelines(@Body() body: Record<string, unknown> = {}) {
    return this.maintenance.sendCommand("RELOAD_PIPELINES", body);
  }

  @Post("reindex")
  reindex(@Body() body: Record<string, unknown> = {}) {
    return this.maintenance.sendCommand("REINDEX", body);
  }

  @Post("rotate")
  rotate(@Body() body: Record<string, unknown> = {}) {
    return this.maintenance.sendCommand("ROTATE", body);
  }
}
