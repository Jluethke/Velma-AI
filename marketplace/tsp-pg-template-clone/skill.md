# PostgreSQL Template Database Cloning for Tests

**One-line description:** Cuts per-worker or per-test database setup on PostgreSQL by migrating and seeding one template database once, then creating each test database with `CREATE DATABASE ... TEMPLATE`, dropping it with `DROP DATABASE ... WITH (FORCE)`, and running the test server with documented durability settings turned off (`fsync`, `synchronous_commit`, `full_page_writes`).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `hotspot_plan` (object, required): From `tsp-hotspot-classify`; `database` items whose cost is schema creation, migrations or seeding.
- `stack` (string, required): `python`, `node` or `go`; selects where the clone hook goes.

---

## Outputs

- `pg_template_fixture` (object): Server version, template name, migration and seed command, clone granularity (per worker, per package, per file, per test), clone and drop SQL, the hook location for the stack, durability settings applied, and measured seconds for migrate-from-scratch versus clone.

---

## Phase 1: Measure Migrate Versus Clone

### Entry Criteria
- Test PostgreSQL server reachable; `psql --version` and `psql -c "select version()"` work.

### Actions
1. Record the server version from `select version()`. `DROP DATABASE ... WITH (FORCE)` requires PostgreSQL 13 or newer. The `STRATEGY` option of `CREATE DATABASE` exists from PostgreSQL 15.
2. Build the template once:
   `psql -c "CREATE DATABASE app_template"`
   then run the project's migrations and seed against it (for example `DATABASE_URL=.../app_template alembic upgrade head`, `npx knex migrate:latest`, `goose -dir migrations postgres "<dsn>" up`).
3. Time migrate-from-scratch: drop and recreate a scratch database and run migrations with `time`. Record `real`.
4. Time a clone: `time psql -c "CREATE DATABASE app_clone_probe TEMPLATE app_template"`. Record `real`. Then `psql -c "DROP DATABASE app_clone_probe"`.
5. On PostgreSQL 15 or newer, also time `CREATE DATABASE app_clone_probe TEMPLATE app_template STRATEGY FILE_COPY`. The default since 15 is `WAL_LOG`; the docs note `FILE_COPY` can be faster for large templates and slower for small ones. Use the faster measured one.

### Output
Migrate and clone times.

### Quality Gate
- Three or four `real` values recorded from command output.
- Probe database dropped (`psql -lqt | cut -d'|' -f1 | grep app_clone_probe` prints nothing).

---

## Phase 2: Choose Granularity

### Entry Criteria
- Times recorded.

### Actions
1. Choose with this table:

| Situation | Clone per |
|---|---|
| Tests already roll back per test (`tsp-py-db-transaction-rollback`, `tsp-node-db-transaction-rollback`, `tsp-go-db-txdb-rollback` done) | Worker or package: clone once, tests roll back inside it |
| Tests must commit (`needs_commit` lists) and clone time is below current per-test reset time | Test or file |
| Clone time is not below current per-test reset time | Keep current reset; record the measurement |

2. Record the hook location per stack:

| `stack` | Hook | Name source |
|---|---|---|
| python | session-scoped fixture in `conftest.py` | `worker_id` fixture (`gw0`...) or a per-test `uuid4().hex` |
| node | `globalSetup` for per-worker creation, or `beforeAll` in a setup file | `JEST_WORKER_ID` or `VITEST_POOL_ID` |
| go | `TestMain` per package | package name, or `t.Name()` sanitized for per-test |

### Output
Granularity and hook.

### Quality Gate
- The choice cites the measured times from Phase 1 and the row it matched.

---

## Phase 3: Install and Prove

### Entry Criteria
- Granularity chosen; suite green.

### Actions
1. Template preparation in the test bootstrap (CI script or `globalSetup`, not per test): create `app_template`, migrate, seed, then `ALTER DATABASE app_template WITH ALLOW_CONNECTIONS false` so no session holds it open. A template with any open connection makes `CREATE DATABASE ... TEMPLATE` fail with `source database "app_template" is being accessed by other users`.
2. Rebuild the template when migrations change: compute a hash of the migrations directory (for example `find migrations -type f -exec sha256sum {} + | sort | sha256sum`) and store it in a `COMMENT ON DATABASE app_template IS '<hash>'`. Read it back with `psql -Atc "select shobj_description(oid, 'pg_database') from pg_database where datname = 'app_template'"`. When it differs, rebuild by `DROP DATABASE app_template WITH (FORCE)` and repeating step 1.
3. Clone at the chosen hook: `CREATE DATABASE <name> TEMPLATE app_template`; connect the tests to `<name>`; at teardown `DROP DATABASE <name> WITH (FORCE)`.
4. Test-only server settings, for a disposable container or CI service only: start Postgres with `-c fsync=off -c synchronous_commit=off -c full_page_writes=off`. The PostgreSQL docs state these risk data loss on crash, which is acceptable only for throwaway test data. Docker example: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=test postgres:16 -c fsync=off -c synchronous_commit=off -c full_page_writes=off`. Do NOT apply these to any shared or persistent server.
5. Convert one hook per commit. Run the full suite; it must pass.
6. Check for leftover databases after the run: `psql -lqt | cut -d'|' -f1 | grep app_test_` prints nothing.

### Output
`pg_template_fixture`.

### Quality Gate
- Full suite green.
- Zero leftover test databases after the run.
- `psql -c "show fsync"` on the test server prints `off` only when step 4 was applied, and the target server is a disposable container (record its container id).

---

## Worked Example

Illustrative. `stack=go`, PostgreSQL 16, 9 packages each running 140 migrations in `TestMain`.

- Phase 1: migrate from scratch `real 6.9s`; clone `WAL_LOG` `real 0.41s`; `FILE_COPY` `real 0.22s`.
- Phase 2: tests already use go-txdb, so clone per package. Hook: `TestMain`, name `ledger_test_<pkg>`.
- Phase 3: CI step builds `app_template` with hash comment; each `TestMain` runs `CREATE DATABASE ledger_test_store TEMPLATE app_template STRATEGY FILE_COPY` and drops it with `FORCE` after `m.Run()`. Postgres service started with `fsync=off`. Setup across packages falls from 62 s of serial migration to under 3 s.

---

## Exit Criteria

DONE when the template is built once per migration hash, clones are created and force-dropped at the chosen hook, the full suite passes with no leftover databases, and clone versus migrate times are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Server older than 13 | **Adjust**: terminate sessions with `pg_terminate_backend` on `pg_stat_activity` rows for that database before a plain `DROP DATABASE`. |
| Phase 3 | `being accessed by other users` on clone | **Retry**: close every connection to the template; confirm `ALLOW_CONNECTIONS false`. |
| Phase 3 | Test role lacks `CREATEDB` | **Stop**: grant `CREATEDB` to the test role on the test server only. |
| Phase 3 | Template stale after a new migration | **Adjust**: the hash check was skipped; rebuild and confirm the comment hash. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
