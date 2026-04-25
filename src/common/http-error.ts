import { BadRequestException } from "@nestjs/common";

export function assertString(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BadRequestException(`${name} must be a non-empty string`);
  }

  return value;
}

export function parsePositiveInteger(value: unknown, fallback: number, max: number): number {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new BadRequestException("Expected a positive integer");
  }

  return Math.min(parsed, max);
}
