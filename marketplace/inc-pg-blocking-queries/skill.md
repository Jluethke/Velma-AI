# Incident PostgreSQL Blocking and Connection Triage

**One-line description:** Reads `pg_stat_activity`, `pg_blocking_pids()` and `pg_locks` on a live PostgreSQL server to find blocking chains, long transactions, idle-in-transaction sessions and connection exhaustion, and applies a rule table for when to cancel or terminate a backend.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `hypothesis_table` (object[], required): From `inc-hypothesis-draft`; rows needing database evidence.
- `pg_connection` (string, required): A `psql` connection string or service name for a role with `pg_read_all_stats` (or superuser) so other sessions' queries are visible. Never paste the password into the channel; use `~/.pgpass` or `PGPASSWORD` in the shell.

---

## Outputs

- `postgres_evidence` (object): {server_version, connections_used, max_connections, state_counts, wait_event_counts, blocking_chains, long_transactions, idle_in_transaction, actions_taken, hypotheses_affected}.

---

## Phase 1: Connection and State Overview

### Entry Criteria
- `psql "<pg_connection>" -c 'select version();'` succeeds.

### Actions
1. Connect with a short statement timeout so your own queries never become part of the problem: `psql "<pg_connection>" -v ON_ERROR_STOP=1` then `SET statement_timeout = '<value chosen by ops lead>';`.
2. Connection use against the limit:
   ```sql
   SHOW max_connections;
   SELECT count(*) AS total, count(*) FILTER (WHERE state = 'active') AS active,
          count(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_tx
   FROM pg_stat_activity WHERE backend_type = 'client backend';
   ```
3. What sessions are waiting on:
   ```sql
   SELECT wait_event_type, wait_event, count(*) FROM pg_stat_activity
   WHERE state <> 'idle' GROUP BY 1,2 ORDER BY 3 DESC;
   ```
   `Lock` means waiting on a heavyweight lock; `LWLock` is internal contention; `IO` is disk; `Client` with `ClientRead` means the server waits on the application.
4. Longest running and longest open transactions:
   ```sql
   SELECT pid, usename, application_name, client_addr, state,
          now() - xact_start AS xact_age, now() - query_start AS query_age,
          wait_event_type, wait_event, left(query, 200) AS query
   FROM pg_stat_activity WHERE backend_type = 'client backend' AND xact_start IS NOT NULL
   ORDER BY xact_start ASC LIMIT 20;
   ```

### Output
Counts and the top 20 oldest transactions.

### Quality Gate
- connections_used and max_connections are both numbers from the queries.
- The wait event table is pasted.

---

## Phase 2: Blocking Chains

### Entry Criteria
- Overview is captured.

### Actions
1. Find blocked sessions and who blocks them:
   ```sql
   SELECT pid, pg_blocking_pids(pid) AS blocked_by, now() - query_start AS waiting,
          left(query, 150) AS query
   FROM pg_stat_activity WHERE cardinality(pg_blocking_pids(pid)) > 0
   ORDER BY waiting DESC;
   ```
2. Find the root blockers: PIDs that appear in some `blocked_by` array but are not themselves blocked. Show them:
   ```sql
   SELECT pid, usename, application_name, state, now() - xact_start AS xact_age,
          left(query, 300) AS last_query
   FROM pg_stat_activity WHERE pid IN (<root pids>);
   ```
   For a root blocker in `idle in transaction`, `query` is the LAST statement it ran, not what holds the lock; the lock comes from earlier in the transaction.
3. Show the locks a root blocker holds: `SELECT locktype, relation::regclass, mode, granted FROM pg_locks WHERE pid = <root pid>;`
4. Common patterns:

| Pattern | Meaning |
|---|---|
| Root blocker runs `ALTER TABLE` or `CREATE INDEX` (non-concurrent), many waiters on the same table | DDL needs an ACCESS EXCLUSIVE or SHARE lock and queues every later query behind it |
| Root blocker is `idle in transaction` for a long time | Application opened a transaction and did not commit (often an exception path or a slow remote call inside the transaction) |
| Many sessions active, few blocked, `IO` waits | Slow queries from a plan change or missing index, not locking |
| total connections near max_connections, many `idle` | Connection pools too large for the server; consider PgBouncer |

### Output
Blocking chains with root blockers.

### Quality Gate
- Every root blocker has its pid, state, transaction age and held locks recorded.

---

## Phase 3: Decide on Cancel or Terminate

### Entry Criteria
- Root blockers are known.

### Actions
1. Apply this table. Every row needs IC approval because it changes production state:

| Root blocker | Action |
|---|---|
| Active long query from a known batch or report job | `SELECT pg_cancel_backend(<pid>);` (cancels the query, keeps the session) |
| `idle in transaction` holding locks others need | `SELECT pg_terminate_backend(<pid>);` (cancel does nothing for an idle session; terminate rolls back its transaction) |
| Migration DDL blocking traffic | Terminate the migration session and reschedule it with `lock_timeout` set |
| Replication, autovacuum preventing wraparound, or a system process | **Do not** terminate; escalate to a DBA |

2. Read the result: both functions return `t` when the signal was sent. Re-run the Phase 2 query; the chain should be gone.
3. Never run `EXPLAIN ANALYZE` on a write query (INSERT, UPDATE, DELETE) in production: ANALYZE executes the statement. Use plain `EXPLAIN` for writes.
4. Record each action with time, pid, the query text and approver in `actions_taken` and the timeline.

### Output
`postgres_evidence`.

### Quality Gate
- Each action has an approver and the post-action blocking query output.
- No `EXPLAIN ANALYZE` was run on a write statement (check the psql history: `\s`).

---

## Worked Example

Illustrative only. PostgreSQL 16, `max_connections` 200.

- Phase 1: total 196, active 41, idle_in_tx 3. Wait events: `Lock / relation` 37, `Client / ClientRead` 3.
- Phase 2: 37 sessions blocked by pid 48211. pid 48211: `ALTER TABLE orders ADD COLUMN promo_code text DEFAULT gen_random_uuid()::text`, xact_age 6 min, holds `AccessExclusiveLock` on `orders`. Pattern row 1: DDL blocking traffic (a volatile default forces a table rewrite).
- Phase 3: IC approves. `SELECT pg_terminate_backend(48211);` returns `t`. Re-run shows zero blocked sessions. Action recorded; migration to be rescheduled with `lock_timeout`.

---

## Exit Criteria

DONE when connection use, wait events, blocking chains and root blockers are recorded, any cancel or terminate is approved and verified, and each database hypothesis row is decided.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cannot connect: "too many clients already" | **Adjust**: connect through the superuser-reserved slots with a superuser role (see `superuser_reserved_connections`), or ask the DBA. |
| Phase 1 | Query text shows `<insufficient privilege>` | **Adjust**: use a role with `pg_read_all_stats`. |
| Phase 3 | Terminated session reappears | **Adjust**: the job retries automatically; stop the job at its scheduler first. |
| Phase 3 | Managed service (RDS, Cloud SQL) without superuser | **Adjust**: `pg_cancel_backend` and `pg_terminate_backend` work for roles granted `pg_signal_backend`; check the provider docs. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
