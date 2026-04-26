import type { FieldDefinition, FieldDefinitions } from "@logarys/query-adapter-contracts";

const STRING_OPERATORS = [
  "==",
  "!=",
  "=in=",
  "=out=",
  "=contains=",
  "=starts=",
  "=ends=",
  "=exists=",
] as const;

const NUMBER_OPERATORS = [
  "==",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
  "=gt=",
  "=ge=",
  "=lt=",
  "=le=",
  "=in=",
  "=out=",
  "=exists=",
] as const;

const BOOLEAN_OPERATORS = ["==", "!=", "=exists="] as const;

export const DEFAULT_LOG_ALLOWED_FIELDS: FieldDefinitions = {
  timestamp: {
    type: "date",
    operators: [">", ">=", "<", "<=", "==", "!=", "=gt=", "=ge=", "=lt=", "=le="],
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
    operators: ["==", "!=", "=contains=", "=starts=", "=ends=", "=regex="],
  },
  normalizedMessage: {
    type: "string",
    operators: ["==", "!=", "=contains=", "=starts=", "=ends=", "=regex="],
  },
  traceId: {
    type: "string",
    operators: ["==", "!=", "=exists="],
  },
  requestId: {
    type: "string",
    operators: ["==", "!=", "=exists="],
  },
  "context.requestId": {
    type: "string",
    operators: [...STRING_OPERATORS],
  },
  "context.service": {
    type: "string",
    operators: [...STRING_OPERATORS],
  },
  "context.userAgent": {
    type: "string",
    operators: [...STRING_OPERATORS],
  },
  "context.index": {
    type: "number",
    operators: [...NUMBER_OPERATORS],
  },
  "context.durationMs": {
    type: "number",
    operators: [...NUMBER_OPERATORS],
  },
};

const RSQL_OPERATOR_PATTERN =
  "==|!=|>=|<=|>|<|=gt=|=ge=|=lt=|=le=|=in=|=out=|=contains=|=starts=|=ends=|=exists=|=regex=";

const SELECTOR_PATTERN = new RegExp(
  `(^|[;,()])\\s*([A-Za-z_][A-Za-z0-9_.]*)\\s*(?:${RSQL_OPERATOR_PATTERN})`,
  "g",
);

const UNSAFE_CONTEXT_PARTS = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

export function buildLogAllowedFields(query?: string): FieldDefinitions {
  const allowedFields: FieldDefinitions = { ...DEFAULT_LOG_ALLOWED_FIELDS };

  if (!query) {
    return allowedFields;
  }

  for (const selector of extractSelectors(query)) {
    if (!selector.startsWith("context.")) {
      continue;
    }

    if (!isSafeContextSelector(selector)) {
      continue;
    }

    allowedFields[selector] ??= inferContextFieldDefinition(selector);
  }

  return allowedFields;
}

export function getLogAllowedFieldNames(query?: string): string[] {
  const allowedFields = buildLogAllowedFields(query);

  return [
    ...Object.keys(allowedFields).sort(),
    "context.<safeField>",
  ];
}

function extractSelectors(query: string): string[] {
  const selectors = new Set<string>();

  SELECTOR_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = SELECTOR_PATTERN.exec(query)) !== null) {
    selectors.add(match[2]);
  }

  return [...selectors];
}

function isSafeContextSelector(selector: string): boolean {
  if (
    selector.startsWith("$") ||
    selector.includes("..") ||
    selector.includes("[") ||
    selector.includes("]")
  ) {
    return false;
  }

  const parts = selector.split(".");

  if (parts.length < 2 || parts[0] !== "context") {
    return false;
  }

  return parts.every((part) => {
    return (
      /^[A-Za-z_][A-Za-z0-9_]*$/.test(part) &&
      !part.startsWith("$") &&
      !UNSAFE_CONTEXT_PARTS.has(part)
    );
  });
}

function inferContextFieldDefinition(selector: string): FieldDefinition {
  const lastPart = selector.split(".").at(-1) ?? "";

  if (/^(is|has|can)[A-Z_]/.test(lastPart)) {
    return {
      type: "boolean",
      operators: [...BOOLEAN_OPERATORS],
    };
  }

  if (
    /(?:count|index|size|total|duration|durationMs|elapsed|elapsedMs|latency|latencyMs)$/i.test(
      lastPart,
    )
  ) {
    return {
      type: "number",
      operators: [...NUMBER_OPERATORS],
    };
  }

  return {
    type: "string",
    operators: [...STRING_OPERATORS],
  };
}
