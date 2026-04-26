import test from "node:test";
import assert from "node:assert/strict";
import { get, post } from "./http-client.mjs";

function assertBadRequestForRsqlSyntax(response, pattern = /Invalid RSQL|Missing|Unbalanced|Unexpected|Unclosed|Empty expression|Query must be/) {
  assert.equal(response.status, 400, JSON.stringify(response.body));
  assert.equal(typeof response.body, "object");
  assert.equal(response.body.message, "Invalid RSQL syntax");
  assert.match(String(response.body.details ?? ""), pattern);
}

test("POST /query/convert should reject malformed RSQL syntax with HTTP 400", async () => {
  const response = await post("/query/convert", {
    query: "level==error;",
  });

  assertBadRequestForRsqlSyntax(response, /Empty expression/);
});

test("POST /query/convert should reject empty RSQL query with HTTP 400", async () => {
  const response = await post("/query/convert", {
    query: "   ",
  });

  assertBadRequestForRsqlSyntax(response, /Query must be a non-empty string/);
});

test("GET /logs should reject malformed RSQL filter before executing Mongo query", async () => {
  const filter = encodeURIComponent("level==error;");
  const response = await get(`/logs?filter=${filter}&limit=10`);

  assertBadRequestForRsqlSyntax(response, /Empty expression/);
});

test("GET /logs should reject malformed RSQL query alias before executing Mongo query", async () => {
  const query = encodeURIComponent("(level==error");
  const response = await get(`/logs?query=${query}&limit=10`);

  assertBadRequestForRsqlSyntax(response, /Unbalanced parentheses/);
});

test("POST /logs/search should reject malformed RSQL filter before executing Mongo query", async () => {
  const response = await post("/logs/search", {
    filter: "level==",
    limit: 10,
  });

  assertBadRequestForRsqlSyntax(response, /Missing value/);
});

test("POST /api/logs/search should reject malformed RSQL query alias before executing Mongo query", async () => {
  const response = await post("/api/logs/search", {
    query: "level==\"unterminated",
    limit: 10,
  });

  assertBadRequestForRsqlSyntax(response, /Unclosed quote/);
});
