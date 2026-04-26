import { BadRequestException, Injectable } from "@nestjs/common";
import type { QueryAdapterResult } from "@logarys/query-adapter-contracts";
import { QueryAdapterRegistryService } from "../query-adapters/query-adapter-registry.service.js";
import { DEFAULT_LOG_ALLOWED_FIELDS } from "./default-allowed-fields.js";

function isRsqlSyntaxError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "RsqlSyntaxError" ||
    error.message.startsWith("Invalid RSQL") ||
    error.message.startsWith("Unbalanced parentheses") ||
    error.message.startsWith("Unexpected closing parenthesis") ||
    error.message.startsWith("Unclosed quote") ||
    error.message.startsWith("Empty expression") ||
    error.message.startsWith("Missing selector") ||
    error.message.startsWith("Missing value") ||
    error.message.startsWith("Invalid selector") ||
    error.message.startsWith("Expected parenthesized list") ||
    error.message.startsWith("Unterminated")
  );
}

@Injectable()
export class QueryService {
  constructor(private readonly registry: QueryAdapterRegistryService) {}

  convert(language: string, target: string, query: string): QueryAdapterResult {
    this.assertQueryString(query);

    const adapter = this.registry.get(language, target);

    try {
      return adapter.convert({
        query,
        options: {
          allowedFields: DEFAULT_LOG_ALLOWED_FIELDS,
          defaultLimit: 100,
          maxLimit: 1000,
        },
      });
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);

      if (isRsqlSyntaxError(error)) {
        throw new BadRequestException({
          message: "Invalid RSQL syntax",
          details,
          query,
        });
      }

      throw new BadRequestException({
        message: "Invalid RSQL syntax",
        details,
        allowedFields: Object.keys(DEFAULT_LOG_ALLOWED_FIELDS),
      });
    }
  }

  private assertQueryString(query: string): void {
    if (typeof query !== "string" || query.trim().length === 0) {
      throw new BadRequestException({
        message: "Invalid RSQL syntax",
        details: "Query must be a non-empty string",
      });
    }
  }
}
