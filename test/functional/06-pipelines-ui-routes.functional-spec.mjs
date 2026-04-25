import test from "node:test";
import assert from "node:assert/strict";
import { get, post, assertOk } from "./http-client.mjs";

function listItems(body) {
  if (Array.isArray(body)) {
    return body;
  }

  if (Array.isArray(body?.items)) {
    return body.items;
  }

  if (Array.isArray(body?.data)) {
    return body.data;
  }

  return [];
}

function createPipelinePayload(prefix = "functional-ui-pipeline") {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: `${prefix}-${suffix}`,
    name: `${prefix}-${suffix}`,
    enabled: true,
    inputType: "http",
    description: "Pipeline created by functional tests",
    config: {
      source: "functional-tests",
      format: "json",
    },
  };
}

test("POST /pipelines should create a pipeline usable by the UI", async () => {
  const payload = createPipelinePayload();
  const response = await post("/pipelines", payload);

  assertOk(response);

  assert.equal(response.body.id, payload.id);
  assert.equal(response.body.name, payload.name);
  assert.equal(response.body.enabled, true);
  assert.equal(response.body.inputType, "http");
  assert.ok(response.body.createdAt, "Expected createdAt to be returned");
  assert.ok(response.body.updatedAt, "Expected updatedAt to be returned");
});

test("GET /pipelines should search pipelines by name", async () => {
  const payload = createPipelinePayload("functional-search-pipeline");
  await post("/pipelines", payload);

  const response = await get(`/pipelines?query=${encodeURIComponent(payload.name)}&limit=10`);

  assertOk(response);

  const items = listItems(response.body);
  const match = items.find((pipeline) => pipeline.id === payload.id);

  assert.ok(match, `Expected pipeline ${payload.id} in search results`);
  assert.equal(match.name, payload.name);
});

test("GET /pipelines/:id should return one pipeline", async () => {
  const payload = createPipelinePayload("functional-get-pipeline");
  await post("/pipelines", payload);

  const response = await get(`/pipelines/${encodeURIComponent(payload.id)}`);

  assertOk(response);

  assert.equal(response.body.id, payload.id);
  assert.equal(response.body.name, payload.name);
});

test("/configs/pipelines alias should create and list pipelines", async () => {
  const payload = createPipelinePayload("functional-config-alias-pipeline");
  const createResponse = await post("/configs/pipelines", payload);

  assertOk(createResponse);
  assert.equal(createResponse.body.id, payload.id);

  const listResponse = await get(`/configs/pipelines?name=${encodeURIComponent(payload.name)}`);

  assertOk(listResponse);

  const items = listItems(listResponse.body);
  assert.ok(
    items.some((pipeline) => pipeline.id === payload.id),
    `Expected pipeline ${payload.id} in /configs/pipelines results`,
  );
});

test("POST /pipelines should reject missing names", async () => {
  const response = await post("/pipelines", {
    enabled: true,
    inputType: "http",
  });

  assert.equal(response.ok, false);
  assert.equal(response.status, 400);
});
