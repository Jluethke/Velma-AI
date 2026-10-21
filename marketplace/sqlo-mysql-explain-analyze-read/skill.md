# MySQL EXPLAIN and EXPLAIN ANALYZE Reading

**One-line description:** Runs `EXPLAIN FORMAT=TREE`, `EXPLAIN ANALYZE` (MySQL 8.0.18 and later) and the tabular `EXPLAIN` on each slow MySQL query, and reads the access type, key, rows, filtered and Extra columns to name the exact cause of slowness.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuning_scope` (object, required): From `sqlo-baseline-scope`.
- `slow_query_list` (object[], required): From `sqlo-mysql-slow-log-capture`. Contains sample statements with literal values.
- `digest_findings` (object, required): From `sqlo-mysql-perf-schema-digest`. Supplies `QUERY_SAMPLE_TEXT` and counters.

---

## Outputs

- `plan_findings` (object[]): Per query: tabular plan, tree or analyze output, and findings from the fixed finding list in Phase 3, each with the plan row or line that proves it.

---

## Phase 1: Prepare the Statement

### Entry Criteria
- `tuning_scope.db_engine` == `mysql`.

### Actions
1. Take a real statement with literals from the slow log sample or `QUERY_SAMPLE_TEXT`. Do not invent literal values.
2. Set a guard: `SET SESSION max_execution_time = <user value in ms>;`. It applies to read-only SELECT statements only.
3. `EXPLAIN ANALYZE` executes the statement. Use it only on SELECT. For UPDATE or DELETE, write the equivalent SELECT with the same WHERE and ORDER BY and analyze that; plain `EXPLAIN UPDATE ...` (no ANALYZE) is safe and shows the access path without executing.

### Output
Statement with literals and guard.

### Quality Gate
- The literal values have a recorded source.
- No `EXPLAIN ANALYZE` is run on UPDATE, DELETE or INSERT.

---

## Phase 2: Run the Three Views

### Entry Criteria
- Phase 1 complete.

### Actions
1. Tabular: `EXPLAIN <stmt>;`. Columns to record: `table`, `type`, `possible_keys`, `key`, `key_len`, `ref`, `rows`, `filtered`, `Extra`.
2. Tree (8.0.16 and later): `EXPLAIN FORMAT=TREE <stmt>;`.
3. Analyze (8.0.18 and later): `EXPLAIN ANALYZE <stmt>;`. Each line shows `(cost=... rows=EST) (actual time=FIRST..LAST rows=ACTUAL loops=L)`. Times are milliseconds per loop; multiply by `loops`.
4. If the server is older than 8.0.18, use `EXPLAIN FORMAT=JSON` for cost detail and `SHOW SESSION STATUS LIKE 'Handler_read%';` before and after running the query (after `FLUSH STATUS;`) to count rows read.
5. Optional, when the optimizer's choice is unclear: `SET optimizer_trace='enabled=on'; <stmt>; SELECT TRACE FROM information_schema.OPTIMIZER_TRACE\G SET optimizer_trace='enabled=off';`. Read `considered_execution_plans` and `rows_estimation`.

### Output
Saved plan output for each query.

### Quality Gate
- Each query has a tabular EXPLAIN saved, and an EXPLAIN ANALYZE or Handler counter output.
- The server version that decided which view was used is recorded.

---

## Phase 3: Read the Plan

### Entry Criteria
- Phase 2 complete.

### Actions
1. Read the `type` column. Order from best to worst for a single-table access: `system`, `const`, `eq_ref`, `ref`, `range`, `index` (full index scan), `ALL` (full table scan).
2. Read `key_len`: it shows how many bytes of a composite index are used, so you can tell how many leading columns were used. Compute it from column types (for example INT NOT NULL = 4, nullable adds 1, VARCHAR(n) utf8mb4 = 4n + 2).
3. Estimated rows read by a row is `rows x filtered / 100` passed to the next table.
4. Match each rule and record the finding with its row or line:

| Evidence | Finding | Next flow |
|---|---|---|
| `type` = `ALL` on a large table | `missing_index` | `sqlo-btree-composite-order` |
| `type` = `index` without `Using index` | `full_index_scan` | composite or covering index |
| `key_len` covers fewer columns than the equality predicates | `partial_index_match` | `sqlo-btree-composite-order` |
| `Extra` has `Using filesort` | `sort_not_from_index` | index matching ORDER BY after equality columns |
| `Extra` has `Using temporary` | `temp_table` | index on GROUP BY columns or rewrite |
| `Extra` has `Using where` with `filtered` low and many `rows` | `filter_after_scan` | `sqlo-sargable-rewrite` |
| `possible_keys` lists an index but `key` is NULL | `index_not_chosen` | check sargability and statistics |
| `Extra` has `Using join buffer (hash join)` or `Block Nested Loop` | `join_without_index` | index on join column |
| `rows` estimate and `actual rows` differ by a large factor | `estimate_error` | `sqlo-mysql-statistics-histograms` |
| `Extra` has `Using index` | `covered` (good) | none |
| `Extra` has `Using index condition` | `icp` (index condition pushdown, partial help) | consider adding the column to the index |
| `Select tables optimized away` or `const` | `trivial` | none |

5. Record findings only. Do not create indexes here.

### Output
`plan_findings`.

### Quality Gate
- Every finding quotes the EXPLAIN row (table, type, key, rows, filtered, Extra) or the ANALYZE line.
- `key_len` interpretation states the number of index columns used.

---

## Worked Example

Illustrative only.

Input: `SELECT id, name, price FROM products WHERE category_id = 42 AND LOWER(name) LIKE '%lamp%' ORDER BY price LIMIT 24;`

Phase 2 tabular:
```
| table    | type | possible_keys            | key  | key_len | rows    | filtered | Extra                       |
| products | ALL  | idx_category,idx_cat_pr  | NULL | NULL    | 2104332 |     1.11 | Using where; Using filesort |
```
Phase 2 analyze:
```
-> Limit: 24 row(s)  (actual time=1152.1..1152.1 rows=24 loops=1)
    -> Sort: products.price, limit input to 24 row(s) per chunk  (actual time=1152.1..1152.1 rows=24 loops=1)
        -> Filter: ((products.category_id = 42) and (lower(products.`name`) like '%lamp%'))  (cost=213000 rows=23380) (actual time=0.31..1151.6 rows=311 loops=1)
            -> Table scan on products  (cost=213000 rows=2104332) (actual time=0.29..980.3 rows=2110000 loops=1)
```
Findings: `index_not_chosen` (possible_keys present, key NULL), `missing_index` (ALL), `sort_not_from_index` (Using filesort), `estimate_error` (23,380 estimated vs 311 actual). Note: `idx_category` was not chosen even though `category_id = 42`; next check its selectivity in the statistics flow.

---

## Exit Criteria

DONE when each slow query has saved plan output and findings from the fixed list, each with its proving row or line.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Only DML is slow | **Adjust**: analyze the equivalent SELECT; record that locking cost is not measured by it and pass the DML to `sqlo-mysql-lock-contention`. |
| Phase 2 | `EXPLAIN ANALYZE` syntax error | **Adjust**: server is older than 8.0.18; use Phase 2 Action 4. |
| Phase 2 | Query exceeds `max_execution_time` | **Adjust**: keep the plain `EXPLAIN`; record the timeout as evidence. |
| Phase 3 | Plan matches no rule | **Adjust**: record it as `unclassified` with the full output; do not invent a cause. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
