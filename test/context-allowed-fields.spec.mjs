import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLogAllowedFields,
  getLogAllowedFieldNames,
} from "../dist/query/default-allowed-fields.js";

test("buildLogAllowedFields includes known context fields", () => {
  const allowedFields = buildLogAllowedFields();

  assert.equal(allowedFields["context.requestId"].type, "string");
  assert.equal(allowedFields["context.service"].type, "string");
  assert.equal(allowedFields["context.durationMs"].type, "number");
  assert.equal(allowedFields["context.index"].type, "number");
});

test("buildLogAllowedFields dynamically allows safe context string fields", () => {
  const allowedFields = buildLogAllowedFields("context.customKey==abc");

  assert.equal(allowedFields["context.customKey"].type, "string");
  assert.ok(allowedFields["context.customKey"].operators.includes("=contains="));
});

test("buildLogAllowedFields dynamically infers numeric context fields", () => {
  const allowedFields = buildLogAllowedFields("context.elapsedMs>=250");

  assert.equal(allowedFields["context.elapsedMs"].type, "number");
  assert.ok(allowedFields["context.elapsedMs"].operators.includes(">="));
});

test("buildLogAllowedFields does not allow unsafe context selectors", () => {
  const allowedFields = buildLogAllowedFields("context.__proto__.polluted==true");

  assert.equal(allowedFields["context.__proto__.polluted"], undefined);
});

test("getLogAllowedFieldNames documents dynamic context fields", () => {
  const names = getLogAllowedFieldNames();

  assert.equal(names.includes("context.<safeField>"), true);
});
