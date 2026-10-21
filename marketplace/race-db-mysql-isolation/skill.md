# MySQL InnoDB Isolation Anomaly and Deadlock Reproduction

**One-line description:** Reproduces lost updates, gap-lock and next-key-lock deadlocks and lock wait timeouts in MySQL InnoDB with two scripted `mysql` sessions at the application's real isolation level, reads `SHOW ENGINE INNODB STATUS` and `performance_schema.data_locks`, and picks the fix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the project root.
- `suspect_paths` (object[], required): From `race-symptom-triage`; rows naming transaction and query sites.
- `db_connection` (string, required): Connection details for a NON-production MySQL or MariaDB server with the same schema. Never production.

---

## Outputs

- `mysql_anomaly_report` (object): `server_version`, `isolation_level`, `anomaly` (`lost-update`, `write-skew`, `deadlock`, `lock-wait-timeout`, `none`), `session_script`, `observed_errors` (error number, SQLSTATE, text), `deadlock_section` (verbatim `LATEST DETECTED DEADLOCK`), `lock_evidence` (rows from `performance_schema.data_locks` / `data_lock_waits`), `fix`, `retry_required`.

---

## Phase 1: Find Version, Isolation Level and Transaction Shape

### Entry Criteria
- `db_connection` targets a non-production server (`SELECT @@hostname;` returns a local or test host).

### Actions
1. `SELECT VERSION();` and record it. Variable names differ: MySQL 8.0 uses `@@transaction_isolation`; MySQL 5.7 has both `tx_isolation` and `transaction_isolation` (5.7.20+); MariaDB uses `tx_isolation` (check the MariaDB docs for your version).
2. `SELECT @@GLOBAL.transaction_isolation, @@SESSION.transaction_isolation;` The InnoDB default is `REPEATABLE-READ`.
3. Application overrides: `rg -n "transaction_isolation|tx_isolation|SET TRANSACTION|isolation" "<repo_path>"`, plus ORM settings (SQLAlchemy `isolation_level`, Django `OPTIONS: {"isolation_level": "read committed"}`, Spring `@Transactional(isolation = ...)`, Hibernate `hibernate.connection.isolation`).
4. List each suspect transaction's statements. Mark reads as consistent (plain `SELECT`, reads a snapshot under REPEATABLE READ) or locking (`SELECT ... FOR UPDATE`, `SELECT ... FOR SHARE` in 8.0, `LOCK IN SHARE MODE` in older versions; these read the latest committed row and lock it).

### Output
Version, isolation level, statement lists.

### Quality Gate
- `VERSION()` and isolation level outputs are recorded.
- Each read is marked consistent or locking.

---

## Phase 2: Reproduce With Two Sessions

### Entry Criteria
- Statement lists exist.

### Actions
1. Open sessions A and B with the `mysql` client. In each: `SET SESSION TRANSACTION ISOLATION LEVEL <app level>; START TRANSACTION;`
2. Use these scripts:

| Anomaly | A | B | Result |
|---|---|---|---|
| Lost update (REPEATABLE READ) | `SELECT stock FROM item WHERE id=1;` (10) | `SELECT stock FROM item WHERE id=1;` (10) | |
| | `UPDATE item SET stock=9 WHERE id=1; COMMIT;` | `UPDATE item SET stock=9 WHERE id=1; COMMIT;` | stock 9, one sale lost. InnoDB does NOT raise an error here, unlike PostgreSQL REPEATABLE READ |
| Gap-lock deadlock on insert-if-absent | `SELECT * FROM t WHERE k=50 FOR UPDATE;` (no row; takes a gap lock) | same statement (gap locks do not conflict with each other) | |
| | `INSERT INTO t (k) VALUES (50);` (blocks on B's gap lock) | `INSERT INTO t (k) VALUES (50);` | one session gets `ERROR 1213 (40001): Deadlock found when trying to get lock; try restarting transaction` |
| Two-row deadlock | `UPDATE item SET ... WHERE id=1;` | `UPDATE item SET ... WHERE id=2;` | |
| | `UPDATE item SET ... WHERE id=2;` | `UPDATE item SET ... WHERE id=1;` | `ERROR 1213` in one session |

3. While blocked, in a third session (MySQL 8.0):
   `SELECT * FROM performance_schema.data_lock_waits\G`
   `SELECT ENGINE_TRANSACTION_ID, OBJECT_NAME, INDEX_NAME, LOCK_TYPE, LOCK_MODE, LOCK_STATUS, LOCK_DATA FROM performance_schema.data_locks;`
   `LOCK_MODE` values such as `X,GAP`, `X,REC_NOT_GAP`, `X,INSERT_INTENTION` show gap and next-key locks. On 5.7 use `information_schema.innodb_lock_waits` and `innodb_locks`. `sys.innodb_lock_waits` gives a joined view where the sys schema is installed.
4. After a deadlock: `SHOW ENGINE INNODB STATUS\G` and copy the `LATEST DETECTED DEADLOCK` section verbatim. It lists `*** (1) TRANSACTION`, `*** (1) HOLDS THE LOCK(S)`, `*** (1) WAITING FOR THIS LOCK TO BE GRANTED`, the same for (2), and `*** WE ROLL BACK TRANSACTION (n)`. Only the most recent deadlock is kept; set `innodb_print_all_deadlocks=ON` on the test server to log all of them to the error log.
5. A session that waits and then gets `ERROR 1205 (HY000): Lock wait timeout exceeded; try restarting transaction` hit `innodb_lock_wait_timeout` (documented default 50 seconds; `SELECT @@innodb_lock_wait_timeout;`). By default (`innodb_rollback_on_timeout=OFF`) only the statement is rolled back, not the transaction; the app must roll back itself.
6. Repeat the lost-update script with `SELECT ... FOR UPDATE` at the read and record that B now blocks until A commits.

### Output
`session_script`, `observed_errors`, `deadlock_section`, `lock_evidence`.

### Quality Gate
- A final `SELECT` after both sessions shows the invariant violation, or `anomaly` = `none` with the full script.
- Any deadlock has its `LATEST DETECTED DEADLOCK` section copied verbatim.

---

## Phase 3: Choose the Fix

### Entry Criteria
- Reproduction recorded.

### Actions
1. Pick the first matching row:

| Situation | Fix | Retry needed |
|---|---|---|
| Read-modify-write computable in SQL | `UPDATE item SET stock = stock - 1 WHERE id = ? AND stock > 0;` check affected rows = 1 | No |
| Read, decide in app code, write same row | `SELECT ... FOR UPDATE` at the read; lock rows in primary key order | Yes on 1213 as a backstop |
| Insert-if-absent | `UNIQUE` index plus `INSERT ... ON DUPLICATE KEY UPDATE` or `INSERT IGNORE` (check warnings), instead of `SELECT ... FOR UPDATE` on a missing row, which takes gap locks | No |
| Gap-lock deadlocks under REPEATABLE READ where phantom protection is not needed | Run that transaction at `READ COMMITTED`, which disables most gap locking for searches and index scans per the InnoDB docs | Yes on 1213 |
| Invariant spans rows | Lock all involved rows with `FOR UPDATE` in key order, or `SERIALIZABLE` for that transaction (InnoDB turns plain SELECTs into `FOR SHARE` reads when autocommit is off) | Yes on 1213 |
| Version-column compare-and-set | `UPDATE t SET ..., version = version + 1 WHERE id = ? AND version = ?`; zero affected rows means conflict | App re-reads and retries |

2. Retries re-run the whole transaction and retry only error 1213 (SQLSTATE 40001); for 1205, roll back explicitly before retrying. The retry limit is a user input or an open question.
3. Rerun the Phase 2 script with the fix applied by hand and show the invariant holding.

### Output
`mysql_anomaly_report`.

### Quality Gate
- The rerun with the fix shows the invariant holding in a final `SELECT`.
- If `retry_required`, the report names error 1213 (and 1205 handling) explicitly.

---

## Worked Example

Illustrative only.

Phase 1: `VERSION()` = `8.0.39`, `@@transaction_isolation` = `REPEATABLE-READ`. `orders/reserve.py` runs `SELECT stock`, checks in Python, then `UPDATE item SET stock = :s`.

Phase 2: lost-update script with stock 10. Final `SELECT stock FROM item WHERE id=1;` prints `9` after two sales. No error in either session.

Phase 3: row 1. `UPDATE item SET stock = stock - 1 WHERE id = 1 AND stock > 0;` reports `Rows matched: 1  Changed: 1` for each session; final stock `8`. `retry_required` false.

---

## Exit Criteria

DONE when the version and real isolation level are recorded, the anomaly is reproduced or ruled out with a two-session script, deadlocks include the verbatim InnoDB section, and the fix is shown to hold.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Connection is production | **Stop**: refuse; ask for a disposable server (`docker run -e MYSQL_ROOT_PASSWORD=x -p 3306:3306 mysql:<version>`). |
| Phase 1 | `performance_schema` disabled | **Adjust**: use `SHOW ENGINE INNODB STATUS` only, or enable `performance_schema=ON` on the test server (needs restart). |
| Phase 2 | Engine is not InnoDB (`SHOW TABLE STATUS` shows MyISAM) | **Return**: MyISAM has table locks and no transactions; report that the anomaly analysis does not apply. |
| Phase 3 | App catches 1213 and continues without retrying | **Adjust**: record it as a defect in the same report; the transaction was rolled back and its work lost. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
