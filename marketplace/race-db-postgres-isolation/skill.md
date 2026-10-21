# PostgreSQL Isolation Anomaly and Deadlock Reproduction

**One-line description:** Reproduces lost updates, write skew and deadlocks in PostgreSQL with two scripted `psql` sessions at the application's real isolation level, reads SQLSTATE `40001` and `40P01` errors and `pg_locks`, and picks the fix (atomic UPDATE, `SELECT ... FOR UPDATE`, constraint, SERIALIZABLE with retry).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the project root.
- `suspect_paths` (object[], required): From `race-symptom-triage`; rows naming transaction and query sites.
- `db_connection` (string, required): A connection string to a NON-production PostgreSQL database with the same schema (for example a local Docker container). Never a production URL.

---

## Outputs

- `pg_anomaly_report` (object): `isolation_level` (application's real level), `anomaly` (`lost-update`, `write-skew`, `non-repeatable-read`, `phantom`, `deadlock`, `none`), `session_script` (the two-session step list), `observed_errors` (SQLSTATE and message text), `lock_evidence` (rows from `pg_locks`/`pg_blocking_pids`), `fix` (from the fix table), `retry_required` (true when the fix raises 40001 or 40P01 that the app must retry).

---

## Phase 1: Find the Real Isolation Level and Transaction Shape

### Entry Criteria
- `db_connection` points at a non-production database (`psql "<db_connection>" -c "select current_database(), inet_server_addr()"` returns a local or test host).

### Actions
1. Server default: `psql "<db_connection>" -c "SHOW default_transaction_isolation;"`. The PostgreSQL default is `read committed`.
2. Application overrides: `rg -n "isolation|ISOLATION|SERIALIZABLE|REPEATABLE READ|isolation_level|IsolationLevel" "<repo_path>"`. ORM settings to check: SQLAlchemy `isolation_level=` on `create_engine` or `execution_options`, Django `OPTIONS: {"isolation_level": ...}`, Spring `@Transactional(isolation = Isolation.X)`, Prisma `$transaction(..., { isolationLevel })`, Go `sql.TxOptions{Isolation: sql.LevelSerializable}`.
3. For each suspect transaction, write down its statements in order (read with `SELECT`, the decision in application code, then the write). Mark reads that are plain `SELECT` versus locking reads (`FOR UPDATE`, `FOR NO KEY UPDATE`, `FOR SHARE`).

### Output
Isolation level and transaction statement lists.

### Quality Gate
- `SHOW default_transaction_isolation` output is recorded.
- Each suspect transaction has its statement list with each read marked locking or plain.

---

## Phase 2: Reproduce With Two Sessions

### Entry Criteria
- Statement lists exist.

### Actions
1. Open two terminals, A and B, each `psql "<db_connection>"`. In each run `BEGIN ISOLATION LEVEL <app level>;` (use the exact level from Phase 1).
2. Interleave statements step by step in the order that breaks the invariant. Use these canonical scripts:

| Anomaly | A | B | Result at READ COMMITTED |
|---|---|---|---|
| Lost update | `SELECT balance FROM acct WHERE id=1;` (100) | `SELECT balance FROM acct WHERE id=1;` (100) | |
| | `UPDATE acct SET balance=90 WHERE id=1;` | `UPDATE acct SET balance=80 WHERE id=1;` (blocks) | |
| | `COMMIT;` | (unblocks) `COMMIT;` | balance 80, A's debit lost |
| Write skew | `SELECT count(*) FROM oncall WHERE shift=7;` (2) | same (2) | |
| | `UPDATE oncall SET on=false WHERE doc='a';` | `UPDATE oncall SET on=false WHERE doc='b';` | |
| | `COMMIT;` | `COMMIT;` | zero doctors on call |
| Deadlock | `UPDATE acct SET ... WHERE id=1;` | `UPDATE acct SET ... WHERE id=2;` | |
| | `UPDATE acct SET ... WHERE id=2;` (blocks) | `UPDATE acct SET ... WHERE id=1;` | one session gets `ERROR: deadlock detected` |

3. While a session is blocked, in a third terminal record lock evidence:
   `SELECT pid, pg_blocking_pids(pid), wait_event_type, state, left(query, 80) FROM pg_stat_activity WHERE datname = current_database();`
   and `SELECT locktype, relation::regclass, mode, granted, pid FROM pg_locks WHERE NOT granted;`
4. Record every error with SQLSTATE. Turn on verbose errors in psql with `\set VERBOSITY verbose` to print the code. Expected forms:
   - `ERROR: 40001: could not serialize access due to concurrent update` (REPEATABLE READ or SERIALIZABLE, lost-update case),
   - `ERROR: 40001: could not serialize access due to read/write dependencies among transactions` (SERIALIZABLE, write skew),
   - `ERROR: 40P01: deadlock detected` with `DETAIL: Process 123 waits for ShareLock on transaction 456; blocked by process 789.`
   PostgreSQL checks for deadlock after `deadlock_timeout`, documented default 1s (`SHOW deadlock_timeout;`).
5. Repeat the same script at REPEATABLE READ and at SERIALIZABLE and record what changes. PostgreSQL REPEATABLE READ prevents lost update (by raising 40001) but allows write skew; SERIALIZABLE (SSI) prevents both by raising 40001.
6. Never run these scripts against production. Never leave a session open in a transaction; end each with `COMMIT` or `ROLLBACK`.

### Output
`session_script`, `observed_errors`, `lock_evidence` per isolation level.

### Quality Gate
- The anomaly reproduced at the app's level: final row values are shown with a `SELECT` after both sessions end, and the invariant violation is visible in that output; or `anomaly` = `none` with the full script recorded.
- Every error has a SQLSTATE copied from verbose psql output.

---

## Phase 3: Choose the Fix

### Entry Criteria
- Reproduction recorded.

### Actions
1. Pick the first matching row:

| Situation | Fix | Retry needed |
|---|---|---|
| Read-modify-write on one row, new value computable in SQL | `UPDATE acct SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance;` zero rows means refuse | No |
| Read, decide in app code, then write the same row | `SELECT ... FOR UPDATE` (or `FOR NO KEY UPDATE` when no key columns change) at the read | No, but deadlocks possible: lock rows in a fixed order (`ORDER BY id FOR UPDATE`) |
| Invariant is uniqueness | `UNIQUE` constraint plus `INSERT ... ON CONFLICT DO NOTHING` or `DO UPDATE` | No |
| Invariant spans rows (write skew) and cannot be a constraint | `SERIALIZABLE` for that transaction | Yes, on 40001 |
| Mutual exclusion on a logical key with no row to lock | `SELECT pg_advisory_xact_lock(<bigint key>);` at transaction start | No |
| Queue consumer picks jobs | `SELECT ... FOR UPDATE SKIP LOCKED LIMIT n` | No |
| Deadlock between two code paths | Same row lock order in both paths | Yes, on 40P01 as a backstop |
| Version-column compare-and-set preferred by the team | `UPDATE t SET ..., version = version + 1 WHERE id = $1 AND version = $2`; zero rows means conflict | App re-reads and retries |

2. If `retry_required`, the retry must re-run the whole transaction (from `BEGIN`), not just the failed statement, and must retry only SQLSTATE `40001` and `40P01`. The retry count limit is a user input; record it as an open question if not given.
3. Rerun the Phase 2 script with the fix applied by hand in psql and record that the invariant now holds.

### Output
`pg_anomaly_report`.

### Quality Gate
- The fix is one table row, and the Phase 2 script rerun with the fix shows the invariant holding in a final `SELECT`.
- If `retry_required` is true, the report names the exact SQLSTATE codes to retry.

---

## Worked Example

Illustrative only.

Phase 1: `SHOW default_transaction_isolation;` prints `read committed`; no override in the code. `wallet/debit.py` runs `SELECT balance ...`, checks `balance >= amount` in Python, then `UPDATE wallets SET balance = :new`.

Phase 2: lost-update script with balance 100, A debits 10, B debits 20. Final `SELECT balance FROM wallets WHERE id=1;` prints `80`; expected `70`. At REPEATABLE READ, B gets `ERROR: 40001: could not serialize access due to concurrent update`.

Phase 3: row 1. Fix `UPDATE wallets SET balance = balance - :amt WHERE id = :id AND balance >= :amt RETURNING balance`. Rerun: final `70`. `retry_required` false.

---

## Exit Criteria

DONE when the app's real isolation level is known, the anomaly is reproduced or ruled out with a recorded two-session script, errors carry SQLSTATE codes, and the chosen fix is shown to hold in a rerun.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `db_connection` resolves to a production host | **Stop**: refuse; ask for a disposable copy (`docker run -e POSTGRES_PASSWORD=x -p 5432:5432 postgres:<version>` plus schema migration). |
| Phase 2 | Session B does not block where expected | **Adjust**: the read in A was not a locking read or the rows differ; confirm with `pg_locks`. |
| Phase 2 | Anomaly does not reproduce at the app's level | **Return**: record `none` and the script; the race may be in application memory, so continue with the detector flows. |
| Phase 3 | Fix requires SERIALIZABLE but the app has no retry layer | **Adjust**: record `retry_required` and hand the retry wrapper to `race-apply-fix` as part of the same change. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
