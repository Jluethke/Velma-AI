# Run the Verify Commands and Capture Exit Codes Honestly

**One-line description:** Runs the applied edit's verify commands in card order (compile, goal check, touched-file checks), saves each full output to a log with the real exit code (no pipes that swallow it, no watch modes, no cached results), and decides pass or fail from the exit code plus the literal pass string, never from a skim of the output.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `applied_edit` (object, required): From `stp-apply-one-edit`.
- `verify_card` (object, required): From `stp-baseline-capture`.
- `scratch_log` (string, required): Path from `stp-scratch-log-start`.

---

## Outputs

- `verify_result` (object): `{ "edit_id": str, "attempt": int, "runs": [{"level": str, "command": str, "exit_code": int, "log": str, "first_error": str}], "goal_passed": bool, "all_passed": bool, "matches_expected_signal": bool }`.

---

## Phase 1: Prepare the Commands

### Entry Criteria
- `applied_edit.files_changed` is 1.

### Actions
1. Take `applied_edit.verify` in order: L0, L1, then each L2. Replace `<file>` with `applied_edit.file`.
2. Check each command against the card: it must be a card command with only `<file>` substituted. A command not on the card was never proven at baseline; do not run it here.
3. Log names: `<verify_card.log_dir>/<edit id>-a<attempt>-<level>.log` (for example `.git/stp/runs/E3-a1-L1.log`).
4. Hang guards: confirm no command contains a watch form (`vitest` without `run`, `--watch`, `jest --watchAll`, `cargo watch`, `gradle --continuous`). If a command needs a time limit, use the user's limit with `timeout <seconds> <command>` (GNU coreutils; exit code 124 means it timed out). Do not invent a limit.

### Output
Ordered command list with log paths.

### Quality Gate
- Every command string equals a `verify_card` command after `<file>` substitution.

---

## Phase 2: Run and Capture

### Entry Criteria
- Command list ready.

### Actions
1. For each command, append `RUN <level>: <command>` to `scratch_log`, then run it from `goal_check.cwd` (recorded in the log header) with exactly one of:
   - bash: `<command> > <log> 2>&1; echo "exit=$?" >> <log>`
   - PowerShell 7: `<command> *> <log>; "exit=$LASTEXITCODE" | Add-Content <log>`
2. Do not write `<command> | tail -n 20` and then read `$?`; that is the exit code of `tail`. If you must filter output, use `set -o pipefail` first, or capture to the log file and filter the file afterwards.
3. Do not add flags that change results: no `--passWithNoTests`, no `-k "not <test>"`, no `--deselect`, no `-DskipTests`, no `|| true`, no `-count` other than `-count=1` for Go.
4. After each run, read the `exit=` line: `rg -n "^exit=" <log>`.
5. Find the first error line: `rg -n -m 1 -e "^E |FAILED|FAIL |--- FAIL|error\[E|error TS|\[ERROR\]|Error:|panicked at|Traceback" <log>`. Store it as `first_error` (empty if none).
6. Append `EXIT: <code>` and `FIRST ERROR: <line>` to `scratch_log`.
7. Run order rule: if L0 (compile) fails, do not run L1 and L2; their output would only repeat the compile error. Record them as `not run (L0 failed)`.

### Output
`runs` with exit codes, logs and first errors.

### Quality Gate
- Each run's `exit_code` equals the number on the `exit=` line of its log.
- No run used a flag from the forbidden list in step 3 (`rg -n -e "passWithNoTests|--deselect|skipTests|\|\| true" <scratch_log>` finds none in this edit's RUN lines).

---

## Phase 3: Decide Pass, Fail and Match

### Entry Criteria
- All runs done or skipped by the order rule.

### Actions
1. `goal_passed` is true only if the L1 run has `exit_code` 0 AND `rg -c -F "<pass_signal.must_contain>" <L1 log>` prints at least 1. Both are required: exit 0 with "0 passed", "no tests to run", "running 0 tests" or "Tests run: 0" is a selector miss, not a pass.
2. `all_passed` is true only if every run that was run has `exit_code` 0. A failure that also existed at baseline still counts as a failure here; the comparison with baseline happens in `stp-keep-or-revert-edit`, not in this flow.
3. `matches_expected_signal`: compare with `applied_edit.expected_signal`:

| Expected signal | Matches when |
|---|---|
| "L1 passes" | `goal_passed` true and every L0 and L2 run exit 0 |
| "L1 fails with an assertion error comparing X to Y" | L0 exit 0, L1 non-zero, and the L1 log contains an assertion line with X (pytest `assert`, jest/vitest `Expected`/`Received` or `expected ... to be`, go `got`/`want`, cargo `left`/`right`, JUnit `expected: <...> but was: <...>`) |
| "L0 passes, L1 unchanged" | L0 exit 0, and the L1 `first_error` equals the previous attempt's L1 `first_error` in `scratch_log` |

4. Append `RESULT <edit id> a<attempt>: goal_passed=<b> all_passed=<b> matches_expected=<b>` to `scratch_log`.

### Output
`verify_result`.

### Quality Gate
- `goal_passed` is true only if both the exit code and the `rg -c -F` count conditions hold, as shown in the logs.
- The `RESULT` line is present in `scratch_log`.

---

## Worked Example

Illustrative only.

`applied_edit` E3 attempt 1, expected "L1 passes".

```
$ uv run python -m py_compile slugkit/core.py > .git/stp/runs/E3-a1-L0.log 2>&1; echo "exit=$?" >> .git/stp/runs/E3-a1-L0.log
$ uv run pytest tests/test_slugify.py::test_strips_accents -q > .git/stp/runs/E3-a1-L1.log 2>&1; echo "exit=$?" >> .git/stp/runs/E3-a1-L1.log
$ cat .git/stp/runs/E3-a1-L1.log
.                                                                        [100%]
1 passed in 0.02s
exit=0
$ rg -c -F "1 passed" .git/stp/runs/E3-a1-L1.log
1
$ uv run ruff check slugkit/core.py > .git/stp/runs/E3-a1-L2a.log 2>&1; echo "exit=$?" >> .git/stp/runs/E3-a1-L2a.log
$ tail -n 2 .git/stp/runs/E3-a1-L2a.log
All checks passed!
exit=0
```

`goal_passed` true, `all_passed` true (mypy also exit 0), `matches_expected_signal` true.

---

## Exit Criteria

DONE when every card command for the edit has a log with a real exit code, and `goal_passed`, `all_passed` and `matches_expected_signal` are set from those logs by the rules above.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Plan's verify list includes a command not on the card | **Stop**: run `stp-baseline-capture` for it first or drop it. |
| Phase 2 | Command hangs | **Stop**: kill it; record "hung"; check for watch mode; never mark as passed. |
| Phase 2 | Exit code 124 from `timeout` | **Return**: failure with first error "timed out after the user's limit". |
| Phase 2 | Tool missing now but present at baseline | **Stop**: the environment changed; report it. |
| Phase 3 | Exit 0 but pass string absent | **Return**: `goal_passed` false; the selector matched nothing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
