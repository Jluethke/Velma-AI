# Schema Ownership Split

**One-line description:** Moves the candidate's owned tables into their own schema (PostgreSQL) or database (MySQL) on the same server first, with compatibility views, a dedicated database role and revoked grants that make any remaining cross-module access fail loudly, and drops cross-boundary foreign keys only after the facade enforces them, before any physical move to a separate server.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `table_ownership` (object[], required): From `mex-table-ownership-map`.
- `shared_tables` (object[], required): From `mex-table-ownership-map`.
- `database_engine` (string, required): `postgres`, `mysql` or `other`.
- `module_interface` (object, required): From `mex-interface-boundary-contract`.
- `deployment_decision` (string, required): From `mex-in-process-or-service-decision`.

---

## Outputs

- `schema_split_plan` (object): Ordered steps (logical move, role and grants, compatibility views, FK removal, physical move decision), each with its migration file, rollback statement and verification query; plus `target_location` (`same_server_schema` or `separate_server`).
- `migration_scripts` (object[]): Migration file paths in the project's migration tool, each with forward and rollback SQL.

---

## Phase 1: Preconditions

### Entry Criteria
- `shared_tables` has no `written_by_both` rows. If it has, stop: the writes must first move behind the facade.

### Actions
1. Find the project's migration tool and use it for every change: Django migrations (`RunSQL` with `reverse_sql`), Alembic (`op.execute`), Flyway (`V<n>__name.sql` plus an undo script if the edition supports it), Liquibase changesets with `rollback`, Rails migrations, golang-migrate (`up.sql` and `down.sql`), Prisma migrate. Do not apply raw SQL to a shared environment outside the tool.
2. List every remaining reader of each owned table outside the candidate from `table_ownership.readers`. Each must be either routed through the facade already or listed here as `needs_compat_view`.
3. Take a schema dump to compare later: PostgreSQL `pg_dump --schema-only -t 'invoices*' -t payments "$DB" > /tmp/mex_before.sql`; MySQL `mysqldump --no-data app invoices invoice_lines payments > /tmp/mex_before.sql`.

### Output
Migration tool chosen, reader list, schema dump.

### Quality Gate
- `grep -c written_by_both` over `shared_tables` is zero.
- `/tmp/mex_before.sql` is non-empty.

---

## Phase 2: Logical Move with Grants

### Entry Criteria
- Preconditions met.

### Actions
1. PostgreSQL (one migration per step):
   ```sql
   CREATE SCHEMA billing;
   ALTER TABLE public.invoices SET SCHEMA billing;            -- moves indexes, constraints and owned sequences too
   CREATE VIEW public.invoices AS SELECT * FROM billing.invoices;  -- only if needs_compat_view
   CREATE ROLE billing_app LOGIN;   -- password set outside the migration, from the secret store
   GRANT USAGE ON SCHEMA billing TO billing_app;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA billing TO billing_app;
   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA billing TO billing_app;
   REVOKE ALL ON ALL TABLES IN SCHEMA billing FROM monolith_app;
   ```
   Rollback: `ALTER TABLE billing.invoices SET SCHEMA public;` after dropping the view. A simple single-table view is automatically updatable in PostgreSQL, so legacy writes through it keep working until revoked.
2. MySQL: a database is the schema. `CREATE DATABASE billing;` then `RENAME TABLE app.invoices TO billing.invoices;` (same server only; triggers on the table block the rename across databases, check `SHOW TRIGGERS LIKE 'invoices'` first). Compatibility: `CREATE VIEW app.invoices AS SELECT * FROM billing.invoices;`. Grants: `GRANT SELECT, INSERT, UPDATE, DELETE ON billing.* TO 'billing_app'@'%';` and revoke the monolith user's privileges on `billing.*`.
3. `other` engine: read the engine's docs for schema or database namespaces and grants; record the doc section used.
4. Point the candidate's code at the new connection or role (`search_path` in PostgreSQL via the role's connection string or `ALTER ROLE billing_app SET search_path = billing;`; a separate DSN in MySQL).
5. Run the full test suite and the characterization suite against a database migrated with these scripts.

### Output
Migrations for the logical move.

### Quality Gate
- As the monolith role, a direct query fails: PostgreSQL `SET ROLE monolith_app; SELECT 1 FROM billing.invoices LIMIT 1;` returns `permission denied`; MySQL the same check as the monolith user returns error 1142.
- Full test suite and characterization suite pass.

---

## Phase 3: Foreign Keys and Physical Move Decision

### Entry Criteria
- Logical move deployed and stable in the target environment.

### Actions
1. For each `cross_fk` in `shared_tables`: confirm the facade validates existence (for example `create_invoice` rejects an unknown `order_id` via the order lookup port and the contract tests cover it). Then drop the constraint in its own migration: `ALTER TABLE billing.invoices DROP CONSTRAINT invoices_order_id_fkey;` (MySQL `ALTER TABLE billing.invoices DROP FOREIGN KEY <name>;`). Keep the column and its index.
2. Add an orphan check to run after the drop, scheduled or in reconciliation: `SELECT COUNT(*) FROM billing.invoices i LEFT JOIN public.orders o ON o.id = i.order_id WHERE o.id IS NULL;` must stay at the pre-drop value.
3. Decide `target_location`: if `deployment_decision` is `in_process`, stay `same_server_schema`. If `service`, a separate server is needed only when a driver from the decision (scaling, isolation, compliance) requires it; otherwise stay on the same server with separate roles. A separate server requires data sync: go to `mex-dual-write-or-cdc-decision`.
4. Remove each compatibility view once its last reader moves to the facade, one view per migration.

### Output
`schema_split_plan`, `migration_scripts`.

### Quality Gate
- Every `cross_fk` drop is preceded by a contract test that exercises the existence check.
- The orphan count query result is recorded before and after each drop.

---

## Worked Example

Illustrative. PostgreSQL, Django.

```
$ python manage.py makemigrations billing --empty -n move_to_billing_schema
# migration uses RunSQL(sql=[...], reverse_sql=[...])
$ python manage.py migrate billing
$ psql "$DB" -c "SET ROLE monolith_app; SELECT 1 FROM billing.invoices LIMIT 1;"
ERROR:  permission denied for schema billing
$ pytest -q
1196 passed, 3 skipped in 144.80s
```
Orphan check before dropping `invoices_order_id_fkey`: `0`; after one week: `0`. `target_location = separate_server` because the PCI driver requires the billing database outside the shared cluster.

---

## Exit Criteria

DONE when owned tables live in their own schema or database, the monolith role cannot touch them, cross-boundary foreign keys are replaced by tested facade checks, and the physical location is decided.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Any `written_by_both` table | **Stop**: move writes behind the facade first. |
| Phase 2 | ORM hardcodes `public.` schema or database name | **Adjust**: set the schema in the model metadata (`db_table`, `__table_args__ = {"schema": "billing"}`, `@Table(schema=...)`) in its own commit. |
| Phase 2 | Permission denied for the candidate itself after revoke | **Retry**: missing sequence or schema `USAGE` grant; add it in a new migration. |
| Phase 3 | Orphan count rises after FK drop | **Stop**: a write path bypasses the facade; find it in `pg_stat_statements` or the digest table before continuing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
