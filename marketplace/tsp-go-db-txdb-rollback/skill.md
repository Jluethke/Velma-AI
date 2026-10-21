# Go Database Rollback with go-txdb

**One-line description:** Makes each Go database test run inside a transaction that is rolled back when its connection closes, using `github.com/DATA-DOG/go-txdb` registered once in `TestMain` with a unique DSN per test, or an explicit `*sql.Tx` or `pgx.Tx` passed through a small query interface, with migrations run once per package.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Module root.
- `hotspot_plan` (object, required): From `tsp-hotspot-classify`; items with cause `database`.
- `db_engine` (string, optional): `postgres` or `mysql`.

---

## Outputs

- `go_db_fixture` (object): Driver (`database/sql` with `lib/pq` or `pgx/stdlib`, native `pgx`), technique (txdb or explicit tx), migration location, per-package database naming for `-p` parallelism, `needs_commit` tests, commit SHAs, package seconds before and after.

---

## Phase 1: Map Driver and Pattern

### Entry Criteria
- At least one `database` item is `todo`.

### Actions
1. Driver: `grep -rn "sql.Open(\|pgxpool.New(\|pgx.Connect(" --include=*.go .`.
2. Choose the technique:

| Code uses | Technique |
|---|---|
| `*sql.DB` from `database/sql` | go-txdb: `txdb.Register("txdb", "<driver name>", dsn)` once, then `sql.Open("txdb", t.Name())` per test; every statement runs in one transaction that rolls back on `db.Close()` |
| Native `pgx` (`*pgxpool.Pool`) | Explicit transaction: define `type DBTX interface { Exec(...); Query(...); QueryRow(...) }` matching the pgx method signatures already used; repositories accept `DBTX`; tests pass `tx` from `pool.Begin(ctx)` and call `tx.Rollback(ctx)` in `t.Cleanup` |
| sqlc-generated code | sqlc emits a `DBTX` interface and `New(db DBTX)`; pass the transaction to `New` |

3. Find how schema is created today (`migrate.Up`, `goose.Up`, raw SQL files) and whether it runs per test.
4. List `needs_commit` tests: code that spawns goroutines with their own connection, uses `LISTEN`, or tests that verify transaction boundaries themselves.

### Output
Technique and `needs_commit` list.

### Quality Gate
- Technique row chosen with the grep line quoted.

---

## Phase 2: Install

### Entry Criteria
- Technique chosen; `go test ./...` green.

### Actions
1. Time before: `go test -count=1 -v ./<pkg>` and record the package `ok` line seconds.
2. Migrations once per package in `TestMain`:
   `func TestMain(m *testing.M) { dsn := os.Getenv("TEST_DATABASE_URL"); runMigrations(dsn); txdb.Register("txdb", "pgx", dsn); os.Exit(m.Run()) }`
   (`"pgx"` is the driver name registered by `github.com/jackc/pgx/v5/stdlib`; use `"postgres"` for `lib/pq`, `"mysql"` for go-sql-driver.)
3. Per test helper:
   `func newDB(t *testing.T) *sql.DB { db, err := sql.Open("txdb", t.Name()); if err != nil { t.Fatal(err) }; t.Cleanup(func() { db.Close() }); return db }`
   The unique name per test gives each test its own transaction. `t.Name()` includes subtest names, so subtests are isolated too.
4. For the explicit-tx technique: `tx, err := pool.Begin(ctx)`; `t.Cleanup(func() { tx.Rollback(context.Background()) })`.
5. Package parallelism: `go test ./...` runs packages in parallel (up to `-p`, default GOMAXPROCS). Two packages migrating the same database at the same time conflict. Give each package its own database (for example suffix the DB name with the package name in `TestMain`, creating it if missing), or route to `tsp-pg-template-clone`.
6. Convert one package per commit. Do NOT remove assertions that query rows back.

### Output
One package converted.

### Quality Gate
- `go vet ./<pkg>` prints nothing.
- `grep -n "migrate\|goose" <pkg>/*_test.go` shows migrations only in `TestMain`.

---

## Phase 3: Prove and Commit

### Entry Criteria
- Package converted.

### Actions
1. Shuffle twice: `go test -count=1 -shuffle=on ./<pkg>`; the run prints `-test.shuffle <seed>`; record both seeds. Both pass.
2. Parallel tests: if the package uses `t.Parallel()`, run `go test -count=1 -race ./<pkg>`. txdb gives each `t.Name()` its own connection, so parallel tests are isolated.
3. Leak check: after the run, query table row counts with `psql "$TEST_DATABASE_URL" -c "select count(*) from <table>"`; they must equal the pre-run counts.
4. Full suite `go test -count=1 ./...` passes. Commit.

### Output
Row in `go_db_fixture`.

### Quality Gate
- Two shuffle seeds recorded and both runs `ok`.
- Row counts unchanged.
- Full suite has no `FAIL` lines.

---

## Worked Example

Illustrative. Package `store`, `database/sql` with `pgx/v5/stdlib`, every test calls `setupSchema(t)` (drop and recreate), 48.2 s.

- Phase 1: technique go-txdb; `needs_commit`: `TestOutboxRelay` (goroutine opens its own `sql.DB`).
- Phase 2: `TestMain` runs `goose.Up` once on `ledger_test_store`, registers `txdb` with driver `"pgx"`; tests call `newDB(t)`. `TestOutboxRelay` keeps the old helper.
- Phase 3: `-shuffle=on` seeds `1729551800123` and `1729551811456` both `ok`; `entries` count 0 before and after; package 48.2 s to 4.6 s.

---

## Exit Criteria

DONE when every `database` item is `done` with migrations once per package, a per-test rollback, two shuffled passes, unchanged row counts and a green full suite.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Code under test calls `db.Begin()` and `Commit()` | **Adjust**: go-txdb turns nested `Begin` into savepoints for supported drivers; check its README for your driver; otherwise mark `needs_commit`. |
| Phase 2 | `sql: unknown driver "txdb"` | **Retry**: `txdb.Register` must run in `TestMain` before any `sql.Open("txdb", ...)`. |
| Phase 3 | Shuffled run fails with duplicate key | **Return**: a helper opens a non-txdb connection; route it through `newDB(t)`. |
| Phase 3 | Packages collide on schema during `go test ./...` | **Adjust**: per-package database names, or run `tsp-pg-template-clone`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
