# PostgreSQL Partial and Covering Index Design

**One-line description:** Refines PostgreSQL B-tree index candidates into partial indexes (`WHERE` clause for a fixed predicate) and covering indexes (`INCLUDE` columns for index-only scans), checks the planner can prove the partial predicate with parameterized queries, and confirms index-only scans by their `Heap Fetches` count.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `plan_findings` (object[], required): From `sqlo-pg-explain-analyze-read`.
- `btree_index_proposal` (object[], required): From `sqlo-btree-composite-order`.
- `schema_ddl` (string, required): Table and index definitions.

---

## Outputs

- `pg_index_proposal` (object[]): Each candidate as final DDL (plain, partial, covering, or partial covering), with the reason, the predicate-proof check for partial indexes, and the plan evidence.

---

## Phase 1: Decide Partial

### Entry Criteria
- `btree_index_proposal` is not empty.

### Actions
1. For each candidate, find predicates that are the same literal in every call of the query, for example `status = 'pending'`, `deleted_at IS NULL`, `processed = false`.
2. Measure the fraction of rows that match: `SELECT count(*) FILTER (WHERE deleted_at IS NULL)::float / count(*) FROM orders;` on a copy, or from `pg_stats.null_frac` and `most_common_freqs`.
3. Apply:

| Condition | Decision |
|---|---|
| Predicate is a constant in the application code, and matches a small fraction of rows | partial index with that predicate in `WHERE`; drop that column from the key if it was only there for this equality |
| Predicate value is passed as a parameter (`status = $1`) | not partial, unless the app always passes the same value; with a generic plan the planner cannot prove `$1 = 'pending'` |
| Predicate matches most rows | not partial (little size saving) |
| Unique rule applies to a subset (one active row per user) | partial UNIQUE index: `CREATE UNIQUE INDEX ... ON t (user_id) WHERE active;` |

4. Partial predicate proof: the query's WHERE must imply the index's WHERE using the same expression. `WHERE deleted_at IS NULL` in the index is used by a query with `deleted_at IS NULL`; it is not used by `COALESCE(deleted_at, ...)` forms. For parameterized queries, test both plans: `SET plan_cache_mode = force_generic_plan;` then `EXPLAIN EXECUTE ...`.

### Output
Partial decision per candidate.

### Quality Gate
- Each partial decision records the measured match fraction and whether the predicate is a literal in the application SQL (cite file and line, or the logged query text).

---

## Phase 2: Decide Covering

### Entry Criteria
- Phase 1 complete.

### Actions
1. List the columns the query reads that are not in the index key (SELECT list, filters not in the key).
2. Apply:

| Condition | Decision |
|---|---|
| Query selects a few narrow columns and runs often | add them with `INCLUDE (col1, col2)` (PostgreSQL 11 and later for B-tree) |
| Query uses `SELECT *` | not covering; ask the app to select fewer columns first, or skip |
| Included columns are wide (large text, jsonb) | skip; the index grows and entries can exceed the B-tree size limit |
| An included column is updated often | weigh against HOT updates: any column in any index (key or INCLUDE) disables HOT for updates that change it; send to `sqlo-index-write-cost` |

3. INCLUDE columns are not searchable and not sorted; use them only for reading. Put a column in the key if it is filtered or sorted.

### Output
Covering decision per candidate.

### Quality Gate
- Each INCLUDE column is listed as read-only by the query (appears only in SELECT or as a non-key filter).
- Each candidate records whether any of its columns appear in the table's frequent UPDATE statements (from `slow_query_list` or app code).

---

## Phase 3: Verify Index-Only Scans

### Entry Criteria
- Final DDL drafted.

### Actions
1. On a `production_like` copy, build the final index, then run `VACUUM (ANALYZE) orders;` so the visibility map is set.
2. Run `EXPLAIN (ANALYZE, BUFFERS)`. For covering candidates the plan must show `Index Only Scan` and `Heap Fetches:` low relative to rows returned.
3. If `Heap Fetches` is close to rows returned on production-like data after a vacuum, the table changes too fast for the visibility map to stay set; the index-only benefit is unreliable. Record this and consider per-table autovacuum settings via `sqlo-pg-vacuum-bloat`.
4. Record size: `SELECT pg_size_pretty(pg_relation_size('orders_pending_created_idx'));` compared with the non-partial version, if built.

### Output
`pg_index_proposal`.

### Quality Gate
- Each covering candidate has an `Index Only Scan` line and a `Heap Fetches` value from real output.
- Each partial candidate has a plan showing it is used for the target query, under both custom and generic plans when the query is prepared.

---

## Worked Example

Illustrative only.

Input candidate: `(status, created_at)` for the worker query `SELECT id, payload_ref FROM jobs WHERE status = 'pending' ORDER BY created_at LIMIT 100;` The literal `'pending'` is hard-coded in `worker/poll.py` line 12.

Phase 1: 0.4 percent of 30M rows are pending. Decision: partial on `status = 'pending'`, key becomes `(created_at)`.

Phase 2: query reads `id` and `payload_ref` (narrow); `status` is updated on every job, but `status` is in the partial predicate, not a key or INCLUDE column, and updates moving rows out of `pending` change index membership, so the write cost flow must measure it.

Final DDL: `CREATE INDEX jobs_pending_created_idx ON jobs (created_at) INCLUDE (id, payload_ref) WHERE status = 'pending';`

Phase 3:
```
Limit (actual time=0.03..0.19 rows=100 loops=1)
  -> Index Only Scan using jobs_pending_created_idx on jobs (actual rows=100 loops=1)
       Heap Fetches: 4
```
Size: 9 MB partial vs 1,240 MB for the full `(status, created_at)` index.

---

## Exit Criteria

DONE when each candidate has final DDL with partial and covering decisions recorded, and plan evidence of use (and of index-only scans where covering).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Partial index unused under generic plan | **Adjust**: drop the partial predicate, or ask the app owner to inline the literal in the SQL. |
| Phase 2 | `index row size exceeds btree version 4 maximum` | **Adjust**: remove the wide INCLUDE column. |
| Phase 3 | `Heap Fetches` stays high after VACUUM | **Return**: record unreliable index-only benefit; pass the table to `sqlo-pg-vacuum-bloat`. |
| Phase 3 | Planner prefers another index | **Adjust**: compare EXPLAIN ANALYZE times; keep whichever is faster and record why. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
