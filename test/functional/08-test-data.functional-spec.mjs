import test from "node:test";
import assert from "node:assert/strict";
import { post } from "./http-client.mjs";

test("POST /test-data should be protected unless explicitly enabled", async () => {
  const response = await post("/test-data", {
    pipelineName: `functional-test-data-${Date.now()}`,
    logCount: 3,
  });

  if (response.status === 403) {
    assert.match(
      JSON.stringify(response.body),
      /disabled|LOGARYS_ENABLE_TEST_DATA_ENDPOINTS/i,
    );
    return;
  }

  assert.equal(response.ok, true, JSON.stringify(response.body));
  assert.equal(typeof response.body.pipeline, "object");
  assert.equal(response.body.insertedLogs, 3);
});

test("POST /dev/test-data alias should expose the same protected test data endpoint", async () => {
  const response = await post("/dev/test-data", {
    pipelineName: `functional-dev-test-data-${Date.now()}`,
    logCount: 2,
  });

  if (response.status === 403) {
    assert.match(
      JSON.stringify(response.body),
      /disabled|LOGARYS_ENABLE_TEST_DATA_ENDPOINTS/i,
    );
    return;
  }

  assert.equal(response.ok, true, JSON.stringify(response.body));
  assert.equal(typeof response.body.pipeline, "object");
  assert.equal(response.body.insertedLogs, 2);
});
