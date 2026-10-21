# Keyset Pagination Rewrite

**One-line description:** Replaces deep `OFFSET`/`LIMIT` pagination with keyset (seek) pagination on a unique, indexed sort key, using PostgreSQL row-value comparison or the expanded OR form for MySQL and mixed sort directions, and proves no row is skipped or repeated across pages.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuning_scope` (object, required): From `sqlo-baseline-scope`.
- `rewritten_queries` (object[], required): From `sqlo-sargable-rewrite`. Paginated queries with `OFFSET` are taken from here; others pass through unchanged.
- `schema_ddl` (string, required): Table and index definitions for the paginated tables.

---

## Outputs

- `query_rewrites` (object[]): All queries from `rewritten_queries`, with paginated ones replaced by keyset versions, the supporting index, the cursor format, and the page-walk check result.

---

## Phase 1: Decide Whether Keyset Fits

### Entry Criteria
- `rewritten_queries` is present (it may contain no OFFSET queries; then pass through and stop).

### Actions
1. Find queries with `OFFSET` (PostgreSQL, MySQL) or `LIMIT m, n` (MySQL). Record the largest offset seen in the slow log or app logs.
2. Apply this table:

| Requirement | If not met |
|---|---|
| The UI or API moves next/previous, not "jump to page 57" | keep OFFSET for jump; use keyset for next/previous, or cap the page number the UI allows (user decision) |
| The sort key is unique, or can be made unique by appending the primary key | append the primary key as the last sort column |
| Sort columns are NOT NULL | handle NULLs explicitly (`NULLS LAST` and a separate branch) or use `COALESCE` in both the ORDER BY and an expression index |
| An index exists whose columns are the equality filters, then the sort columns in the same order and direction (or all reversed) | pass the index to `sqlo-btree-composite-order` |

3. Record the decision per query: `keyset`, `keyset_next_prev_only`, or `keep_offset` with the reason.

### Output
Per-query decision.

### Quality Gate
- Every OFFSET query has a decision and, for keyset, a unique sort key named.

---

## Phase 2: Write the Keyset Query

### Entry Criteria
- At least one query decided `keyset`.

### Actions
1. Original form: `SELECT ... FROM orders WHERE customer_id = $1 ORDER BY created_at DESC, id DESC LIMIT 50 OFFSET 5000;`
2. PostgreSQL, all sort columns in the same direction, use a row-value comparison, which a B-tree index can seek on:
```
SELECT ... FROM orders
WHERE customer_id = $1 AND (created_at, id) < ($2, $3)
ORDER BY created_at DESC, id DESC
LIMIT 50;
```
   Index: `(customer_id, created_at DESC, id DESC)` or `(customer_id, created_at, id)` (scanned backward).
3. MySQL, and any engine with mixed directions (for example `created_at DESC, id ASC`), use the expanded form:
```
WHERE customer_id = ? AND (created_at < ? OR (created_at = ? AND id > ?))
ORDER BY created_at DESC, id ASC LIMIT 50;
```
   Check with EXPLAIN that the access is a range or ref on the composite index. Do not assume a MySQL row constructor `(a, b) < (?, ?)` uses the index; verify with EXPLAIN on your version.
4. First page: same query without the keyset condition.
5. Cursor: the last row's sort values (`created_at`, `id`), encoded opaquely (for example base64 of JSON) so clients do not build it. Keep timestamp precision exact: a cursor rounded to milliseconds when the column stores microseconds skips or repeats rows.
6. Previous page: reverse the comparison and the ORDER BY, then reverse the fetched rows in the application.
7. Framework helpers that implement this: Django REST Framework `CursorPagination` (set `ordering` to a unique field set). For others, write the WHERE clause yourself; do not invent a library method.

### Output
Keyset SQL, cursor format and required index.

### Quality Gate
- The ORDER BY ends with a unique column.
- The keyset predicate uses the same columns, in the same order, as the ORDER BY.

---

## Phase 3: Prove Correctness and Speed

### Entry Criteria
- Phase 2 complete.

### Actions
1. Page walk on `production_like` data: fetch all pages with keyset for one real filter value and collect ids. Then `SELECT id FROM ... WHERE customer_id = $1 ORDER BY created_at DESC, id DESC;` once. The concatenated keyset ids must equal that list exactly, with no duplicates.
2. Insert a row in the middle of a walk on a copy and confirm the walk neither repeats nor skips existing rows (OFFSET would shift).
3. EXPLAIN ANALYZE the keyset query for a deep cursor (a cursor taken from the position of the largest recorded offset). Compare execution time with the OFFSET version at the same depth. The keyset plan must show an index scan with no Sort node and rows read close to the LIMIT.

### Output
`query_rewrites`.

### Quality Gate
- The page-walk id list equals the single-query id list (same length, same order, zero duplicates).
- The deep-cursor plan has no Sort node (PostgreSQL) or no `Using filesort` (MySQL), shown in output.

---

## Worked Example

Illustrative only.

Input: `SELECT id, total, created_at FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 50 OFFSET $2;` Largest offset seen 48,000. PostgreSQL 16.

Phase 1: `created_at` not unique, so `id` is appended. Decision `keyset_next_prev_only`; the UI shows only next and previous buttons.

Phase 2:
```
SELECT id, total, created_at FROM orders
WHERE customer_id = $1 AND (created_at, id) < ($2, $3)
ORDER BY created_at DESC, id DESC LIMIT 50;
```
Required index `(customer_id, created_at DESC, id DESC)` passed to the composite order flow.

Phase 3: walk for customer 8812 returned 4,301 ids in 87 pages, identical to the single query. Deep cursor:
```
Limit (actual time=0.05..0.21 rows=50 loops=1)
  -> Index Scan using orders_cust_created_id on orders (actual rows=50 loops=1)
       Index Cond: ((customer_id = 8812) AND (ROW(created_at, id) < ROW('2023-02-11 10:04:00.123456', 7731001)))
```
OFFSET version at 48,000 on a large customer: 182 ms; keyset: 0.24 ms.

---

## Exit Criteria

DONE when every OFFSET query is either rewritten with a passing page walk and a deep-cursor plan without a sort, or kept with a recorded reason.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Product requires jumping to arbitrary pages | **Return**: offer the user keyset for next/previous plus capped OFFSET; record the choice. |
| Phase 2 | Sort column nullable | **Adjust**: add explicit NULL handling or an expression on `COALESCE` used in both ORDER BY and index. |
| Phase 3 | Page walk shows duplicates or gaps | **Stop**: check cursor precision and that the ORDER BY ends with a unique column; fix, then repeat the walk. |
| Phase 3 | Plan still sorts | **Adjust**: the index order does not match; pass to `sqlo-btree-composite-order`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
