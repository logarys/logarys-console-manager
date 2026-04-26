import test from "node:test";
import assert from "node:assert/strict";
import { QueryService } from "../dist/query/query.service.js";

function makeService(adapter) {
  return new QueryService({
    get(language, target) {
      assert.equal(language, "rsql");
      assert.equal(target, "mongodb");
      return adapter;
    },
  });
}

function getBadRequestBody(error) {
  assert.equal(error?.constructor?.name, "BadRequestException");
  const response = error.getResponse();
  assert.equal(typeof response, "object");
  return response;
}

test("QueryService returns HTTP 400 body for RSQL syntax errors", () => {
  const service = makeService({
    convert() {
      const error = new Error("Missing value in comparison: level==");
      error.name = "RsqlSyntaxError";
      throw error;
    },
  });

  assert.throws(
    () => service.convert("rsql", "mongodb", "level=="),
    (error) => {
      const body = getBadRequestBody(error);
      assert.equal(body.message, "Invalid RSQL syntax");
      assert.match(body.details, /Missing value/);
      assert.equal(body.query, "level==");
      return true;
    },
  );
});

test("QueryService returns HTTP 400 body for empty query before adapter call", () => {
  let called = false;
  const service = makeService({
    convert() {
      called = true;
      return { filter: {} };
    },
  });

  assert.throws(
    () => service.convert("rsql", "mongodb", "   "),
    (error) => {
      const body = getBadRequestBody(error);
      assert.equal(body.message, "Invalid RSQL syntax");
      assert.match(body.details, /non-empty string/);
      return true;
    },
  );

  assert.equal(called, false);
});

test("QueryService keeps field validation errors as invalid query filters", () => {
  const service = makeService({
    convert() {
      throw new Error("Field is not allowed: error");
    },
  });

  assert.throws(
    () => service.convert("rsql", "mongodb", 'error=="critical"'),
    (error) => {
      const body = getBadRequestBody(error);
      assert.equal(body.message, "Invalid query filter");
      assert.match(body.details, /Field is not allowed/);
      assert.ok(Array.isArray(body.allowedFields));
      return true;
    },
  );
});
