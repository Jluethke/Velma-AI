# Production-Like Verification of SQL Tuning

**One-line description:** Proves each tuning change on a production-like copy and then in production: checks the copy matches production in version, data volume, statistics and planner settings, compares before and after plans and latency distributions with pgbench or mysqlslap, and confirms the effect in pg_stat_statements or the MySQL digest table after release.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuning_scope` (object, required): From `sqlo-baseline-scope`. Supplies production settings, table sizes and acceptance criteria.
- `slow_query_list` (object[], required): From the capture flow. The before numbers for each target query.
- `query_rewrites` (object[], required): From `sqlo-keyset-pagination`. Rewritten SQL with equality proofs.
- `index_migration` (object[], required): From `sqlo-pg-create-index-concurrently` or `sqlo-mysql-online-index-ddl`.
- `stats_actions` (object[], required): From the statistics flow. Statistics objects, targets, histograms or sample settings that must also exist on the copy.

---

## Outputs

- `verification_report` (object): Parity checks, per-query before and after plans and latency, production confirmation numbers, acceptance verdict per criterion (PASS, FAIL, or OPEN), and the rollback list.

---

## Phase 1: Prove the Copy Is Production-Like

### Entry Criteria
- A copy exists with `environment_class` = `production_like`.

### Actions
1. Compare with `tuning_scope` and record each as match or mismatch:

| Check | PostgreSQL | MySQL |
|---|---|---|
| Major version | `SHOW server_version_num;` | `SELECT @@version;` |
| Row counts of target tables | `SELECT reltuples::bigint FROM pg_class WHERE relname = '...';` after ANALYZE, or exact `count(*)` | `SELECT COUNT(*) FROM ...;` |
| Planner settings | `work_mem`, `random_page_cost`, `effective_cache_size`, `default_statistics_target`, `jit`, `plan_cache_mode` | `optimizer_switch`, `eq_range_index_dive_limit`, `innodb_stats_persistent_sample_pages` |
| Statistics | `ANALYZE` run after restore (a dump and restore does not carry planner statistics unless your version's `pg_dump` supports dumping them, which arrived in PostgreSQL 18; run ANALYZE regardless) | `ANALYZE TABLE` run after restore |
| Extended statistics, targets, histograms from `stats_actions` | present in `pg_statistic_ext` / `pg_attribute.attstattarget` | present in `information_schema.COLUMN_STATISTICS` and table options |
| Indexes | `\d+ table` equal to production except the change under test | `SHOW CREATE TABLE` equal except the change |

2. Memory size can differ (`shared_buffers`, `innodb_buffer_pool_size`). If the copy has less memory, cache hit ratios differ; record it and compare plans and buffer counts, not only latency.
3. Data must not be synthetic for this verdict. A seeded `dev` database can confirm a plan shape but not a latency result.

### Output
Parity table.

### Quality Gate
- Every row in the parity table is recorded as match or mismatch with both values.
- Any mismatch in version, row counts, planner settings or statistics is fixed on the copy before Phase 2, or the verdict for affected queries becomes OPEN.

---

## Phase 2: Before and After on the Copy

### Entry Criteria
- Phase 1 parity complete.

### Actions
1. For each target query, run EXPLAIN ANALYZE (PostgreSQL with `BUFFERS`) with the same real parameter values in two states: before (original SQL, no new index), after (rewritten SQL plus new index and statistics). Save both plans.
2. Latency distribution under concurrency, with a parameter-varying script:
   - PostgreSQL: `pgbench -n -f read.sql -c C -j J -T T -r -l --log-prefix=after shop`. `-l` writes per-transaction latency logs so you can compute percentiles; `read.sql` uses `\set cid random(1, N)` with N from the real id range.
   - MySQL: `mysqlslap --create-schema=shop --query=read.sql --concurrency=C --iterations=I --no-drop` (reports average, minimum and maximum per iteration); for percentiles use sysbench with a custom Lua script and `--percentile`.
   C, J, T, I come from `tuning_scope` connection counts and the user.
3. Run before and after three times each, alternating, after a warm-up run that is discarded.
4. Run the write benchmark from `sqlo-index-write-cost` once more with all changes together, since several indexes on one table add up.
5. Compute median and p95 per state from the logs. State whether the difference exceeds the run-to-run spread.

### Output
Plans and latency numbers before and after.

### Quality Gate
- Each target query has two saved plans and six benchmark runs (three before, three after) with raw summary lines.
- Percentiles are computed from per-transaction logs, not estimated from averages.

---

## Phase 3: Confirm in Production and Decide

### Entry Criteria
- Changes released to production through the online index flow and the application deploy.

### Actions
1. Production after numbers, same method as the before numbers in `slow_query_list`:
   - PostgreSQL: with user approval `SELECT pg_stat_statements_reset();` at release, then after a window equal to the original `capture_window`, the same ranking query. Match by normalized text, because `queryid` changes when the SQL text changes.
   - MySQL: `TRUNCATE TABLE performance_schema.events_statements_summary_by_digest;` with approval at release, then the same digest query after the window; or a new slow log window with the same `long_query_time`.
2. Confirm indexes are used: `pg_stat_user_indexes.idx_scan` or `table_io_waits_summary_by_index_usage.COUNT_READ` rising for each new index.
3. Check for regressions: any statement in the new top 20 by total time that was not in the old list, and any increase in mean time on write statements to tuned tables.
4. Verdict per acceptance criterion:

| Evidence | Verdict |
|---|---|
| Production number meets the user's target | PASS |
| Production number misses the target | FAIL: return the query to its EXPLAIN reading flow with the new plan |
| No numeric target was given | OPEN: report numbers, ask the user |
| Copy improved but production did not | FAIL: recheck Phase 1 parity, especially parameter values and plan_cache_mode |

5. List rollback statements from `index_migration` and the reverse of each `stats_actions` change, and the commit to revert for each query rewrite.

### Output
`verification_report`.

### Quality Gate
- Each target query has a production after number taken by the same method and window length as its before number.
- Every acceptance criterion has PASS, FAIL or OPEN with the numbers that decided it.
- The report never states success for a query whose verdict is FAIL or OPEN.

---

## Worked Example

Illustrative only.

Input: target `GET /orders` query, before mean 6.60 ms over 182,340 calls/hour (pg_stat_statements), acceptance p95 150 ms for the endpoint.

Phase 1: copy PostgreSQL 16.4 (match), `orders` 41,203,118 rows (match at snapshot), `work_mem` 4MB (match), `ANALYZE` run after restore (done), `orders_cust_status` statistics present (match). Copy has 64 GB RAM vs production 128 GB: recorded.

Phase 2:
```
before: Index Scan Backward using orders_created_at_idx ... Rows Removed by Filter: 118440  Execution Time: 7.420 ms
after:  Index Scan using orders_cust_shipped_created_idx ...                          Execution Time: 0.092 ms
pgbench -c 16 -T 120 (three runs each): before median 6.9 ms p95 21.4 ms; after median 0.21 ms p95 0.58 ms
```
Phase 3: one hour after release, the statement shows mean 0.11 ms over 179,902 calls; `idx_scan` on the new index 179,902. Endpoint p95 from the APM tool 96 ms: PASS. Rollback: `DROP INDEX CONCURRENTLY orders_cust_shipped_created_idx;` and `CREATE INDEX CONCURRENTLY orders_customer_idx ON public.orders USING btree (customer_id);` (saved definition).

---

## Exit Criteria

DONE when parity is recorded, before and after evidence exists on the copy, production numbers are taken by the same method, every criterion has a verdict, and rollbacks are listed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No production-like copy available | **Stop**: report that verification cannot be completed; verdicts are OPEN. |
| Phase 2 | After is slower than before on the copy | **Return**: send the query back to its EXPLAIN reading flow; do not release. |
| Phase 3 | User declines resetting production statistics | **Adjust**: snapshot the view at release time and compute deltas at the end of the window. |
| Phase 3 | New regression appears in the top list | **Return**: verdict FAIL for the change that touched that table; apply its rollback with user approval. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
