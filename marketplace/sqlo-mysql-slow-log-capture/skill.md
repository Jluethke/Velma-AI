# MySQL Slow Query Log Capture

**One-line description:** Turns on the MySQL slow query log for a bounded window with a data-chosen `long_query_time`, then summarizes it with pt-query-digest (or mysqldumpslow when Percona Toolkit is unavailable) into a ranked list of query fingerprints.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuning_scope` (object, required): From `sqlo-baseline-scope`.
- `capture_window` (string, required): How long the log stays on, chosen by the user to cover the slow period.

---

## Outputs

- `slow_query_list` (object[]): Ranked fingerprints with query ID, a sample statement, calls, total and per-call response time, rows examined and rows sent, and the rank reason.

---

## Phase 1: Enable the Log for the Window

### Entry Criteria
- `tuning_scope.db_engine` == `mysql`.

### Actions
1. Record the current values so you can restore them: `SELECT @@slow_query_log, @@slow_query_log_file, @@long_query_time, @@log_output, @@log_queries_not_using_indexes, @@min_examined_row_limit;`. On MySQL 8.0.14 and later also `@@log_slow_extra`.
2. Choose `long_query_time` (seconds, fractions allowed, default 10) from the symptom: set it at or below the latency of the slow request the user reported. Setting it to `0` logs every statement; use `0` only on `production_like` or `dev`, or for a short window the user approved, because log volume and I/O rise sharply.
3. Enable, as a user with `SYSTEM_VARIABLES_ADMIN` or `SUPER`:
```
SET GLOBAL slow_query_log_file = '/var/lib/mysql/slow-tuning.log';
SET GLOBAL log_output = 'FILE';
SET GLOBAL long_query_time = 0.2;
SET GLOBAL log_slow_extra = ON;        -- 8.0.14 and later only
SET GLOBAL slow_query_log = ON;
```
   The `0.2` is a placeholder; use the value from Action 2.
4. `SET GLOBAL long_query_time` applies only to connections opened after the change. Existing pooled connections keep their session value. Recycle the application pool or wait for reconnects, or check with `SELECT @@SESSION.long_query_time` from an app connection.
5. Amazon RDS and Aurora: set `slow_query_log`, `long_query_time` and `log_output` in the DB parameter group; read the log through the console or `aws rds download-db-log-file-portion`. Do not run `SET GLOBAL` there; it is not permitted for these variables.

### Output
Slow log active with known settings.

### Quality Gate
- `SELECT @@slow_query_log, @@long_query_time;` shows `1` and the chosen value.
- The original values from Action 1 are recorded.

---

## Phase 2: Summarize the Log

### Entry Criteria
- `capture_window` has passed.

### Actions
1. Restore the original values from Phase 1 Action 1 with `SET GLOBAL ...` (or the parameter group).
2. Copy the log file off the server. Do not run the analysis on the database host if CPU is scarce.
3. Run pt-query-digest: `pt-query-digest slow-tuning.log > digest.txt`. Useful real options: `--limit 20` (number of classes reported), `--order-by Query_time:sum` (the default), `--since` and `--until` to cut the window. Check `pt-query-digest --help` before using any other option.
4. If Percona Toolkit is not installed and cannot be: `mysqldumpslow -s t -t 20 slow-tuning.log` (`-s t` sorts by total query time, `-t 20` shows 20).
5. Read the pt-query-digest "Profile" table: columns `Rank`, `Query ID`, `Response time` (total seconds and share), `Calls`, `R/Call` (mean seconds), `V/M` (variance to mean; high means unstable latency), `Item` (the fingerprint).
6. For each class in the top of the profile, read its detail block: `Rows_examined` vs `Rows_sent`. A large ratio means the server reads many rows to return few; record the ratio. With `log_slow_extra`, also note `Created_tmp_disk_tables` and `Sort_merge_passes`.

### Output
`slow_query_list`.

### Quality Gate
- `digest.txt` (or the mysqldumpslow output) exists and contains the profile.
- Every entry has calls, total time, mean time, rows examined, rows sent, and a `rank_reason` of `total_time`, `mean_time` or `examined_ratio`.
- `SELECT @@long_query_time, @@slow_query_log;` shows the restored values.

---

## Worked Example

Illustrative only.

Input: MySQL 8.0.36, symptom "product search takes over a second", `capture_window` = 30 minutes.

Phase 1: `long_query_time` set to `0.5` because the user reported searches at about 1 s.

Phase 2:
```
$ pt-query-digest --limit 5 slow-tuning.log
# Profile
# Rank Query ID                         Response time   Calls R/Call V/M   Item
# ==== ================================ =============== ===== ====== ===== ==========
#    1 0x9A3F2B7C1D4E5F60718293A4B5C6D7E8 812.4400 61.2%   701 1.1590  0.21 SELECT products
#    2 0x11F0C9D8E7B6A5948372615049382716 301.0900 22.7%  2210 0.1362  1.90 SELECT orders
```
Detail for rank 1: `Rows_examined` avg 2.1M, `Rows_sent` avg 24. Recorded as `examined_ratio` with ratio about 87,500 to 1.

---

## Exit Criteria

DONE when `slow_query_list` holds ranked fingerprints with the raw counters, and the slow log settings are back to their original values.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Access denied; you need SUPER or SYSTEM_VARIABLES_ADMIN` | **Return**: hand the user the exact `SET GLOBAL` lines to run as an admin, or use `sqlo-mysql-perf-schema-digest`, which needs only SELECT on performance_schema. |
| Phase 1 | Disk space on the log volume is low | **Adjust**: raise `long_query_time` or shorten the window; record the trade-off. |
| Phase 2 | `pt-query-digest: command not found` | **Adjust**: use `mysqldumpslow` as in Action 4. |
| Phase 2 | Log is empty | **Retry**: confirm app connections reconnected after the change (Phase 1 Action 4), then capture again. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
