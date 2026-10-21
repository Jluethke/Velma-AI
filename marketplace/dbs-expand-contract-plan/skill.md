# Expand Contract Plan

**One-line description:** Diffs the target schema against the current schema, classifies each change by whether it can break the running application, and orders the work into expand, data migration, and contract steps, each tied to the application release that must be live before or after it, so no deploy needs downtime.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_ddl` (string, required): Target schema DDL from `dbs-index-from-access-patterns`, or written by the user.
- `current_schema_dump` (string, optional): Path to a schema-only dump of production: `pg_dump --schema-only --no-owner --no-privileges` or `mysqldump --no-data --routines --triggers`. Absent for a brand-new database.
- `db_engine` (string, required): `postgresql` or `mysql`.

---

## Outputs

- `migration_plan` (object[]): Ordered steps. Each: step number, phase (`expand`, `migrate-data`, `contract`), exact DDL or data operation, the app release that must be deployed before it runs, the app release that may deploy only after it runs, and the check that must pass before the next step.
- `backfill_specs` (object[]): For each `migrate-data` step: table, key column, target column, source expression, "not yet done" predicate.

---

## Phase 1: Diff and Classify

### Entry Criteria
- `target_ddl` present. If `current_schema_dump` is absent, the plan is one `expand` step that creates everything; record that and skip to Phase 3.

### Actions
1. Load both schemas into two disposable databases and diff them. Tools, any one: `migra` for PostgreSQL (`migra postgresql://.../current postgresql://.../target`, note that migra is no longer maintained and may lag new server versions), `atlas schema diff --from <url> --to <url>`, or `diff` of two `pg_dump --schema-only` outputs. Record the tool used.
2. Classify every change with this table:

| Change | Breaks old app code? | Pattern |
|---|---|---|
| Add table | No | Single expand step |
| Add nullable column, or column with a constant default | No (unless old code does `INSERT` without a column list) | Single expand step |
| Add index | No | Single expand step, built online |
| Add NOT NULL to an existing column | Yes for writers that send NULL | Backfill, then constraint (see lock-safety flow) |
| Add foreign key or CHECK to a populated table | Yes for writers that violate it | Add unvalidated, fix data, validate |
| Rename column or table | Yes | Add new, dual-write, backfill, switch reads, stop old writes, drop old |
| Change column type | Usually (rewrite plus code) | New column, dual-write, backfill, switch, drop old |
| Move a column to another table | Yes | New table, dual-write, backfill, switch, drop old |
| Drop column or table | Yes for code that still references it | Remove from code first, deploy, then contract |

3. Search the codebase for `INSERT INTO <table> VALUES` with no column list and `SELECT *` mapped to positional structs. Record each hit; these break on column add or drop and must be fixed first.

### Output
Classified change list.

### Quality Gate
- Every difference reported by the diff tool appears exactly once in the classified list (count both).
- Every change has a pattern from the table.

---

## Phase 2: Order the Steps

### Entry Criteria
- Classified list.

### Actions
1. Apply the deploy rule: during a rolling deploy the old and new app versions run at the same time, so every schema state must work with both. Expand migrations run before the app release that uses them. Contract migrations run after the release that stopped using the old shape is fully deployed everywhere.
2. Expand a rename of `customer.name` to `customer.full_name` into exactly these steps:

| Step | Phase | Operation | App release requirement |
|---|---|---|---|
| 1 | expand | `ADD COLUMN full_name text` (nullable) | before release R1 |
| 2 | app R1 | Write both `name` and `full_name`; read `name` | deployed after step 1 |
| 3 | migrate-data | Backfill `full_name = name WHERE full_name IS NULL` in batches | after R1 fully deployed |
| 4 | app R2 | Read `full_name`; still write both | after step 3 verified |
| 5 | app R3 | Write only `full_name`; remove `name` from the ORM model | after R2 fully deployed |
| 6 | contract | Add NOT NULL to `full_name` if required; `DROP COLUMN name` | after R3 fully deployed |

3. ORM "stop referencing" step for the contract, by stack: Django: remove the field with `migrations.SeparateDatabaseAndState(state_operations=[RemoveField(...)], database_operations=[])` in R3, drop the column in a later migration. SQLAlchemy: delete the mapped attribute; SQLAlchemy selects only mapped columns. Prisma: delete the field from `schema.prisma` and run `prisma generate`; create the drop migration in a later release. Hibernate or JPA: delete the field mapping. Raw SQL: grep for the column name and remove every use.
4. Dual-write by database trigger is an alternative to app dual-write when several apps write the table. Record which one is used per step.
5. Each step gets its own migration file. Never combine an expand and its contract in one file.
6. Write the gate check between steps (for example "`SELECT count(*) FROM customer WHERE full_name IS NULL AND name IS NOT NULL` returns 0" before step 4).

### Output
`migration_plan`.

### Quality Gate
- Every contract step lists the release after which it runs, and that release removes all references found by `rg -n "<old_name>" <repo>`.
- Every step after a `migrate-data` step has a gate query with an expected result.

---

## Phase 3: Emit Backfill Specs

### Entry Criteria
- `migration_plan` ordered.

### Actions
1. For each `migrate-data` step write: table, key column (primary key used for batching), target column, source expression, and the "not yet done" predicate (`full_name IS NULL AND name IS NOT NULL`).
2. Confirm the predicate is false for every row after a full backfill, so the backfill is idempotent and can be restarted.
3. Emit `migration_plan` and `backfill_specs`.

### Output
`migration_plan`, `backfill_specs`.

### Quality Gate
- One `backfill_specs` row per `migrate-data` step.
- Every predicate references the target column so a rerun skips finished rows.

---

## Common Mistakes To Avoid

- Do not rename a column in one migration on a live system. Old app instances will fail on every query that names it.
- Do not drop a column in the same release that stops using it. Instances of the previous release are still running.
- Do not put the backfill inside the expand migration. Migration tools wrap files in one transaction; a large update holds locks and bloats the table.
- Do not mark a step done because the migration file was written. A step is done when its gate query passes.

---

## Worked Example

Illustrative only. PostgreSQL. `current_schema_dump` has `customer.name text NOT NULL`; `target_ddl` has `customer.full_name text NOT NULL` and a new index `ix_orders_cust_created_open`.

Phase 1: `migra` reports `alter table customer drop column name; alter table customer add column full_name text not null; create index ix_orders_cust_created_open ...`. Classified: rename (pattern rename) and add index (single expand). `rg -n "INSERT INTO customer VALUES" app/` returns 0.

Phase 2: plan steps 1 to 6 from the rename table, plus step 1b expand "create index online". Gate after step 3: null-count query returns 0.

Phase 3: `backfill_specs` = [{table: customer, key: id, target: full_name, source: name, predicate: "full_name IS NULL AND name IS NOT NULL"}].

---

## Exit Criteria

DONE when every schema difference maps to ordered steps with release requirements and gate checks, and every data step has an idempotent backfill spec.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Diff tool fails on the server version | **Adjust**: diff `pg_dump --schema-only` or `mysqldump --no-data` text outputs with `diff -u`, and record it. |
| Phase 1 | Diff shows drop plus add where a rename is meant | **Adjust**: classify as rename; never accept drop plus add for a column with data. |
| Phase 2 | Several services write the table and cannot release together | **Adjust**: use a trigger for dual-write and record the trigger as a contract-step removal. |
| Phase 3 | No single-column key to batch on | **Return**: report it; `dbs-pg-batched-backfill` or `dbs-mysql-batched-backfill` needs an ordered key. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
