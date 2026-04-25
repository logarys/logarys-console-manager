import { Injectable } from "@nestjs/common";
import { pathToFileURL } from "node:url";
import path from "node:path";
import type { QueryAdapter, QueryAdapterMetadata } from "@logarys/query-adapter-contracts";
import { QueryAdapterRegistryService } from "./query-adapter-registry.service.js";

type AdapterModule = {
  createAdapter?: () => QueryAdapter;
};

@Injectable()
export class QueryAdapterLoaderService {
  constructor(private readonly registry: QueryAdapterRegistryService) {}

  async loadFromPackage(packageName: string): Promise<QueryAdapterMetadata> {
    const adapterModule = (await import(packageName)) as AdapterModule;
    return this.createAndRegister(adapterModule, packageName);
  }

  async loadFromLocalPath(packagePath: string): Promise<QueryAdapterMetadata> {
    const entrypoint = path.join(packagePath, "dist", "index.js");
    const moduleUrl = pathToFileURL(entrypoint).href;
    const adapterModule = (await import(moduleUrl)) as AdapterModule;
    return this.createAndRegister(adapterModule, packagePath);
  }

  private createAndRegister(adapterModule: AdapterModule, source: string): QueryAdapterMetadata {
    if (typeof adapterModule.createAdapter !== "function") {
      throw new Error(`Adapter module ${source} must export createAdapter()`);
    }

    const adapter = adapterModule.createAdapter();
    return this.registry.register(adapter);
  }
}
