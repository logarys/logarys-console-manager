# Contributing to logarys-console-manager

Thank you for contributing to Logarys.

This package is the backend API used by the Logarys UI. It focuses on query conversion, dashboard reports, configuration management and maintenance commands.

## Requirements

- Node.js 22 or later
- npm
- MongoDB for runtime testing
- NATS for maintenance command testing

## Setup

```bash
npm install
cp .env.example .env
```

If the local Logarys packages are not published yet:

```bash
npm install ../query-adapter-contracts
npm install ../rsql-mongodb-adapter
```

## Development commands

```bash
npm run start:dev
npm run build
npm run lint
npm test
```

## Code style

- Use TypeScript strict mode.
- Keep comments in English.
- Use explicit return types on public methods.
- Keep modules small and focused.
- Avoid coupling controllers directly to MongoDB or NATS.
- Put business logic in services.

## Adapter loading rules

External adapters must:

1. implement `QueryAdapter` from `@logarys/query-adapter-contracts`;
2. export `createAdapter()`;
3. build to `dist/index.js`;
4. provide valid adapter metadata.

Example:

```ts
export function createAdapter(): QueryAdapter {
  return new MyAdapter();
}
```

## Security rules

When working on dynamic adapter loading:

- do not execute shell commands through string interpolation;
- use `execFile`, not `exec`;
- validate Git URLs;
- keep domain allowlists;
- avoid loading untrusted packages in the main process in production;
- prefer an isolated runner process for external adapters.

## Pull request checklist

Before opening a pull request:

- run `npm run build`;
- run `npm test`;
- update the README when adding or changing endpoints;
- add tests for new services;
- keep public API changes explicit.

## Commit messages

Use clear messages:

```txt
Add query adapter registry
Add reports endpoints
Fix Git adapter installer validation
```

## License

By contributing, you agree that your contribution will be licensed under the MIT license.
