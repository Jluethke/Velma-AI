# Small-Edit Implementation Loop

**One-line description:** Implements the edit plan one file and one step at a time: read the file, make the smallest edit, run the step's verifying test, read the result, and only then move on, reverting a step instead of stacking fixes when it breaks something.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `edit_plan` (object[], required): Output of `tkt-change-impact-list`.
- `failing_test_evidence` (object[], required): Output of `tkt-failing-test-first`.
- `repo_profile` (object, required): Output of `tkt-repo-orient-detect`.

---

## Outputs

- `change_diff` (string): Output of `git diff <base commit>..HEAD --stat` plus the full diff, after all steps.
- `verification_log` (object[]): One row per edit step: step number, file, command run, exit code, summary line copied from the tool output, and the commit hash for that step.

---

## Phase 1: One Step

### Entry Criteria
- `failing_test_evidence` exists and the new tests fail for the right reason.
- `git status --porcelain` is empty (previous step committed).

### Actions
1. Take the next `edit_plan` step. Open the named file and read the whole enclosing function or class you will change, plus the file's import block. Do not edit from memory of a file you have not opened in this step.
2. Before using any function, method, type, flag or config key in the edit, confirm it exists: `rg -n -w '<name>'` in the repo, or the library's installed source (`.venv/lib/python*/site-packages/<pkg>`, `node_modules/<pkg>`, `go doc <pkg>.<Symbol>`, `cargo doc --open` or the crate's source in `~/.cargo/registry/src`). If you cannot find it, do not use it.
3. Make the smallest edit that moves the step's test toward green. Change one file only. Match the surrounding style (naming, error handling, logging calls).
4. Do not, in this step: rename unrelated symbols, reformat untouched lines, reorder imports beyond what the formatter requires, or "clean up" nearby code. These hide the real change in review.
5. Run `git diff --stat`. It must list exactly the one file named in the step.

### Output
One uncommitted edit to one file.

### Quality Gate
- `git diff --name-only` prints exactly the step's file.
- Every new identifier used in the edit was found by a search in Action 2 (list the searches).

---

## Phase 2: Verify the Step

### Entry Criteria
- One-file edit present.

### Actions
1. Run the step's verifying command. Read the last lines of output; copy the summary line (for example `5 passed in 0.88s`, `ok example.com/billing/export 0.41s`, `Tests 12 passed (12)`, `test result: ok. 12 passed`).
2. Decide with this table:

| Result | Next action |
|---|---|
| Step test now passes and nothing else in that test file fails | Go to Phase 3. |
| Step test still fails with the same assertion | Make one more edit in the same file, then rerun. At most this one file. |
| Step test fails with a new error (exception, compile error) | Read the error's file:line; fix only if it is in the step's file. |
| A different, previously passing test now fails | Your edit broke it. Read that test. Fix in the step's file, or revert (Action 3). |
| Two consecutive attempts made it worse (more failures than before the step) | Revert (Action 3) and re-plan the step smaller. |

3. Revert one step: `git restore <file>` (Git 2.23+) or `git checkout -- <file>`. This discards only your uncommitted edit to that one file. Never use `git reset --hard` or `git clean -fd`; they delete other work.
4. Never get to green by: deleting or skipping a test (`@pytest.mark.skip`, `it.skip`, `t.Skip`, `#[ignore]`), loosening an assertion, catching and ignoring the exception, or changing expected values to match wrong output. If the test itself is wrong, stop and report which line of the acceptance criterion it contradicts.

### Output
Step test green, or step reverted with a reason.

### Quality Gate
- The summary line copied into the log comes from a command run after the last edit.
- `git diff` contains no added skip markers: `git diff | rg -n '^\+.*(mark\.skip|\.skip\(|t\.Skip|#\[ignore\]|xit\(|xdescribe\()'` prints nothing.

---

## Phase 3: Commit the Step and Loop

### Entry Criteria
- Step test green.

### Actions
1. Run the broader test scope for the module (the test directory or package of the changed file) to catch side effects. Copy the summary line.
2. Stage the one file: `git add <file>`. Commit with a work-in-progress message referencing the step (`git commit -m "wip(PAY-412): step 3 csv_response columns"`). These are squashed or reworded in `tkt-conventional-commit`.
3. Append the log row: step, file, command, exit code, summary line, `git rev-parse --short HEAD`.
4. Return to Phase 1 for the next step. When all steps are done, run the full suite with the baseline command and compare to the baseline report: the only differences allowed are the new tests now passing and pre-existing failures unchanged.
5. Produce `change_diff`: `git diff <base commit>..HEAD --stat` and `git diff <base commit>..HEAD`.

### Output
`change_diff`, `verification_log`.

### Quality Gate
- Full-suite failures after the last step are a subset of the baseline's pre-existing failures.
- Every `failing_test_evidence` test now passes (run each single-test command and copy the result).

---

## Worked Example

Illustrative only. Step 3 of PAY-412: `src/billing/api/responses.py`, add optional `columns` argument.

```
$ rg -n -w 'csv_response' src tests
src/billing/api/responses.py:12:def csv_response(rows):
src/billing/api/routes.py:44:    return csv_response(rows)
src/billing/api/reports.py:67:    return csv_response(report_rows)
(edit: def csv_response(rows, columns=None): ... default keeps old behavior)
$ git diff --name-only
src/billing/api/responses.py
$ uv run pytest tests/api -k csv -q
4 passed in 0.31s
$ uv run pytest tests/api -q
1 failed, 37 passed in 3.02s
FAILED tests/api/test_export.py::test_export_respects_status_filter  (planned: fixed in step 4)
$ git add src/billing/api/responses.py && git commit -m "wip(PAY-412): step 3 csv_response columns"
```

The remaining failure is a planned red test for step 4, not a regression. Log row: step 3, exit 0, `4 passed in 0.31s`, `b2c3d4e`.

---

## Exit Criteria

DONE when every `edit_plan` step has a log row with a passing verifying command and its own commit, all acceptance tests pass, and the full suite shows no failure outside the baseline's pre-existing list.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | The step needs a second file | **Adjust**: stop the step, insert a new step for the other file into `edit_plan`, and do that first. |
| Phase 1 | Needed API does not exist in the installed library version | **Stop**: report the version (`pip show`, `npm ls`, `go list -m`, `cargo tree -i`); upgrading is a separate decision. |
| Phase 2 | Test still red after two attempts | **Retry**: revert and split the step into a smaller one. |
| Phase 2 | Test looks wrong | **Return**: report the contradiction to `tkt-acceptance-criteria-gwt`; never edit the assertion to match. |
| Phase 3 | Full suite has a new failure outside the module | **Stop**: bisect your step commits with `git bisect run <single-test command>` to find the step. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
