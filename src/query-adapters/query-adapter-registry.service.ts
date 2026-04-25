import { Injectable, NotFoundException } from "@nestjs/common";
import type { QueryAdapter, QueryAdapterMetadata } from "@logarys/query-adapter-contracts";

@Injectable()
export class QueryAdapterRegistryService {
  private readonly adapters = new Map<string, QueryAdapter>();

  register(adapter: QueryAdapter): QueryAdapterMetadata {
    const metadata = adapter.getMetadata();
    const key = this.buildKey(metadata.language, metadata.target);
    this.adapters.set(key, adapter);
    return metadata;
  }

  get(language: string, target: string): QueryAdapter {
    const key = this.buildKey(language, target);
    const adapter = this.adapters.get(key);

    if (!adapter) {
      throw new NotFoundException(`No query adapter found for ${language} -> ${target}`);
    }

    return adapter;
  }

  list(): QueryAdapterMetadata[] {
    return [...this.adapters.values()].map((adapter) => adapter.getMetadata());
  }

  private buildKey(language: string, target: string): string {
    return `${language}:${target}`.toLowerCase();
  }
}
