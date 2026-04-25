import test from "node:test";
import assert from "node:assert/strict";
import { QueryAdapterRegistryService } from "../dist/query-adapters/query-adapter-registry.service.js";

test("registry registers and retrieves adapters", () => {
  const registry = new QueryAdapterRegistryService();
  const adapter = {
    getMetadata() {
      return {
        name: "test-adapter",
        language: "test",
        target: "mongodb",
        version: "0.1.0",
      };
    },
    supports(language, target) {
      return language === "test" && target === "mongodb";
    },
    convert(input) {
      return { filter: { query: input.query } };
    },
  };

  registry.register(adapter);

  assert.equal(registry.list().length, 1);
  assert.equal(registry.get("test", "mongodb"), adapter);
});
