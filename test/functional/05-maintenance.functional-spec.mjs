import test from "node:test";
import assert from "node:assert/strict";
import { post, assertOk } from "./http-client.mjs";

test("POST /maintenance/reload-pipelines should accept maintenance command", async () => {
  const response = await post("/maintenance/reload-pipelines", {});

  assertOk(response);

  assert.equal(typeof response.body, "object");
});
