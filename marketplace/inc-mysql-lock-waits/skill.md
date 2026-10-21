# Incident MySQL InnoDB Lock and Metadata Lock Triage

**One-line description:** Uses `SHOW FULL PROCESSLIST`, `sys.innodb_lock_waits`, `information_schema.innodb_trx`, `sys.schema_table_lock_waits` and `SHOW ENGINE INNODB STATUS` on MySQL 8 to find row lock and metadata lock chains, long transactions and connection exhaustion, and kills root blockers only by an approved rule table.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `hypothesis_table` (object[], required): From `inc-hypothesis-draft`; rows needing database evidence.
- `mysql_connection` (string, required): Host, port and user for the `mysql` client with the `PROCESS` privilege and read access to `performance_schema` and `sys`. Keep the password in an option file (`--defaults-extra-file`) or `mysql_config_editor` login path, never on the command line.

---

## Outputs

- `mysql_evidence` (object): {server_version, threads_connected, threads_running, max_connections, processlist_states, row_lock_chains, metadata_lock_chains, long_transactions, latest_deadlock, actions_taken, hypotheses_affected}.

---

## Phase 1: Overview

### Entry Criteria
- `mysql --login-path=<path> -e 'SELECT VERSION();'` succeeds.

### Actions
1. Connection pressure:
   ```sql
   SHOW GLOBAL VARIABLES LIKE 'max_connections';
   SHOW GLOBAL STATUS WHERE Variable_name IN ('Threads_connected','Threads_running','Aborted_connects','Max_used_connections');
   ```
2. What sessions are doing, grouped by state:
   ```sql
   SELECT command, state, count(*) AS n, max(time) AS max_seconds
   FROM information_schema.processlist GROUP BY command, state ORDER BY n DESC;
   ```
   On MySQL 8.0.22 and later, `performance_schema.processlist` is the non-blocking alternative; check the server docs for your version.
3. Read the states:

| State | Meaning |
|---|---|
| `Waiting for table metadata lock` | DDL or a long transaction holds a metadata lock on the table |
| `updating`, `Sending data`, `executing` with high `time` | long-running statements |
| `Sleep` with an open transaction (see Phase 2) | application left a transaction open |
| many `Sleep`, Threads_connected near max_connections | pools too large or connection leak |

### Output
Overview counts and state table.

### Quality Gate
- threads_connected and max_connections are numbers from the output.

---

## Phase 2: Lock Chains and Long Transactions

### Entry Criteria
- Overview is captured.

### Actions
1. Row lock waits (InnoDB):
   ```sql
   SELECT wait_age, locked_table, locked_index, waiting_pid, left(waiting_query,150) AS waiting_query,
          blocking_pid, left(blocking_query,150) AS blocking_query, sql_kill_blocking_query, sql_kill_blocking_connection
   FROM sys.innodb_lock_waits ORDER BY wait_age DESC;
   ```
   `blocking_query` is NULL when the blocker is idle in an open transaction.
2. Metadata lock waits:
   ```sql
   SELECT object_schema, object_name, waiting_pid, waiting_query, blocking_pid, sql_kill_blocking_connection
   FROM sys.schema_table_lock_waits;
   ```
   Requires the `wait/lock/metadata/sql/mdl` instrument, enabled by default in MySQL 8.0.
3. Long transactions:
   ```sql
   SELECT trx_mysql_thread_id AS pid, trx_state, trx_started, TIMESTAMPDIFF(SECOND, trx_started, NOW()) AS age_s,
          trx_rows_locked, trx_rows_modified, left(trx_query,150) AS q
   FROM information_schema.innodb_trx ORDER BY trx_started ASC LIMIT 20;
   ```
4. Latest deadlock: `SHOW ENGINE INNODB STATUS\G` and read the `LATEST DETECTED DEADLOCK` section: it lists both transactions, the lock each held and the one it waited for, and which was rolled back.
5. Identify root blockers: pids that block others and are not waiting themselves.

### Output
Row lock chains, metadata lock chains, long transactions, deadlock text.

### Quality Gate
- Each root blocker has pid, transaction age and the table it locks.
- The deadlock section is pasted or recorded as "none since restart".

---

## Phase 3: Kill Decision

### Entry Criteria
- Root blockers are known.

### Actions
1. Apply the table; every kill needs IC approval:

| Root blocker | Action |
|---|---|
| Long statement from a batch job | `KILL QUERY <pid>;` (stops the statement, keeps the connection) |
| Idle connection with an open transaction holding locks | `KILL <pid>;` (closes the connection and rolls back) |
| Online schema change tool (gh-ost, pt-online-schema-change) | Use the tool's own pause or abort control; do not kill its connections blind |
| Replication threads or `event_scheduler` | **Do not** kill; escalate to a DBA |

2. On Amazon RDS or Aurora MySQL, `KILL` on another user's thread is not permitted; use `CALL mysql.rds_kill_query(<pid>);` or `CALL mysql.rds_kill(<pid>);`.
3. Rolling back a large transaction takes time; the killed pid shows `Killed` and `trx_state` `ROLLING BACK` until done. Do not restart the server to speed it up; crash recovery would repeat the rollback.
4. Re-run the Phase 2 queries to confirm the chain is gone. Record actions with time, pid, query and approver.

### Output
`mysql_evidence`.

### Quality Gate
- Each kill has an approver and a post-kill query result.
- No server restart was performed to clear a rollback.

---

## Worked Example

Illustrative only. MySQL 8.0 on RDS, `max_connections` 1000.

- Phase 1: Threads_connected 912, Threads_running 380. State `Waiting for table metadata lock`: 341 sessions, max 410 s.
- Phase 2: `sys.schema_table_lock_waits` shows `shop.orders`, blocking_pid 7781. `innodb_trx` shows pid 7781 started 14 minutes ago, trx_query NULL (idle), rows_locked 0. The DDL waiting behind it (pid 7802, `ALTER TABLE orders ...`) in turn blocks all new reads.
- Phase 3: IC approves killing the idle transaction. `CALL mysql.rds_kill(7781);`. The ALTER completes in seconds; waits clear. Recorded.

---

## Exit Criteria

DONE when connection pressure, lock chains, long transactions and the latest deadlock are recorded, any kill is approved and verified, and each database hypothesis row is decided.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | "Too many connections" when connecting | **Adjust**: MySQL reserves one extra connection for an account with `CONNECTION_ADMIN` (or `SUPER`); connect with that account. |
| Phase 2 | `sys` schema missing | **Adjust**: join `performance_schema.data_lock_waits` with `information_schema.innodb_trx` directly. |
| Phase 3 | `KILL` returns "You are not owner of thread" | **Adjust**: on RDS use `mysql.rds_kill`; elsewhere use an account with `CONNECTION_ADMIN`. |
| Phase 3 | Blocker reappears | **Stop**: find and pause the job or deploy creating it before killing again. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
