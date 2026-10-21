# Go golang-migrate Migration

**One-line description:** Writes one numbered up and down SQL pair per plan step with `migrate create -seq`, wraps multi-statement files in explicit transactions where the engine allows it, keeps `CONCURRENTLY` statements unwrapped and alone, and proves up, down 1, up on a scratch database, including how to clear a `Dirty database version` state with `migrate force`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `migration_plan` (object[], required): Ordered steps from `dbs-expand-contract-plan`.
- `repo_path` (string, required): Repository root containing the migrations directory (often `db/migrations` or `migrations`).
- `scratch_database_url` (string, required): golang-migrate database URL of a disposable database, for example `postgres://user:pw@localhost:55432/app?sslmode=disable` or `mysql://user:pw@tcp(localhost:53306)/app?multiStatements=true`. Never production.

---

## Outputs

- `migration_files` (string[]): Paths of the `NNNNNN_<name>.up.sql` and `NNNNNN_<name>.down.sql` files created, in apply order.

---

## Phase 1: Check the Tool and State

### Entry Criteria
- A migrations directory exists, or the plan creates the first migration.

### Actions
1. Run `migrate -version`. If missing, install the CLI with the driver tags you need: `go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest` (use `'mysql'` for MySQL). A CLI built without the tag fails with an unknown driver error.
2. Record the naming scheme already in the directory: sequential (`000012_add_x.up.sql`) or timestamp (`20261020120000_add_x.up.sql`). Keep it.
3. Run `migrate -path <dir> -database "$SCRATCH_URL" up`, then `migrate -path <dir> -database "$SCRATCH_URL" version`. Record the version. If the output contains `(dirty)`, go to Error Handling first.
4. If the app runs migrations from Go code, record how: `migrate.New(...)` with `file://` or `iofs` source from `//go:embed`, and whether it treats `migrate.ErrNoChange` as success (`errors.Is(err, migrate.ErrNoChange)`).

### Output
Tool and version record.

### Quality Gate
- `migrate ... version` prints a number without `(dirty)`, exit code 0.

---

## Phase 2: Write One Up/Down Pair Per Step

### Entry Criteria
- Clean version.

### Actions
1. Run `migrate create -ext sql -dir <dir> -seq <phase>_<short_description>` (omit `-seq` if the directory uses timestamps). Two empty files appear.
2. golang-migrate does not wrap a file in a transaction for you. Wrap it yourself according to this table:

| Engine and content | File content |
|---|---|
| PostgreSQL, ordinary DDL or several statements | `BEGIN;` ... statements ... `COMMIT;` |
| PostgreSQL, `CREATE INDEX CONCURRENTLY` or `DROP INDEX CONCURRENTLY` | That one statement only, no `BEGIN`/`COMMIT` |
| MySQL, any DDL | One DDL statement per file; MySQL DDL commits implicitly, so a transaction wrapper does not protect it |

3. MySQL files with several statements need `multiStatements=true` in the database URL. PostgreSQL with the `postgres` driver sends the whole file in one call; check the driver documentation for `x-multi-statement` before using it.
4. Write the `.down.sql` as the exact reverse of the `.up.sql`. For a step that destroys data (contract `DROP COLUMN`), the down file recreates the empty column and starts with a comment `-- lossy: data in <column> is not restored`. Record it for `dbs-rollback-plan`.
5. Use `IF NOT EXISTS` and `IF EXISTS` in PostgreSQL index statements so a rerun after a partial failure does not error, for example `CREATE INDEX CONCURRENTLY IF NOT EXISTS ...`.

### Output
New up and down files.

### Quality Gate
- Every new `.up.sql` has a `.down.sql` with the same number and name.
- Zero PostgreSQL `CONCURRENTLY` statements sit inside `BEGIN`/`COMMIT` or share a file (`rg -n "CONCURRENTLY" <dir>` and inspect each hit).

---

## Phase 3: Prove on the Scratch Database

### Entry Criteria
- Files written.

### Actions
1. `migrate -path <dir> -database "$SCRATCH_URL" up`. Exit code 0.
2. For each new migration, newest first: `migrate ... down 1`, then `migrate ... up`. Both exit 0.
3. `migrate ... version` prints the newest number without `(dirty)`.
4. Run `go test ./...` with the test database pointed at the scratch URL; record the pass count.

### Output
`migration_files` and the command log.

### Quality Gate
- Up, down 1, and up exit 0 for every new migration, with output recorded.
- Final `version` equals the newest file number and is not dirty.
- `go test ./...` result recorded; zero tests deleted or skipped.

---

## Common Mistakes To Avoid

- Do not run `migrate down` without a number. With no argument it asks to apply all down migrations.
- Do not run `migrate force` to make an error go away. Force only sets the version number; it does not change the schema. Fix the schema first.
- Do not renumber a file that has been applied anywhere shared.
- Do not use `drop` (it drops everything in the database) outside a disposable database.

---

## Worked Example

Illustrative only. PostgreSQL, sequential numbering, current version 11.

Phase 2: `migrate create -ext sql -dir db/migrations -seq expand_ix_orders_cust_created_open` creates `000012_expand_ix_orders_cust_created_open.up.sql`:
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_orders_cust_created_open
  ON orders (customer_id, created_at DESC) WHERE status = 'open';
```
and `.down.sql`:
```sql
DROP INDEX CONCURRENTLY IF EXISTS ix_orders_cust_created_open;
```
Phase 3:
```
$ migrate -path db/migrations -database "$SCRATCH_URL" up
12/u expand_ix_orders_cust_created_open (41.2ms)
$ migrate -path db/migrations -database "$SCRATCH_URL" down 1
12/d expand_ix_orders_cust_created_open (18.9ms)
$ migrate -path db/migrations -database "$SCRATCH_URL" up
$ migrate -path db/migrations -database "$SCRATCH_URL" version
12
```
`go test ./...`: ok for all packages.

---

## Exit Criteria

DONE when every plan step has a numbered up and down pair with correct transaction wrapping, and up, down 1, up, version, and tests pass on the scratch database.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `error: database driver: unknown driver postgres` | **Retry**: reinstall the CLI with `-tags 'postgres'` (or `'mysql'`). |
| Phase 1 | `Dirty database version N. Fix and force version.` | **Adjust**: read what file N applied; undo its partial changes by hand; run `migrate ... force <N-1>`; rerun `up`. |
| Phase 3 | `cannot run inside a transaction block` | **Retry**: remove `BEGIN`/`COMMIT` and keep the statement alone. |
| Phase 3 | Down file fails | **Retry**: fix the down file; a broken down file is a broken rollback. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
