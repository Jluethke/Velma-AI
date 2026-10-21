# Unit vs Integration Test Choice

**One-line description:** Decides, per acceptance criterion, whether the proving test is a unit test, an integration test or an end-to-end test using a fixed decision table based on what the observable is and which boundaries it crosses, and names the existing test file, fixture and pattern to copy.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `acceptance_criteria` (object[], required): Output of `tkt-acceptance-criteria-gwt`.
- `impact_list` (object[], required): Output of `tkt-change-impact-list`.

---

## Outputs

- `test_plan` (object[]): One row per acceptance criterion: test level, target test file (existing or new path), fixture or helper to reuse, the existing test to copy as a pattern (file:line), what to fake and what to keep real, and the single-test command.

---

## Phase 1: Classify Each Criterion

### Entry Criteria
- Every acceptance criterion has a test hint (observable).

### Actions
1. For each criterion, answer the questions in order and stop at the first "yes":

| # | Question | If yes, level |
|---|---|---|
| 1 | Is the observable only a return value or raised error of one function or class, given its arguments? | unit |
| 2 | Is the observable an HTTP status/body, a CLI exit code/output, or a rendered component, with the logic in this repo and no real external service needed? | integration (in-process: test client, CLI runner, component render) |
| 3 | Does the observable depend on real SQL behavior (constraints, transactions, query semantics, migrations)? | integration with a real database of the same engine and major version as production |
| 4 | Does it depend on a message broker, cache or another service's real protocol? | integration with that service in a container, or a contract test if the repo already has them |
| 5 | Does it need a real browser, multiple deployed services, or real third-party APIs? | end-to-end (only if the repo already has an e2e suite; else integration plus a note) |

2. Rules that override the table:
   - Never fake the database to test SQL. An in-memory SQLite substitute for PostgreSQL gives different results for types, constraints and locking.
   - Mock only at the boundary you do not own (third-party HTTP API, clock, randomness). Do not mock the function under test or its direct in-repo collaborators.
   - A bug that only shows across a boundary needs a test at that boundary; a unit test that mocks the boundary will pass while the bug remains.
3. Record the level and the reason (question number).

### Output
Level per criterion.

### Quality Gate
- Every criterion has a level and the question number that decided it.
- No criterion with question 3 is planned against a substitute database engine.

---

## Phase 2: Find the Pattern to Copy

### Entry Criteria
- Levels assigned.

### Actions
1. Find existing tests of the same level near the changed code. Stack-specific searches:

| stack | Unit test location | Integration helpers to search for |
|---|---|---|
| python (pytest) | `tests/` mirroring `src/` | `rg -n 'TestClient\(|AsyncClient\(|CliRunner\(|@pytest.fixture' tests/conftest.py tests/**/conftest.py`; markers `rg -n 'pytest.mark\.' pyproject.toml` |
| node (jest/vitest) | `*.test.ts` beside source or in `__tests__/` | `rg -n 'supertest|request\(app\)|render\(|setupServer\(|testcontainers' -g '*.test.*'` |
| go | `*_test.go` in the same package | `rg -n 'httptest\.|testcontainers|TestMain\(' --type go`; build tags `//go:build integration` |
| rust | `#[cfg(test)] mod tests` in the source file | integration tests in `tests/*.rs`; `rg -n '#\[tokio::test\]|sqlx::test' --type rust` |

2. Pick the closest existing test (same module, same level) and record its file:line as the pattern to copy. Matching its fixtures and naming keeps the suite consistent.
3. Decide the target file: add to the existing test file for that module if one exists; create a new file only when none exists, using the repo's naming (`test_<module>.py`, `<module>.test.ts`, `<module>_test.go`, `tests/<feature>.rs`).
4. Record the single-test command using the baseline report's `test_single` pattern.
5. Check how integration tests are selected in CI (markers, build tags, separate job). If integration tests are excluded from the default run, record the exact command that runs them, for example `pytest -m integration`, `go test -tags=integration ./...`, `cargo test --test <name>`.

### Output
`test_plan`.

### Quality Gate
- Every row names a pattern test by file:line that exists (open it to check).
- Every row has a single-test command, and integration rows state how CI selects them.

---

## Worked Example

Illustrative only. PAY-412, Python FastAPI service with PostgreSQL.

```
AC1 export returns CSV          Q2 integration  tests/api/test_export.py (new)  pattern tests/api/test_invoices.py:22 (TestClient + db fixture)
AC2 header and column order     Q1 unit         tests/api/test_responses.py     pattern tests/api/test_responses.py:10
AC3 status filter               Q3 integration  tests/api/test_export.py        real Postgres via fixture `pg_db` in tests/conftest.py:31
AC4 role without access 403     Q2 integration  tests/api/test_export.py        pattern tests/api/test_auth.py:48 (fixture `client_as`)
AC5 above limit returns 202     Q2 integration  tests/api/test_export.py        fake: job queue enqueue (third-party broker client)
```

```
$ rg -n 'markers' -A 3 pyproject.toml
42:markers = [
43:  "integration: needs the docker-compose database",
$ rg -n 'pytest -m' .github/workflows/ci.yml
37:      run: uv run pytest -m integration
```

Single-test command for AC3: `uv run pytest -m integration tests/api/test_export.py::test_export_respects_status_filter`.

---

## Exit Criteria

DONE when each acceptance criterion has a level decided by the table, a target test file, an existing pattern test to copy, a single-test command, and the CI selection rule for integration tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Criterion fits no row | **Adjust**: the observable is unclear; return it to `tkt-acceptance-criteria-gwt` for a sharper Then line. |
| Phase 1 | Question 5 applies but the repo has no e2e suite | **Adjust**: plan an integration test plus a manual verification note in the PR; do not build an e2e framework inside this ticket. |
| Phase 2 | No integration test infrastructure exists | **Stop**: ask the owner whether adding it is in scope. |
| Phase 2 | Pattern test is itself skipped or flaky in the baseline | **Adjust**: choose the next closest pattern. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
