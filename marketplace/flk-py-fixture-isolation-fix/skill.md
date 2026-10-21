# Pytest Fixture Isolation Fix

**One-line description:** Removes state shared between pytest tests by fixing the polluter at its source: narrowing fixture scope, replacing direct mutation with `monkeypatch`, fixed paths with `tmp_path`, unclosed patches with context managers, and adding teardown that resets caches, process settings and database rows.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_cause_evidence` (object, required): Polluter test id and mechanism hint from the order report.
- `flake_class` (string, required): `shared_state` or `test_order`.
- `baseline_command` (string, required): Two-test reproduction or seed loop.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `py_fixture_fix_diff` (string): Unified diff with a note per hunk naming the leaked state it now resets.

---

## Phase 1: Name The Leaked State

### Entry Criteria
- `flake_class` is `shared_state` or `test_order`. Otherwise return an empty diff.

### Actions
1. Open the polluter (or, for `shared_state` with no polluter, the victim itself plus every fixture it requests). List fixtures in play: `python -m pytest "<test_id>" --setup-show -q` prints each fixture's SETUP and TEARDOWN with its scope letter (`S`, `P`, `M`, `C`, `F` for session, package, module, class, function).
2. Write down the exact state that survives the test: the object, attribute, env var, file path, cache, table, or process setting.
3. Find who else touches it: `grep -rn "<name>" <repo_path>/tests <repo_path>/src`.

### Output
The leaked state and every reader and writer of it.

### Quality Gate
- `--setup-show` output is recorded, and the leaked state is one named thing with file:line of the write.

---

## Phase 2: Apply The Isolation Fix

### Entry Criteria
- Leaked state named.

### Actions
1. Fix where the state is written (usually the polluter or a shared fixture), not in the victim. Use:

| Leaked state | Fix |
|---|---|
| Module attribute or global assigned in a test | `monkeypatch.setattr(module, "NAME", value)`; restored automatically at teardown |
| `os.environ` changed | `monkeypatch.setenv("KEY", "v")` / `monkeypatch.delenv("KEY", raising=False)` |
| `mock.patch(...).start()` without stop | `with mock.patch(...):` or `mocker.patch(...)` (pytest-mock, if installed) which undoes at teardown |
| Fixed file path | `tmp_path` (function scope) or `tmp_path_factory.mktemp("x")` for wider scopes |
| `functools.lru_cache` / `cache` result | Autouse fixture in the nearest `conftest.py`: `yield` then `func.cache_clear()` |
| `decimal.getcontext()` changes | `with decimal.localcontext() as ctx:` inside the test |
| `os.chdir` | `monkeypatch.chdir(tmp_path)` |
| `sys.path` / `sys.modules` edits | `monkeypatch.syspath_prepend(...)`; `monkeypatch.delitem(sys.modules, "name", raising=False)` |
| `logging` handlers or levels | `caplog.set_level(...)` (restored at teardown) |
| `locale.setlocale` | Save with `locale.setlocale(locale.LC_ALL)` (no second argument returns the current value) and restore in `yield` teardown |
| Module- or session-scoped fixture object mutated by tests | Change scope to `function`, or return a fresh copy (`copy.deepcopy`) per test from a function-scoped wrapper fixture |
| Database rows committed | Wrap each test in a transaction rolled back in teardown; Django: use `db` fixture (transaction per test) not `transactional_db` unless the test needs commits; SQLAlchemy: bind the session to a connection with an outer transaction and roll it back |
| Singleton or registry in product code | Add a reset function in product code used by an autouse fixture, or inject the dependency |

2. Teardown goes after `yield` in the fixture. Code after `yield` runs even when the test fails; code at the end of a test body does not.
3. Change one fixture or one test at a time and rerun `baseline_command` once after each.
4. Do NOT add `@pytest.mark.order`, `pytest-order`, `-p no:randomly` or a fixed seed to make the order "safe". Do NOT delete the polluter or weaken its assertions.

### Output
Edited tests or fixtures.

### Quality Gate
- `baseline_command` (the two-test reproduction) passes once.
- The victim still passes alone: `python -m pytest "<victim>" -q` exit code 0.

---

## Phase 3: Prove Both Orders And Produce The Diff

### Entry Criteria
- Fix applied.

### Actions
1. Run polluter then victim and victim then polluter, both with `-p no:randomly`; both must pass.
2. Run the polluter's whole file and the victim's whole file under a fresh seed: `python -m pytest <both files> -p randomly --randomly-seed=<new int> -q`.
3. `git -C <repo_path> diff > flk-py-fix.diff`; copy into `py_fixture_fix_diff`; delete the file.

### Output
`py_fixture_fix_diff`.

### Quality Gate
- Both two-test orders exit 0, outputs recorded.
- `git diff --stat` lists only files named in Phase 1.

---

## Worked Example

Illustrative. Polluter `tests/api/test_pricing.py::test_eur_rounding_mode` sets `decimal.getcontext().rounding = ROUND_DOWN`.

- Phase 1: `--setup-show` shows only function fixtures; the leaked state is the thread's decimal context, written at `test_pricing.py:22`.
- Phase 2: replaced with `with decimal.localcontext() as ctx: ctx.rounding = ROUND_DOWN` around the two lines that need it.
- Phase 3: both orders print `2 passed`; seed 5150 run prints `46 passed`. Diff: 1 file, 3 insertions, 2 deletions.

---

## Exit Criteria

DONE when the leaked state is reset at its source, both two-test orders pass, and the diff touches only the named files.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `flake_class` not matched | **Return**: empty diff. |
| Phase 2 | Narrowing scope makes the suite much slower (expensive fixture) | **Adjust**: keep the wide-scope resource but hand each test a fresh copy or a rolled-back transaction. |
| Phase 2 | State lives in product code with no reset | **Adjust**: add a reset or injection point in product code; note it as a product change. |
| Phase 3 | Reverse order now fails | **Adjust**: the fix moved the leak; return to Phase 1 with the new failure. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
