# Pytest Setup and Import Cost Profile

**One-line description:** Measures where a pytest suite spends time before test bodies run: collection and import time with `python -X importtime`, fixture setup per scope with `--setup-show`, and session start with `--collect-only`, then names the fixtures whose scope can widen safely.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `test_command` (string, required): Baseline pytest command.
- `py_duration_report` (object, required): From `tsp-py-durations-report`; lists rows tagged `fixture_setup` and the collection time.

---

## Outputs

- `py_setup_cost` (object): Collection seconds, the slowest imports (module, cumulative microseconds), fixture table (name, scope, setup count, seconds per setup, total seconds), plugin list, and a scope-widening candidate list with the safety check result for each.

---

## Phase 1: Collection and Import Cost

### Entry Criteria
- `py_duration_report` exists and records collection time.

### Actions
1. Time collection three ways and record each `real`:
   - `time <test_command> --collect-only -q > /dev/null`
   - `time python -c "import <top_level_package>"`
   - `time python -m pytest --version` (plugin load floor)
2. Get the import tree for the test session: `python -X importtime -m pytest --collect-only -q 2> importtime.txt > /dev/null`.
3. Rank by cumulative time: `sort -t'|' -k2 -n -r importtime.txt | head -40`. Lines look like `import time:      1203 |     412877 | sqlalchemy.orm`; the second column is cumulative microseconds.
4. List loaded plugins: the header of `pytest -v` prints `plugins: xdist-3.6.1, cov-5.0.0, ...`. Record it.
5. Check for `conftest.py` files that import heavy modules at top level: `grep -n "^import\|^from" $(find . -name conftest.py -not -path "./.venv/*")`.

### Output
Collection and import block of `py_setup_cost`.

### Quality Gate
- `importtime.txt` exists and the ranked top rows are copied from it.
- The three `real` values are recorded as printed.

---

## Phase 2: Fixture Setup Cost

### Entry Criteria
- Phase 1 complete.

### Actions
1. Show fixture setup and teardown order for the files that hold `fixture_setup` rows:
   `<test_command> <file> --setup-show -q -p no:randomly > setup-show.txt`
   Lines read `SETUP    S db_engine`, `SETUP    F db_session (fixtures used: db_engine)`. The letter is the scope: `S` session, `P` package, `M` module, `C` class, `F` function.
2. Count setups per fixture: `grep -oE "SETUP +[SPMCF] [a-zA-Z0-9_]+" setup-show.txt | sort | uniq -c | sort -rn`.
3. Get seconds per setup: in `py_duration_report`, the `setup` phase seconds of a test that uses only one expensive function-scoped fixture is that fixture's cost. Where a test uses several, time the fixture alone with a probe test in a scratch file outside the repo, or use `pytest --durations=0` on a test that requests only that fixture.
4. Total seconds per fixture = setup count times seconds per setup. Rank.

### Output
Fixture table.

### Quality Gate
- Every fixture row has a scope letter copied from `setup-show.txt` and a setup count from the `uniq -c` output.
- No probe file is left inside `repo_path` (`git status --porcelain` shows nothing new).

---

## Phase 3: Scope-Widening Safety Check

### Entry Criteria
- Fixture table ranked.

### Actions
1. For each fixture, in rank order, answer these questions by reading its code. Widening to `module` or `session` is allowed only when every answer is "no":

| Question | How to check |
|---|---|
| Does any test mutate the object the fixture returns? | `grep -n "<fixture_name>\." tests/` and look for assignment, `.append`, `.update`, `.delete`, `session.add` |
| Does the fixture yield a DB session or connection that tests commit through? | Body contains `session`, `connection`, `commit` |
| Does it depend on a function-scoped fixture (`tmp_path`, `monkeypatch`, `request.param` of a function-scoped parametrize)? | pytest raises `ScopeMismatch` if you widen; check the signature |
| Does it patch globals, env vars, or time? | Body contains `monkeypatch`, `mock.patch`, `os.environ` |

2. If every answer is "no", record the fixture as a candidate with the target scope. If any answer is "yes", record it as "not widenable" and route DB fixtures to `tsp-py-db-transaction-rollback`.
3. For read-only data that tests mutate, record the alternative: keep an expensive `session` fixture that builds the data once and a cheap `function` fixture that returns `copy.deepcopy()` of it.
4. Do NOT change fixture scopes in this flow. It produces the list; changes happen one at a time in the fix flows with a test run after each.

### Output
`py_setup_cost` with candidates.

### Quality Gate
- Every candidate row shows four "no" answers with the grep or line that supports each.
- Every "not widenable" row names the question that failed.

---

## Worked Example

Illustrative. Collection `real 4.61s`; `python -c "import shop"` `real 2.90s`.

- Phase 1: `importtime.txt` top rows: `412877 | sqlalchemy.orm`, `388102 | shop.reports` (imports `matplotlib` at module top). `conftest.py` line 3 `from shop.reports import render_all`.
- Phase 2: `uniq -c` shows `118 SETUP    F db_with_catalog` and `1 SETUP    S db_engine`. A probe test requesting only `db_with_catalog` shows `0.27s setup`, total about 31.9 s.
- Phase 3: `db_with_catalog` calls `session.add_all(...)` and tests call `session.commit()`, so it is "not widenable", routed to the DB rollback flow. `pricing_table` (function scope, 0.4 s, 60 setups) is never mutated and takes no function-scoped fixtures, so it is a `session` candidate.

---

## Exit Criteria

DONE when `py_setup_cost` records collection and import costs from saved output, a ranked fixture table with scopes and counts, and a widening decision with evidence for each fixture.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `-X importtime` output is empty | **Adjust**: confirm Python 3.7 or newer with `python --version`; stderr must be redirected with `2>`. |
| Phase 2 | `--setup-show` output too long to read | **Adjust**: run it per file from the ranked list instead of the whole suite. |
| Phase 3 | A fixture is used through `@pytest.mark.usefixtures` only | **Adjust**: grep for the fixture name as a string in `usefixtures(` and include those tests in the mutation check. |
| Phase 3 | Unsure whether a test mutates the object | **Stop**: mark it "not widenable"; an unproven widening causes order-dependent failures. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
