# Batch N+1 Fields With DataLoader (Node)

**One-line description:** Replaces each per-item lookup found by N+1 detection with a per-request `dataloader` instance whose batch function issues one `IN (...)` query and returns results in key order, for Apollo Server or GraphQL Yoga.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `n_plus_one_fields` (object[], required): Offending fields with repeated SQL and parent key, from `gql-n-plus-one-detect`.
- `project_dir` (string, required): Node server project root.

---

## Outputs

- `loader_code` (string): Path to the loaders module (for example `src/loaders.ts`).
- `query_count_after` (object[]): Per fixed operation: statement count at the same two sizes after batching.

---

## Phase 1: Write One Batch Function Per Key

### Entry Criteria
- `n_plus_one_fields` is non-empty; the regression test from detection fails.

### Actions
1. `npm i dataloader`.
2. Create `src/loaders.ts`. For each offending field, write one batch function keyed by the parent key:
```ts
import DataLoader from 'dataloader';
export function createLoaders(db: Db) {
  return {
    customerById: new DataLoader<string, Customer | null>(async (ids) => {
      const rows = await db.customer.findMany({ where: { id: { in: [...ids] } } });
      const byId = new Map(rows.map((r) => [r.id, r]));
      return ids.map((id) => byId.get(id) ?? null);
    }),
  };
}
```
3. The batch function contract (from the DataLoader README): it receives an array of keys and must return a Promise of an array of the same length, where index i holds the value or an `Error` for key i. The database returns rows in any order and omits missing ids, so always re-map through a `Map`; never `return rows`.
4. For one-to-many relations (an order's line items), the value per key is an array: group rows by foreign key and return `ids.map(id => groups.get(id) ?? [])`.
5. Keys that are objects need `cacheKeyFn` (for example `cacheKeyFn: (k) => \`${k.tenantId}:${k.id}\``), otherwise every object is a distinct cache key.
6. If the database limits the number of bind parameters in one statement, set the `maxBatchSize` option to that documented limit; do not invent a value.

### Output
`src/loaders.ts` with one loader per offending field.

### Quality Gate
- `npx tsc --noEmit` exits 0.
- Every batch function body contains a `.map(` over the input keys (`grep -n "ids.map\|keys.map" src/loaders.ts` lists one per loader).

---

## Phase 2: Create Loaders Per Request and Use Them

### Entry Criteria
- Loaders compile.

### Actions
1. Create loaders inside the context function so each request gets new instances:
   - Apollo: in `startStandaloneServer(server, { context: async ({ req }) => ({ db, userId, loaders: createLoaders(db) }) })`.
   - Yoga: in `createYoga({ context: async ({ request }) => ({ db, userId, loaders: createLoaders(db) }) })`.
2. NEVER create a loader at module level. Its cache would live for the whole process, serving one user's data to another and never seeing updates.
3. Add `loaders` to the `Context` type and regenerate codegen types if the context type is generated.
4. Change each offending resolver to `Order: { customer: (row, _a, ctx) => ctx.loaders.customerById.load(row.customerId) }`.
5. If a mutation changes an entity in the same request, call `ctx.loaders.customerById.clear(id)` (or `.prime(id, newValue)`) before reading it again.
6. Change one resolver, run the detection regression test, then move to the next.

### Output
Resolvers using loaders.

### Quality Gate
- `grep -rn "new DataLoader" src/ | grep -v loaders.ts` prints nothing.
- `grep -n "createLoaders(" src/server.ts` shows the call inside the context function.

---

## Phase 3: Prove the Batch

### Entry Criteria
- All offending resolvers use loaders.

### Actions
1. Rerun the detection measurement at the same N1 and N2. Record counts in `query_count_after`.
2. The count at N2 must equal the count at N1. Inspect the statement log: the per-item statement is replaced by one `... WHERE "id" IN ($1, $2, ...)` (Prisma logs `IN` with one parameter per id).
3. Run the regression test from detection: it now passes.
4. Run the full test suite to catch ordering bugs: `npx vitest run` or `npx jest`.

### Output
`loader_code`, `query_count_after`.

### Quality Gate
- `query_count_after` shows equal counts at N1 and N2 for each fixed operation.
- Full test suite exits 0 with no tests skipped or deleted.

---

## Worked Example

Illustrative only.

Input: `{ field: "Order.customer", parent_key: "Order.customerId" }`. Before: 3 statements at 2 orders, 6 at 5 orders.

After Phase 2, log at 5 orders:
```
SELECT ... FROM "Order" WHERE "customerId" = $1 ORDER BY ... LIMIT $2
SELECT ... FROM "Customer" WHERE "id" IN ($1,$2,$3,$4,$5)
```
`query_count_after`: `{ op: "CustomerOrders", n1: 2, count1: 2, n2: 5, count2: 2 }`. Regression test: `1 passed`.

---

## Exit Criteria

DONE when each offending field loads through a per-request DataLoader and statement counts no longer grow with item count.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `DataLoader must be constructed with a function which accepts Array<key> and returns Promise<Array<value>>, but the function did not return a Promise of an Array of the same length` | **Return**: the batch function returned `rows` directly; re-map through a `Map` keyed by id. |
| Phase 2 | Users see each other's data | **Stop**: a loader is shared across requests; move creation into the context function. |
| Phase 3 | Count still grows | **Adjust**: the resolver awaits each load in a loop (`for ... await load`); use `loadMany` or let parallel field resolvers call `load` without serial awaits. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
