# Prisma N+1 Query Fix

**One-line description:** Detects N+1 queries in a Node.js or TypeScript code path using Prisma query events, fixes each with nested `include`/`select`, `_count`, or batched `findMany` with `in`, uses DataLoader for GraphQL resolvers, and pins the query count in a Jest or Vitest test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Project root containing `package.json` and `prisma/schema.prisma`.
- `test_command` (string, required): For example `npm test`, `npx jest` or `npx vitest run`.
- `suspect_endpoint` (string, required): Route handler, GraphQL resolver or job suspected of N+1.

---

## Outputs

- `n_plus_one_fixes` (object[]): Per fix: file and line, query code before and after, counts at two sizes, and the pinning test.

---

## Phase 1: Count Queries

### Entry Criteria
- `test_command` passes before any change.
- Prisma version recorded: `npx prisma --version`.

### Actions
1. In the test setup, create the client with query events:
```ts
import { PrismaClient } from "@prisma/client";
export const queries: string[] = [];
export const prisma = new PrismaClient({ log: [{ emit: "event", level: "query" }] });
prisma.$on("query", (e) => { queries.push(e.query); });
```
   Make the code under test use this client (dependency injection or a test module mock). Do not create a second client inside the code under test.
2. Seed 10 parents with children, clear `queries`, call the handler, record `queries.length`. Repeat with 20. Growth means N+1.
3. The repeated SQL (for example `SELECT ... FROM "public"."OrderItem" WHERE "orderId" = $1`) names the relation. Search the handler for `await prisma.<model>.find...` inside `for`, `map` or `Promise.all` loops.
4. GraphQL: a field resolver like `Order.items: (parent) => prisma.orderItem.findMany({ where: { orderId: parent.id } })` runs once per parent; that is the N+1.

### Output
Counts at two sizes and the looping call sites.

### Quality Gate
- Two counts at two sizes recorded from test output.
- Each looping call site is named by file and line.

---

## Phase 2: Apply the Fix

### Entry Criteria
- N+1 confirmed.

### Actions
1. Choose:

| Pattern | Fix |
|---|---|
| Loop calling `findMany`/`findUnique` per parent | one parent query with `include: { items: true }` or nested `select` |
| Only a count per parent | `include: { _count: { select: { items: true } } }` |
| IDs collected, then fetched one by one | `prisma.item.findMany({ where: { orderId: { in: ids } } })` then group in memory with a `Map` |
| GraphQL field resolver | DataLoader (`npm install dataloader`) per request: `new DataLoader(async (ids) => { const rows = await prisma.orderItem.findMany({ where: { orderId: { in: [...ids] } } }); return ids.map(id => rows.filter(r => r.orderId === id)); })`; create loaders in the request context, never as a global |
| `findUnique` calls in the same tick | Prisma batches these automatically into one query when they target the same model and unique field; keep them as `findUnique` rather than `findFirst` to get the batching |

2. `include` produces separate queries per relation by default. Newer Prisma versions offer `relationLoadStrategy: "join"` (database-level join); check whether your version supports it and whether it needs the `relationJoins` preview flag in `schema.prisma` before using it.
3. Select only needed fields with `select` to keep rows narrow.
4. Edit one call site per change.

### Output
Query code updated at one call site.

### Quality Gate
- `git diff --stat` shows only the intended file.
- `npx tsc --noEmit` exits 0 if the project is TypeScript (the result type of `include` changes).

---

## Phase 3: Pin and Run

### Entry Criteria
- Phase 2 edit made.

### Actions
1. Rerun the counting test at both sizes; counts must match.
2. Assert: `expect(queries.length).toBe(EXPECTED)` with the post-fix count. Exclude transaction statements (`BEGIN`, `COMMIT`) from the count if the code uses `$transaction`, and say so in the test.
3. Run the full `test_command`. Do not skip, delete or loosen tests.

### Output
`n_plus_one_fixes`.

### Quality Gate
- Equal counts at both sizes in test output.
- The count assertion passes.
- Full `test_command` exit code is 0.

---

## Worked Example

Illustrative only.

Input: `src/routes/orders.ts` handler for `GET /orders`.

Phase 1: 10 orders gives 21 queries; 20 gives 41. Loop at line 22:
```ts
const orders = await prisma.order.findMany({ where: { status: "SHIPPED" }, take: 50 });
for (const o of orders) { o.items = await prisma.orderItem.findMany({ where: { orderId: o.id } }); }
```
Phase 2:
```ts
const orders = await prisma.order.findMany({
  where: { status: "SHIPPED" }, take: 50,
  include: { items: { select: { id: true, sku: true, qty: true } } },
});
```
Phase 3: 2 queries at both sizes (orders, then items `IN`). `expect(queries.length).toBe(2)`. `npx vitest run`: 96 passed.

---

## Exit Criteria

DONE when counts are constant across sizes, a test pins the count, types check, and the full suite passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Code under test creates its own `PrismaClient` | **Adjust**: refactor to accept the client as a parameter in that one module, then count. |
| Phase 2 | Type errors after adding `include` | **Adjust**: update the function's return type to `Prisma.OrderGetPayload<{ include: { items: true } }>` or the equivalent; do not cast to `any`. |
| Phase 2 | DataLoader returns results in the wrong order | **Retry**: return results mapped in the same order as the input keys, as DataLoader requires. |
| Phase 3 | Count includes unrelated queries from middleware | **Adjust**: clear `queries` immediately before the call under test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
