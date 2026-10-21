# Seed Data

**One-line description:** Separates reference data that every environment needs from development sample data and test fixtures, loads reference data through idempotent upserts in migrations, loads sample data through a seed command that refuses to run in production, and proves both are safe to run twice.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `constrained_schema` (object, required): Schema with constraints from `dbs-constraints-foreign-keys`.
- `repo_path` (string, required): Repository root.
- `migration_tool` (string, required): `alembic`, `django`, `prisma`, `flyway`, or `golang-migrate`.
- `db_engine` (string, required): `postgresql` or `mysql`.
- `reference_data` (object, optional): Lists of rows the application cannot run without (roles, currencies, order statuses), with their source (ISO standard, product spec).

---

## Outputs

- `seed_files` (string[]): Paths of reference-data migrations and development seed scripts created, each tagged `reference` or `dev-sample`.

---

## Phase 1: Classify the Data

### Entry Criteria
- `constrained_schema` present.

### Actions
1. Sort every set of initial rows into one class:

| Class | Example | Where it lives | Runs in production |
|---|---|---|---|
| Reference data | Roles, ISO 4217 currencies, status lookup rows referenced by foreign keys | A migration | Yes |
| Development sample data | Fake customers and orders for local work | A seed script | Never |
| Test fixtures | Rows a single test needs | The test itself, through a factory (`factory_boy`, `@faker-js/faker` with a builder, Go test helpers) | Never |

2. Reference data must have a stable natural key (`code`) so upserts can find existing rows. If a table has only a surrogate key, add a unique natural key first (back to `dbs-constraints-foreign-keys`).
3. Record the source for each reference list (for example "ISO 4217 list, version date"). Do not type lists from memory when a standard exists; copy from the standard's published file.

### Output
Classified data sets.

### Quality Gate
- Every data set has exactly one class.
- Every reference table has a unique natural key in `constrained_schema`.

---

## Phase 2: Write Idempotent Loaders

### Entry Criteria
- Classes set.

### Actions
1. Reference data SQL, by engine:
   - PostgreSQL: `INSERT INTO currency (code, name, minor_units) VALUES ('EUR','Euro',2), ('JPY','Yen',0) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, minor_units = EXCLUDED.minor_units;`
   - MySQL 8.0.19+: `INSERT INTO currency (code, name, minor_units) VALUES (...) AS new ON DUPLICATE KEY UPDATE name = new.name, minor_units = new.minor_units;` (older 8.0 uses `VALUES(name)`, deprecated).
2. Put reference SQL in a migration by tool: Alembic `op.execute(...)` in a revision; Django `RunPython` using `apps.get_model(...).objects.update_or_create(code=..., defaults={...})` with a reverse; Prisma a hand-written `migration.sql` from `migrate dev --create-only`; Flyway a `V` file (or `R__reference_data.sql` if the whole list is rewritten idempotently each time); golang-migrate an up file with a down file that deletes those codes.
3. Explicit IDs in PostgreSQL: a `GENERATED ALWAYS AS IDENTITY` column rejects explicit values unless the insert says `OVERRIDING SYSTEM VALUE`. After inserting explicit IDs into any identity or serial column, reset the sequence: `SELECT setval(pg_get_serial_sequence('role','id'), (SELECT max(id) FROM role));`. Prefer natural keys to avoid this.
4. Development sample data, by tool:
   - Django: fixture JSON loaded with `python manage.py loaddata dev_sample.json`, or a management command.
   - Prisma: `prisma/seed.ts` using `upsert`, run with `npx prisma db seed`; the seed command is configured in `package.json` under `"prisma": {"seed": "..."}` or in `prisma.config.ts` depending on version (check the Prisma docs for the installed version).
   - Alembic, golang-migrate: a separate script or Go command (`cmd/seed`), not a migration.
   - Flyway: a separate location (for example `db/seed-dev`) added to `locations` only in the development configuration.
5. Every dev-sample loader starts with a production guard: read the environment variable the app uses (for example `APP_ENV`) and exit nonzero with a message when it equals the production value.

### Output
Loader files.

### Quality Gate
- Every reference insert uses `ON CONFLICT` or `ON DUPLICATE KEY UPDATE`, or `update_or_create`, or `upsert`.
- Every dev-sample loader contains the production guard (`rg -n "<env var name>" <seed files>`).

---

## Phase 3: Prove Idempotence and the Guard

### Entry Criteria
- Loaders written.

### Actions
1. On a scratch database, run migrations, then record `SELECT count(*)` for each reference table.
2. Run the reference loader again (for migrations: roll back the reference migration, re-apply, or run its SQL twice). Counts must be unchanged.
3. Run the dev seed twice. Counts after the second run equal counts after the first.
4. Run the dev seed with the environment variable set to the production value. It must exit nonzero and insert nothing (counts unchanged).
5. Insert one row referencing a reference code (for example an order with currency `EUR`) to prove foreign keys resolve.

### Output
`seed_files` with the count log.

### Quality Gate
- Reference and dev-sample counts are identical after the first and second runs.
- The production-guard run exits nonzero and counts are unchanged.

---

## Common Mistakes To Avoid

- Do not put fake sample data in a migration. It will reach production.
- Do not use plain `INSERT` for reference data. The second run fails on the unique key or duplicates rows.
- Do not load reference data in a test-only fixture; production would lack it.
- Do not use `TRUNCATE` and reload for reference data that other rows reference by foreign key.

---

## Worked Example

Illustrative only. Prisma, PostgreSQL. `reference_data` = order statuses `open, paid, shipped, cancelled` from the product spec.

Phase 2: migration `20261020130000_reference_order_status/migration.sql`:
```sql
INSERT INTO "order_status" ("code", "label") VALUES
 ('open','Open'),('paid','Paid'),('shipped','Shipped'),('cancelled','Cancelled')
ON CONFLICT ("code") DO UPDATE SET "label" = EXCLUDED."label";
```
`prisma/seed.ts` begins `if (process.env.APP_ENV === 'production') { console.error('refusing to seed production'); process.exit(1); }` then upserts 20 sample customers.

Phase 3: `order_status` count 4 before and after re-run. `npx prisma db seed` twice: customers 20 and 20. `APP_ENV=production npx prisma db seed` exits 1; customers still 20.

---

## Exit Criteria

DONE when every data set is classified, reference data loads through idempotent migrations, dev data loads through a guarded seed command, and the double-run and guard checks pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Reference table has no natural key | **Return**: add a unique natural key through `dbs-constraints-foreign-keys` first. |
| Phase 2 | MySQL older than 8.0.19 rejects the `AS new` alias | **Adjust**: use `ON DUPLICATE KEY UPDATE name = VALUES(name)`. |
| Phase 3 | Second run changes counts | **Retry**: the conflict target does not match the unique key; fix and rerun. |
| Phase 3 | Guard run inserts rows | **Stop**: fix the guard before the seed script is committed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
