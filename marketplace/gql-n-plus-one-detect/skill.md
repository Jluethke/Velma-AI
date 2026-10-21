# Detect N+1 Queries Per GraphQL Operation

**One-line description:** Counts the SQL statements each GraphQL operation issues at two different result sizes, using the ORM or driver query log for the stack, and names every field whose query count grows with the number of parent items.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Server project root.
- `stack` (string, required): One of `apollo`, `yoga`, `python`, `go`.
- `operation_documents` (string, required): Directory of operation files; list operations are the test targets.

---

## Outputs

- `query_count_report` (object[]): Per operation: item count N1 and N2, SQL statement count at each, and the repeated statement text.
- `n_plus_one_fields` (object[]): Each offending field coordinate (`Order.customer`), the repeated SQL, and the parent key it filters by.

---

## Phase 1: Turn On Statement Counting

### Entry Criteria
- The server runs against a local or test database you can seed.

### Actions
1. Enable a per-request statement counter for your data layer:

| `stack` / data layer | How to count statements |
|---|---|
| Node + Prisma | `new PrismaClient({ log: [{ emit: 'event', level: 'query' }] })` and `prisma.$on('query', e => ctx.sql.push(e.query))` |
| Node + Knex | `knex.on('query', q => ...)` event |
| Node + `pg` directly | wrap `pool.query` in a function that pushes the SQL text into a per-request array |
| Python + SQLAlchemy | `event.listen(engine.sync_engine if async else engine, "before_cursor_execute", lambda conn, cur, stmt, *a: counter.append(stmt))` |
| Python + Django ORM | `from django.test.utils import CaptureQueriesContext` with `connection`; `len(ctx.captured_queries)` |
| Go + pgx v5 | set `config.ConnConfig.Tracer` to a type implementing `pgx.QueryTracer` (`TraceQueryStart`, `TraceQueryEnd`) that appends `data.SQL` |
| Go + `database/sql` | wrap the driver with an instrumenting wrapper, or count in your repository layer |

2. Store the list on the request context so each GraphQL request has its own counter. A global counter mixes concurrent requests.
3. Log the count and the statements at the end of each request (Apollo plugin `willSendResponse`, Yoga/envelop `onExecute` done hook, Strawberry extension `on_operation` after `yield`, gqlgen `srv.AroundResponses`).

### Output
Per-request statement log.

### Quality Gate
- Sending `{ __typename }` logs a count of `0` statements; sending one list operation logs a count of `1` or more.

---

## Phase 2: Measure at Two Sizes

### Entry Criteria
- Counting works.

### Actions
1. Pick every operation in `operation_documents` that selects a list or connection with nested object fields.
2. Seed the database so the list returns N1 items, run the operation, record the count. Then seed to N2 items (N2 different from N1, for example N1 = 2 and N2 = 5; any two distinct sizes work) and record again.
3. Decision rule:

| Count at N1 vs N2 | Verdict |
|---|---|
| Equal | No N+1 for this operation |
| Count grows by (N2 - N1) times k | N+1: k nested fields each issue one query per item |
| Count grows but not linearly | Partial batching or caching; inspect statements |

4. Run each measurement with a fresh server request; do not reuse a warmed cache that hides queries.

### Output
`query_count_report`.

### Quality Gate
- Every list operation has two recorded counts at two distinct sizes.

---

## Phase 3: Name the Offending Fields

### Entry Criteria
- At least one operation has a growing count, or all are equal (then emit empty `n_plus_one_fields`).

### Actions
1. In the statement log at N2, group identical SQL texts (ignoring parameter values). A statement repeated N2 times is the per-item query, for example `SELECT * FROM customers WHERE id = $1` repeated 5 times.
2. Map it to the resolver that runs it: search the code for the table name, for example `grep -rn "customers" src/` or `grep -rn "Customer" graph/*.resolvers.go`. The field whose resolver issues it is the offender (`Order.customer`).
3. Record field coordinate, repeated SQL, and the parent key (`orders.customer_id`) in `n_plus_one_fields`. The DataLoader flow for your stack batches by that key.
4. Add a regression test that runs the operation at N2 and asserts the statement count equals the count measured at N1. It fails now and passes after batching.

### Output
`n_plus_one_fields`, regression test.

### Quality Gate
- Each `n_plus_one_fields` row names a resolver file and line found by grep.
- The regression test fails before the fix (record the failing output).

---

## Worked Example

Illustrative only. `stack = apollo`, Prisma.

Phase 2: `CustomerOrders` with 2 orders logs 3 statements; with 5 orders logs 6 statements. Growth 3 for a size change of 3: k = 1, one N+1 field.

Phase 3 grouped log at N2:
```
1x SELECT ... FROM "Order" WHERE "customerId" = $1 ORDER BY ... LIMIT $2
5x SELECT ... FROM "Customer" WHERE "id" = $1 LIMIT $2
```
`grep -rn "customer.findUnique" src/` points to `src/resolvers.ts:58` in `Order.customer`. Row: `{ field: "Order.customer", sql: "SELECT ... FROM Customer WHERE id = $1", parent_key: "Order.customerId" }`.

---

## Exit Criteria

DONE when every list operation has counts at two sizes and every per-item query is mapped to a field with a failing regression test.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Counter shows statements from other requests | **Adjust**: move the counter from module scope into the request context. |
| Phase 2 | Count equal but responses are slow | **Return**: not an N+1; hand off to `gql-otel-resolver-tracing`. |
| Phase 3 | Repeated SQL comes from an ORM lazy-load, not a resolver | **Adjust**: record the relation attribute that triggered it (for example a SQLAlchemy relationship) as the offender. |
| Any | Tempted to fix with eager JOINs on every root query | **Stop**: that fetches data for fields the client did not select; batch with DataLoader instead. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
