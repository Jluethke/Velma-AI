# Python Ruff Exception Rules Gate

**One-line description:** Turns on the Ruff rules that catch bare and blind excepts, `try`/`except`/`pass`, missing `raise ... from`, `return` in `finally` and logging misuse, fixes or documents every hit, and makes the check fail CI so swallowed exceptions cannot return.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `py_failure_tests` (object, required): From `errh-py-pytest-failure-paths`. The gate goes in only after failure paths are tested.
- `triage_table` (object[], required): From `errh-catch-site-triage`. `keep_boundary` and `keep_documented` rows get inline suppressions.

---

## Outputs

- `py_lint_gate` (object): `{ ruff_version, rules, config_file, suppressions: [ { file, line, rule, reason } ], ci_step }`.

---

## Phase 1: Measure

### Entry Criteria
- `ruff --version` prints a version (install with `uv tool install ruff` or `pip install ruff`).

### Actions
1. Run the rule set without changing config:
   `ruff check --select E722,BLE001,S110,S112,B904,B012,TRY002,TRY003,TRY201,TRY300,TRY400,TRY401,SIM105 --output-format concise --statistics .`
2. Rule meanings (confirm each with `ruff rule <CODE>`):

| Code | Name | Finds |
|---|---|---|
| E722 | bare-except | `except:` |
| BLE001 | blind-except | `except Exception` / `BaseException` without re-raise |
| S110 | try-except-pass | `except ...: pass` |
| S112 | try-except-continue | `except ...: continue` |
| B904 | raise-without-from-inside-except | `raise X` in `except` without `from` |
| B012 | jump-statement-in-finally | `return`/`break`/`continue` in `finally` |
| TRY002 | raise-vanilla-class | `raise Exception(...)` |
| TRY003 | raise-vanilla-args | long message built at the raise site |
| TRY201 | verbose-raise | `raise exc` instead of bare `raise` |
| TRY300 | try-consider-else | success path inside `try` |
| TRY400 | error-instead-of-exception | `logger.error` in `except` (loses traceback) |
| TRY401 | verbose-log-message | exception object repeated in `logger.exception` message |
| SIM105 | suppressible-exception | `try/except/pass` that should be `contextlib.suppress` |

3. Save the statistics output.

### Output
Baseline counts per rule.

### Quality Gate
- `ruff rule <CODE>` succeeded for every code (none unknown to the installed version); unknown codes are removed and recorded.

---

## Phase 2: Fix or Suppress

### Entry Criteria
- Counts recorded.

### Actions
1. For each hit, look up its site in `triage_table`:
   - Row exists with an action already applied: the hit should be gone; if not, fix it the same way.
   - Row is `keep_boundary`: add `# noqa: BLE001  boundary handler, see errh-log-once` on that line.
   - Row is `keep_documented`: add `# noqa: <CODE>` with the contract reason on the same line.
   - No row: apply the Python idiom flow's table to that site.
2. TRY003 is a style rule; if the team rejects it, drop it from the select list and record the decision. Do not drop B904, BLE001, E722, S110 or B012.
3. Do NOT use `ruff check --fix --unsafe-fixes` across the repo. Fix by hand one file at a time and run the tests after each file.
4. Do NOT add a file-wide or `per-file-ignores` suppression for these codes outside `tests/`.

### Output
Clean or suppressed hits.

### Quality Gate
- The Phase 1 command exits 0.
- `rg -n "noqa: (BLE001|E722|S110|B904|B012)" --type py` count equals the number of suppressions recorded, each with a reason after the code.

---

## Phase 3: Enforce in Config and CI

### Entry Criteria
- Phase 1 command exits 0.

### Actions
1. Add to `pyproject.toml` (or `ruff.toml` if the repo uses it):
```toml
[tool.ruff.lint]
extend-select = ["E722", "BLE001", "S110", "S112", "B904", "B012", "TRY002", "TRY201", "TRY300", "TRY400", "TRY401", "SIM105"]

[tool.ruff.lint.per-file-ignores]
"tests/**" = ["S110", "BLE001"]
```
2. Add the CI step: `ruff check --output-format github .` for GitHub Actions (annotations), or `ruff check .` elsewhere.
3. Prove it is live: add a temporary `try:\n    x()\nexcept Exception:\n    pass` to a source file, run `ruff check .`, confirm BLE001 and S110 appear and exit code is 1, then remove it with `git checkout -- <file>`.

### Output
`py_lint_gate`.

### Quality Gate
- `ruff check .` exits 0 on the clean tree and 1 with the planted swallow.
- `test_command` from the run record still passes.

---

## Worked Example

Illustrative.
```
$ ruff check --select E722,BLE001,S110,B904,B012,TRY400 --statistics .
 7  BLE001  blind-except
 4  B904    raise-without-from-inside-except
 2  TRY400  error-instead-of-exception
 1  E722    bare-except
```
After fixes: `app/main.py:88 # noqa: BLE001  boundary handler` is the only suppression. Planted swallow gives `app/x.py:3:8: BLE001 Do not catch blind exception: Exception` and exit 1.

---

## Exit Criteria

DONE when the selected rules pass, every suppression carries a reason and maps to a triage row, the config enforces them, and CI fails on a planted swallow.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Code unknown to installed Ruff | **Adjust**: upgrade Ruff or drop the code and record it; do not guess a replacement code. |
| Phase 2 | Hundreds of TRY003 hits | **Adjust**: drop TRY003 by decision; keep the correctness rules. |
| Phase 2 | Fix breaks tests | **Retry**: revert the file and apply the idiom table; never weaken the test. |
| Phase 3 | Repo uses flake8 instead | **Adjust**: enable `flake8-bugbear` (B904, B012) and `flake8-blind-except` (B902 in that plugin's numbering; confirm in its README). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
