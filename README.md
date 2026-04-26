# logarys-console-manager

`logarys-console-manager` is the Logarys console API.

It is responsible for UI-oriented requests:

- authenticating console users with JWT bearer tokens;
- managing console users in MongoDB;
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
  +--> Auth / users in MongoDB
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

# Disabled by default. Enable only in local/dev environments.
LOGARYS_ENABLE_TEST_DATA_ENDPOINTS=false

# Authentication
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN_SECONDS=43200

# Optional first admin initialization. Never auto-overwrites an existing admin.
ADMIN_INIT_ENABLED=false
ADMIN_EMAIL=admin@logarys.local
ADMIN_PASSWORD=change-me-password
ADMIN_NAME=Administrator
```

### First admin initialization

The application can create the first administrator automatically at startup.

Enable it only when bootstrapping an environment:

```env
ADMIN_INIT_ENABLED=true
ADMIN_EMAIL=admin@logarys.local
ADMIN_PASSWORD=change-me-password
ADMIN_NAME=Administrator
```

Startup behavior:

```txt
If ADMIN_INIT_ENABLED is not true:
  do nothing

If ADMIN_INIT_ENABLED is true and no admin exists:
  create the first admin user

If an admin already exists:
  do nothing
```

The initializer never overwrites an existing admin password.

## Authentication

Most routes are protected by JWT bearer authentication.

Login:

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "admin@logarys.local",
  "password": "change-me-password"
}
```

Example response:

```json
{
  "accessToken": "jwt-token",
  "expiresIn": 43200,
  "user": {
    "id": "user-id",
    "name": "Administrator",
    "email": "admin@logarys.local",
    "isAdmin": true,
    "isEnabled": true
  }
}
```

Use the token on protected routes:

```http
Authorization: Bearer jwt-token
```

## Permissions

| Action | Admin | Regular user |
|---|---:|---:|
| Login | yes | yes |
| Search logs | yes | yes |
| Convert/search query | yes | yes |
| Add/rebuild index | yes | yes |
| Read own profile | yes | yes |
| Update own name/email/password | yes | yes |
| List users | yes | no |
| Create users | yes | no |
| Update another user | yes | no |
| Disable users | yes | no |
| Manage pipelines | yes | no |
| Manage query adapters | yes | no |
| Run admin maintenance commands | yes | no |
| Load test data endpoint | yes | no |

Disabled users cannot log in, and existing tokens from disabled users are rejected.

## User management API

### List users

Admin only.

```http
GET /users
Authorization: Bearer jwt-token
```

### Create user

Admin only.

```http
POST /users
Authorization: Bearer jwt-token
Content-Type: application/json
```

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "change-me-password",
  "isAdmin": false,
  "isEnabled": true
}
```

### Update user

Admin only.

```http
PATCH /users/:id
Authorization: Bearer jwt-token
Content-Type: application/json
```

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "new-password",
  "isAdmin": false,
  "isEnabled": true
}
```

All fields are optional.

### Disable user

Admin only.

```http
PATCH /users/:id/disable
Authorization: Bearer jwt-token
```

### Delete user

Admin only.

```http
DELETE /users/:id
Authorization: Bearer jwt-token
```

### Read own profile

Authenticated users.

```http
GET /users/me
Authorization: Bearer jwt-token
```

### Update own profile

Authenticated users.

Regular users can only update their own `name`, `email`, and `password`.

```http
PATCH /users/me
Authorization: Bearer jwt-token
Content-Type: application/json
```

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "new-password"
}
```

## Console user commands

The project includes console commands for user administration.

### Create an admin user

```bash
npm run user:create -- \
  --name "Administrator" \
  --email admin@logarys.local \
  --password "change-me-password" \
  --admin
```

### Create a regular user

```bash
npm run user:create -- \
  --name "John Doe" \
  --email john@example.com \
  --password "change-me-password"
```

### Create a disabled user

```bash
npm run user:create -- \
  --name "John Doe" \
  --email john@example.com \
  --password "change-me-password" \
  --disabled
```

### Update a user password

```bash
npm run user:password -- \
  --email john@example.com \
  --password "new-password"
```

The commands use the same MongoDB environment variables as the API:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=logarys
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

## Functional tests

Functional tests are stored in `test/functional`.

Run the dev stack:

```bash
npm run dev:up
```

Run functional tests:

```bash
npm run test:functional
```

Use another API URL:

```bash
LOGARYS_CONSOLE_URL=http://localhost:3000 npm run test:functional
```

The functional HTTP helper logs in as an admin user by default so existing protected-route tests can call the API normally.

Auth-specific tests can opt out of authentication or use a regular user.

The suite includes coverage for:

- login success and failure;
- missing bearer token rejection;
- disabled user login rejection;
- admin user CRUD;
- regular user denial on admin-only routes;
- regular user profile update;
- regular user access to search/query/reindex routes.

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

Admin only.

```http
GET /query-adapters
Authorization: Bearer jwt-token
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

Admin only.

```http
POST /query-adapters/load
Authorization: Bearer jwt-token
Content-Type: application/json
```

```json
{
  "packageName": "@logarys/rsql-mongodb-adapter"
}
```

## Install an adapter from Git

Admin only.

```http
POST /query-adapters/install
Authorization: Bearer jwt-token
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

Authenticated users.

```http
POST /query/convert
Authorization: Bearer jwt-token
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

## User commands inside Docker

When running npm scripts inside the container, pass script arguments after `--` so npm does not parse them as npm options.

```bash
docker exec -it logarys-console-manager npm run user:create -- \
  --name "Sébastien Kus" \
  --email "seb@ktoi.fr" \
  --password "password"
```

Create an admin user:

```bash
docker exec -it logarys-console-manager npm run user:create -- \
  --name "Administrator" \
  --email "admin@logarys.local" \
  --password "change-me" \
  --admin
```

Update a password:

```bash
docker exec -it logarys-console-manager npm run user:password -- \
  --email "seb@ktoi.fr" \
  --password "new-password"
```

The runtime Docker image includes the `scripts/` directory so these commands are available in `/app/scripts`.
