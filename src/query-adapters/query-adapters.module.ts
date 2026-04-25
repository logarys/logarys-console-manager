import { Module, OnModuleInit } from "@nestjs/common";
import { QueryAdapterRegistryService } from "./query-adapter-registry.service.js";
import { QueryAdapterLoaderService } from "./query-adapter-loader.service.js";
import { QueryAdapterInstallerService } from "./query-adapter-installer.service.js";
import { QueryAdaptersController } from "./query-adapters.controller.js";
import { createAdapter as createRsqlMongoDbAdapter } from "@logarys/rsql-mongodb-adapter";

@Module({
  controllers: [QueryAdaptersController],
  providers: [
    QueryAdapterRegistryService,
    QueryAdapterLoaderService,
    QueryAdapterInstallerService,
  ],
  exports: [
    QueryAdapterRegistryService,
    QueryAdapterLoaderService,
    QueryAdapterInstallerService,
  ],
})
export class QueryAdaptersModule implements OnModuleInit {
  constructor(private readonly registry: QueryAdapterRegistryService) {}

  onModuleInit(): void {
    this.registry.register(createRsqlMongoDbAdapter());
  }
}
