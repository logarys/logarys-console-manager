import test from "node:test";
import assert from "node:assert/strict";
import { LogsService } from "../dist/logs/logs.service.js";

class FakeCollection {
  constructor(name, documents, calls) {
    this.name = name;
    this.documents = documents;
    this.calls = calls;
    this.filter = null;
    this.sortValue = null;
    this.limitValue = null;
  }

  find(filter) {
    this.filter = filter;
    this.calls.push({ collection: this.name, filter });
    return this;
  }

  sort(sort) {
    this.sortValue = sort;
    return this;
  }

  limit(limit) {
    this.limitValue = limit;
    return this;
  }

  async toArray() {
    return this.documents;
  }
}

class FakeMongoService {
  constructor(collections) {
    this.collections = collections;
    this.calls = [];
  }

  async listCollectionNames() {
    return Object.keys(this.collections);
  }

  collection(name) {
    return new FakeCollection(name, this.collections[name] ?? [], this.calls);
  }
}

const queryService = {
  convert() {
    return { filter: {} };
  },
};

test("LogsService reads rotated log collections and flattens storage-manager documents", async () => {
  const mongo = new FakeMongoService({
    logs_2026_05_01: [
      {
        _id: "stored-id",
        source: "locafire-docker",
        receivedAt: new Date("2026-05-01T18:36:30.725Z"),
        payload: {
          pipelineId: "locafire-docker",
          normalizedLog: {
            timestamp: "2026-05-01T20:45:00.000Z",
            level: "ERROR",
            message: "Database connection failed",
            source: "locafire-docker",
            host: "locafire-prod-1",
            context: {
              service: "api",
              env: "production",
              raw: "raw log line",
            },
          },
        },
      },
    ],
  });

  const service = new LogsService(mongo, queryService);
  const logs = await service.search({
    text: "Database connection failed",
    limit: 100,
    skip: 0,
  });

  assert.equal(logs.length, 1);
  assert.equal(logs[0].pipelineId, "locafire-docker");
  assert.equal(logs[0].level, "ERROR");
  assert.equal(logs[0].message, "Database connection failed");
  assert.equal(logs[0].source, "locafire-docker");
  assert.equal(logs[0].host, "locafire-prod-1");
  assert.equal(logs[0].service, "api");
  assert.equal(logs[0].environment, "production");
  assert.equal(logs[0].raw, "raw log line");
  assert.equal(logs[0].timestamp.toISOString(), "2026-05-01T20:45:00.000Z");

  assert.deepEqual(mongo.calls[0].filter, {
    $or: [
      { "payload.normalizedLog.message": /Database connection failed/i },
      { "payload.normalizedLog.source": /Database connection failed/i },
      { "payload.normalizedLog.level": /Database connection failed/i },
      { "payload.normalizedLog.host": /Database connection failed/i },
      { "payload.normalizedLog.context.service": /Database connection failed/i },
      { "payload.normalizedLog.context.env": /Database connection failed/i },
      { "payload.normalizedLog.context.raw": /Database connection failed/i },
      { source: /Database connection failed/i },
    ],
  });
});

test("LogsService remaps RSQL filters for rotated storage-manager log documents", async () => {
  const mongo = new FakeMongoService({
    logs_2026_05_01: [],
  });
  const service = new LogsService(mongo, {
    convert() {
      return {
        filter: {
          message: /Database/i,
          level: "ERROR",
          service: "api",
        },
      };
    },
  });

  await service.search({
    query: "message==*Database*;level==ERROR;service==api",
    limit: 100,
    skip: 0,
  });

  assert.deepEqual(mongo.calls[0].filter, {
    "payload.normalizedLog.message": /Database/i,
    "payload.normalizedLog.level": "ERROR",
    "payload.normalizedLog.context.service": "api",
  });
});
