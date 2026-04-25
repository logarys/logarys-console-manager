import { Module } from "@nestjs/common";
import { MongoModule } from "../mongo/mongo.module.js";
import { QueryModule } from "../query/query.module.js";
import { LogsController } from "./logs.controller.js";
import { LogsService } from "./logs.service.js";

@Module({
  imports: [MongoModule, QueryModule],
  controllers: [LogsController],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {}
