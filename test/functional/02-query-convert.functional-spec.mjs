import test from "node:test";
import assert from "node:assert/strict";
import { post, assertOk } from "./http-client.mjs";

test("POST /query/convert should convert simple RSQL query to MongoDB filter", async () => {
  const response = await post("/query/convert", {
    language: "rsql",
    target: "mongodb",
    query: "level==error;host==api-01",
  });

  assertOk(response);

  assert.ok(response.body.filter);
  assert.ok(response.body.filter.$and);

  assert.deepEqual(response.body.filter, {
    $and: [
      {
        level: "error",
      },
      {
        host: "api-01",
      },
    ],
  });
});

test("POST /query/convert should convert RSQL in operator", async () => {
  const response = await post("/query/convert", {
    language: "rsql",
    target: "mongodb",
    query: "level=in=(error,critical)",
  });

  assertOk(response);

  assert.deepEqual(response.body.filter, {
    level: {
      $in: ["error", "critical"],
    },
  });
});

test("POST /query/convert should convert date comparison", async () => {
  const response = await post("/query/convert", {
    language: "rsql",
    target: "mongodb",
    query: "timestamp>=2026-04-25T00:00:00Z",
  });

  assertOk(response);

  assert.ok(response.body.filter.timestamp);
  assert.ok(response.body.filter.timestamp.$gte);
});

test("POST /query/convert should reject unsupported fields", async () => {
  const response = await post("/query/convert", {
    language: "rsql",
    target: "mongodb",
    query: "$where==malicious",
  });

  assert.equal(response.ok, false);
  assert.ok([400, 422, 500].includes(response.status));
});
