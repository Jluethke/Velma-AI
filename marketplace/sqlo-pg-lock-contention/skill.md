# PostgreSQL Lock Contention Diagnosis

**One-line description:** Builds the PostgreSQL blocking tree with `pg_blocking_pids()`, separates heavyweight lock waits from LWLock and I/O waits, reads deadlock reports from the server log, and maps each blocking pattern (DDL lock queue, idle-in-transaction holder, row lock ordering, unindexed foreign key) to its specific fix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuning_scope` (object, required): From `sqlo-baseline-scope`.

---

## Outputs

- `lock_report` (object): Blocking trees observed, wait event breakdown, deadlock reports, the pattern class for each, and the fix for each with its evidence.

---

## Phase 1: Turn On Lock Evidence

### Entry Criteria
- `tuning_scope.db_engine` == `postgresql`.

### Actions
1. Record: `SHOW log_lock_waits; SHOW deadlock_timeout; SHOW lock_timeout; SHOW idle_in_transaction_session_timeout;`. `log_lock_waits` logs any lock wait longer than `deadlock_timeout` (default `1s`). `log_lock_waits` defaults to off on most versions; check yours.
2. If off and the user approves: `ALTER SYSTEM SET log_lock_waits = on; SELECT pg_reload_conf();` (reload, no restart). Managed services: set it in the parameter group.
3. Do not lower `deadlock_timeout` to get more log lines; it also controls how often deadlock checks run.

### Output
Lock logging confirmed on.

### Quality Gate
- `SHOW log_lock_waits;` returns `on`, or the user's refusal is recorded.

---

## Phase 2: Sample Waits and Build the Blocking Tree

### Entry Criteria
- Contention is happening now, or the log contains lock wait lines.

### Actions
1. Wait event breakdown (run several times a few seconds apart and record each):
```
SELECT wait_event_type, wait_event, state, count(*)
FROM pg_stat_activity WHERE backend_type = 'client backend'
GROUP BY 1,2,3 ORDER BY 4 DESC;
```
2. Classify by `wait_event_type`:

| wait_event_type | Meaning | Flow to use |
|---|---|---|
| `Lock` | heavyweight lock (row, table, transaction id) | continue this flow |
| `LWLock` | internal shared memory lock (for example `WALWrite`, `BufferMapping`, `LockManager`) | not row contention; record and report; `LockManager` often means many partitions or indexes touched per query |
| `IO` | waiting on disk | index or cache work, not locking |
| `Client` with state `idle in transaction` | session holding locks while the app does other work | Phase 3 `idle_in_transaction` |
| NULL with state `active` | on CPU | not a wait |

3. Blocking tree:
```
SELECT a.pid, pg_blocking_pids(a.pid) AS blocked_by, a.state, a.wait_event,
       now() - a.xact_start AS xact_age, now() - a.query_start AS query_age,
       left(a.query, 150) AS query
FROM pg_stat_activity a
WHERE cardinality(pg_blocking_pids(a.pid)) > 0
   OR a.pid IN (SELECT unnest(pg_blocking_pids(pid)) FROM pg_stat_activity)
ORDER BY xact_age DESC NULLS LAST;
```
   The root blocker is a pid that appears in `blocked_by` but has an empty `blocked_by` itself.
4. Lock detail for the root and the waiters: `SELECT locktype, relation::regclass, mode, granted, pid FROM pg_locks WHERE pid IN (...) ORDER BY granted, pid;`.
5. Deadlocks: search the log for `deadlock detected`. Each report lists `Process A waits for ShareLock on transaction T; blocked by process B.` and the statements. Save every report.

### Output
Wait breakdown, blocking trees, deadlock reports.

### Quality Gate
- At least three wait samples are recorded with timestamps.
- Each blocking tree names its root pid with that pid's `state`, `xact_age` and query.

---

## Phase 3: Classify the Pattern and Name the Fix

### Entry Criteria
- Phase 2 produced at least one tree or deadlock report.

### Actions
1. Match each tree or report to a pattern:

| Evidence | Pattern | Fix |
|---|---|---|
| Waiters want `AccessShareLock` and wait behind a pending `AccessExclusiveLock` (from `ALTER TABLE`, `DROP`, `TRUNCATE`, `REINDEX` without CONCURRENTLY), which itself waits behind a long query | `ddl_lock_queue` | run DDL with `SET lock_timeout = '<user value>';` and retry on failure; use online forms (`CREATE INDEX CONCURRENTLY`, `ADD CONSTRAINT ... NOT VALID` then `VALIDATE CONSTRAINT`) |
| Root blocker `state` = `idle in transaction` | `idle_in_transaction` | fix the code path holding the transaction open (network calls inside a transaction); set `idle_in_transaction_session_timeout` at role or database level to a user-chosen value |
| Deadlock between two transactions updating the same rows in different orders | `row_lock_ordering` | lock rows in a fixed order: `SELECT ... FROM t WHERE id = ANY($1) ORDER BY id FOR UPDATE` before updating |
| Many workers wait on the same rows of a queue table | `queue_hot_rows` | `SELECT ... FOR UPDATE SKIP LOCKED LIMIT n` in the worker query |
| Waits on `ShareLock` for a transaction id during DELETE or UPDATE of a parent row, child table scanned | `unindexed_foreign_key` | index the referencing column; find candidates with the query in Action 2 |
| Waits on `ShareRowExclusiveLock` or `ShareLock` on a table during bulk load or FK validation | `bulk_ddl` | schedule the operation; split into batches |
| Single hot row updated by every request (counter) | `hot_row_counter` | aggregate in a separate table with several rows per key, or update asynchronously |

2. Unindexed foreign keys (columns of an FK not leading any index):
```
SELECT c.conrelid::regclass AS child, c.conname, a.attname
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
WHERE c.contype = 'f'
  AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = c.conrelid AND i.indkey[0] = c.conkey[1]);
```
   This checks the first FK column only; check multi-column FKs by hand.
3. Ending a blocker: `SELECT pg_cancel_backend(pid);` cancels the current query; `SELECT pg_terminate_backend(pid);` ends the session and rolls back its transaction. Either needs explicit user approval for every pid. Never end a session to make a benchmark pass.
4. Write `lock_report`. This flow does not change application code; it names the file or query that needs the change.

### Output
`lock_report`.

### Quality Gate
- Every tree and deadlock report has exactly one pattern from the table, or `unclassified` with the evidence.
- Every proposed fix quotes the evidence row that matched its pattern.
- No `pg_terminate_backend` or `pg_cancel_backend` call appears without a recorded approval.

---

## Worked Example

Illustrative only.

Phase 2 wait samples: 140 sessions `Lock / relation`, 3 sessions `Client / ClientRead` idle in transaction.

Blocking tree:
```
  pid  | blocked_by | state               | wait_event | xact_age | query
 40211 | {}         | active              |            | 00:06:12 | SELECT ... FROM orders o JOIN ... (monthly report)
 40388 | {40211}    | active              | relation   | 00:00:41 | ALTER TABLE orders ADD COLUMN gift_note text
 40401 | {40388}    | active              | relation   | 00:00:39 | SELECT * FROM orders WHERE id = $1
 ... 138 more blocked by 40388
```
Pattern: `ddl_lock_queue`. The ALTER waits for ACCESS EXCLUSIVE behind the report, and every new SELECT queues behind the ALTER. Fix: rerun the migration with `SET lock_timeout = '3s';` (value from the user) and retry logic; move the report to a replica.

---

## Exit Criteria

DONE when every observed blocking tree and deadlock report has a pattern and a named fix backed by quoted evidence.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cannot change `log_lock_waits` | **Adjust**: rely on live sampling in Phase 2 while contention happens. |
| Phase 2 | No contention at sampling time and no log lines | **Return**: report no lock evidence; ask the user to rerun Phase 2 during the slow period. |
| Phase 2 | `pg_stat_activity.query` shows `<insufficient privilege>` | **Adjust**: request the `pg_read_all_stats` role. |
| Phase 3 | Waits are `LWLock` only | **Return**: report that this is not row or table lock contention; do not apply the lock fixes. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
