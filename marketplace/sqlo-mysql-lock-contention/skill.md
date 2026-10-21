# MySQL InnoDB Lock Contention Diagnosis

**One-line description:** Diagnoses MySQL lock waits with `sys.innodb_lock_waits`, `performance_schema.data_locks`, metadata lock views and the LATEST DETECTED DEADLOCK section of `SHOW ENGINE INNODB STATUS`, and maps each pattern (gap locks under REPEATABLE READ, unindexed UPDATE locking every scanned row, metadata lock queue behind DDL, long open transactions) to its specific fix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuning_scope` (object, required): From `sqlo-baseline-scope`.

---

## Outputs

- `lock_report` (object): Row lock waits, metadata lock waits, deadlock reports, long transactions, each with its pattern class and fix backed by evidence.

---

## Phase 1: Prepare Evidence Sources

### Entry Criteria
- `tuning_scope.db_engine` == `mysql`.

### Actions
1. Record: `SELECT @@transaction_isolation, @@innodb_lock_wait_timeout, @@lock_wait_timeout, @@innodb_print_all_deadlocks, @@innodb_deadlock_detect;` (defaults `REPEATABLE-READ`, 50 seconds, 31536000 seconds, OFF, ON).
2. If the user approves, log every deadlock to the error log, not only the latest: `SET GLOBAL innodb_print_all_deadlocks = ON;`.
3. Check the metadata lock instrument: `SELECT NAME, ENABLED FROM performance_schema.setup_instruments WHERE NAME = 'wait/lock/metadata/sql/mdl';` (enabled by default on 8.0).

### Output
Settings recorded, evidence sources enabled.

### Quality Gate
- The five settings from Action 1 are recorded.
- `wait/lock/metadata/sql/mdl` shows `YES`, or its absence is recorded.

---

## Phase 2: Capture Waits

### Entry Criteria
- Contention is happening now, or deadlocks are in the error log.

### Actions
1. Row lock waits (8.0):
```
SELECT wait_age, locked_table, locked_index, locked_type,
       waiting_pid, waiting_query, blocking_pid, blocking_query, sql_kill_blocking_query
FROM sys.innodb_lock_waits\G
```
2. Lock detail: `SELECT ENGINE_TRANSACTION_ID, OBJECT_NAME, INDEX_NAME, LOCK_TYPE, LOCK_MODE, LOCK_STATUS, LOCK_DATA FROM performance_schema.data_locks WHERE OBJECT_NAME = 'orders' LIMIT 50;`. Read `LOCK_MODE`: `X,REC_NOT_GAP` is a record lock only; `X,GAP` is a gap lock; `X` alone is a next-key lock (record plus gap before it); `X,INSERT_INTENTION` is an insert waiting for a gap.
3. Metadata lock waits: `SELECT * FROM sys.schema_table_lock_waits\G`. In `SHOW PROCESSLIST`, the state `Waiting for table metadata lock` marks these.
4. Long transactions: `SELECT trx_id, trx_state, trx_started, TIMESTAMPDIFF(SECOND, trx_started, NOW()) AS age_s, trx_rows_locked, trx_rows_modified, trx_mysql_thread_id, LEFT(trx_query,150) FROM information_schema.INNODB_TRX ORDER BY trx_started LIMIT 10;`. A transaction with `trx_query` NULL is idle inside an open transaction.
5. Deadlocks: `SHOW ENGINE INNODB STATUS\G` and copy the whole `LATEST DETECTED DEADLOCK` section. It shows each transaction's statement, the lock it holds (`HOLDS THE LOCK(S)`), the lock it waits for (`WAITING FOR THIS LOCK TO BE GRANTED`), the index, and which transaction was rolled back. With `innodb_print_all_deadlocks` on, collect all reports from the error log.
6. Undo backlog: in the same status output, record `History list length`. A large and growing value means a long transaction is preventing purge.

### Output
Wait rows, lock detail, MDL waits, long transactions, deadlock reports.

### Quality Gate
- Each captured wait names the blocking thread id and its query or `NULL` (idle).
- Every deadlock report is saved verbatim.

---

## Phase 3: Classify and Name the Fix

### Entry Criteria
- Phase 2 produced at least one wait, long transaction or deadlock.

### Actions
1. Match each to a pattern:

| Evidence | Pattern | Fix |
|---|---|---|
| UPDATE or DELETE whose WHERE column has no usable index (EXPLAIN shows `type: ALL` or `index`), `trx_rows_locked` far above rows changed | `unindexed_dml_locks_scanned_rows` | add an index on the WHERE column (InnoDB locks every row it scans under REPEATABLE READ) |
| `LOCK_MODE` `X,GAP` or next-key locks blocking `INSERT_INTENTION` | `gap_lock_insert_block` | if the application tolerates it, use READ COMMITTED for that transaction (`SET TRANSACTION ISOLATION LEVEL READ COMMITTED;`), which disables most gap locking; or use a unique index for equality lookups so only record locks are taken |
| Deadlock: two transactions update the same rows in opposite order | `row_lock_ordering` | lock rows in primary key order (`SELECT ... WHERE id IN (...) ORDER BY id FOR UPDATE`) |
| Many workers block on the same queue rows | `queue_hot_rows` | `SELECT ... FOR UPDATE SKIP LOCKED` (MySQL 8.0) |
| `Waiting for table metadata lock` behind an `ALTER TABLE`, which waits behind an open transaction | `mdl_queue_behind_ddl` | set `SET SESSION lock_wait_timeout = <user value>;` before DDL and retry; end the idle transaction first with approval |
| `INNODB_TRX` row with old `trx_started` and NULL `trx_query` | `idle_open_transaction` | fix the code path that leaves the transaction open (autocommit off with no commit, network call inside the transaction) |
| Deadlock involving `AUTO-INC` locks during bulk inserts | `autoinc_lock` | check `innodb_autoinc_lock_mode` (default 2 on 8.0) and the binlog format before changing anything |

2. Ending a blocker: `KILL <thread_id>;` rolls back its transaction, which can take as long as the work it undoes. Every KILL needs explicit user approval per thread. `sys.innodb_lock_waits.sql_kill_blocking_query` gives the text; do not run it on your own.
3. Write `lock_report` with the pattern, the evidence rows and the fix. This flow does not change application code.

### Output
`lock_report`.

### Quality Gate
- Every wait, long transaction and deadlock report has one pattern from the table or `unclassified` with the evidence.
- No `KILL` was run without a recorded approval.

---

## Worked Example

Illustrative only.

Phase 2, deadlock section (shortened):
```
*** (1) TRANSACTION:
TRANSACTION 9123311, ACTIVE 0 sec starting index read
UPDATE inventory SET qty = qty - 1 WHERE sku = 'A-100'
*** (1) HOLDS THE LOCK(S):
RECORD LOCKS space id 88 page no 4 n bits 80 index idx_sku of table `shop`.`inventory` lock_mode X locks rec but not gap
*** (1) WAITING FOR THIS LOCK TO BE GRANTED:
... index idx_sku ... lock_mode X locks rec but not gap ... 'B-200'
*** (2) TRANSACTION:
UPDATE inventory SET qty = qty - 1 WHERE sku = 'B-200'
... WAITING ... 'A-100'
*** WE ROLL BACK TRANSACTION (2)
```
Pattern: `row_lock_ordering`. Checkout updates cart lines in cart order. Fix: sort SKUs before updating, or `SELECT id FROM inventory WHERE sku IN (...) ORDER BY sku FOR UPDATE` first.

---

## Exit Criteria

DONE when every captured wait, long transaction and deadlock has a pattern and a fix backed by quoted evidence.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `sys` schema missing | **Adjust**: join `performance_schema.data_lock_waits` to `data_locks` and `threads` directly. |
| Phase 2 | MySQL 5.7 (no `data_locks`) | **Adjust**: use `information_schema.INNODB_LOCK_WAITS` and `INNODB_LOCKS`, which exist only on 5.7. |
| Phase 2 | No contention at sampling time | **Return**: ask the user to rerun Phase 2 during the slow period; keep any deadlock reports. |
| Phase 3 | Isolation change requested by fix | **Stop**: get application owner confirmation that READ COMMITTED semantics are acceptable before proposing it as done. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
