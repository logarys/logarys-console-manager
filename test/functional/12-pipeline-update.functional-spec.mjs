import test from "node:test";
import assert from "node:assert/strict";
import { get, post, put, patch, assertOk } from "./http-client.mjs";

function createPipelinePayload(prefix = "functional-update-pipeline") {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: `${prefix}-${suffix}`,
    name: `${prefix}-${suffix}`,
    enabled: true,
    inputType: "http",
    description: "Pipeline created by update functional tests",
    source: "functional-tests",
    parser: "json",
    config: {
      source: "functional-tests",
      format: "json",
    },
  };
}

test("PUT /pipelines/:id should update a pipeline configuration", async () => {
  const payload = createPipelinePayload("functional-put-pipeline");
  const created = await post("/pipelines", payload);
  assertOk(created);

  const response = await put(`/pipelines/${encodeURIComponent(payload.id)}`, {
    name: `${payload.name} updated`,
    enabled: false,
    inputType: "nats",
    source: "orders.logs",
    parser: "json",
    description: "Updated by PUT",
    config: {
      subject: "orders.logs",
      durable: "logarys-ui",
    },
  });

  assertOk(response);
  assert.equal(response.body.id, payload.id);
  assert.equal(response.body.name, `${payload.name} updated`);
  assert.equal(response.body.enabled, false);
  assert.equal(response.body.inputType, "nats");
  assert.equal(response.body.source, "orders.logs");
  assert.equal(response.body.parser, "json");
  assert.equal(response.body.config.subject, "orders.logs");
});

test("PATCH /pipelines/:id should partially update a pipeline configuration", async () => {
  const payload = createPipelinePayload("functional-patch-pipeline");
  const created = await post("/pipelines", payload);
  assertOk(created);

  const response = await patch(`/pipelines/${encodeURIComponent(payload.id)}`, {
    enabled: false,
    config: {
      source: "patched",
      format: "json",
      retries: 3,
    },
  });

  assertOk(response);
  assert.equal(response.body.id, payload.id);
  assert.equal(response.body.name, payload.name);
  assert.equal(response.body.enabled, false);
  assert.equal(response.body.config.source, "patched");
  assert.equal(response.body.config.retries, 3);
});

test("PATCH /configs/pipelines/:id alias should update a pipeline", async () => {
  const payload = createPipelinePayload("functional-patch-alias-pipeline");
  const created = await post("/configs/pipelines", payload);
  assertOk(created);

  const response = await patch(`/configs/pipelines/${encodeURIComponent(payload.id)}`, {
    description: "Updated through alias",
  });

  assertOk(response);
  assert.equal(response.body.description, "Updated through alias");
});

test("PATCH /pipelines/:id should return 404 for unknown pipeline", async () => {
  const response = await patch(`/pipelines/unknown-${Date.now()}`, {
    enabled: false,
  });

  assert.equal(response.status, 404, JSON.stringify(response.body));
});

test("PATCH /pipelines/:id should reject empty update payload", async () => {
  const payload = createPipelinePayload("functional-empty-update-pipeline");
  const created = await post("/pipelines", payload);
  assertOk(created);

  const response = await patch(`/pipelines/${encodeURIComponent(payload.id)}`, {});

  assert.equal(response.status, 400, JSON.stringify(response.body));
});

test("GET /pipelines/:id should return updated pipeline", async () => {
  const payload = createPipelinePayload("functional-get-updated-pipeline");
  const created = await post("/pipelines", payload);
  assertOk(created);

  const updated = await patch(`/pipelines/${encodeURIComponent(payload.id)}`, {
    description: "Reloaded after update",
  });
  assertOk(updated);

  const fetched = await get(`/pipelines/${encodeURIComponent(payload.id)}`);
  assertOk(fetched);

  assert.equal(fetched.body.description, "Reloaded after update");
});
