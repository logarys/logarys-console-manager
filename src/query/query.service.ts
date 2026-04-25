import { Injectable } from "@nestjs/common";
import type { QueryAdapterResult } from "@logarys/query-adapter-contracts";
import { QueryAdapterRegistryService } from "../query-adapters/query-adapter-registry.service.js";
import { DEFAULT_LOG_ALLOWED_FIELDS } from "./default-allowed-fields.js";

@Injectable()
export class QueryService {
  constructor(private readonly registry: QueryAdapterRegistryService) {}

  convert(language: string, target: string, query: string): QueryAdapterResult {
    const adapter = this.registry.get(language, target);

    return adapter.convert({
      query,
      options: {
        allowedFields: DEFAULT_LOG_ALLOWED_FIELDS,
        defaultLimit: 100,
        maxLimit: 1000,
      },
    });
  }
}
