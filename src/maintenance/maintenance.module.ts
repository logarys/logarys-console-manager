import { Module } from "@nestjs/common";
import { NatsModule } from "../nats/nats.module.js";
import { MaintenanceController } from "./maintenance.controller.js";
import { MaintenanceService } from "./maintenance.service.js";

@Module({
  imports: [NatsModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
})
export class MaintenanceModule {}
