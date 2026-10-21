# PostgreSQL Migration Lock and Rewrite Review

**One-line description:** Renders the SQL of every migration in the PR, checks each statement against PostgreSQL's documented lock levels and table-rewrite rules, runs the squawk migration linter, and requires the safe pattern for each risky operation (concurrent index builds, NOT VALID constraints, expand and contract renames, lock_timeout).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Local clone with the PR head checked out.
- `changed_files` (object[], required): Rename-aware file list.
- `findings_dir` (string, required): Findings directory.
- `database_url` (string, optional): Non-production PostgreSQL connection string, used only to read the server version and table sizes.

---

## Outputs

- `migration_findings` (object[]): One finding per risky statement with lock level and safe alternative, written to `<findings_dir>/prr-pg-migration-lock-review.json`.

---

## Phase 1: Render Migration SQL

### Entry Criteria
- At least one changed file is a migration: under `migrations/`, `alembic/versions/`, `db/migrate/`, `prisma/migrations/`, `flyway`/`db/migration` (`V*__*.sql`), or `*.sql` in a migrations directory.

### Actions
1. Get the SQL each migration will run:

| Framework | Command |
|---|---|
| Django | `python manage.py sqlmigrate <app_label> <migration_name>` |
| Alembic | `alembic upgrade <down_revision>:<revision> --sql` (offline mode prints SQL) |
| Rails | read the migration; `strong_migrations` gem reports unsafe operations if installed (`bin/rails db:migrate` on a scratch DB) |
| Prisma | read `prisma/migrations/<name>/migration.sql` |
| Flyway, raw SQL | read the `.sql` file |

2. Record the PostgreSQL major version: `psql "<database_url>" -Atc 'show server_version'` if `database_url` is given, else ask; several rules below depend on it.
3. Note whether each migration runs inside a transaction (Django and Alembic do by default; Flyway does per script on PostgreSQL).

### Output
SQL per migration, server version, transaction mode.

### Quality Gate
- Every migration file in `changed_files` has rendered SQL.
- The PostgreSQL major version is recorded or listed as an open question.

---

## Phase 2: Check Each Statement Against the Lock Table

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Run squawk if available: `squawk <file>.sql` (pipe rendered SQL into a temp file first). Its rule names (for example `require-concurrent-index-creation`, `adding-not-nullable-field`, `constraint-missing-not-valid`, `renaming-column`, `changing-column-type`) map to the rows below. Check `squawk --help` for options.
2. Check every statement by hand with this table (lock levels from the PostgreSQL documentation, "Explicit Locking" and `ALTER TABLE`):

| Statement | Lock and cost | Safe pattern |
|---|---|---|
| `CREATE INDEX` | `SHARE` lock: blocks writes for the whole build | `CREATE INDEX CONCURRENTLY`, outside a transaction. Django: `AddIndexConcurrently` with `atomic = False`; Alembic: `postgresql_concurrently=True` inside `with op.get_context().autocommit_block():`; Rails: `algorithm: :concurrently` with `disable_ddl_transaction!` |
| `DROP INDEX` | `ACCESS EXCLUSIVE` | `DROP INDEX CONCURRENTLY` |
| `ADD COLUMN ... DEFAULT <constant>` | Metadata only on PostgreSQL 11+ | Fine on 11+; on 10 and older it rewrites the table |
| `ADD COLUMN ... DEFAULT <volatile>` (`now()` is stable and fine; `clock_timestamp()`, `random()`, `gen_random_uuid()` are volatile) | Rewrites the whole table under `ACCESS EXCLUSIVE` | Add the column without default, backfill in batches, then set the default |
| `ALTER COLUMN ... SET NOT NULL` | Scans the table under `ACCESS EXCLUSIVE` | PostgreSQL 12+: add `CHECK (col IS NOT NULL) NOT VALID`, `VALIDATE CONSTRAINT`, then `SET NOT NULL` (skips the scan), then drop the check |
| `ADD CONSTRAINT ... FOREIGN KEY` or `CHECK` | Validates all rows while holding locks | `ADD CONSTRAINT ... NOT VALID`, then `VALIDATE CONSTRAINT` in a separate statement (`SHARE UPDATE EXCLUSIVE`, does not block writes) |
| `ALTER COLUMN ... TYPE` | Usually a full rewrite under `ACCESS EXCLUSIVE` (some binary-coercible changes, such as increasing `varchar(n)` length, skip it) | New column, dual write, backfill, switch reads, drop old |
| `RENAME COLUMN` / `RENAME TABLE` | Fast, but running application code still uses the old name | Expand and contract: add new, dual write, migrate reads, drop old in a later release |
| `DROP COLUMN` | Fast, but old code still selecting it fails | Remove all code references in an earlier deploy first (Django: deploy code without the field before the migration; Rails: `self.ignored_columns`) |
| Data backfill `UPDATE big_table SET ...` in one statement | Long transaction, row locks, bloat | Batch by primary key ranges in separate transactions |

3. Every `ACCESS EXCLUSIVE` statement waits behind long-running queries and blocks everything queued after it. Check that the migration sets `SET lock_timeout = '<value>'` before such statements. The value is a team decision; if the project has none, raise a question instead of picking one.

### Output
Per-statement lock level and risk.

### Quality Gate
- Every statement in the rendered SQL has a table row or "no lock concern" recorded.
- squawk output is recorded, or "squawk not available".

---

## Phase 3: Size Context and Findings

### Entry Criteria
- Phase 2 complete.

### Actions
1. If `database_url` is given, read approximate table sizes: `SELECT relname, reltuples::bigint, pg_size_pretty(pg_total_relation_size(oid)) FROM pg_class WHERE relname IN (<tables>)`.
2. Label:

| Situation | Label |
|---|---|
| Rewrite, full scan, or write-blocking index build on a table that receives production writes | blocking |
| Rename or drop without the expand and contract steps | blocking |
| Same operations on a table created in this same PR (empty) | none |
| Missing `lock_timeout` before an `ACCESS EXCLUSIVE` statement | question if the project has no policy, blocking if it does |

3. Write `<findings_dir>/prr-pg-migration-lock-review.json` (fields `flow`, `category`="migration", `file`, `line`, `evidence` = the SQL statement and lock level, `proposed_label`, `fix` = the safe pattern with framework syntax) and validate with `python -m json.tool`.

### Output
`migration_findings`.

### Quality Gate
- Every blocking finding names the lock level and the safe pattern.
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. Django migration `orders/migrations/0042_order_status_idx.py` adds an index and a non-null column.

- Phase 1: `python manage.py sqlmigrate orders 0042` prints:
  ```
  BEGIN;
  ALTER TABLE "orders_order" ADD COLUMN "region" varchar(8) DEFAULT 'us' NOT NULL;
  ALTER TABLE "orders_order" ALTER COLUMN "region" DROP DEFAULT;
  CREATE INDEX "orders_order_status_idx" ON "orders_order" ("status");
  COMMIT;
  ```
  `show server_version` prints `15.6`.
- Phase 2: the `ADD COLUMN` with a constant default is metadata only on 15. `CREATE INDEX` without `CONCURRENTLY` blocks writes. squawk reports `require-concurrent-index-creation`. No `lock_timeout`.
- Phase 3: `orders_order` has `reltuples` 398326 and receives writes: blocking, fix "use `AddIndexConcurrently` from `django.contrib.postgres.operations` in a migration with `atomic = False`".

---

## Exit Criteria

DONE when every migration's SQL is rendered, every statement is matched to its lock level and rewrite behavior for the recorded PostgreSQL version, and every risky statement is a finding with the framework-specific safe pattern.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `sqlmigrate` needs a database connection that is unavailable | **Adjust**: read the migration operations and map each to SQL by hand, marked as unverified. |
| Phase 1 | PostgreSQL version unknown | **Adjust**: apply the stricter (older version) rule and add a question for the version. |
| Phase 2 | Statement not in the table | **Adjust**: look up its lock level in the PostgreSQL `ALTER TABLE` documentation for that version and cite the section. |
| Phase 3 | Table size unknown | **Adjust**: treat the table as large if it receives production writes. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
