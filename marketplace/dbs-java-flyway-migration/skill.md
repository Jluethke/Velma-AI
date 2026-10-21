# Java Flyway Migration

**One-line description:** Writes one versioned Flyway SQL migration per plan step using the `V<version>__<description>.sql` naming rule, marks non-transactional scripts with a `.sql.conf` file setting `executeInTransaction=false`, and proves `flyway migrate`, `info`, and `validate` on a scratch database, including what to do after a failed migration on PostgreSQL versus MySQL.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `migration_plan` (object[], required): Ordered steps from `dbs-expand-contract-plan`.
- `repo_path` (string, required): Repository root. Migrations usually live in `src/main/resources/db/migration` (Spring Boot and Java API default `classpath:db/migration`) or in the directory named by `flyway.locations`.
- `scratch_database_url` (string, required): JDBC URL of a disposable database of the production engine and major version. Never production.

---

## Outputs

- `migration_files` (string[]): Paths of the `V...__....sql` files (and any `.sql.conf` files) created, in apply order.

---

## Phase 1: Read the Flyway Setup

### Entry Criteria
- A Flyway dependency (Maven `org.flywaydb:flyway-core`, Gradle plugin, or CLI) is present.

### Actions
1. Record the Flyway version (CLI `flyway --version`, or the `flyway-core` version in `pom.xml` or `build.gradle`). Flyway 10 and later also need the database module (for example `flyway-database-postgresql` or `flyway-mysql`).
2. Find the configuration: `flyway.conf` or `flyway.toml` (CLI), `spring.flyway.*` in `application.yml` (Spring Boot), or the Maven or Gradle plugin block. Record `locations`, `outOfOrder` (default false), `validateOnMigrate` (default true), and `cleanDisabled` (default true from Flyway 9).
3. Run `flyway -url="$SCRATCH_JDBC_URL" -user=... -password=... -locations=filesystem:src/main/resources/db/migration info`. Record the highest version with state `Success`.
4. List existing file names and record the version scheme (integers `V12__`, dotted `V1.4.2__`, or timestamps `V20261020120000__`). Continue the same scheme.

### Output
Setup record with current version.

### Quality Gate
- `flyway info` exits 0 and shows zero rows in state `Failed` or `Pending` that you did not create.

---

## Phase 2: Write One Migration Per Step

### Entry Criteria
- Current version known.

### Actions
1. Create the file for the next plan step: `V<next>__<phase>_<short_description>.sql`. Two underscores between version and description. Use the plan's DDL exactly.
2. For a statement that cannot run in a transaction (`CREATE INDEX CONCURRENTLY` on PostgreSQL), put it alone in its own versioned file and add a script configuration file next to it with the same name plus `.conf`, for example `V15__expand_ix_orders_concurrently.sql.conf`, containing the line `executeInTransaction=false`. Confirm the key in the Flyway docs for your version.
3. For MySQL, every DDL statement commits implicitly; a file with three statements that fails on the second leaves the first applied. Put one DDL statement per file for MySQL.
4. Repeatable migrations (`R__<name>.sql`) rerun whenever their checksum changes. Use them only for views, functions, and procedures that are recreated with `CREATE OR REPLACE`. Never for table changes.
5. Undo files (`U<version>__...sql`) run only in Flyway Teams and Enterprise editions. On the open-source edition, write a reverse SQL file outside `locations` for `dbs-rollback-plan` (for example `db/rollback/V15__reverse.sql`).
6. Spring Boot runs Flyway on application startup by default. For contract steps that must run after every instance is on the new release, record whether migrations run at startup or as a separate `flyway migrate` job; a contract step at startup runs while old instances may still exist.

### Output
New migration files.

### Quality Gate
- Every new file name matches `^V[0-9._]+__[a-z0-9_]+\.sql$` (check with `ls | rg`), and versions are strictly increasing after the recorded current version.
- Every `CONCURRENTLY` file has a matching `.sql.conf` with `executeInTransaction=false`.

---

## Phase 3: Prove on the Scratch Database

### Entry Criteria
- Files written.

### Actions
1. `flyway ... migrate`. The output lists each new version as migrated. Exit code 0.
2. `flyway ... info`. Every new version shows `Success`.
3. `flyway ... validate`. Exit code 0 means checksums of applied migrations match the files.
4. Apply each reverse file by hand to a copy of the scratch database, then rerun `migrate` from the prior version, to prove the reverse works.
5. Run the test suite (`./mvnw test` or `./gradlew test`) and record the pass count.
6. If a migration failed: on PostgreSQL the transactional migration rolled back and the database is unchanged; fix the file and rerun. On MySQL the partial DDL stayed; undo the applied statements by hand, then run `flyway repair` to remove the failed row from `flyway_schema_history`, then fix and rerun.

### Output
`migration_files` and the command log.

### Quality Gate
- `migrate`, `info`, and `validate` all exit 0 and `info` shows `Success` for every new version.
- Test pass count recorded; zero tests removed or disabled.

---

## Common Mistakes To Avoid

- Do not edit an applied migration file. `validate` fails with a checksum mismatch. Write a new version.
- Do not run `flyway repair` to hide a checksum mismatch you caused by editing a file.
- Do not set `cleanDisabled=false` in any shared configuration. `clean` drops every object in the schema.
- Do not set `outOfOrder=true` to work around a version collision; renumber your unapplied file instead.

---

## Worked Example

Illustrative only. PostgreSQL 16, Spring Boot, `flyway info` shows `14 | expand customer full name | Success`.

Phase 2: files created:
```
src/main/resources/db/migration/V15__expand_ix_orders_concurrently.sql
  CREATE INDEX CONCURRENTLY ix_orders_cust_created_open
    ON orders (customer_id, created_at DESC) WHERE status = 'open';
src/main/resources/db/migration/V15__expand_ix_orders_concurrently.sql.conf
  executeInTransaction=false
db/rollback/V15__reverse.sql
  DROP INDEX CONCURRENTLY IF EXISTS ix_orders_cust_created_open;
```
Phase 3: `flyway migrate` prints "Migrating schema "public" to version "15 - expand ix orders concurrently"" and "Successfully applied 1 migration". `info` shows 15 `Success`. `validate` exits 0. `./mvnw test`: 530 tests, 0 failures.

---

## Exit Criteria

DONE when every plan step has its own correctly named versioned file, non-transactional files carry the script configuration, reverse files exist, and migrate, info, validate, and tests pass on the scratch database.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `info` shows a `Failed` row before you start | **Stop**: someone left a failed migration; resolve it with its owner first. |
| Phase 2 | Version collides with a teammate's unmerged file | **Adjust**: renumber your unapplied file to the next free version. |
| Phase 3 | `Validate failed: Migration checksum mismatch` | **Return**: find who edited an applied file; restore it from git. |
| Phase 3 | `cannot run inside a transaction block` | **Retry**: add the `.sql.conf` with `executeInTransaction=false` and keep the statement alone. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
