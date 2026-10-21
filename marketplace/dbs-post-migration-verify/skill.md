# Post Migration Verify

**One-line description:** After a migration step runs in a real environment, proves it landed with read-only catalog queries: the version table, each new column's type and nullability, index validity, constraint validation, backfill completeness, foreign key orphans, identity headroom, and application error counts for missing columns.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `migration_plan` (object[], required): Ordered steps from `dbs-expand-contract-plan`, naming what each step should have created or changed.
- `backfill_specs` (object[], required): Backfill predicates from `dbs-expand-contract-plan`. Empty when the plan has no data steps.
- `db_engine` (string, required): `postgresql` or `mysql`.
- `verify_database_url` (string, required): Read-only connection to the environment just migrated.

---

## Outputs

- `verification_report` (object): One row per check: the query, its output, expected value, and PASS or FAIL, plus the list of follow-up actions for every FAIL.

---

## Phase 1: Structure Checks

### Entry Criteria
- The migration step reported success in its tool output.

### Actions
1. Version table shows the expected last migration (queries in `dbs-schema-drift-check` Phase 2). Expected value: the step's migration identifier.
2. For each column the step created or changed:
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_schema = '<schema>' AND table_name = '<table>' AND column_name = '<column>';
   ```
   Compare each field to the plan.
3. Indexes. PostgreSQL: `SELECT indexrelid::regclass, indisvalid, indisready FROM pg_index WHERE indrelid = '<table>'::regclass;`; every new index must show `indisvalid = t`. MySQL: `SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = '<db>' AND TABLE_NAME = '<table>' ORDER BY INDEX_NAME, SEQ_IN_INDEX;`.
4. Constraints. PostgreSQL: `SELECT conname, convalidated FROM pg_constraint WHERE conrelid = '<table>'::regclass;`. A constraint added `NOT VALID` shows `f` until its `VALIDATE` step; after that step it must show `t`. MySQL: `SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE, ENFORCED FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = '<db>' AND TABLE_NAME = '<table>';` (`ENFORCED` exists from 8.0.16).
5. PostgreSQL database-wide leftovers: `SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;` must return 0 rows.

### Output
Structure rows in `verification_report`.

### Quality Gate
- Every object the plan step names has a check row with the query output pasted.
- Zero invalid indexes (PostgreSQL).

---

## Phase 2: Data Checks

### Entry Criteria
- Structure checks run.

### Actions
1. For each `backfill_specs` row whose step has run: `SELECT count(*) FROM <table> WHERE <predicate>;` must return 0.
2. For each foreign key added with `NOT VALID` or under `foreign_key_checks=0`, count orphans:
   ```sql
   SELECT count(*) FROM <child> c
   LEFT JOIN <parent> p ON p.<pk> = c.<fk>
   WHERE c.<fk> IS NOT NULL AND p.<pk> IS NULL;
   ```
   Must return 0 before the validate step runs.
3. Identity headroom. PostgreSQL: `SELECT schemaname, sequencename, last_value, max_value, round(100.0 * last_value / max_value, 2) AS pct_used FROM pg_sequences WHERE last_value IS NOT NULL ORDER BY pct_used DESC LIMIT 10;`. MySQL: `SELECT * FROM sys.schema_auto_increment_columns ORDER BY auto_increment_ratio DESC LIMIT 10;`. Report the top rows; the alert level is a user input, not set here.
4. Run these on a replica if one exists, to keep load off the primary.

### Output
Data rows in `verification_report`.

### Quality Gate
- Every backfill predicate query returns 0, or the row is FAIL with the count.
- Every orphan query returns 0, or the row is FAIL with the count.

---

## Phase 3: Application Checks

### Entry Criteria
- Data checks run.

### Actions
1. Search application logs for the window since the migration for missing-object errors: PostgreSQL SQLSTATE `42703` (undefined column) and `42P01` (undefined table); MySQL error `1054` (unknown column) and `1146` (table does not exist). Record the count and the query used in the log tool.
2. Search the database log (PostgreSQL `log_lock_waits` entries "still waiting for", if enabled) for lock waits during the migration window. Record the count.
3. For each new index, record its usage after a window the user sets: PostgreSQL `SELECT indexrelname, idx_scan FROM pg_stat_user_indexes WHERE relname = '<table>';`; MySQL `SELECT * FROM sys.schema_unused_indexes WHERE object_name = '<table>';`. An index still unused after the window goes back to `dbs-index-from-access-patterns` for review; do not drop it from this flow.
4. Mark each row PASS or FAIL and list a follow-up for each FAIL.

### Output
`verification_report`.

### Quality Gate
- Missing-object error count is recorded with the log query. Any nonzero count is FAIL.
- Every row has PASS or FAIL and pasted output.

---

## Common Mistakes To Avoid

- Do not report the step verified because the migration tool printed success. Run the catalog queries.
- Do not use a read-write role for verification.
- Do not drop an unused index or fix a FAIL from this flow. Report it.
- Do not run the orphan query against the primary during peak traffic if a replica exists.

---

## Worked Example

Illustrative only. PostgreSQL. Step 6 of the plan: `full_name` NOT NULL and `name` dropped.

Phase 1: `alembic_version` = `c9d8e7f6a5b4` (expected). `full_name | text | NO | null`: PASS. `name` absent from `information_schema.columns`: PASS. Invalid index query: 0 rows.

Phase 2: `SELECT count(*) FROM customer WHERE full_name IS NULL AND name IS NOT NULL;` cannot run because `name` no longer exists; the check was run before step 6 and returned 0; recorded with timestamp. Top sequence `orders_id_seq` at 0.41 pct used.

Phase 3: log search for `42703` since deploy: 0 hits. `ix_orders_cust_created_open idx_scan` = 18,204 after the user's window. All PASS.

---

## Exit Criteria

DONE when every object, constraint, backfill, and foreign key the plan step touches has a read-only check with pasted output, application error counts are recorded, and every FAIL has a follow-up.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Version table shows an earlier migration | **Stop**: the step did not run; do not proceed to the next plan step. |
| Phase 1 | Invalid index present | **Return**: hand to `dbs-pg-ddl-lock-safety` to drop and rebuild concurrently. |
| Phase 2 | Backfill predicate returns rows | **Return**: rerun the backfill from `START_ID=0`; check the dual-write. |
| Phase 3 | Missing-column errors in app logs | **Stop**: halt further plan steps; roll the app back per `dbs-rollback-plan`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
