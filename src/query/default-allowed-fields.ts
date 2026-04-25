import type { FieldDefinition } from "@logarys/query-adapter-contracts";

export const DEFAULT_LOG_ALLOWED_FIELDS: Record<string, FieldDefinition> = {
  timestamp: {
    type: "date",
    operators: [">", ">=", "<", "<=", "==", "!="],
    sortable: true,
  },
  level: {
    type: "string",
    operators: ["==", "!=", "=in=", "=out="],
    sortable: true,
  },
  host: {
    type: "string",
    operators: ["==", "!=", "=in=", "=out=", "=contains=", "=starts="],
    sortable: true,
  },
  source: {
    type: "string",
    operators: ["==", "!=", "=in=", "=out=", "=contains=", "=starts="],
    sortable: true,
  },
  service: {
    type: "string",
    operators: ["==", "!=", "=in=", "=out="],
    sortable: true,
  },
  environment: {
    type: "string",
    operators: ["==", "!=", "=in=", "=out="],
    sortable: true,
  },
  errorType: {
    type: "string",
    operators: ["==", "!=", "=in=", "=out=", "=contains="],
    sortable: true,
  },
  errorCode: {
    type: "string",
    operators: ["==", "!=", "=in=", "=out=", "=contains="],
  },
  message: {
    type: "string",
    operators: ["==", "!=", "=contains="],
  },
  normalizedMessage: {
    type: "string",
    operators: ["==", "!=", "=contains="],
  },
  traceId: {
    type: "string",
    operators: ["==", "!=", "=exists="],
  },
  requestId: {
    type: "string",
    operators: ["==", "!=", "=exists="],
  },
};
