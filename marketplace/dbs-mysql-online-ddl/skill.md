# MySQL Online DDL

**One-line description:** Classifies every MySQL 8 InnoDB migration statement by the algorithm it can use (INSTANT, INPLACE, COPY), pins `ALGORITHM` and `LOCK` clauses so MySQL refuses a heavier mode instead of silently taking it, sets `lock_wait_timeout` for the metadata lock, and routes table-copy changes to gh-ost or pt-online-schema-change with a dry run first.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `migration_plan` (object[], required): Ordered steps from `dbs-expand-contract-plan`.
- `repo_path` (string, required): Repository root containing the migration files.
- `db_version` (string, required): Exact MySQL version from `SELECT VERSION();`. INSTANT support differs between 8.0 minor releases.

---

## Outputs

- `online_ddl_review` (object[]): Per statement: file, statement, algorithm achieved, lock, rebuild (yes or no), tool used (native, gh-ost, pt-online-schema-change), and the proof command output.

---

## Phase 1: Classify Each Statement

### Entry Criteria
- Migration files exist; render ORM migrations to SQL first.

### Actions
1. List every `ALTER TABLE`, `CREATE INDEX`, and `DROP INDEX` statement.
2. Classify with this table (from the MySQL 8.0 Reference Manual, "Online DDL Operations"; confirm the row for your exact `db_version`):

| Operation | Best algorithm | Notes |
|---|---|---|
| Add column | INSTANT (8.0.12+ as last column; 8.0.29+ any position) | Not INSTANT on tables with a `FULLTEXT` index or in `ROW_FORMAT=COMPRESSED` |
| Drop column | INSTANT from 8.0.29; INPLACE with rebuild before | |
| Rename column | INSTANT from 8.0.28; INPLACE before | Still breaks running code; expand-contract |
| Set or drop column default | INSTANT | |
| Extend `VARCHAR` length | INPLACE, no rebuild, while the length prefix stays 1 byte (up to 255 bytes) or stays 2 bytes | Crossing 255 bytes needs COPY |
| Change column type | COPY | Use gh-ost or pt-online-schema-change |
| Make column NOT NULL or NULL | INPLACE with rebuild | |
| Add secondary index | INPLACE, `LOCK=NONE`, no rebuild | |
| Drop index | INPLACE, metadata only | |
| Add foreign key | INPLACE only with `foreign_key_checks=0`; otherwise COPY | |
| Change character set | COPY | |

3. INSTANT operations add a row version; the manual documents a per-table limit (64 row versions in 8.0.29+). Check headroom: `SELECT NAME, TOTAL_ROW_VERSIONS FROM INFORMATION_SCHEMA.INNODB_TABLES WHERE NAME = '<db>/<table>';`.

### Output
Draft `online_ddl_review`.

### Quality Gate
- Every statement has a row naming the best algorithm and the manual row used.

---

## Phase 2: Pin Algorithm and Lock

### Entry Criteria
- Draft review.

### Actions
1. Append the clause to each native statement: `ALTER TABLE orders ADD COLUMN note VARCHAR(200) NULL, ALGORITHM=INSTANT;` or `..., ALGORITHM=INPLACE, LOCK=NONE;`. With the clause, MySQL returns an error such as "ALGORITHM=INSTANT is not supported for this operation. Try ALGORITHM=COPY/INPLACE." instead of quietly copying the table.
2. Put `SET SESSION lock_wait_timeout = <value>;` before each statement. Every ALTER needs an exclusive metadata lock at start and end; it waits behind open transactions, and later queries queue behind it. The value is a user input; the server default is 31536000 seconds (one year), which is why it must be set.
3. One DDL statement per migration file. MySQL DDL commits implicitly and cannot be rolled back as a group.
4. For COPY-only operations on tables in use, choose a tool:

| Condition | Tool |
|---|---|
| Table has no foreign keys (in or out), `binlog_format=ROW` | gh-ost |
| Table has foreign keys, or triggers are acceptable | pt-online-schema-change with `--alter-foreign-keys-method` chosen deliberately |
| Table is small enough that the service owner accepts the COPY lock (user decision with row count) | Native `ALGORITHM=COPY` in a maintenance window |

5. gh-ost commands, dry run first (gh-ost is a no-op without `--execute`):
   ```
   gh-ost --host=<replica> --user=<u> --ask-pass --database=app --table=orders \
     --alter="MODIFY COLUMN amount DECIMAL(14,2) NOT NULL" \
     --max-lag-millis=<user value> --chunk-size=<user value> \
     --postpone-cut-over-flag-file=/tmp/ghost.postpone --verbose
   ```
   Then rerun with `--execute`; delete the postpone file when ready to cut over. Use `--allow-on-master` only when connecting to the primary deliberately.
6. pt-online-schema-change, dry run first:
   ```
   pt-online-schema-change --alter "MODIFY COLUMN amount DECIMAL(14,2) NOT NULL" \
     D=app,t=orders,h=<primary>,u=<u> --ask-pass --dry-run
   ```
   Then `--execute`. Its `--max-load` and `--critical-load` defaults (`Threads_running=25` and `Threads_running=50`, per the tool documentation) pause or abort the copy; override only with user values.

### Output
Updated migration files and tool commands.

### Quality Gate
- Every native statement carries an explicit `ALGORITHM=` clause (`rg -n "ALGORITHM=" <files>` count equals native statement count).
- Every migration file has one DDL statement and a `lock_wait_timeout` line.
- Every tool-run change has a recorded dry-run output.

---

## Phase 3: Prove on a Scratch Server

### Entry Criteria
- Files updated; scratch MySQL of the same version with rows in each touched table.

### Actions
1. Run each native statement through the migration tool. Each must succeed with its pinned algorithm; an error about an unsupported algorithm means the classification was wrong.
2. Metadata-lock fail-fast test: in session A run `START TRANSACTION; SELECT * FROM orders LIMIT 1;` and leave it open. In session B run the migration. It must fail with error 1205 "Lock wait timeout exceeded" within the timeout. Session C sees it waiting in `SELECT * FROM performance_schema.metadata_locks WHERE OBJECT_NAME = 'orders';` or `SHOW PROCESSLIST` state "Waiting for table metadata lock". `ROLLBACK` session A and rerun.
3. After INSTANT changes, recheck `TOTAL_ROW_VERSIONS`.

### Output
`online_ddl_review` with proof.

### Quality Gate
- Every native statement succeeded with its pinned algorithm.
- Session B failed with error 1205 while session A held its transaction.

---

## Common Mistakes To Avoid

- Do not omit `ALGORITHM=`. Without it MySQL picks the best it can, including a full table copy, without telling you.
- Do not run gh-ost on a table with foreign keys; it does not support them.
- Do not leave `lock_wait_timeout` at the server default for migrations.
- Do not put several DDL statements in one migration file on MySQL.

---

## Worked Example

Illustrative only. MySQL 8.0.36. Plan step: add `orders.note`.

Phase 1: add column, last position: INSTANT. `TOTAL_ROW_VERSIONS` = 2.

Phase 2:
```sql
SET SESSION lock_wait_timeout = <user value>;
ALTER TABLE orders ADD COLUMN note VARCHAR(200) NULL, ALGORITHM=INSTANT;
```
Phase 3: applies in milliseconds. With session A holding `START TRANSACTION; SELECT * FROM orders LIMIT 1;`, session B fails: `ERROR 1205 (HY000): Lock wait timeout exceeded; try restarting transaction`. After `ROLLBACK`, it applies. `TOTAL_ROW_VERSIONS` = 3.

---

## Exit Criteria

DONE when every statement is classified against the manual for the exact version, native statements pin their algorithm with a metadata lock timeout, copy-only changes go through gh-ost or pt-online-schema-change after a dry run, and the fail-fast test passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Operation not in the table | **Adjust**: find it in the manual's Online DDL tables for `db_version` and add a row. |
| Phase 2 | `ALGORITHM=INSTANT is not supported` | **Adjust**: try `ALGORITHM=INPLACE, LOCK=NONE`; if that fails, route to gh-ost or pt-online-schema-change. |
| Phase 2 | gh-ost reports `binlog_format` is not ROW | **Adjust**: use pt-online-schema-change, or have the DBA change the format; do not force it. |
| Phase 3 | Row versions at the documented limit | **Adjust**: the next INSTANT change fails; schedule a rebuild (`ALTER TABLE ... ENGINE=InnoDB` through gh-ost) first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
