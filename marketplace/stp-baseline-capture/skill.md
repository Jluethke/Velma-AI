# Capture the Baseline Before Any Edit

**One-line description:** Runs every verify command for the chosen stack on the untouched tree, saves each output with its exit code, lists the failures that already exist, counts the tests, and confirms the goal check fails today, producing the verify card that every later edit is measured against.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_verify_commands` (object, optional): From `stp-py-verify-commands` when `stack` is `python`.
- `node_verify_commands` (object, optional): From `stp-node-verify-commands` when `stack` is `node`.
- `go_verify_commands` (object, optional): From `stp-go-verify-commands` when `stack` is `go`.
- `rust_verify_commands` (object, optional): From `stp-rust-verify-commands` when `stack` is `rust`.
- `java_verify_commands` (object, optional): From `stp-java-verify-commands` when `stack` is `java`.
- `goal_check` (object, required): From `stp-goal-to-runnable-check`.
- `scratch_log` (string, required): Path from `stp-scratch-log-start`.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `verify_card` (object): `{ "L0_compile": str, "L1_goal": str, "L2_touched": [str], "L3_package": str, "L4_full": str, "collect_count": str, "pass_signal": object, "log_dir": str }`. Only commands that ran at baseline are on the card.
- `baseline_report` (object): `{ "per_command": [{"level": str, "command": str, "exit_code": int, "log": str}], "preexisting_failures": [str], "test_count": int|null, "goal_fails_now": bool, "goal_first_error": str }`.

---

## Phase 1: Build the Card from the One Stack Input Present

### Entry Criteria
- Exactly one of the five stack inputs is present.

### Actions
1. Take the present input. If more than one is present, use the one whose name matches `stack` and ignore the rest.
2. Map its fields onto the card:

| Card level | Source field | When to run it |
|---|---|---|
| `L0_compile` | `compile_one` | after every edit |
| `L1_goal` | `goal_check.command` | after every edit |
| `L2_touched` | `check_touched` | after every edit, with `<file>` set to the edited file |
| `L3_package` | `test_one` widened to the package or test file (pytest: the test file path; vitest/jest: the test file; go: `go test ./<pkgdir> -count=1`; cargo: `cargo test -p <package>`; Maven/Gradle: the test class) | after the last edit of a package |
| `L4_full` | `full_suite` | once at the end, before the final report |

3. Set `log_dir` to the directory of `scratch_log` plus `runs/` (for example `.git/stp/runs/`). Create it.

### Output
Draft `verify_card`.

### Quality Gate
- Each card level holds a literal command copied from the stack input or `goal_check`; no command text was written from memory.

---

## Phase 2: Run Every Level on the Untouched Tree

### Entry Criteria
- `scratch_log` has no `EDIT` entry yet (nothing has been changed by this chain).

### Actions
1. For each level L0, L1, L2 (with `<file>` set to each source file listed under "In scope" in `scratch_log`), L3, L4, run the command from `goal_check.cwd` and capture output and exit code to a file. Use exactly one of these forms:
   - bash: `<command> > <log_dir>/base-L1.log 2>&1; echo "exit=$?" >> <log_dir>/base-L1.log`
   - PowerShell: `<command> *> <log_dir>\base-L1.log; "exit=$LASTEXITCODE" | Add-Content <log_dir>\base-L1.log`
2. Do not pipe the command into `tail`, `head` or `Select-Object` before capturing the exit code. In bash, `cmd | tail` reports `tail`'s exit code unless `set -o pipefail` is on.
3. Append to `scratch_log`: `RUN base-<level>: <command>` then `EXIT: <code>` and `FIRST ERROR: <first matching line>`. Find the first error line with `rg -n -m 1 -e "FAILED|FAIL:|--- FAIL|error\[|error TS|ERROR|Error:|panicked" <log>`.
4. If a command fails because the tool is missing (`command not found`, `is not recognized as`, `No module named`), remove that level from the card and record "not runnable at baseline". Do not install anything.
5. Run `collect_count` and store the number in `test_count`. If the output has no number you can read, store null and record the raw last line.

### Output
`per_command` entries and `test_count`.

### Quality Gate
- Every per-command entry has an integer `exit_code` read from the `exit=` line of its log file.
- No command in `verify_card` is one that printed "command not found" or "not recognized".

---

## Phase 3: Classify Baseline Failures and the Goal State

### Entry Criteria
- Phase 2 logs exist.

### Actions
1. From the L3 and L4 logs, copy the identifier of every failing test into `preexisting_failures` (pytest `FAILED tests/x.py::test_y`, jest/vitest `FAIL path > name`, go `--- FAIL: TestX`, cargo `test name ... FAILED`, Surefire/Gradle `Class > method FAILED`). Also copy typecheck and lint errors from L0 and L2 as `file:line code`.
2. Set `goal_fails_now` from L1 using `goal_check`:

| `task_type` | L1 result at baseline | Meaning | Next |
|---|---|---|---|
| bug, feature, build, lint | non-zero exit or missing `must_contain` | reproduces | continue; store first error in `goal_first_error` |
| bug, feature, build, lint | exit 0 and contains `must_contain` | does not reproduce | **Stop** and report: the check does not show the problem |
| refactor | exit 0 and contains `must_contain` | correct baseline | continue |
| refactor | non-zero | suite broken before you start | **Stop** and report |

3. Write `preexisting_failures` into `scratch_log` under the heading "Baseline failures (not caused by me)".

### Output
`baseline_report` and final `verify_card`.

### Quality Gate
- `goal_fails_now` matches the table row selected from the L1 log.
- `preexisting_failures` lines can each be found with `rg -F` in a baseline log file.

---

## Worked Example

Illustrative only.

Inputs: `py_verify_commands` for `/work/slugkit` (prefix `uv run`), goal `uv run pytest tests/test_slugify.py::test_strips_accents -q` (written into the test in a later edit, so the test file exists at baseline but not that test).

- Phase 1: L0 `uv run python -m py_compile <file>`, L1 goal command, L2 `uv run ruff check <file>` and `uv run mypy <file>`, L3 `uv run pytest tests/test_slugify.py -q`, L4 `uv run pytest`.
- Phase 2:
```
$ uv run pytest > .git/stp/runs/base-L4.log 2>&1; echo "exit=$?" >> .git/stp/runs/base-L4.log
$ tail -n 3 .git/stp/runs/base-L4.log
FAILED tests/test_cli.py::test_version_flag - AssertionError: assert '0.4.1' in '0.4.0'
1 failed, 41 passed in 0.88s
exit=1
$ uv run pytest --collect-only -q | tail -n 1
42 tests collected in 0.12s
```
- Phase 3: `preexisting_failures` = [`tests/test_cli.py::test_version_flag`]. L1 log ends `ERROR: not found: ...::test_strips_accents` and `exit=4`, so `goal_fails_now` = true. `test_count` = 42.

---

## Exit Criteria

DONE when `verify_card` lists only commands that ran at baseline, `baseline_report` records every pre-existing failure with a log line, and `goal_fails_now` follows the table.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No stack input present | **Stop**: the stack flow for `stack` did not run; return to it. |
| Phase 2 | A command hangs | **Stop**: kill it, record "hung at baseline", and remove it from the card; check for watch mode in its form. |
| Phase 2 | L4 takes longer than the user allows | **Adjust**: keep L4 for the final report only and record the duration. |
| Phase 3 | Goal passes at baseline for a bug | **Stop**: report that the check does not reproduce; return to `stp-goal-to-runnable-check`. |
| Phase 3 | Baseline failures in the goal's own test file | **Return**: report them before editing; they may be the same bug. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
