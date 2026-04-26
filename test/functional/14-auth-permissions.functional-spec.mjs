import test from "node:test";
import assert from "node:assert/strict";
import { get, post, assertOk, createRegularUser, getRegularToken } from "./http-client.mjs";

async function getRegularAuthToken() {
  const user = await createRegularUser("functional-permission-user");
  return getRegularToken(user);
}

test("regular user should search logs", async () => {
  const token = await getRegularAuthToken();
  const response = await get("/logs?limit=5", { auth: token });

  assertOk(response);
  assert.equal(typeof response.body, "object");
  assert.equal(typeof response.body.count, "number");
  assert.equal(Array.isArray(response.body.items), true);
});

test("regular user should convert queries", async () => {
  const token = await getRegularAuthToken();
  const response = await post(
    "/query/convert",
    {
      language: "rsql",
      target: "mongodb",
      query: "level==error",
    },
    { auth: token },
  );

  assertOk(response);
  assert.deepEqual(response.body.filter, { level: "error" });
});

test("regular user should request reindex command", async () => {
  const token = await getRegularAuthToken();
  const response = await post("/maintenance/reindex", {}, { auth: token });

  assertOk(response);
  assert.equal(response.body.type, "REINDEX");
});

test("regular user should not manage pipelines", async () => {
  const token = await getRegularAuthToken();
  const response = await get("/pipelines", { auth: token });

  assert.equal(response.status, 403, JSON.stringify(response.body));
});

test("regular user should not manage query adapters", async () => {
  const token = await getRegularAuthToken();
  const response = await get("/query-adapters", { auth: token });

  assert.equal(response.status, 403, JSON.stringify(response.body));
});

test("regular user should not run admin maintenance commands", async () => {
  const token = await getRegularAuthToken();
  const response = await post("/maintenance/reload-pipelines", {}, { auth: token });

  assert.equal(response.status, 403, JSON.stringify(response.body));
});
