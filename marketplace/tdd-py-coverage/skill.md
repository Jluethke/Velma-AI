# TDD Python Coverage With coverage.py

**One-line description:** Measures line and branch coverage of a Python test suite with coverage.py (directly or through pytest-cov), reads the Missing column including partial branches such as `12->15`, and maps each uncovered line to a missing behavior or dead code instead of chasing a percentage.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `refactored_code` (object, required): Files and suite result from `tdd-refactor-under-green`.
- `test_runner` (string, required): `pytest` or `unittest`.
- `coverage_floor` (number, optional): A minimum total percentage set by the user or project policy. When absent, no pass/fail threshold is applied.

---

## Outputs

- `coverage_report` (object): Total percent, per-file statements, missing lines and partial branches, the report command, and the paths of `.coverage`, `coverage.xml` or `htmlcov/`.
- `uncovered_lines` (object[]): Each uncovered line or branch with file, line, classification (missing behavior, dead code, defensive only, excluded) and the action taken.

---

## Phase 1: Configure and Run

### Entry Criteria
- Full suite green.

### Actions
1. Install: `python -m pip install coverage` (and `pytest-cov` if `test_runner` is pytest and the project prefers it).
2. Add configuration to `pyproject.toml` (or `.coveragerc`), naming the package so files never imported still show as 0 percent:

```toml
[tool.coverage.run]
branch = true
source = ["mypkg"]

[tool.coverage.report]
show_missing = true
skip_covered = false
exclude_also = [
    "if TYPE_CHECKING:",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
]
```

`exclude_also` needs coverage.py 7.2 or newer (check `coverage --version`); older versions use `exclude_lines`, which replaces the defaults instead of adding to them.
3. Run:

| test_runner | Command |
|---|---|
| pytest (coverage.py directly) | `coverage run -m pytest -q` then `coverage report` |
| pytest (pytest-cov) | `python -m pytest --cov=mypkg --cov-branch --cov-report=term-missing -q` |
| unittest | `coverage run -m unittest discover -s tests -t .` then `coverage report` |

4. For an HTML view: `coverage html` writes `htmlcov/index.html`. For CI tools: `coverage xml` writes `coverage.xml` (Cobertura format).

### Output
Coverage data and a terminal report.

### Quality Gate
- The report lists every module under `source`, including ones with 0 percent.
- The report header shows `Branch` and `BrPart` columns (branch measurement is on).

---

## Phase 2: Read the Report

### Entry Criteria
- Report printed.

### Actions
1. Read each row: `Name  Stmts  Miss  Branch  BrPart  Cover  Missing`.
   - `Miss` counts statements never run.
   - `BrPart` counts branches where only one direction ran.
   - In `Missing`, `14-17` means lines 14 to 17 never ran; `22->25` means the branch from line 22 to line 25 never happened (for example the `if` was always true); `22->exit` means the function never returned from line 22 by that path.
2. List every missing line and partial branch in `uncovered_lines`.
3. Do NOT add `# pragma: no cover` to lines only because they are uncovered.

### Output
Draft `uncovered_lines`.

### Quality Gate
- Every entry in the `Missing` column for files in `refactored_code` appears in `uncovered_lines`.

---

## Phase 3: Classify and Act

### Entry Criteria
- Draft list exists.

### Actions
1. Classify each line with this table:

| Line is... | Classification | Action |
|---|---|---|
| Logic that a requirement describes (a branch for an error case, a boundary) | missing behavior | add a row to `behavior_list` and drive it with `tdd-red-one-failing-test` |
| Code no requirement asks for and no caller reaches | dead code | delete it under green (`tdd-refactor-under-green`, Remove Dead Code) |
| Defensive check for a state the type system or caller already rules out | defensive only | keep; add `# pragma: no cover` with a one-line reason only if the project's policy allows pragmas |
| Debug, `__repr__`, platform branch for another OS | excluded | add a targeted pattern to `exclude_also` |

2. Never write a test that executes a line without asserting its effect. Coverage counts execution, not checking; mutation testing (`tdd-py-mutmut`) will expose assertion-free tests.
3. If `coverage_floor` is given, run `coverage report --fail-under=<coverage_floor>` and record the exit code (2 when below the floor). If it is not given, report the total without a verdict.

### Output
`coverage_report`, `uncovered_lines`.

### Quality Gate
- Every entry in `uncovered_lines` has a classification and an action.
- If `coverage_floor` was given, the `--fail-under` exit code is recorded.

---

## Worked Example

Illustrative only. Package `shipping`, `test_runner` = `pytest`.

```
$ coverage run -m pytest -q && coverage report
Name                   Stmts   Miss Branch BrPart  Cover   Missing
------------------------------------------------------------------
shipping/__init__.py       0      0      0      0   100%
shipping/rates.py         18      2      8      1    85%   31-32, 24->27
------------------------------------------------------------------
TOTAL                     18      2      8      1    85%
```

Phase 3:
- `31-32`: raises `UnknownZone` for an unlisted zone. The requirement says unknown zones are rejected: missing behavior, new row B09.
- `24->27`: the `if weight <= 0` check was never true. Requirement says weight must be positive: missing behavior, new row B10.

---

## Exit Criteria

DONE when branch coverage was measured over the whole package, every missing line and partial branch is classified with an action, and any floor check used a user-supplied value.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `No data was collected` warning | **Adjust**: `source` does not match the import name; set it to the importable package name. |
| Phase 1 | Report omits a module | **Adjust**: add it under `source`; modules never imported are only listed when `source` is set. |
| Phase 2 | Lines inside tests show as missed | **Adjust**: limit `source` to the package or add `omit = ["tests/*"]`. |
| Phase 3 | Pressure to reach a number by tests without assertions | **Stop**: assertion-free tests are not allowed; report the real total. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
