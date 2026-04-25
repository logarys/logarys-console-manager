import test from "node:test";
import assert from "node:assert/strict";
import { get, assertOk } from "./http-client.mjs";

const from = encodeURIComponent("2026-04-25T00:00:00Z");
const to = encodeURIComponent("2026-04-25T23:59:59Z");

test("GET /reports/errors/by-type should return report data", async () => {
  const response = await get(`/reports/errors/by-type?from=${from}&to=${to}`);

  assertOk(response);

  assert.ok(
    Array.isArray(response.body) ||
      Array.isArray(response.body.items) ||
      Array.isArray(response.body.data),
    "Expected report response to contain an array",
  );
});

test("GET /reports/errors/by-host should return report data", async () => {
  const response = await get(`/reports/errors/by-host?from=${from}&to=${to}`);

  assertOk(response);

  assert.ok(
    Array.isArray(response.body) ||
      Array.isArray(response.body.items) ||
      Array.isArray(response.body.data),
    "Expected report response to contain an array",
  );
});

test("GET /reports/errors/by-source should return report data", async () => {
  const response = await get(`/reports/errors/by-source?from=${from}&to=${to}`);

  assertOk(response);

  assert.ok(
    Array.isArray(response.body) ||
      Array.isArray(response.body.items) ||
      Array.isArray(response.body.data),
    "Expected report response to contain an array",
  );
});

test("GET /reports/errors/progression should return report data", async () => {
  const response = await get(
    `/reports/errors/progression?from=${from}&to=${to}&groupBy=hour`,
  );

  assertOk(response);

  assert.ok(
    Array.isArray(response.body) ||
      Array.isArray(response.body.items) ||
      Array.isArray(response.body.data),
    "Expected report response to contain an array",
  );
});
