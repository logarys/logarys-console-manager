import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard.js";
import { QueryAdapterRegistryService } from "./query-adapter-registry.service.js";
import { QueryAdapterInstallerService } from "./query-adapter-installer.service.js";
import { QueryAdapterLoaderService } from "./query-adapter-loader.service.js";

@Controller("query-adapters")
@UseGuards(AdminGuard)
export class QueryAdaptersController {
  constructor(
    private readonly registry: QueryAdapterRegistryService,
    private readonly installer: QueryAdapterInstallerService,
    private readonly loader: QueryAdapterLoaderService,
  ) {}

  @Get()
  list() {
    return this.registry.list();
  }

  @Post("load")
  async loadFromPackage(@Body() body: { packageName: string }) {
    const metadata = await this.loader.loadFromPackage(body.packageName);
    return { success: true, metadata };
  }

  @Post("install")
  async installFromGit(@Body() body: { gitUrl: string; branch?: string }) {
    const result = await this.installer.installFromGit(body.gitUrl, body.branch ?? "main");
    return { success: true, ...result };
  }
}
