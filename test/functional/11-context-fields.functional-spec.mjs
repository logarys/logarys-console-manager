import test from "node:test";
import assert from "node:assert/strict";
import { get, post, assertOk } from "./http-client.mjs";

let seedPromise = null;

async function ensureContextTestData(t) {
  if (!seedPromise) {
    seedPromise = (async () => {
      const existing = await get(
        "/logs?filter=context.requestId%3D%3Dtest-099&limit=1",
      );

      if (
        existing.ok &&
        Array.isArray(existing.body.items) &&
        existing.body.items.length > 0
      ) {
        return true;
      }

      const seed = await post("/test-data", {
        pipelineName: `functional-context-fields-${Date.now()}`,
        logCount: 100,
      });

      if (seed.status === 403 || seed.status === 404) {
        return false;
      }

      assertOk(seed);
      assert.equal(seed.body.insertedLogs, 100);
      return true;
    })();
  }

  const available = await seedPromise;

  if (!available) {
    t.skip(
      "Context field functional tests require existing logs or LOGARYS_ENABLE_TEST_DATA_ENDPOINTS=true",
    );
    return false;
  }

  return true;
}

function assertOnlyRequestId(response, requestId) {
  assertOk(response);
  assert.equal(Array.isArray(response.body.items), true);
  assert.ok(response.body.items.length > 0, "Expected at least one matching log");

  for (const log of response.body.items) {
    assert.equal(log.context?.requestId, requestId);
  }
}

test("GET /logs should allow RSQL filters on context.requestId", async (t) => {
  if (!(await ensureContextTestData(t))) {
    return;
  }

  const response = await get(
    "/logs?filter=context.requestId%3D%3Dtest-099&limit=100",
  );

  assertOnlyRequestId(response, "test-099");
});

test("POST /logs/search should allow RSQL filters on context.requestId", async (t) => {
  if (!(await ensureContextTestData(t))) {
    return;
  }

  const response = await post("/logs/search", {
    filter: "context.requestId==test-099",
    limit: 100,
  });

  assertOnlyRequestId(response, "test-099");
});

test("GET /logs should allow RSQL filters on context.service", async (t) => {
  if (!(await ensureContextTestData(t))) {
    return;
  }

  const response = await get(
    "/logs?filter=context.service%3D%3Dcheckout&limit=100",
  );

  assertOk(response);
  assert.ok(response.body.items.length > 0, "Expected checkout logs");

  for (const log of response.body.items) {
    assert.equal(log.context?.service, "checkout");
  }
});

test("GET /logs should allow numeric comparisons on context.durationMs", async (t) => {
  if (!(await ensureContextTestData(t))) {
    return;
  }

  const response = await get(
    "/logs?filter=context.durationMs%3E%3D304&limit=100",
  );

  assertOk(response);
  assert.ok(response.body.items.length > 0, "Expected logs with durationMs >= 304");

  for (const log of response.body.items) {
    assert.equal(typeof log.context?.durationMs, "number");
    assert.ok(log.context.durationMs >= 304);
  }
});

test("GET /logs should reject unsafe context fields", async () => {
  const response = await get(
    "/logs?filter=context.__proto__.polluted%3D%3Dtrue&limit=100",
  );

  assert.equal(response.status, 400, JSON.stringify(response.body));
  assert.equal(response.body.message, "Invalid query filter");
});
