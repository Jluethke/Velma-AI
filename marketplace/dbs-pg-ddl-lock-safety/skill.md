# PostgreSQL DDL Lock Safety

**One-line description:** Reviews every PostgreSQL migration statement for the lock it takes and whether it rewrites or scans the table, replaces each blocking form with its online recipe (`CONCURRENTLY`, `NOT VALID` plus `VALIDATE`, `CHECK` before `SET NOT NULL`, `USING INDEX`), adds `lock_timeout`, and proves on a scratch database that a held lock makes the migration fail fast instead of queueing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `migration_plan` (object[], required): Ordered steps from `dbs-expand-contract-plan`.
- `repo_path` (string, required): Repository root containing the migration files written by the tool-specific flow.
- `db_version` (string, required): PostgreSQL major version (`SHOW server_version_num`). Several recipes depend on it.

---

## Outputs

- `lock_review` (object[]): Per statement: file, statement, lock mode, rewrite or full scan (yes or no), the replacement recipe applied, and whether `lock_timeout` is set.

---

## Phase 1: Classify Each Statement

### Entry Criteria
- Migration files exist. For ORM tools, render SQL first: `alembic upgrade <a>:<b> --sql`, `python manage.py sqlmigrate <app> <n>`, Prisma `migration.sql`, Flyway and golang-migrate `.sql` files.

### Actions
1. List every DDL statement in the new migrations, one row each.
2. Classify each with this table (lock modes from the PostgreSQL documentation, "Explicit Locking" and "ALTER TABLE"):

| Statement | Lock mode | Rewrite or scan | Online recipe |
|---|---|---|---|
| `ADD COLUMN` nullable, no default | ACCESS EXCLUSIVE, brief | No | Keep; add `lock_timeout` |
| `ADD COLUMN ... DEFAULT <constant>` (PostgreSQL 11+) | ACCESS EXCLUSIVE, brief | No | Keep; add `lock_timeout` |
| `ADD COLUMN ... DEFAULT <volatile>` (`gen_random_uuid()`, `clock_timestamp()`) | ACCESS EXCLUSIVE | Rewrite | Add nullable column, backfill in batches, then `SET DEFAULT` |
| `ADD COLUMN ... GENERATED ALWAYS AS (...) STORED` | ACCESS EXCLUSIVE | Rewrite | Only on small tables, or plain column plus backfill and trigger |
| `ALTER COLUMN ... TYPE` | ACCESS EXCLUSIVE | Rewrite, except `varchar(n)` to larger `n` or to `text` | New column, dual-write, backfill, swap (expand-contract) |
| `ALTER COLUMN ... SET NOT NULL` | ACCESS EXCLUSIVE | Full scan | PostgreSQL 12+: `ADD CONSTRAINT ck CHECK (col IS NOT NULL) NOT VALID`; `VALIDATE CONSTRAINT ck`; `SET NOT NULL` (skips the scan); `DROP CONSTRAINT ck` |
| `ADD CONSTRAINT ... CHECK` | ACCESS EXCLUSIVE | Full scan | `... NOT VALID`, then `VALIDATE CONSTRAINT` (SHARE UPDATE EXCLUSIVE) in a separate transaction |
| `ADD CONSTRAINT ... FOREIGN KEY` | SHARE ROW EXCLUSIVE on both tables | Full scan | `... NOT VALID`, then `VALIDATE CONSTRAINT` in a separate transaction |
| `ADD CONSTRAINT ... UNIQUE` or `PRIMARY KEY` | ACCESS EXCLUSIVE while the index builds | Index build | `CREATE UNIQUE INDEX CONCURRENTLY ix ...`; then `ADD CONSTRAINT uq UNIQUE USING INDEX ix` |
| `CREATE INDEX` | SHARE (blocks writes) | Index build | `CREATE INDEX CONCURRENTLY` (outside a transaction) |
| `DROP INDEX` | ACCESS EXCLUSIVE | No | `DROP INDEX CONCURRENTLY` |
| `DROP COLUMN` | ACCESS EXCLUSIVE, brief | No | Contract step only; add `lock_timeout` |
| `RENAME COLUMN` or `RENAME TO` | ACCESS EXCLUSIVE, brief | No | Breaks running code; expand-contract unless the plan says no reader exists |
| `VACUUM FULL`, `CLUSTER` | ACCESS EXCLUSIVE | Rewrite | Do not run in a migration; use the `pg_repack` extension if a rewrite is required |

3. Mark every row where the online recipe differs from the statement as "replace".

### Output
Draft `lock_review`.

### Quality Gate
- Every DDL statement in the new migrations has exactly one row (count statements in the rendered SQL and rows in the review).
- Every row cites a table row above.

---

## Phase 2: Apply the Recipes and Timeouts

### Entry Criteria
- Draft review.

### Actions
1. Rewrite each "replace" row into its recipe. Put each `CONCURRENTLY` statement and each `VALIDATE CONSTRAINT` in its own migration, using the tool mechanism: Alembic `autocommit_block()`, Django `atomic = False`, Prisma one statement per file, Flyway `.sql.conf` with `executeInTransaction=false`, golang-migrate no `BEGIN`/`COMMIT`.
2. Put `SET lock_timeout = '<value>';` at the top of every migration that takes ACCESS EXCLUSIVE or SHARE ROW EXCLUSIVE. Use `SET LOCAL` inside a transaction. The value is a user input agreed with the service owner; do not invent one. Reason: even a brief ACCESS EXCLUSIVE request waits behind any open transaction on the table, and every later query on the table queues behind the waiting request.
3. Add `SET statement_timeout = '<value>';` (user input) for statements that scan, unless the recipe moved the scan to `VALIDATE`.
4. After a failed `CREATE INDEX CONCURRENTLY`, an INVALID index remains. Add to the run notes: check `SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;`, then `DROP INDEX CONCURRENTLY <name>;` and rerun.
5. Before running in production, list long transactions that would block the lock:
   ```sql
   SELECT pid, now() - xact_start AS xact_age, state, left(query, 80)
   FROM pg_stat_activity
   WHERE xact_start IS NOT NULL ORDER BY xact_start LIMIT 20;
   ```

### Output
Updated migration files and final `lock_review`.

### Quality Gate
- Zero rows remain marked "replace" without an applied recipe.
- `rg -n "lock_timeout" <new migration files>` hits every file that takes ACCESS EXCLUSIVE or SHARE ROW EXCLUSIVE.

---

## Phase 3: Prove Fail-Fast and No Rewrite on Scratch

### Entry Criteria
- Files updated. A scratch database with the current schema and some rows in each touched table.

### Actions
1. Record the table's file node: `SELECT pg_relation_filenode('orders');`.
2. In session A, hold a conflicting lock: `BEGIN; SELECT 1 FROM orders LIMIT 1;` and leave it open (holds ACCESS SHARE).
3. In session B, run the migration through its tool. It must fail with SQLSTATE `55P03` ("canceling statement due to lock timeout") within the timeout instead of hanging. While it waits, session C can see it with `SELECT pid, pg_blocking_pids(pid), left(query, 60) FROM pg_stat_activity WHERE cardinality(pg_blocking_pids(pid)) > 0;`.
4. `ROLLBACK;` session A. Rerun the migration; it succeeds.
5. Compare `pg_relation_filenode('orders')` to step 1. Equal means no rewrite. Different means a rewrite happened; find the statement and fix it.
6. Check `SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;` returns 0 rows and `SELECT conname FROM pg_constraint WHERE NOT convalidated;` lists only constraints the plan validates in a later step.

### Output
Proof log appended to `lock_review`.

### Quality Gate
- Session B failed with `55P03` while session A held its lock.
- The file node is unchanged for every table whose review row says "no rewrite".
- Invalid index query returns 0 rows.

---

## Common Mistakes To Avoid

- Do not assume a fast `ALTER TABLE` is safe without `lock_timeout`. The lock queue is the outage, not the statement.
- Do not wrap `CREATE INDEX CONCURRENTLY` in `BEGIN`. It errors.
- Do not run `VALIDATE CONSTRAINT` in the same transaction as `ADD ... NOT VALID`; that removes the benefit.
- Do not leave an INVALID index after a failed concurrent build; it costs writes and is not used for reads.

---

## Worked Example

Illustrative only. PostgreSQL 16. Plan contract step: make `customer.full_name` NOT NULL on a large table.

Phase 1: `ALTER TABLE customer ALTER COLUMN full_name SET NOT NULL;` classified ACCESS EXCLUSIVE with full scan: replace.

Phase 2: three migrations:
```sql
-- m1
SET lock_timeout = '<user value>';
ALTER TABLE customer ADD CONSTRAINT ck_customer_full_name_nn CHECK (full_name IS NOT NULL) NOT VALID;
-- m2 (own transaction)
ALTER TABLE customer VALIDATE CONSTRAINT ck_customer_full_name_nn;
-- m3
SET lock_timeout = '<user value>';
ALTER TABLE customer ALTER COLUMN full_name SET NOT NULL;
ALTER TABLE customer DROP CONSTRAINT ck_customer_full_name_nn;
```
Phase 3: with session A holding `BEGIN; SELECT 1 FROM customer LIMIT 1;`, m1 fails: `ERROR: canceling statement due to lock timeout` (55P03). After `ROLLBACK`, m1 to m3 succeed. `pg_relation_filenode('customer')` 16481 before and after.

---

## Exit Criteria

DONE when every statement has a lock classification, every blocking form is replaced by its recipe, every locking migration sets `lock_timeout`, and the fail-fast and no-rewrite checks pass on scratch.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Statement not in the table | **Adjust**: look it up in the PostgreSQL "ALTER TABLE" documentation for `db_version`, cite the lock mode, and add a row. |
| Phase 2 | No agreed `lock_timeout` value | **Return**: ask the service owner; do not ship a locking migration without one. |
| Phase 3 | Migration hangs instead of failing | **Retry**: `lock_timeout` is not applied in that session (check tool transaction handling); fix and rerun. |
| Phase 3 | File node changed | **Retry**: find the rewriting statement and use its recipe. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
