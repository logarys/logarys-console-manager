import test from "node:test";
import assert from "node:assert/strict";
import { get, assertOk } from "./http-client.mjs";

test("GET /query-adapters should return registered adapters", async () => {
  const response = await get("/query-adapters");

  assertOk(response);
  assert.equal(Array.isArray(response.body), true);

  const rsqlAdapter = response.body.find((adapter) => {
    return adapter.language === "rsql" && adapter.target === "mongodb";
  });

  assert.ok(rsqlAdapter, "Expected default rsql -> mongodb adapter to be registered");
  assert.equal(typeof rsqlAdapter.name, "string");
  assert.equal(typeof rsqlAdapter.version, "string");
});
