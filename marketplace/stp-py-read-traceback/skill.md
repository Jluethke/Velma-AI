# Read a Python Traceback and pytest Failure Output Correctly

**One-line description:** Reads a failing Python run the right way round (exception line at the bottom first, then the deepest frame inside the repo, skipping site-packages frames), maps the exception class and pytest markers (`E`, `>`, `ERROR collecting`, short test summary) to a cause class with a fixed table, and names the single next action.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `verify_result` (object, required): From `stp-run-verify-capture`, with `all_passed` false.
- `applied_edit` (object, required): From `stp-apply-one-edit`.

---

## Outputs

- `py_error_diagnosis` (object): `{ "exception": str, "message": str, "repo_frame": "file:line", "in_edited_hunk": bool, "cause_class": "EDIT_TEXT_WRONG"|"API_WRONG"|"PLAN_WRONG"|"TEST_SELECTOR_WRONG"|"ENVIRONMENT"|"EXPECTED_INTERMEDIATE", "evidence_lines": [str], "next_action": str }`.

---

## Phase 1: Find the Exception Line and the Repo Frame

### Entry Criteria
- At least one run in `verify_result.runs` has a non-zero exit code.

### Actions
1. Open the log of the first failing run (lowest level). Read it from the bottom up.
2. Plain traceback (L0 `py_compile`, a script, or an import): the last line is `ExceptionType: message`. Above it, frames read `File "path", line N, in func` followed by the source line. The LAST frame is where the exception was raised; the first frame whose path is inside the repo (not containing `site-packages`, `dist-packages`, `lib/python3`, `<frozen`) and nearest the bottom is `repo_frame`.
3. Chained exceptions: "During handling of the above exception, another exception occurred" or "The above exception was the direct cause of the following exception" means there are two tracebacks. The bottom one is what was raised last; the top one is often the real cause. Read both exception lines.
4. pytest output: find the section for the failing test (`____ test_name ____`). Inside it:
   - Lines starting with `>` mark the source line being executed when it failed.
   - Lines starting with `E` are the exception and, for asserts, pytest's comparison (`E       AssertionError: assert 'crme-brle' == 'creme-brulee'`, then `E         - creme-brulee` and `E         + crme-brle`, where `-` is the expected right side and `+` is the actual left side in recent pytest versions; check the `assert` line itself to be sure which side is which).
   - The line `path.py:NN: ExceptionType` under the block gives file and line.
   - The `short test summary info` block lists `FAILED nodeid - message` and `ERROR nodeid - message` lines.
5. `SyntaxError`/`IndentationError` print `File "path", line N`, the source line and a `^` caret under the problem; the caret position matters.
6. Set `in_edited_hunk`: true if `repo_frame` file is `applied_edit.file` and its line is inside the hunk range from `applied_edit.diff` (`@@ -a,b +c,d @@` means new lines c to c+d-1).

### Output
`exception`, `message`, `repo_frame`, `in_edited_hunk`.

### Quality Gate
- `exception` and `message` are copied from a log line that `rg -n -F` finds.
- `repo_frame` path contains no `site-packages` or `dist-packages`.

---

## Phase 2: Classify the Cause

### Entry Criteria
- Phase 1 done.

### Actions
1. Apply the first matching row:

| Signal in the log | `cause_class` | `next_action` |
|---|---|---|
| `SyntaxError`, `IndentationError`, `TabError` in the edited file | EDIT_TEXT_WRONG | revert; fix `new_text` at the caret position; re-lock |
| `NameError: name 'x' is not defined` | EDIT_TEXT_WRONG if `x` should come from an import in the plan, else PLAN_WRONG | revert; add the missing import edit before this edit |
| `AttributeError: module 'm' has no attribute 'x'` or `'T' object has no attribute 'x'` | API_WRONG | revert; send `m.x` back to `stp-py-api-exists-check` |
| `TypeError: f() got an unexpected keyword argument 'k'` or `takes N positional arguments but M were given` | API_WRONG | revert; re-check the signature |
| `ImportError: cannot import name 'x' from 'm'` | API_WRONG | revert; re-check what `m` exports |
| `ModuleNotFoundError: No module named 'm'` | ENVIRONMENT if `m` is a third-party package; EDIT_TEXT_WRONG if `m` is a repo module path typo | revert; stop if environment |
| pytest `ERROR collecting <file>` | the exception under it decides (usually an import-time error above) | apply this table to that exception |
| pytest `fixture 'x' not found` | PLAN_WRONG | revert; read `conftest.py` for available fixtures (`pytest --fixtures <file>`) |
| pytest exit code 5 or `no tests ran` / `ERROR: not found: <nodeid>` | TEST_SELECTOR_WRONG | fix the node id on the card; nothing to revert if the edit compiled |
| `AssertionError` with actual and expected shown, and `expected_signal` predicted this failure | EXPECTED_INTERMEDIATE | keep the edit |
| `AssertionError` not predicted | PLAN_WRONG | revert; the fix logic is wrong; re-read the context around `repo_frame` |
| mypy `error: ... [code]` or ruff `F401`, `E501`, etc. on a line you added | EDIT_TEXT_WRONG | revert; fix the reported line |
| same lint or type error on a line you did not touch | check `baseline_report.preexisting_failures` in the next flow | no action here |

2. Copy two to five log lines that prove the row into `evidence_lines`.
3. Never treat the fix as "change the test's expected value". If the test asserts the behavior in `goal_check`, the test is right and the code is wrong.

### Output
`py_error_diagnosis`.

### Quality Gate
- `cause_class` is one value from the table and its row's signal text appears in `evidence_lines`.
- `next_action` does not mention editing, skipping or deleting a test assertion, unless the test was added by this chain in the same edit and `cause_class` is EDIT_TEXT_WRONG for a syntax error inside it.

---

## Worked Example

Illustrative only.

E3 attempt 1 was typed with `unicodedata.strip_accents` (a name that does not exist) instead of the locked `unicodedata.normalize`. L1 log:

```
tests/test_slugify.py:11: in test_strips_accents
    assert slugify("Crème Brûlée") == "creme-brulee"
slugkit/core.py:16: in slugify
    text = unicodedata.strip_accents(text)
E   AttributeError: module 'unicodedata' has no attribute 'strip_accents'
=========================== short test summary info ============================
FAILED tests/test_slugify.py::test_strips_accents - AttributeError: module 'unicodedata' has no attribute 'strip_accents'
```

- Phase 1: `exception` `AttributeError`, `repo_frame` `slugkit/core.py:16`, inside the hunk, so `in_edited_hunk` true.
- Phase 2: row API_WRONG; `next_action` "revert E3; the applied text differs from the locked plan; re-apply the locked `new_text` exactly". Python 3.10 and later sometimes append a "Did you mean: 'x'?" hint; treat it as a lead, not as evidence, until `stp-py-api-exists-check` confirms the name.

---

## Exit Criteria

DONE when the diagnosis names the exception, the repo frame, whether it is inside the edited hunk, one cause class from the table with quoted evidence lines, and one next action.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Log has no traceback and no pytest section (process killed) | **Return**: `ENVIRONMENT` with the last ten lines as evidence. |
| Phase 1 | Every frame is in site-packages | **Adjust**: use the last repo frame above them (the call into the library). |
| Phase 2 | No table row matches | **Return**: `PLAN_WRONG` with the exception line; the stop flow decides whether to continue. |
| Phase 2 | Error is in a file the edit did not touch | **Return**: set `in_edited_hunk` false; baseline comparison happens next. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
