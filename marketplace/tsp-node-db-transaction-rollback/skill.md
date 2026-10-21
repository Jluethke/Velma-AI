# Jest and Vitest Database Transaction Rollback

**One-line description:** Replaces per-test truncation or re-migration in Node database tests with migrations once per worker in `globalSetup` or a per-file `beforeAll`, and a `BEGIN` in `beforeEach` with `ROLLBACK` in `afterEach` on a single injected connection (`pg` `PoolClient`, a Knex transaction object), with per-worker databases keyed by `JEST_WORKER_ID` or `VITEST_POOL_ID`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `hotspot_plan` (object, required): From `tsp-hotspot-classify`; items with cause `database`.
- `db_engine` (string, optional): `postgres`, `mysql` or `sqlite`.

---

## Outputs

- `node_db_fixture` (object): Data layer (`pg`, Knex, Prisma, TypeORM, other), the before pattern, how the transaction connection is injected, per-worker database naming, tests that need real commits, commit SHAs, and file times before and after.

---

## Phase 1: Map the Data Layer

### Entry Criteria
- At least one `database` item is `todo`.

### Actions
1. Identify the data layer: `npm ls pg knex @prisma/client typeorm sequelize mysql2`.
2. Record the current per-test pattern by grepping test setup: `TRUNCATE`, `migrate.latest`, `migrate.rollback`, `prisma migrate reset`, `synchronize: true`, `sequelize.sync({ force: true })` inside `beforeEach`.
3. Decide feasibility with this table:

| Data layer | Can the app run on one transaction-held connection? | Route |
|---|---|---|
| `pg` with a pool passed into repositories | Yes: pass a `PoolClient` that holds the transaction | This flow |
| Knex instance passed into repositories | Yes: `const trx = await knex.transaction()`; pass `trx` (it is a Knex query builder) and `await trx.rollback()` after | This flow |
| TypeORM `DataSource` | Yes with a `QueryRunner`: `queryRunner.startTransaction()` then `rollbackTransaction()`, passing `queryRunner.manager` | This flow |
| Prisma Client | Not natively: interactive transactions cannot be held open across a test and rolled back by design | `tsp-pg-template-clone` (Postgres) or keep truncation and only move migrations to once per worker |
| Global singleton connection imported everywhere with no injection | Only by mocking the module that exports it to return the transaction client | This flow, with that module mock in setup |

4. List tests needing committed data across connections (worker processes, `LISTEN/NOTIFY`, separate pools). Mark `needs_commit`.

### Output
Data layer, route, `needs_commit` list.

### Quality Gate
- One table row selected with the dependency version from `npm ls`.

---

## Phase 2: Install Per-Worker Database and Rollback

### Entry Criteria
- Route is this flow; suite green.

### Actions
1. Time the affected files before.
2. Per-worker database: in a setup file, derive the name from the worker id: Jest sets `process.env.JEST_WORKER_ID` (`"1"`, `"2"`, ...); Vitest sets `process.env.VITEST_POOL_ID`. Example `const db = \`app_test_${process.env.JEST_WORKER_ID ?? '1'}\``. Create and migrate it once per worker in a `beforeAll` of the setup file guarded by a "migrated" check, or create all worker databases in `globalSetup` (runs once, before workers start).
3. Per test (in `setupFilesAfterEnv` for Jest, `setupFiles` for Vitest, or in the file):
   - `pg`: `beforeEach(async () => { client = await pool.connect(); await client.query('BEGIN'); })`, `afterEach(async () => { await client.query('ROLLBACK'); client.release(); })`; pass `client` to the code under test.
   - Knex: `beforeEach(async () => { trx = await knex.transaction(); })`, `afterEach(async () => { await trx.rollback(); })`.
   - Code under test that itself calls `BEGIN`/`COMMIT` inside the outer transaction: on Postgres, nested `BEGIN` only warns and `COMMIT` would end the outer transaction. Make the app use `SAVEPOINT` when already in a transaction (Knex does this automatically when `trx.transaction()` is called on a transaction), or move such tests to `needs_commit`.
4. Convert one test file per commit. Do NOT rewrite the shared setup and every file in one change.
5. Do NOT delete the assertions that read rows back.

### Output
One file converted; setup committed with it.

### Quality Gate
- A query of `SELECT count(*) FROM <table>` after the file's run (from `psql` or a scratch script outside the repo) equals the count before the run.
- `git diff --stat` shows setup files and one test file.

---

## Phase 3: Prove Isolation and Commit

### Entry Criteria
- One file converted.

### Actions
1. Run the file shuffled twice: Jest `npx jest <file> --randomize` (Jest 29.2+), Vitest `npx vitest run <file> --sequence.shuffle`. Both pass.
2. Run it under several workers with others: `npx jest --maxWorkers=<output of nproc>` (Vitest: `npx vitest run`, which uses multiple workers by default); per-worker databases must prevent cross-worker collisions.
3. Full suite with the baseline command must pass. Commit. Next file.

### Output
Row in `node_db_fixture`.

### Quality Gate
- Two shuffled runs and one multi-worker run pass.
- Row counts after equal row counts before.

---

## Worked Example

Illustrative. Express app, Knex 3 on Postgres, `beforeEach` runs `knex.migrate.rollback(undefined, true)` then `migrate.latest()`; `src/orders/orders.test.ts` 14.8 s.

- Phase 1: route "Knex instance passed into repositories"; `needs_commit`: `src/jobs/outbox.test.ts` (worker uses its own pool).
- Phase 2: `globalSetup` creates `app_test_1..N` and migrates each; setup file makes `trx = await knex.transaction()` per test and passes `trx` to `makeOrderRepo(trx)`.
- Phase 3: `--randomize` twice passes; `--maxWorkers=4` passes; `orders.test.ts` 14.8 s to 1.9 s; `SELECT count(*) FROM orders` is 0 before and after.

---

## Exit Criteria

DONE when every `database` item is `done` or routed, converted files roll back per test on per-worker databases, shuffled and multi-worker runs pass, and row counts are unchanged after runs.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Data layer is Prisma | **Return**: route the item to `tsp-pg-template-clone` or keep truncation with migrations once per worker. |
| Phase 2 | Tests hang in `afterEach` | **Adjust**: a query is still running on the client; await every query in the test, and release the client after rollback. |
| Phase 3 | Row counts grow after a run | **Return**: some code path uses the global pool instead of the transaction client; find it with a log of `pool.on('connect')` and inject the client there. |
| Phase 3 | Cross-worker unique violations | **Adjust**: database name does not include the worker id; fix the name derivation. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
