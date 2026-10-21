# GraphQL Yoga Resolvers From SDL (TypeScript)

**One-line description:** Implements resolvers for a schema-first SDL on `graphql-yoga` with `createSchema`, codegen-generated resolver types, a typed context built from the Fetch API `Request`, and a smoke query against `/graphql`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `validated_schema` (string, required): Path to the lint-clean `schema.graphql`.
- `project_dir` (string, required): Node project root.

---

## Outputs

- `resolver_code` (string): Path to the resolver module (for example `src/resolvers.ts`).
- `server_entry` (string): Path to the server entry and the start command.

---

## Phase 1: Install and Generate Types

### Entry Criteria
- `node --version` meets the minimum in the graphql-yoga README for the version `npm view graphql-yoga version` prints.

### Actions
1. In `project_dir`: `npm i graphql-yoga graphql` and `npm i -D typescript tsx @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-resolvers`.
2. Create `codegen.ts` with plugins `typescript` and `typescript-resolvers`, output `src/__generated__/resolvers-types.ts`, and `config: { contextType: '../context#Context', mappers: { Order: '../models#OrderRow' } }`.
3. Write `src/context.ts`. Yoga merges your context with its own `YogaInitialContext` (which carries `request` and `params`), so declare `export type Context = YogaInitialContext & { db: Db; userId: string | null }` importing `YogaInitialContext` from `graphql-yoga`.
4. Run `npx graphql-codegen`.

### Output
Generated resolver types.

### Quality Gate
- `npx graphql-codegen` exits 0.
- `grep -c "export type Resolvers" src/__generated__/resolvers-types.ts` prints at least `1`.

---

## Phase 2: Write Resolvers

### Entry Criteria
- Generated types exist.

### Actions
1. Create `src/resolvers.ts` exporting `resolvers: Resolvers`.
2. Implement root fields first, then type field resolvers. Resolver arguments are `(parent, args, context, info)`; read the caller and database only from `context`.
3. Add `Node.__resolveType`. Add field resolvers only where the API value differs from the row property.
4. Errors: throw `GraphQLError` (import from `graphql`) for expected failures. Yoga masks every other thrown error as `Unexpected error.` by default (`maskedErrors` is on), so a plain `throw new Error('not found')` reaches the client as `Unexpected error.`; this is intended, and `gql-error-extensions` sets the codes.
5. Run `npx tsc --noEmit` after each resolver group; no `as any`.

### Output
`src/resolvers.ts`.

### Quality Gate
- `npx tsc --noEmit` exits 0.
- `grep -n "as any" src/resolvers.ts` prints nothing.

---

## Phase 3: Start and Smoke Test

### Entry Criteria
- Type check passes.

### Actions
1. Create `src/server.ts`:
```ts
import { createServer } from 'node:http';
import { createSchema, createYoga } from 'graphql-yoga';
import { readFileSync } from 'node:fs';
import { resolvers } from './resolvers';
const yoga = createYoga({
  schema: createSchema({ typeDefs: readFileSync('schema.graphql', 'utf8'), resolvers }),
  context: async ({ request }) => ({ db, userId: await userFromAuthHeader(request.headers.get('authorization')) }),
});
createServer(yoga).listen(Number(process.env.PORT ?? 4000), () => console.log('ready'));
```
Yoga serves on `/graphql` by default (`graphqlEndpoint` option) and serves GraphiQL on GET in a browser (`graphiql` option; set `graphiql: false` in production if your policy requires it).
2. Start: `npx tsx src/server.ts`.
3. Smoke: `curl -s -X POST http://localhost:4000/graphql -H 'content-type: application/json' -d '{"query":"{ __typename }"}'` prints `{"data":{"__typename":"Query"}}`.
4. Run one real operation from `operations/` and confirm no `errors` key.
5. Note the request object is the Fetch API `Request`: read headers with `request.headers.get('x')`, not `req.headers.x`.

### Output
`resolver_code`, `server_entry`.

### Quality Gate
- Smoke curl prints exactly `{"data":{"__typename":"Query"}}`.
- One real operation returns no `errors` key.

---

## Worked Example

Illustrative only.

Phase 2 excerpt:
```ts
Query: {
  node: async (_p, { id }, ctx) => ctx.db.findByGlobalId(id),
  viewer: (_p, _a, ctx) => (ctx.userId ? { id: ctx.userId } : null),
},
```
Phase 3: `npx tsx src/server.ts` prints `ready`; `curl ... /graphql` prints `{"data":{"__typename":"Query"}}`. Running `CustomerOrders` with no auth header returns `{"data":{"viewer":null}}`, which matches the nullable `viewer` decision.

---

## Exit Criteria

DONE when types compile, resolvers are implemented without `any`, the server answers on `/graphql`, and one real operation succeeds.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Context type conflicts with `YogaInitialContext` | **Adjust**: intersect your type with `YogaInitialContext` instead of redefining `request`. |
| Phase 3 | Curl to `/` returns 404 | **Adjust**: Yoga listens on `/graphql`; use that path or set `graphqlEndpoint`. |
| Phase 3 | Client sees `Unexpected error.` | **Return**: read the server log for the original error; fix the resolver or throw a `GraphQLError` for an expected case. |
| Any | Tempted to set `maskedErrors: false` to see errors | **Stop**: that leaks internals; read server logs or run with `NODE_ENV=development` locally instead. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
