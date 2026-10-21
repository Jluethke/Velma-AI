# Pytest Per-Test Durations Report

**One-line description:** Produces a ranked per-test timing table for a pytest suite, split into setup, call and teardown phases, from `pytest --durations=0` and the JUnit XML `time` attribute, so slow tests and slow fixtures are named with seconds instead of guessed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `test_command` (string, required): The pytest command used in the baseline (for example `pytest` or `python -m pytest tests/`).
- `baseline_report` (object, required): From `tsp-baseline-lock`; provides the green pass state and the commit.

---

## Outputs

- `py_duration_report` (object): Ranked rows of `nodeid`, phase (`setup`, `call`, `teardown`) and seconds; per-file totals; total of the setup phase versus the call phase; collection time; the raw files `durations.txt` and `junit.xml`.

---

## Phase 1: Capture Durations

### Entry Criteria
- `baseline_report` shows a green run at the current commit (`git rev-parse HEAD` matches).

### Actions
1. Run with every phase reported, including tiny ones:
   `<test_command> --durations=0 --durations-min=0 -vv -p no:randomly --junitxml=junit.xml 2>&1 | tee durations.txt`
2. Why each flag: `--durations=0` lists all phases, not only the slowest N; `--durations-min=0` removes the documented default floor of 0.005 s; `-vv` keeps short entries; `-p no:randomly` keeps order fixed if `pytest-randomly` is installed (if pytest reports `unrecognized` or that the plugin is not found, drop that flag).
3. Measure collection alone: `time <test_command> --collect-only -q > /dev/null`. Record `real`.
4. Do NOT run with `-x` or `--lf`. A partial run hides slow tests.

### Output
`durations.txt`, `junit.xml`, collection time.

### Quality Gate
- `durations.txt` contains a section headed `slowest durations`.
- `junit.xml` exists and its `<testsuite tests="...">` value equals the test count in `baseline_report` (skips included).

---

## Phase 2: Parse and Rank

### Entry Criteria
- Raw files exist.

### Actions
1. Each durations line has the shape `0.84s setup    tests/api/test_orders.py::test_refund`. Extract seconds, phase and nodeid. A shell one-liner that does this:
   `grep -E '^[0-9.]+s (setup|call|teardown) ' durations.txt | sort -rn > ranked.txt`
2. Sum by phase: `awk '{gsub("s","",$1); t[$2]+=$1} END {for (p in t) print p, t[p]}' ranked.txt`.
3. Sum by file: strip `::...` from the nodeid and total per file. Rank files.
4. Find fixture-heavy tests: a test whose `setup` seconds exceed its `call` seconds. List them; this is the input for `tsp-py-setup-import-cost`.
5. Cross-check against `junit.xml`: each `<testcase time="...">` is setup plus call plus teardown for that test. Spot check the top 5 rows match within the rounding of the printed values.

### Output
Ranked rows, per-phase totals, per-file totals.

### Quality Gate
- The sum of all rows in `ranked.txt` is printed and recorded next to the pytest wall time from `durations.txt` last line; the difference is recorded as non-test overhead (collection, plugin start, session fixtures counted in the first test's setup).
- Every row in `py_duration_report` came from `ranked.txt` (no hand-typed values).

---

## Phase 3: Annotate for Classification

### Entry Criteria
- Ranked rows exist.

### Actions
1. For every row, in rank order, record one signal from this table. Use grep over the test file first (for example `grep -nE "time\.sleep|asyncio\.sleep" <file>`) and open the test only to confirm the hit is inside that test or its fixtures. No row is skipped; the ranking only decides the order of later work.

| Signal in code | Record as |
|---|---|
| `time.sleep(`, `asyncio.sleep(`, `wait_for` loops with fixed waits | `sleep` |
| `requests.`, `httpx.`, `urllib`, boto3 clients, SMTP, gRPC stubs pointing outside localhost | `network` |
| `@pytest.mark.django_db(transaction=True)`, `TRUNCATE`, `create_all()`, migrations in a fixture | `database` |
| Setup seconds larger than call seconds | `fixture_setup` |
| `subprocess`, `docker`, Selenium or Playwright | `process_or_browser` |
| None of the above | `cpu_in_test` |

2. Note the fixture names with `scope="function"` used by rows tagged `fixture_setup` (`grep -n "@pytest.fixture" -r tests conftest.py`).
3. Do NOT edit any test in this flow. It only measures.

### Output
`py_duration_report` with a signal column.

### Quality Gate
- Every annotated row has exactly one signal from the table and the file and line that justified it.
- `git status --porcelain` shows no modified source or test files.

---

## Worked Example

Illustrative. `test_command=pytest`, 412 tests.

- Phase 1: `durations.txt` ends with `412 passed, 3 skipped in 82.10s`; collection `real 4.61s`.
- Phase 2: top of `ranked.txt`:
  `6.02s call     tests/notify/test_email.py::test_retry_backoff`
  `3.40s setup    tests/api/test_orders.py::test_refund`
  `3.38s setup    tests/api/test_orders.py::test_cancel`
  Phase totals: `setup 31.7`, `call 44.9`, `teardown 1.2`.
- Phase 3: `test_retry_backoff` gets `sleep` (line 41 `time.sleep(2)` inside a retry loop); the two `test_orders.py` rows get `fixture_setup` (fixture `db_with_catalog`, function scope, runs `create_all()`).

---

## Exit Criteria

DONE when `py_duration_report` holds ranked rows with phase, per-phase and per-file totals, collection time, and a signal for every row, all copied from the saved raw files.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | pytest older than 6.2 rejects `--durations-min` | **Adjust**: drop the flag and record that entries under 0.005 s are hidden. |
| Phase 1 | Run fails although the baseline was green | **Stop**: the suite is nondeterministic; record the failing test and hand it to a flaky-test workflow before timing. |
| Phase 2 | `junit.xml` test count differs from baseline | **Retry**: confirm the same `test_command` and same markers (`-m`) were used. |
| Phase 3 | A test has two signals | **Adjust**: record the one with more seconds in its phase (setup signal if setup seconds dominate, else the call signal). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
