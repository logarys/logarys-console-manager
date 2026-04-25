import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { QueryModule } from "./query/query.module.js";
import { QueryAdaptersModule } from "./query-adapters/query-adapters.module.js";
import { LogsModule } from "./logs/logs.module.js";
import { ReportsModule } from "./reports/reports.module.js";
import { ConfigManagementModule } from "./config/config-management.module.js";
import { MaintenanceModule } from "./maintenance/maintenance.module.js";
import { MongoModule } from "./mongo/mongo.module.js";
import { NatsModule } from "./nats/nats.module.js";
import { TestDataModule } from "./test-data/test-data.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongoModule,
    NatsModule,
    QueryAdaptersModule,
    QueryModule,
    LogsModule,
    ReportsModule,
    ConfigManagementModule,
    MaintenanceModule,
    TestDataModule,
  ],
})
export class AppModule {}
