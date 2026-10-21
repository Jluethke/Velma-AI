# Connection Resolver With SQL Keyset Pagination

**One-line description:** Implements a Relay connection resolver backed by a SQL keyset (seek) query with opaque base64url cursors, the `LIMIT n+1` trick for `hasNextPage`, a matching composite index, and tests that page through inserts without skipping or repeating rows.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cursor_spec` (object[], required): Cursor contract rows from `gql-relay-connection-schema`.
- `project_dir` (string, required): Server project root.
- `stack` (string, required): One of `apollo`, `yoga`, `python`, `go`.
- `max_page_size` (integer, required): Largest `first`/`last` the server accepts. A product decision supplied by the user; this flow does not choose it.

---

## Outputs

- `connection_resolvers` (string[]): Paths of the implemented connection resolver files.
- `pagination_tests` (string): Path to the pagination test file and its passing run output.

---

## Phase 1: Write the Seek Query

### Entry Criteria
- `cursor_spec` lists sort keys and a unique tie-breaker for every connection.

### Actions
1. For a forward page with sort `placed_at DESC, id DESC`, write the row-value comparison (PostgreSQL, MySQL 8, SQLite 3.15+ support row values):
```sql
SELECT * FROM orders
WHERE customer_id = $1
  AND (placed_at, id) < ($2, $3)
ORDER BY placed_at DESC, id DESC
LIMIT $4;  -- bound to first + 1
```
For the first page (no `after`), use a second query string without the row comparison. Do NOT write `($2 IS NULL OR (placed_at, id) < ($2, $3))`; the OR can stop the planner from using the index as a seek.
2. The comparison operator follows the direction: `<` for DESC, `>` for ASC. Mixed directions (one key ASC, one DESC) cannot use one row-value comparison; expand to `(a > $a) OR (a = $a AND b < $b)`.
3. Backward page (`last`/`before`): flip the operator and the ORDER BY, fetch `last + 1`, then reverse the rows in code before building edges.
4. Create the index that matches the ORDER BY exactly: `CREATE INDEX CONCURRENTLY orders_customer_seek ON orders (customer_id, placed_at DESC, id DESC);` (`CONCURRENTLY` is PostgreSQL; drop it elsewhere).
5. Check the plan: `EXPLAIN (ANALYZE, BUFFERS) <query with literal values>`. Read it: the plan must show `Index Scan` (or `Index Only Scan`) on the seek index and no `Sort` node above it.

### Output
Seek query and index per connection.

### Quality Gate
- `EXPLAIN` output contains the seek index name and no `Sort` node.

---

## Phase 2: Implement the Resolver

### Entry Criteria
- Seek query verified.

### Actions
1. Validate arguments first, in this order: if `first` and `last` are both set, return a `BAD_USER_INPUT` error (per `cursor_spec`); if either is negative, return `BAD_USER_INPUT` (the Relay spec requires an error); if either exceeds `max_page_size`, return `BAD_USER_INPUT` naming the limit. If neither is set, use `max_page_size` unless the user supplied a separate default.
2. Decode the cursor: base64url decode, JSON parse, check the array length equals the sort key count. Any failure is `BAD_USER_INPUT` with message `invalid cursor`; never a 500.
3. Run the seek query with `limit = n + 1`. `hasNextPage = rows.length > n` for forward pages; drop the extra row. For backward pages, `hasPreviousPage = rows.length > n`.
4. For the opposite flag on a forward page, the spec allows `hasPreviousPage: false` when it cannot be determined cheaply; set it to `after != null` only if the user accepts that approximation, otherwise `false`.
5. Build edges: `cursor = base64url(JSON.stringify([row.placed_at, row.id]))`, `node = row`. `startCursor`/`endCursor` = first and last edge cursors, or `null` when empty.
6. Stack specifics:

| `stack` | Base64url | Where |
|---|---|---|
| `apollo`, `yoga` | `Buffer.from(s).toString('base64url')` / `Buffer.from(c, 'base64url').toString()` | the `Viewer.orders` resolver in `src/resolvers.ts` |
| `python` | `base64.urlsafe_b64encode(s.encode()).decode().rstrip('=')`; pad with `'=' * (-len(c) % 4)` before decoding | the `orders` field method |
| `go` | `base64.RawURLEncoding.EncodeToString` / `DecodeString` | the `Orders` method in `graph/*.resolvers.go` |

7. Serialize timestamps in the cursor as RFC 3339 with full fractional precision; truncating microseconds makes the comparison skip rows.

### Output
Implemented connection resolvers.

### Quality Gate
- Type check or build passes: `npx tsc --noEmit` (node), `python -m compileall -q app` (python), `go build ./...` (go).

---

## Phase 3: Test Paging Under Inserts

### Entry Criteria
- Resolver compiles.

### Actions
1. Write a test that seeds rows with duplicate `placed_at` values (to exercise the tie-breaker), then pages with `first: 2` until `hasNextPage` is false, collecting ids.
2. Assert the collected ids equal the full sorted id list from a direct SQL query: no duplicates, no gaps.
3. Second test: fetch page 1, insert a new newest row, fetch page 2 with page 1's `endCursor`. Assert page 2 contains no id from page 1.
4. Third test: invalid cursor (`"abc"`), negative `first`, and `first` above `max_page_size` each return an error with `extensions.code == "BAD_USER_INPUT"` and `data` for that field `null` (or the nearest nullable parent).
5. Run: `npx vitest run` or `npx jest` (node), `pytest -q` (python), `go test ./... -run Pagination -v` (go).

### Output
`connection_resolvers`, `pagination_tests`.

### Quality Gate
- The test run exits 0 and reports the three tests passing.
- No test was skipped (`skip`, `xfail`, `t.Skip`) to get the green run.

---

## Worked Example

Illustrative only. `stack = go`, `max_page_size = 100` (user supplied).

Phase 1 plan excerpt:
```
Limit  (actual rows=3)
  ->  Index Scan using orders_customer_seek on orders  (actual rows=3)
        Index Cond: ((customer_id = 7) AND (ROW(placed_at, id) < ROW('2026-10-01 10:00:00+00', 'ord_91')))
```
No `Sort` node. Phase 3 output:
```
=== RUN   TestPaginationNoGaps
--- PASS: TestPaginationNoGaps (0.04s)
=== RUN   TestPaginationStableUnderInsert
--- PASS: TestPaginationStableUnderInsert (0.03s)
=== RUN   TestPaginationBadArgs
--- PASS: TestPaginationBadArgs (0.01s)
ok   github.com/acme/shop/graph 0.21s
```

---

## Exit Criteria

DONE when every connection uses an index-backed seek query, arguments and cursors are validated, and the three paging tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Plan shows `Sort` or `Seq Scan` | **Adjust**: make the index column order and directions match the ORDER BY exactly; rerun EXPLAIN on a table with realistic row counts. |
| Phase 2 | Database lacks row-value comparison | **Adjust**: use the expanded OR form from Action 1.2. |
| Phase 3 | Gap test fails only with equal timestamps | **Return**: the tie-breaker is missing from the cursor or ORDER BY; fix and rerun. |
| Phase 3 | Tempted to switch to OFFSET to pass the insert test | **Stop**: OFFSET is the defect the test catches. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
