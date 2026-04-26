import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard.js";
import { MaintenanceService } from "./maintenance.service.js";

@Controller("maintenance")
export class MaintenanceController {
  constructor(private readonly maintenance: MaintenanceService) {}

  @Post("reload-pipelines")
  @UseGuards(AdminGuard)
  reloadPipelines(@Body() body: Record<string, unknown> = {}) {
    return this.maintenance.sendCommand("RELOAD_PIPELINES", body);
  }

  @Post("reindex")
  reindex(@Body() body: Record<string, unknown> = {}) {
    return this.maintenance.sendCommand("REINDEX", body);
  }

  @Post("rotate")
  @UseGuards(AdminGuard)
  rotate(@Body() body: Record<string, unknown> = {}) {
    return this.maintenance.sendCommand("ROTATE", body);
  }
}
