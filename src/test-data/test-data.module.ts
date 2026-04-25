import { Module } from "@nestjs/common";
import { ConfigManagementModule } from "../config/config-management.module.js";
import { MongoModule } from "../mongo/mongo.module.js";
import { TestDataController } from "./test-data.controller.js";
import { TestDataService } from "./test-data.service.js";

@Module({
  imports: [MongoModule, ConfigManagementModule],
  controllers: [TestDataController],
  providers: [TestDataService],
})
export class TestDataModule {}
