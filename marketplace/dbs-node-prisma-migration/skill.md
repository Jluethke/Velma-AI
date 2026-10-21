# Node Prisma Migration

**One-line description:** Writes one Prisma Migrate migration per plan step with `prisma migrate dev --create-only`, hand-edits the generated `migration.sql` where Prisma drops instead of renames or cannot express the object, keeps non-transactional statements alone in their own migration, and proves `migrate deploy`, `migrate status`, and a schema diff on a scratch database.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `migration_plan` (object[], required): Ordered steps from `dbs-expand-contract-plan`.
- `repo_path` (string, required): Repository root containing `prisma/schema.prisma` (or the schema path set in `package.json` or `prisma.config.ts`).
- `scratch_database_url` (string, required): Connection URL of a disposable database of the production engine and major version. Never production.

---

## Outputs

- `migration_files` (string[]): Paths of `prisma/migrations/<timestamp>_<name>/migration.sql` files created, one per plan step, in apply order.

---

## Phase 1: Check the Prisma Setup

### Entry Criteria
- A Prisma schema file exists.

### Actions
1. Run `npx prisma --version` and record the `prisma` and `@prisma/client` versions. Flag names in this flow are checked against that version with `npx prisma migrate --help` and `npx prisma migrate diff --help`; if a flag is not listed there, do not use it.
2. Set `DATABASE_URL` to `scratch_database_url` in the shell (not in a committed `.env`).
3. Run `npx prisma migrate deploy` to bring the scratch database to the current migration history, then `npx prisma migrate status`. It must report that the database schema is up to date.
4. `prisma migrate dev` needs a shadow database. On local Docker it creates one itself; on managed databases where it cannot create databases, set `shadowDatabaseUrl` in the datasource (or the config file, depending on version) to a second disposable database.

### Output
Setup record with versions.

### Quality Gate
- `npx prisma migrate status` reports up to date, exit code 0.

---

## Phase 2: Create and Edit One Migration Per Step

### Entry Criteria
- Setup recorded.

### Actions
1. Edit `schema.prisma` for the next plan step only.
2. Run `npx prisma migrate dev --create-only --name <phase>_<short_description>`. This writes `migration.sql` without applying it.
3. Open `migration.sql` and fix it with this table:

| Situation | What Prisma generates | What to write |
|---|---|---|
| Field or model renamed in the schema | `DROP COLUMN` plus `ADD COLUMN` (data loss) | Follow the expand-contract steps, or keep the old name with `@map("old_name")` / `@@map("old_table")` so no SQL is needed |
| Partial index, expression index, `NOT VALID` constraint, trigger | Not expressible in the schema | Add the SQL by hand to `migration.sql` |
| A later migration where hand-added objects are not in the schema | Prisma may emit `DROP INDEX` for objects it does not know | Delete those lines from the new `migration.sql`; record each one |
| `CREATE INDEX CONCURRENTLY` | Never generated | Put the statement alone in its own `--create-only` migration; a file with several statements runs as one implicit transaction on PostgreSQL and fails |
| Required field added to a table with rows | `ADD COLUMN ... NOT NULL` without default, which fails on existing rows | Make it optional (`String?`) for the expand step; NOT NULL comes in a later step after the backfill |

4. UUID v7 defaults: use `@default(uuid(7))` only if the installed Prisma version documents it; otherwise generate in the app. Check with the Prisma docs for the recorded version.
5. Prisma Migrate has no down migrations. For each migration, produce a reverse script for `dbs-rollback-plan`: `npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datamodel <path to previous schema.prisma> --script > down_<name>.sql`. Flag names differ across Prisma major versions; confirm them with `npx prisma migrate diff --help` first. Store the down script outside `prisma/migrations/` so Prisma does not try to apply it.

### Output
One edited migration directory per step.

### Quality Gate
- `rg -n "DROP COLUMN|DROP TABLE|DROP INDEX" prisma/migrations/<new>/migration.sql` hits only operations the plan lists as contract steps.
- Every `CONCURRENTLY` statement is the only statement in its file.

---

## Phase 3: Prove on the Scratch Database

### Entry Criteria
- Migrations edited.

### Actions
1. `npx prisma migrate deploy`. Every new migration name is printed as applied. Exit code 0.
2. `npx prisma migrate status` reports up to date.
3. Drift check: `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code` (confirm flag names with `--help`). Exit code 0 means no difference; 2 means the database and the schema differ. Differences equal to your hand-added objects (partial indexes) are expected; list them.
4. Run `npx prisma generate`, then the test suite, and record the pass count.

### Output
`migration_files` and the command log.

### Quality Gate
- `migrate deploy` and `migrate status` exit 0.
- The diff output lists only hand-added objects recorded in Phase 2.
- Test pass count recorded; zero tests removed or skipped.

---

## Common Mistakes To Avoid

- Do not run `prisma migrate dev` against a shared or production database. It can ask to reset and drop all data.
- Do not run `prisma migrate reset` anywhere except a disposable database.
- Do not use `prisma db push` for production schema changes; it writes no migration history.
- Do not edit a `migration.sql` that has been applied anywhere shared. Prisma stores a checksum and reports the change.
- Do not rename a field in `schema.prisma` and accept the generated SQL without reading it.

---

## Worked Example

Illustrative only. Plan step: expand `customer.full_name`, keeping the Prisma field name stable.

Phase 1: `npx prisma --version` shows `prisma 6.x`. `migrate status` reports "Database schema is up to date!".

Phase 2: add `fullName String? @map("full_name")` to `Customer`. `npx prisma migrate dev --create-only --name expand_customer_full_name` writes `prisma/migrations/20261020120000_expand_customer_full_name/migration.sql`:
```sql
ALTER TABLE "customer" ADD COLUMN "full_name" TEXT;
```
No `DROP` lines. Down script saved to `db/down/20261020120000_expand_customer_full_name.sql` containing `ALTER TABLE "customer" DROP COLUMN "full_name";`.

Phase 3: `npx prisma migrate deploy` prints "Applying migration `20261020120000_expand_customer_full_name`". `migrate diff ... --exit-code` exits 0. Tests: 251 passed.

---

## Exit Criteria

DONE when every plan step has its own read and edited `migration.sql`, each has a stored down script, and deploy, status, diff, and tests pass on the scratch database.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `migrate status` reports failed migrations | **Stop**: resolve them first with `npx prisma migrate resolve --rolled-back <name>` or `--applied <name>` after fixing the database by hand. |
| Phase 2 | `migrate dev` cannot create the shadow database | **Adjust**: set `shadowDatabaseUrl` to a second disposable database. |
| Phase 3 | `cannot run inside a transaction block` | **Retry**: move the statement into its own migration file. |
| Phase 3 | Diff shows unexpected differences | **Retry**: a schema change is missing from a migration; create one and rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
