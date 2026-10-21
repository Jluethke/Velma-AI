# PostgreSQL pg_stat_statements Capture

**One-line description:** Enables pg_stat_statements if missing, captures a timed window of normalized statement statistics, and ranks the queries worth tuning by total time, mean time, I/O and temp spill, with the exact columns for the server's major version.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuning_scope` (object, required): From `sqlo-baseline-scope`. Supplies version, environment class and `shared_preload_libraries`.
- `capture_window` (string, required): How long to collect before ranking, chosen by the user to cover the slow period (for example "the 09:00 to 10:00 peak"). This flow does not choose it.

---

## Outputs

- `slow_query_list` (object[]): Ranked statements with `queryid`, normalized query text, calls, total and mean execution time, rows, shared blocks hit and read, temp blocks written, and the rank reason.

---

## Phase 1: Make Sure the Extension Is Collecting

### Entry Criteria
- `tuning_scope.db_engine` == `postgresql`.

### Actions
1. Check whether the library is loaded: `SHOW shared_preload_libraries;`. The value must contain `pg_stat_statements`.
2. If it is missing:
   - Self-managed: add it to `postgresql.conf` as `shared_preload_libraries = 'pg_stat_statements'` (keep any existing entries, comma separated). This needs a server restart, not a reload. Ask the user to schedule the restart. Do not restart a production server yourself.
   - Amazon RDS or Aurora: add `pg_stat_statements` to `shared_preload_libraries` in the DB parameter group, then reboot. Other managed services: follow the provider's documentation for the parameter.
3. Check the extension exists in the database you will query: `SELECT extversion FROM pg_extension WHERE extname = 'pg_stat_statements';`. If no row, run `CREATE EXTENSION pg_stat_statements;` (needs a role allowed to create extensions).
4. Record these settings: `SHOW pg_stat_statements.track;` (default `top`; `all` also tracks statements inside functions), `SHOW pg_stat_statements.max;` (default 5000), `SHOW compute_query_id;` (PostgreSQL 14 and later; `auto` is the default and is fine).

### Output
Extension confirmed collecting.

### Quality Gate
- `SELECT count(*) FROM pg_stat_statements;` returns a number, not an error.
- The values of `pg_stat_statements.track` and `pg_stat_statements.max` are recorded.

---

## Phase 2: Capture a Clean Window

### Entry Criteria
- Phase 1 complete.

### Actions
1. Check `SELECT dealloc, stats_reset FROM pg_stat_statements_info;` (PostgreSQL 14 and later). A growing `dealloc` means entries were evicted because `pg_stat_statements.max` was reached; record it as a coverage gap.
2. Ask the user before resetting, because a reset is global for all users of the view: `SELECT pg_stat_statements_reset();`. If the user declines, take a snapshot instead: `CREATE TABLE tuning_pgss_t0 AS SELECT now() AS ts, * FROM pg_stat_statements;` on a non-production copy only; on production record the snapshot to a file with `\copy (SELECT * FROM pg_stat_statements) TO 'pgss_t0.csv' CSV HEADER`.
3. Wait for `capture_window` to pass while normal traffic runs.
4. At the end, export the view with `\copy (SELECT * FROM pg_stat_statements) TO 'pgss_t1.csv' CSV HEADER`. If you used a snapshot, compute deltas per `queryid, userid, dbid`.

### Output
Statement statistics for exactly the capture window.

### Quality Gate
- `pgss_t1.csv` exists and its row count is greater than zero.
- Either the reset time from `pg_stat_statements_info.stats_reset` or the `t0` snapshot timestamp is recorded as the window start.

---

## Phase 3: Rank and Select

### Entry Criteria
- Phase 2 complete.

### Actions
1. Use the column names for the version. PostgreSQL 13 and later: `total_exec_time`, `mean_exec_time`, `stddev_exec_time`. PostgreSQL 12 and earlier: `total_time`, `mean_time`, `stddev_time`. Do not mix them.
2. Run the top by total time (this is where the server spends its time):
```
SELECT queryid, calls, round(total_exec_time::numeric,1) AS total_ms,
       round(mean_exec_time::numeric,2) AS mean_ms, rows,
       shared_blks_hit, shared_blks_read, temp_blks_written,
       left(query, 200) AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC LIMIT 20;
```
3. Run the same query ordered by `mean_exec_time DESC` (slow single calls), by `shared_blks_read DESC` (disk reads), and by `temp_blks_written DESC` (sorts and hashes spilling past `work_mem`).
4. Build `slow_query_list` as the union of these lists. For each entry set `rank_reason` to one of `total_time`, `mean_time`, `disk_read`, `temp_spill`.
5. Compute the cache hit share per statement as `shared_blks_hit / (shared_blks_hit + shared_blks_read)` and record it; do not label it good or bad without a user target.
6. Mark statements whose text starts with `COMMIT`, `BEGIN`, `SET` or `SHOW` as `not_a_tuning_target`; their time usually reflects waits elsewhere (for example a slow `COMMIT` points at WAL fsync or synchronous replication).

### Output
`slow_query_list`.

### Quality Gate
- Every entry has `queryid`, `calls`, total and mean time, and a `rank_reason`.
- The column names used match the server major version recorded in `tuning_scope`.

---

## Worked Example

Illustrative only.

Input: PostgreSQL 16, `capture_window` = "one hour from 09:00".

Phase 1: `shared_preload_libraries` = `pg_stat_statements`; `extversion` 1.10; `track` = `top`; `max` = 5000.

Phase 2: user approved the reset at 09:00; `\copy` at 10:00 wrote 1,842 rows.

Phase 3 output, top by total time:
```
 queryid              | calls  | total_ms  | mean_ms | rows   | shared_blks_read | temp_blks_written | query
 -4012291349857632001 | 182340 | 1203311.4 |    6.60 | 182340 |          9921034 |                 0 | SELECT * FROM orders WHERE customer_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT $3
  7718839920113322310 |    412 |  611002.7 | 1483.02 |  41200 |           310441 |           2210091 | SELECT ... FROM order_items oi JOIN products p ... ORDER BY p.name OFFSET $1 LIMIT $2
```
`slow_query_list` gets the first as `total_time` and the second as `mean_time` and `temp_spill`.

---

## Exit Criteria

DONE when `slow_query_list` holds ranked statements from a known window, each with its rank reason and the raw statistics.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Library not loaded and restart not allowed | **Return**: hand the user the exact config change and use `sqlo-pg-auto-explain-capture` or the server log with `log_min_duration_statement` until the restart happens. |
| Phase 1 | `permission denied` reading other users' query text | **Adjust**: ask for the `pg_read_all_stats` role grant; rows show `<insufficient privilege>` without it. |
| Phase 2 | `dealloc` increased during the window | **Adjust**: record the coverage gap; ask the user whether to raise `pg_stat_statements.max` (restart required). |
| Phase 3 | Column `total_exec_time` does not exist | **Adjust**: the server is 12 or earlier; switch to `total_time` and `mean_time`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
