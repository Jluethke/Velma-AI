# Python Extract Function with rope

**One-line description:** Extracts a contiguous block of Python statements into a new named function using rope's `ExtractMethod` refactoring, which computes parameters and return values from data flow, then runs the characterization tests and commits the single step.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `test_command` (string, required): Full suite command.
- `characterization_tests` (object, required): From `srf-py-characterization-tests`; must cover the lines being extracted.
- `extract_file` (string, required): Path of the file, relative to `repo_path`, for example `billing/invoice.py`.
- `extract_lines` (string, required): Inclusive line range of whole statements to extract, for example `22-31`.
- `new_function_name` (string, required): snake_case name for the new function, for example `parse_header`.

---

## Outputs

- `step_commits` (string[]): SHA of the commit made by this step.
- `step_log` (object[]): For the step: refactoring name, files changed, test result counts, API check result, commit SHA.

---

## Phase 1: Validate the Selection

### Entry Criteria
- `git status --porcelain` is empty.
- `characterization_tests.target_coverage` shows the lines in `extract_lines` as covered.

### Actions
1. Print the range with line numbers: `sed -n '22,31p' billing/invoice.py | cat -n`.
2. Check the selection against this table. Any "Stop" row means choose a different range:

| Condition in the selected lines | Decision |
|---|---|
| Starts or ends in the middle of a statement, `if` block, `try` block or `with` block | Stop: widen or narrow to whole statements. |
| Contains `return` and code after the range still runs on other paths | Stop: rope cannot keep both exits; extract a smaller block. |
| Contains `yield` or `await` | Stop for this flow; extract by hand and test, or pick a range without them. |
| Contains `break` or `continue` that targets a loop outside the range | Stop. |
| Assigns two or more variables used after the range | Allowed: rope returns a tuple. Note it in `step_log`. |
| Uses `nonlocal` or `global` | Stop; extract by hand only after reading the scope rules. |

3. `git grep -n "def <new_function_name>\b"` must find nothing in the same module; a duplicate name would shadow.
4. `pip show rope` must succeed; if not, `pip install rope` into the dev environment.

### Output
Approved line range.

### Quality Gate
- The range starts and ends on statement boundaries at the same indentation.
- No "Stop" row from the table applies.
- The new name is unused in the module.

---

## Phase 2: Run the Refactoring

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Write a throwaway script outside the repo, for example `/tmp/rope_extract.py` (on Windows use the system temp folder). Never save it inside `repo_path`:
```python
import sys
from rope.base.project import Project
from rope.refactor.extract import ExtractMethod

repo, rel, first, last, name = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
project = Project(repo, ropefolder=None)  # ropefolder=None: do not create .ropeproject
res = project.get_resource(rel)
lines = res.read().splitlines(keepends=True)
start = sum(len(l) for l in lines[: first - 1])
start += len(lines[first - 1]) - len(lines[first - 1].lstrip())  # skip indentation
end = sum(len(l) for l in lines[:last]) - 1  # before the final newline
changes = ExtractMethod(project, res, start, end).get_changes(name)
print(changes.get_description())
if "--apply" in sys.argv:
    project.do(changes)
project.close()
```
2. Preview: `python /tmp/rope_extract.py . billing/invoice.py 22 31 parse_header`. Read the printed diff. Confirm the new `def parse_header(...)` signature lists the inputs the block reads and that the call site assigns its return value.
3. If the block uses `self`, rope creates a method. If you need a module-level function instead, check the rope docs for the `global_` argument of `get_changes`; do not guess.
4. Apply: same command plus `--apply`.
5. `git diff --stat` must show exactly one file changed: `extract_file`. If more files changed, run `git checkout -- .` and stop.
6. Do NOT hand-edit the extracted code in this step (no renames, no cleanups). Cleanups are separate steps with their own commit.

### Output
One-file diff containing the new function and its call.

### Quality Gate
- `git diff --stat` lists only `extract_file`.
- `python -m py_compile billing/invoice.py` exits 0.

---

## Phase 3: Verify and Commit

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Run the characterization tests command from `characterization_tests`, then the full `test_command`.
2. If `.refactor/` contains a griffe baseline, run the recorded `griffe check ... --against <baseline_commit>` command.
3. Apply this table:

| Result | Action |
|---|---|
| All green, API check silent | Commit: `git commit -am "refactor: extract parse_header from parse_invoice"` |
| Any test fails | Run `git checkout -- billing/invoice.py`. Read the failure. Retry Phase 1 with a smaller range. Never edit a test or a snapshot to match. |
| API check reports a breakage | Revert as above; extracting must not change public names. |

4. Record the SHA from `git rev-parse HEAD` in `step_commits` and fill `step_log`.

### Output
`step_commits`, `step_log`.

### Quality Gate
- Test counts equal the baseline counts plus any characterization tests, with zero failures.
- `git show --stat HEAD` lists one source file.
- `git status --porcelain` is empty.

---

## Worked Example

Illustrative only. `extract_file=billing/invoice.py`, `extract_lines=22-31`, `new_function_name=parse_header`.
```
$ python /tmp/rope_extract.py . billing/invoice.py 22 31 parse_header
Extract method <parse_header>:
--- a/billing/invoice.py
+++ b/billing/invoice.py
-    head = text.splitlines()[0]
-    number, date_s, total_s = head.split("|")
...
+    number, issued, total = parse_header(text)
+def parse_header(text):
+    head = text.splitlines()[0]
...
+    return number, issued, total
$ python /tmp/rope_extract.py . billing/invoice.py 22 31 parse_header --apply
$ pytest -q
215 passed, 2 skipped in 9.52s
$ git commit -am "refactor: extract parse_header from parse_invoice"
```

---

## Exit Criteria

DONE when the block lives in a new function, one file changed, all tests and the API check pass, and the step is one commit.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Range not on statement boundaries | **Adjust**: move the range edges to whole statements. |
| Phase 2 | rope raises `RefactoringError` | **Adjust**: read the message (often "Extracted piece should contain complete statements"); fix the range and retry. |
| Phase 2 | Offsets wrong because of CRLF line endings | **Adjust**: the script counts characters with `keepends=True`, which includes `\r`; confirm the preview starts at the intended line. |
| Phase 3 | Tests fail after extraction | **Retry**: revert the file, choose a smaller range. |
| Phase 3 | Tests still fail on a one-statement range | **Stop**: report the failing test; the code may depend on evaluation order or locals inspection. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
