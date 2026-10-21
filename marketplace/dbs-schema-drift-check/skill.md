# Schema Drift Check

**One-line description:** Detects two kinds of drift: ORM models that differ from the migrations, and a live environment whose schema differs from what its recorded migration version should produce, by migrating a scratch database to the same version, dumping both schemas with normalized settings, diffing them, and classifying every difference.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `migration_tool` (string, required): `alembic`, `django`, `prisma`, `flyway`, or `golang-migrate`.
- `db_engine` (string, required): `postgresql` or `mysql`.
- `scratch_database_url` (string, required): Empty disposable database of the same engine and major version.
- `reference_database_url` (string, required): Read-only connection to the environment being checked (staging, or a production replica). Use a role that can read the catalog but not write.

---

## Outputs

- `drift_report` (object): Model-versus-migration result, environment version, the diff of normalized schema dumps, and each difference classified with an action.

---

## Phase 1: Model Versus Migrations

### Entry Criteria
- Inputs present.

### Actions
1. Migrate `scratch_database_url` to head with the tool, then run the tool's check:

| Tool | Command | Clean result |
|---|---|---|
| Alembic | `alembic check` | "No new upgrade operations detected.", exit 0 |
| Django | `python manage.py makemigrations --check --dry-run` | "No changes detected", exit 0 |
| Prisma | `npx prisma migrate diff --from-url "$SCRATCH" --to-schema-datamodel prisma/schema.prisma --exit-code` (confirm flags with `--help`) | exit 0 |
| Flyway | `flyway validate` (checksums only; there is no model) | exit 0 |
| golang-migrate | No model; skip to Phase 2 | not applicable |

2. Record the output. A nonzero result means a model change lacks a migration; it goes in the report as "model drift".

### Output
Model drift result.

### Quality Gate
- The command and its exit code are recorded.

---

## Phase 2: Environment Versus Migrations

### Entry Criteria
- Phase 1 recorded.

### Actions
1. Read the environment's recorded version from its version table:

| Tool | Query |
|---|---|
| Alembic | `SELECT version_num FROM alembic_version;` |
| Django | `SELECT app, name FROM django_migrations ORDER BY id;` |
| Prisma | `SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY finished_at;` |
| Flyway | `SELECT version, success FROM flyway_schema_history ORDER BY installed_rank;` |
| golang-migrate | `SELECT version, dirty FROM schema_migrations;` |

2. Recreate `scratch_database_url` empty and migrate it to exactly that version (`alembic upgrade <rev>`, `migrate <app> <name>` per app, Prisma `migrate deploy` with only those migration folders present, `flyway migrate -target=<version>`, `migrate goto <version>`).
3. Dump both schemas with the same client and the same flags:
   - PostgreSQL: `pg_dump --schema-only --no-owner --no-privileges --no-comments "$URL" > env.sql`. The `pg_dump` client major version must be at least the server's. Newer `pg_dump` releases write `\restrict` and `\unrestrict` lines with a random key on each run; remove them: `sed -i '/^\\\(un\)\?restrict /d' env.sql`.
   - MySQL: `mysqldump --no-data --skip-comments --skip-dump-date --routines --triggers --events <db> | sed -E 's/ AUTO_INCREMENT=[0-9]+//' > env.sql`.
4. Diff: `diff -u scratch.sql env.sql > schema.diff`. Optionally confirm with `atlas schema diff --from "$SCRATCH" --to "$REFERENCE"`.

### Output
`schema.diff`.

### Quality Gate
- Both dumps were made with the same client version (record `pg_dump --version` or `mysqldump --version`).
- `schema.diff` exists; its line count is recorded (0 means no drift).

---

## Phase 3: Classify and Act

### Entry Criteria
- Diff produced.

### Actions
1. Classify each hunk:

| Difference | Likely cause | Action |
|---|---|---|
| Object in environment, not in scratch | Hand-applied hotfix or a migration from another branch | Write a migration that creates it idempotently (`CREATE INDEX CONCURRENTLY IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS` in PostgreSQL) so every environment converges |
| Object in scratch, not in environment | A migration recorded as applied but partly failed (MySQL DDL is not transactional) or was undone by hand | Investigate the version table and DDL history; reapply the missing part through a new migration |
| Same object, different definition | Hand edit, or different server defaults (collation, character set) | Decide which is correct with the owner; codify it in a migration |
| Only column order differs | Columns added in different orders | Record as cosmetic; no action |
| Invalid index in environment (PostgreSQL `INVALID`) | Failed `CREATE INDEX CONCURRENTLY` | Drop with `DROP INDEX CONCURRENTLY` and rebuild through a migration |

2. Never fix the environment by hand from this flow. Every fix is a migration that goes through the normal review.
3. Save the normalized environment dump as the production snapshot for `dbs-migration-ci-test` if `reference_database_url` is production.

### Output
`drift_report`.

### Quality Gate
- Every hunk in `schema.diff` has a class and an action.
- Every action other than "cosmetic" names the migration to be written.

---

## Common Mistakes To Avoid

- Do not compare a fresh-from-empty scratch at head against an environment at an older version. Migrate scratch to the environment's version.
- Do not diff dumps taken with different `pg_dump` versions; formatting changes look like drift.
- Do not connect with a role that can write to the reference database.
- Do not run `ALTER` on the environment to make the diff disappear.

---

## Worked Example

Illustrative only. Django, PostgreSQL 16, comparing staging.

Phase 1: `makemigrations --check --dry-run` prints "No changes detected".

Phase 2: staging `django_migrations` last row `orders 0014_validate_fk_orders_coupon`. Scratch migrated to `orders 0014`. Dumps with `pg_dump 16.4`. `diff -u` shows:
```
+CREATE INDEX ix_orders_status_tmp ON public.orders_order USING btree (status);
```
Phase 3: object in environment only: a hand-made index from an incident. Action: migration `0015_codify_ix_orders_status` using `AddIndexConcurrently` with `IF NOT EXISTS` through `RunSQL`, or a decision to drop it, recorded with the owner.

---

## Exit Criteria

DONE when model drift and environment drift are both checked with recorded commands, every difference is classified, and every real difference has a named migration to fix it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Check reports model drift | **Return**: send to the tool-specific migration flow to write the missing migration. |
| Phase 2 | `pg_dump: error: aborting because of server version mismatch` | **Adjust**: install a `pg_dump` client of the server's major version or newer. |
| Phase 2 | golang-migrate `dirty` is true in the environment | **Stop**: the environment has a half-applied migration; resolve it per `dbs-go-golang-migrate` before diffing. |
| Phase 3 | Owner cannot say which definition is correct | **Return**: record both definitions and the open question; do not write a migration yet. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
