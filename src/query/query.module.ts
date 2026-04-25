import { Module } from "@nestjs/common";
import { QueryAdaptersModule } from "../query-adapters/query-adapters.module.js";
import { QueryController } from "./query.controller.js";
import { QueryService } from "./query.service.js";

@Module({
  imports: [QueryAdaptersModule],
  controllers: [QueryController],
  providers: [QueryService],
  exports: [QueryService],
})
export class QueryModule {}
