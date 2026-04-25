import test from "node:test";
import assert from "node:assert/strict";
import { get, post, assertOk } from "./http-client.mjs";

function assertLogSearchResponse(response) {
  assertOk(response);
  assert.equal(typeof response.body, "object");
  assert.equal(typeof response.body.count, "number");
  assert.equal(Array.isArray(response.body.items), true);

  for (const log of response.body.items) {
    assert.equal(typeof log, "object");
    assert.equal(typeof log.humanMessage, "string");
  }
}

test("GET /logs should return the UI log search shape", async () => {
  const response = await get("/logs?limit=10");

  assertLogSearchResponse(response);
});

test("GET /logs should accept UI text, pipeline and level filters", async () => {
  const response = await get(
    "/logs?query=synthetic&pipelineId=logarys-test-pipeline&level=error&limit=10",
  );

  assertLogSearchResponse(response);
});

test("POST /logs/search should return the UI log search shape", async () => {
  const response = await post("/logs/search", {
    search: "synthetic",
    pipelineId: "logarys-test-pipeline",
    level: "error",
    limit: 10,
  });

  assertLogSearchResponse(response);
});

test("/api/logs/search alias should return the UI log search shape", async () => {
  const response = await post("/api/logs/search", {
    query: "synthetic",
    limit: 5,
  });

  assertLogSearchResponse(response);
});
