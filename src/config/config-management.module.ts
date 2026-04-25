import { Module } from "@nestjs/common";
import { MongoModule } from "../mongo/mongo.module.js";
import { ConfigManagementController } from "./config-management.controller.js";
import { ConfigManagementService } from "./config-management.service.js";

@Module({
  imports: [MongoModule],
  controllers: [ConfigManagementController],
  providers: [ConfigManagementService],
  exports: [ConfigManagementService],
})
export class ConfigManagementModule {}
