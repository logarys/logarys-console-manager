import test from "node:test";
import assert from "node:assert/strict";
import { get, assertOk } from "./http-client.mjs";

test("GET /logs should return a valid response", async () => {
  const response = await get("/logs?limit=10");

  assertOk(response);

  assert.ok(
    Array.isArray(response.body) ||
      Array.isArray(response.body.items) ||
      Array.isArray(response.body.data),
    "Expected logs response to contain an array",
  );
});

test("GET /logs should accept RSQL filter", async () => {
  const filter = encodeURIComponent("level==error;host==api-01");
  const response = await get(`/logs?filter=${filter}&limit=10`);

  assertOk(response);

  assert.ok(
    Array.isArray(response.body) ||
      Array.isArray(response.body.items) ||
      Array.isArray(response.body.data),
    "Expected filtered logs response to contain an array",
  );
});
