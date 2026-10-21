# Pytest Database Transaction Rollback Fixtures

**One-line description:** Replaces per-test schema creation, truncation or re-seeding in Python database tests with one schema per session and a per-test outer transaction rolled back at teardown (SQLAlchemy 2.0 `join_transaction_mode="create_savepoint"`, or pytest-django's default `django_db` with `--reuse-db`), keeping per-worker databases ready for xdist.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `hotspot_plan` (object, required): From `tsp-hotspot-classify`; items with cause `database`.
- `db_engine` (string, optional): `postgres`, `mysql` or `sqlite`. Read from the settings or connection URL when not given.

---

## Outputs

- `py_db_fixture` (object): Framework (SQLAlchemy, Django, other), the before fixture pattern, the new fixture code location, tests that still need a real commit and how they are handled, commit SHAs, and suite seconds before and after.

---

## Phase 1: Map the Current Pattern

### Entry Criteria
- At least one `database` item is `todo`.

### Actions
1. Identify the framework and pattern with greps:

| Grep hit | Current pattern |
|---|---|
| `Base.metadata.create_all` / `drop_all` inside a function-scoped fixture | `schema_per_test` |
| `TRUNCATE` or `session.query(X).delete()` in teardown | `truncate_per_test` |
| `@pytest.mark.django_db(transaction=True)` or `TransactionTestCase` | `django_truncate` (pytest-django flushes tables after each such test) |
| `alembic upgrade` or `call_command("migrate")` in a fixture | `migrate_per_test` |
| `@pytest.mark.django_db` without `transaction=True` | Already rollback-based; check `--reuse-db` only |

2. Find tests that genuinely need committed data visible to another connection: code that opens a second engine or connection, background threads or Celery eager tasks reading the DB, `on_commit` hooks, `SELECT ... FOR UPDATE SKIP LOCKED` across sessions. List them as `needs_commit`.
3. Record `db_engine`. With `sqlite` in-memory, a single connection is required for the transaction pattern (`poolclass=StaticPool` for in-memory sqlite shared across threads).

### Output
Pattern, framework, `needs_commit` list.

### Quality Gate
- Pattern names one row of the table with the grep line quoted.
- `needs_commit` list exists (may be empty), each with the line that requires a commit.

---

## Phase 2: Install the Rollback Fixture

### Entry Criteria
- Pattern mapped; suite green.

### Actions
1. Time the affected files before with `pytest <files> -q --durations=0 -p no:randomly`.
2. SQLAlchemy 2.0, in the top `conftest.py`, following the documented recipe "Joining a Session into an External Transaction":
   - `@pytest.fixture(scope="session")` `engine`: create the engine, run `Base.metadata.create_all(engine)` or `alembic upgrade head` once, yield, then `drop_all`.
   - `@pytest.fixture` `db_session(engine)`: `connection = engine.connect()`, `trans = connection.begin()`, `session = Session(bind=connection, join_transaction_mode="create_savepoint")`, yield `session`, then `session.close()`, `trans.rollback()`, `connection.close()`.
   - With `create_savepoint`, code under test can call `session.commit()`; it releases a SAVEPOINT, and the outer transaction still rolls back.
   - The application must use this `db_session`. Override the app's session dependency: FastAPI `app.dependency_overrides[get_db] = lambda: db_session`; Flask-SQLAlchemy and others: check the extension docs for test session binding.
3. Django with pytest-django: convert `django_db(transaction=True)` tests to `django_db` where they are not in `needs_commit`. Add `--reuse-db` to `addopts` so the test database survives between runs (`--create-db` forces a rebuild after migration changes). Use `django_db(transaction=True)` only for `needs_commit` tests.
4. For `needs_commit` tests in SQLAlchemy, keep the old truncating fixture under a new name (for example `committed_db`) and mark those tests with it, so their behavior is unchanged.
5. Change one file of tests per commit. Do NOT rewrite every test module at once.
6. Do NOT remove assertions that read the DB after the action; they are the test.

### Output
Fixture installed; one file converted.

### Quality Gate
- `pytest --setup-show <file>` shows `SETUP    S engine` once and `SETUP    F db_session` per test.
- `git diff --stat` shows `conftest.py` and one test file in the first commit.

---

## Phase 3: Prove Isolation and Commit

### Entry Criteria
- One file converted.

### Actions
1. Run the converted file twice in random order: `pytest <file> -p randomly -q` (requires `pytest-randomly`) or `pytest <file> --random-order` (requires `pytest-random-order`). Both runs must pass; a rollback leak shows as a unique-constraint or row-count failure in the second test that touches a table.
2. Leak probe: add a temporary test at the end of the file that counts rows in each table the file writes and asserts the count equals the seed count; run it; delete it before commit.
3. Prepare for xdist: if the project will run in parallel, give each worker its own database name from the `worker_id` fixture (`"master"` when not under xdist, else `"gw0"`, `"gw1"` ...): for example `f"app_test_{worker_id}"`. pytest-django does this automatically by suffixing the test database name per worker.
4. Full suite with the baseline command must pass. Commit. Repeat Phase 2 step 5 for the next file.

### Output
Row in `py_db_fixture`.

### Quality Gate
- Two shuffled runs pass.
- The leak probe passed and is not in the commit (`git show --stat HEAD`).
- Full suite has zero failures.

---

## Worked Example

Illustrative. FastAPI with SQLAlchemy 2.0 and Postgres; `db_with_catalog` runs `create_all()` and seeds per test, 118 setups at 0.27 s.

- Phase 1: pattern `schema_per_test`; `needs_commit`: `tests/jobs/test_reindex.py` (worker thread opens its own connection).
- Phase 2: session `engine` fixture plus `db_session` with `join_transaction_mode="create_savepoint"`; catalog seed moved into the session fixture before yield; `app.dependency_overrides[get_db]` set in a `client` fixture. `test_reindex.py` uses `committed_db`.
- Phase 3: `tests/api/test_orders.py` passes in two random orders; leak probe sees 12 products before and after. Files converted one per commit; setup phase total falls from 31.7 s to 3.1 s.

---

## Exit Criteria

DONE when every `database` item is `done`, all non-`needs_commit` tests use the rollback fixture, shuffled runs and a leak probe pass per converted file, and the full suite is green.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Tests fail with "This transaction is inactive" or nested-transaction errors | **Adjust**: confirm SQLAlchemy 2.0 (`pip show sqlalchemy`) and `join_transaction_mode="create_savepoint"`; on 1.4 follow the 1.4 docs recipe with `begin_nested` and the `after_transaction_end` event. |
| Phase 2 | App code creates its own `Session()` instead of using the injected one | **Adjust**: patch the session factory in a fixture to return `db_session`; record the patch target. |
| Phase 3 | Second shuffled run fails with duplicate key | **Return**: a code path commits on a different connection; move that test to `needs_commit`. |
| Phase 3 | DDL inside a test (MySQL implicit commit) | **Adjust**: MySQL commits implicitly on DDL; move schema changes to the session fixture or mark the test `needs_commit`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
