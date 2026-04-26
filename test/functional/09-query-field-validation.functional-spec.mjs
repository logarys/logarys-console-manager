import test from "node:test";
import assert from "node:assert/strict";
import { get, post } from "./http-client.mjs";

function assertBadRequestForUnknownField(response) {
  assert.equal(response.status, 400, JSON.stringify(response.body));
  assert.equal(typeof response.body, "object");
  assert.equal(response.body.message, "Invalid query filter");
  assert.match(String(response.body.details ?? ""), /Field is not allowed: error/);
  assert.equal(Array.isArray(response.body.allowedFields), true);
  assert.equal(response.body.allowedFields.includes("level"), true);
  assert.equal(response.body.allowedFields.includes("message"), true);
  assert.equal(response.body.allowedFields.includes("error"), false);
}

test("POST /query/convert should reject unknown RSQL fields with HTTP 400", async () => {
  const response = await post("/query/convert", {
    query: 'error=="critical"',
  });

  assertBadRequestForUnknownField(response);
});

test("GET /logs should reject unknown RSQL fields before executing Mongo query", async () => {
  const filter = encodeURIComponent('error=="critical"');
  const response = await get(`/logs?filter=${filter}&limit=10`);

  assertBadRequestForUnknownField(response);
});

test("GET /logs should reject unknown RSQL fields sent through query alias", async () => {
  const query = encodeURIComponent('error=="critical"');
  const response = await get(`/logs?query=${query}&limit=10`);

  assertBadRequestForUnknownField(response);
});

test("POST /logs/search should reject unknown RSQL fields before executing Mongo query", async () => {
  const response = await post("/logs/search", {
    filter: 'error=="critical"',
    limit: 10,
  });

  assertBadRequestForUnknownField(response);
});

test("POST /api/logs/search should reject unknown RSQL fields before executing Mongo query", async () => {
  const response = await post("/api/logs/search", {
    query: 'error=="critical"',
    limit: 10,
  });

  assertBadRequestForUnknownField(response);
});
