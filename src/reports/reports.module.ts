import { Module } from "@nestjs/common";
import { MongoModule } from "../mongo/mongo.module.js";
import { QueryModule } from "../query/query.module.js";
import { ReportsController } from "./reports.controller.js";
import { ReportsService } from "./reports.service.js";

@Module({
  imports: [MongoModule, QueryModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
