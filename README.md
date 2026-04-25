# logarys-console-manager

`logarys-console-manager` is the Logarys console API.

It is responsible for UI-oriented requests:

- searching logs with a query language such as RSQL;
- converting external query languages to MongoDB queries through adapters;
- exposing dashboard reports;
- managing configuration objects such as pipelines;
- sending maintenance commands to the Logarys backend through NATS.

This application is designed to work with:

- TypeScript;
- NestJS;
- MongoDB;
- NATS JetStream;
- `@logarys/query-adapter-contracts`;
- `@logarys/rsql-mongodb-adapter`.

## Architecture

```txt
UI / frontend
  |
  v
logarys-console-manager
  |
  +--> Query adapters
  +--> MongoDB logs
  +--> MongoDB configs
  +--> NATS maintenance commands
```

The console manager does not ingest logs and should not write raw logs directly.

Log ingestion and storage are handled by other services, for example:

```txt
logarys-ingestor
logarys-storage-manager
logarys-console-manager
logarys-ui
```

## Installation

```bash
npm install
```

If the Logarys adapter packages are not published yet, install them locally:

```bash
npm install ../query-adapter-contracts
npm install ../rsql-mongodb-adapter
```

## Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Available variables:

```env
APP_HOST=0.0.0.0
APP_PORT=3000
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=logarys
NATS_URL=nats://localhost:4222
QUERY_ADAPTERS_DIR=/var/lib/logarys/query-adapters
QUERY_ADAPTER_ALLOWED_GIT_PREFIXES=https://github.com/logarys/,https://gitlab.com/logarys/
```

## Development

```bash
npm run start:dev
```

## Build

```bash
npm run build
```

## Test

```bash
npm test
```

# Functional Tests

Copy the `test/functional` directory into `logarys-console-manager`.

Add this script to `package.json`:

```json
{
  "scripts": {
    "test:functional": "node --test test/functional/*.functional-spec.mjs"
  }
}
```

Start the dev stack:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Run tests:

```bash
npm run test:functional
```

Use another API URL:

```bash
LOGARYS_CONSOLE_URL=http://localhost:3000 npm run test:functional
```

## Query adapters

The console manager uses the adapter pattern.

Every query adapter must implement the `QueryAdapter` contract from:

```txt
@logarys/query-adapter-contracts
```

Every external adapter package must export a standard factory:

```ts
import type { QueryAdapter } from "@logarys/query-adapter-contracts";
import { MyAdapter } from "./my-adapter.js";

export function createAdapter(): QueryAdapter {
  return new MyAdapter();
}
```

At startup, this package registers the default RSQL to MongoDB adapter:

```txt
@logarys/rsql-mongodb-adapter
```

## List installed adapters

```http
GET /query-adapters
```

Example response:

```json
[
  {
    "name": "rsql-mongodb",
    "language": "rsql",
    "target": "mongodb",
    "version": "0.1.0"
  }
]
```

## Load an installed npm package

```http
POST /query-adapters/load
Content-Type: application/json
```

```json
{
  "packageName": "@logarys/rsql-mongodb-adapter"
}
```

## Install an adapter from Git

```http
POST /query-adapters/install
Content-Type: application/json
```

```json
{
  "gitUrl": "https://github.com/logarys/custom-query-adapter.git",
  "branch": "main"
}
```

The installer will:

1. clone the repository;
2. run `npm ci --omit=dev`;
3. run `npm run build`;
4. check the package entrypoint;
5. load the adapter from `dist/index.js`;
6. register the adapter in the runtime registry.

For security, only Git URLs matching `QUERY_ADAPTER_ALLOWED_GIT_PREFIXES` are accepted.

## Convert a query

```http
POST /query/convert
Content-Type: application/json
```

```json
{
  "language": "rsql",
  "target": "mongodb",
  "query": "level==error;host==api-01"
}
```

Example response:

```json
{
  "filter": {
    "$and": [
      {
        "level": "error"
      },
      {
        "host": "api-01"
      }
    ]
  }
}
```

## Search logs

```http
GET /logs?filter=level==error;host==api-01&limit=100
```

The `filter` parameter is converted through the selected query adapter.

Default language:

```txt
rsql
```

Default target:

```txt
mongodb
```

## Reports

### Errors by type

```http
GET /reports/errors/by-type?filter=source==nginx&from=2026-04-25T00:00:00Z&to=2026-04-25T23:59:59Z
```

### Errors by host

```http
GET /reports/errors/by-host?filter=source==nginx
```

### Errors by source

```http
GET /reports/errors/by-source
```

### Error progression

```http
GET /reports/errors/progression?groupBy=hour&from=2026-04-25T00:00:00Z&to=2026-04-25T23:59:59Z
```

Supported values for `groupBy`:

```txt
hour
day
```

## Configuration endpoints

### List pipelines

```http
GET /configs/pipelines
```

### Create pipeline

```http
POST /configs/pipelines
Content-Type: application/json
```

```json
{
  "name": "nginx-pipeline",
  "enabled": true,
  "source": "nginx",
  "parser": "nginx-access",
  "rules": []
}
```

## Maintenance commands

Maintenance commands are published to NATS on:

```txt
logarys.maintenance.commands
```

### Reload pipelines

```http
POST /maintenance/reload-pipelines
```

### Reindex

```http
POST /maintenance/reindex
```

### Rotate

```http
POST /maintenance/rotate
```

## Security notes

Dynamic adapter installation is powerful and dangerous.

Recommended production safeguards:

- restrict adapter installation to administrators;
- whitelist Git domains;
- execute adapters in an isolated runner process;
- store installed adapter metadata in MongoDB;
- add adapter signatures or trusted hashes;
- add timeouts to installation and conversion;
- never expose MongoDB query objects directly to untrusted clients;
- always use field whitelists.

## License

MIT
