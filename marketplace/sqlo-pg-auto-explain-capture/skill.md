# PostgreSQL auto_explain Plan Capture

**One-line description:** Uses the auto_explain module to log the actual execution plans of slow statements as they run in real traffic, including parameter-dependent plans that a manual EXPLAIN with hand-picked values misses, and extracts one plan per slow query.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuning_scope` (object, required): From `sqlo-baseline-scope`.
- `slow_query_list` (object[], required): From `sqlo-pg-stat-statements-capture`. Gives the queries whose plans are needed and their mean time.

---

## Outputs

- `captured_plans` (object[]): One logged plan per slow query: `queryid` or normalized text, the logged duration, the plan text or JSON, and whether it was logged with ANALYZE timing.

---

## Phase 1: Choose the Loading Method

### Entry Criteria
- `tuning_scope.db_engine` == `postgresql`.
- `slow_query_list` is not empty.

### Actions
1. Pick the method with this table:

| Situation | Method |
|---|---|
| You can reproduce the query in your own session | `LOAD 'auto_explain';` in that session (needs superuser, or the module installed under `$libdir/plugins`) |
| Need plans from application connections, restart not allowed | `session_preload_libraries = 'auto_explain'` via `ALTER SYSTEM` or `ALTER ROLE app_user SET session_preload_libraries = 'auto_explain'`, then `SELECT pg_reload_conf();`; applies to new connections only |
| Restart allowed or managed service | add `auto_explain` to `shared_preload_libraries` (restart or parameter-group reboot) |

2. Set `auto_explain.log_min_duration` from data, not from a guess: use a value at or below the `mean_exec_time` of the fastest query in `slow_query_list` you need a plan for. Record the value and why.
3. Set the other parameters:
   - `auto_explain.log_analyze = on`: logs actual rows and timing. It adds overhead to every statement, not only logged ones, because instrumentation runs before the duration is known.
   - `auto_explain.log_timing = off` when overhead matters: keeps actual row counts, drops per-node timing.
   - `auto_explain.log_buffers = on`: logs shared hit and read per node (needs `log_analyze`).
   - `auto_explain.log_format = 'json'` if a tool will parse the plans; `text` for reading by eye.
   - `auto_explain.log_nested_statements = on` only when slow SQL runs inside functions.
   - `auto_explain.sample_rate`: fraction of statements explained, default 1. Lower it on busy production servers; the user picks the fraction.

### Output
Loading method and parameter values chosen.

### Quality Gate
- `SHOW auto_explain.log_min_duration;` in a new connection returns the chosen value, not `-1` (`-1`, the default, disables logging).
- The overhead choice (`log_timing` on or off, `sample_rate`) is recorded with the environment class.

---

## Phase 2: Collect and Extract Plans

### Entry Criteria
- auto_explain is active for the target connections.

### Actions
1. Find the log location: `SHOW log_destination; SHOW logging_collector; SHOW log_directory; SHOW log_filename;`. On managed services download the log through the provider console or CLI (for example `aws rds download-db-log-file-portion`).
2. Let traffic run, or reproduce the query in the session.
3. Extract entries. Text format lines start with `duration: N ms  plan:`; JSON format entries contain `"Plan":`. Example: `grep -n "duration: .* plan:" postgresql-*.log | head`.
4. For each query in `slow_query_list`, keep the slowest logged plan and the most frequent plan shape. If two shapes appear for the same normalized query, keep both and flag `parameter_sensitive_plan = true`.
5. Turn auto_explain off when done: `ALTER SYSTEM RESET session_preload_libraries;` or `ALTER ROLE app_user RESET session_preload_libraries;` then `SELECT pg_reload_conf();`, or restore the original `shared_preload_libraries` value.

### Output
`captured_plans`.

### Quality Gate
- Every query in `slow_query_list` has a captured plan, or is listed as `not_captured` with the reason.
- `SHOW auto_explain.log_min_duration;` or `SHOW session_preload_libraries;` confirms the capture settings were reverted.

---

## Worked Example

Illustrative only.

Input: slowest mean in `slow_query_list` is 1483 ms; fastest needed is 6.6 ms.

Phase 1: production primary, no restart allowed. Commands:
```
ALTER ROLE shop_app SET session_preload_libraries = 'auto_explain';
ALTER ROLE shop_app SET auto_explain.log_min_duration = '5ms';
ALTER ROLE shop_app SET auto_explain.log_analyze = on;
ALTER ROLE shop_app SET auto_explain.log_timing = off;
ALTER ROLE shop_app SET auto_explain.log_buffers = on;
ALTER ROLE shop_app SET auto_explain.sample_rate = 0.05;
```
(`sample_rate` 0.05 was the user's choice.)

Phase 2 log line:
```
LOG:  duration: 7.912 ms  plan:
  Query Text: SELECT * FROM orders WHERE customer_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT $3
  Limit  (cost=0.56..412.30 rows=20 width=212) (actual rows=20 loops=1)
    Buffers: shared hit=31 read=1180
    ->  Index Scan Backward using orders_created_at_idx on orders  (actual rows=20 loops=1)
          Filter: ((customer_id = 8812) AND (status = 'shipped'))
          Rows Removed by Filter: 118440
```
Settings reset with `ALTER ROLE shop_app RESET ALL;` after confirming the role had no other per-role settings (`\drds shop_app`).

---

## Exit Criteria

DONE when every query in `slow_query_list` has a real logged plan or a recorded reason it was not captured, and auto_explain settings are reverted.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `LOAD` fails with permission denied | **Adjust**: use the `ALTER ROLE ... SET session_preload_libraries` method with an admin, or request superuser for the session. |
| Phase 1 | `ALTER ROLE ... RESET ALL` would remove other settings | **Stop**: reset only the named parameters one by one. |
| Phase 2 | No plans appear | **Adjust**: confirm new connections were opened after the change (pooled connections keep old settings); recycle the app pool or wait for reconnects. |
| Phase 2 | Log volume grows fast | **Retry**: lower `auto_explain.sample_rate` or raise `log_min_duration`, then capture again. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
