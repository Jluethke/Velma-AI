# PostgreSQL Vacuum, Dead Tuples and Bloat

**One-line description:** Finds PostgreSQL tables whose dead tuples are not being removed, identifies what holds back the xmin horizon (long transactions, idle-in-transaction sessions, replication slots, prepared transactions, standby feedback), and sets per-table autovacuum parameters from the measured change rate, without running VACUUM FULL on a live table.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuning_scope` (object, required): From `sqlo-baseline-scope`.

---

## Outputs

- `vacuum_actions` (object[]): Per table: dead tuple counts, the autovacuum trigger point, the xmin holder if any, the fix applied or proposed, and the before and after counts.

---

## Phase 1: Measure Dead Tuples and Trigger Points

### Entry Criteria
- `tuning_scope.db_engine` == `postgresql`.

### Actions
1. List tables by dead tuples:
```
SELECT relname, n_live_tup, n_dead_tup, n_mod_since_analyze,
       last_vacuum, last_autovacuum, autovacuum_count,
       n_tup_upd, n_tup_hot_upd
FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 20;
```
2. For each table compute the autovacuum trigger point: `autovacuum_vacuum_threshold + autovacuum_vacuum_scale_factor x reltuples` (defaults 50 and 0.2). Read per-table overrides from `SELECT relname, reloptions FROM pg_class WHERE reloptions IS NOT NULL;`.
3. Classify:

| Evidence | Class |
|---|---|
| `n_dead_tup` below the trigger point | `normal` |
| above the trigger, `last_autovacuum` recent and rising `autovacuum_count` | `vacuum_runs_but_cannot_clean` (go to Phase 2) |
| above the trigger, `last_autovacuum` old or NULL | `vacuum_not_reaching_table` |
| table is large and the trigger point is many millions of rows | `trigger_too_coarse` |

4. Check whether autovacuum workers are busy: `SELECT pid, datname, relid::regclass, phase, heap_blks_scanned, heap_blks_total FROM pg_stat_progress_vacuum;` and compare the worker count with `SHOW autovacuum_max_workers;`.

### Output
Per-table class with counts and trigger points.

### Quality Gate
- Each table in the top 20 has `n_dead_tup`, its computed trigger point and a class.
- Per-table `reloptions` were read and used in the trigger calculation.

---

## Phase 2: Find the xmin Horizon Holder

### Entry Criteria
- At least one table is `vacuum_runs_but_cannot_clean`.

### Actions
1. Run each check and record every row returned:
```
-- long or idle transactions
SELECT pid, usename, state, backend_xmin, now() - xact_start AS xact_age, left(query,120)
FROM pg_stat_activity WHERE backend_xmin IS NOT NULL ORDER BY age(backend_xmin) DESC LIMIT 10;
-- replication slots
SELECT slot_name, slot_type, active, xmin, catalog_xmin FROM pg_replication_slots;
-- prepared transactions
SELECT gid, prepared, owner FROM pg_prepared_xacts;
```
2. On a primary with streaming replicas, check `SHOW hot_standby_feedback;` on each replica. If `on`, long queries on the replica hold back cleanup on the primary; run the first query above on the replica too.
3. Confirm with a verbose vacuum on one affected table (allowed on all environments; it does not block reads or writes): `VACUUM (VERBOSE) orders;`. Read the line reporting tuples removed and tuples that are dead but not yet removable, and the `removable cutoff` / `oldest xmin` line (wording varies by version). A large "not yet removable" count confirms a horizon holder.
4. Name the holder: a pid with its transaction age, an inactive replication slot, or an old prepared transaction.

### Output
Named xmin holder per affected table.

### Quality Gate
- The VACUUM VERBOSE output line with the not-removable count is quoted.
- The holder is named by pid, slot name or gid, or the record says none was found.

---

## Phase 3: Fix and Re-measure

### Entry Criteria
- Phase 1 and (if run) Phase 2 complete.

### Actions
1. Choose the fix with this table. Every action that ends a session or drops a slot needs explicit user approval.

| Class or holder | Fix |
|---|---|
| idle-in-transaction session | ask the user to fix the app path that leaves transactions open; set `idle_in_transaction_session_timeout` to a user-chosen value (role or database level); end the session only with approval: `SELECT pg_terminate_backend(pid);` |
| long-running query or report | move it to a replica without `hot_standby_feedback`, or shorten it |
| inactive replication slot | confirm with the owner that the consumer is gone, then `SELECT pg_drop_replication_slot('name');` |
| orphaned prepared transaction | `ROLLBACK PREPARED 'gid';` after the owner confirms |
| `trigger_too_coarse` | `ALTER TABLE orders SET (autovacuum_vacuum_scale_factor = X, autovacuum_vacuum_threshold = Y);` with X and Y derived so the trigger point equals the number of dead tuples the user accepts, agreed with the user |
| `vacuum_not_reaching_table` with workers always busy | raise `autovacuum_max_workers` (restart required) or lower per-table cost delay `autovacuum_vacuum_cost_delay`; agree values with the user |

2. Do not run `VACUUM FULL` or `CLUSTER` on a live table: both take an ACCESS EXCLUSIVE lock and rewrite the table, blocking all reads and writes. To reclaim space online use `pg_repack` (an extension and client, `pg_repack -t orders -d shop`), after the user approves.
3. After removing the holder, run `VACUUM (VERBOSE, ANALYZE) orders;` and record the new dead tuple counts.
4. Check wraparound risk while here: `SELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC;` and compare with `SHOW autovacuum_freeze_max_age;` (default 200 million). Report any database near it as urgent.

### Output
`vacuum_actions`.

### Quality Gate
- `n_dead_tup` after the fix is recorded from `pg_stat_user_tables` for every table that had an action.
- No `VACUUM FULL` or `CLUSTER` appears in the executed command list.
- Every session termination or slot drop has a recorded user approval.

---

## Worked Example

Illustrative only.

Phase 1: `orders` n_live_tup 41.2M, n_dead_tup 9.6M, trigger point 50 + 0.2 x 41.2M = 8.24M, `autovacuum_count` rising every 20 minutes: `vacuum_runs_but_cannot_clean`.

Phase 2:
```
 pid   | usename   | state               | xact_age        | left
 31877 | reporting | idle in transaction | 2 days 03:11:09 | SELECT sum(total) FROM orders WHERE ...
```
`VACUUM (VERBOSE) orders;` reported `tuples: 2104 removed, 41203118 remain, 9588211 are dead but not yet removable`.

Phase 3: user approved ending pid 31877 and set `ALTER ROLE reporting SET idle_in_transaction_session_timeout = '15min';` (value chosen by the user). After `VACUUM (VERBOSE, ANALYZE) orders;`, n_dead_tup fell to 12,040.

---

## Exit Criteria

DONE when every table above its trigger point has a class, any xmin holder is named, and the applied fixes have before and after dead tuple counts.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `pg_stat_user_tables` counters were reset recently | **Adjust**: check `pg_stat_database.stats_reset`; mark counts as partial. |
| Phase 2 | Holder is on a replica you cannot access | **Return**: ask the user to run the Phase 2 query on the replica. |
| Phase 3 | User declines to end the holding session | **Stop**: report that cleanup cannot proceed until it ends; record the pid and age. |
| Phase 3 | Database near `autovacuum_freeze_max_age` | **Stop**: report as urgent before any other tuning. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
