# Stress Verification of a Concurrency Fix

**One-line description:** Proves a concurrency fix by rerunning the original stress harness the number of times the measured baseline failure rate requires, under the same and amplified conditions plus the stack detector, and reports the result with the rule-of-three upper bound instead of "seems fixed".

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the project root, on the fix branch.
- `stress_command` (string, required): From `race-stress-harness`; unchanged since the baseline.
- `baseline_failure_rate` (object, required): From `race-stress-harness`.
- `stress_runs` (integer, required): The user's run budget per measurement.
- `regression_test` (object, required): From `race-deterministic-regression-test`.
- `fix_patch` (object, required): From `race-apply-fix`.

---

## Outputs

- `verification_report` (object): `required_runs` (computed), `runs_done`, `failures_after`, `upper_bound_rate` (rule of three), `baseline_rate`, `conditions` (each machine and amplification setting run), `detector_clean` (true or false with output file), `regression_on_base` (fails on base, passes on fix), `verdict` (`PASS`, `FAIL`, `INCONCLUSIVE`).

---

## Phase 1: Compute the Number of Runs Needed

### Entry Criteria
- `baseline_failure_rate.rate` is known.
- `stress_command` is byte-for-byte the command used for the baseline (compare the strings).

### Actions
1. If the baseline rate p is greater than 0: the chance that an unfixed program passes n runs in a row is (1 - p)^n. To make that chance at most 5 percent (the 95 percent confidence level used by the rule of three), n must satisfy n >= ln(0.05) / ln(1 - p). Compute it: `python -c "import math; p=<rate>; print(math.ceil(math.log(0.05)/math.log(1-p)))"`. For small p this is close to 3 / p.
2. If the user requires a different confidence level, use it in place of 0.05 and record it.
3. Compare with `stress_runs`. If `required_runs` > `stress_runs`, the verdict cannot be PASS from this measurement alone; record this now and ask the user to raise `stress_runs` or accept INCONCLUSIVE.
4. If p = 0 (the harness never reproduced), stress runs cannot prove the fix. The proof rests on the regression test and the detector; the verdict can be at most PASS on those two checks, and the report must say the harness never reproduced.

### Output
`required_runs` and the confidence level.

### Quality Gate
- `required_runs` is printed by the command in step 1 (output saved) or p = 0 is recorded.
- The `stress_command` string equality check is recorded.

---

## Phase 2: Run the Stress Measurement

### Entry Criteria
- `required_runs` known.

### Actions
1. On the fix branch, run the loop form of `stress_command` for max(`required_runs`, `stress_runs`) runs if the user accepted that count, else `stress_runs`. Save output.
2. Repeat under every amplification used during the baseline (same `-cpu` list, `taskset`, background load, switch interval). A fix that passes only without amplification is not verified.
3. If another machine or CI runner with a different CPU count or architecture is available, run there too and record its description. ARM machines expose memory-ordering bugs that x86 hides.
4. Count failures from the saved outputs with the same command used for the baseline.
5. Do not change the harness, its worker count, or its assertions between baseline and verification. Changing them invalidates the comparison.

### Output
`runs_done`, `failures_after`, `conditions`.

### Quality Gate
- `failures_after` is computed with the same grep or summary-line method as the baseline (command recorded).
- Each condition from the baseline has a matching verification run.

---

## Phase 3: Detector, Base Check and Verdict

### Entry Criteria
- Stress outputs saved.

### Actions
1. Run the stack detector on the fix branch over the harness and the whole package: `go test -race ./...`, TSan build tests, Miri or loom, jcstress, asyncio debug run, strict-rejection Node run. Save output. `detector_clean` = true only if the output contains no race or warning report.
2. Check the regression test both ways without touching the working tree: `git -C "<repo_path>" worktree add /tmp/race-base <fix_patch.test_commit>` (the commit with the test and hook but no fix), run `regression_test.run_command` inside `/tmp/race-base` (must FAIL), then run it on the fix branch (must PASS). Remove the worktree after: `git -C "<repo_path>" worktree remove /tmp/race-base`. This is the mutation check: a test that passes on both is not testing the fix.
3. Compute `upper_bound_rate`: if `failures_after` = 0, the 95 percent upper bound on the per-run failure rate is about 3 / `runs_done` (rule of three). If failures_after > 0, report the observed rate `failures_after / runs_done`.
4. Verdict table:

| Condition | `verdict` |
|---|---|
| Any stress failure after the fix, or detector reports a race, or regression test passes on base | FAIL |
| Zero failures, `runs_done` >= `required_runs`, detector clean, regression fails on base and passes on fix | PASS |
| Zero failures but `runs_done` < `required_runs`, or baseline p = 0 | INCONCLUSIVE (state which) |

5. On FAIL, return to `race-findings-consolidate` with the new output; do not raise the run count until the failures stop appearing.

### Output
`verification_report`.

### Quality Gate
- `verdict` follows the table, with each condition's evidence file named.
- The base-worktree run of the regression test output is saved and shows a failure.

---

## Worked Example

Illustrative only.

Baseline: 37 failures in 600 runs, p = 0.0617. `python -c "import math; p=0.0617; print(math.ceil(math.log(0.05)/math.log(1-p)))"` prints `47`. `stress_runs` = 200, so 200 runs per `-cpu` setting is enough.

Phase 2: `go test -run '^TestReserveStress$' -count=200 -cpu 1,2,4 ./inventory` (600 runs), plus `taskset -c 0` variant (600 runs). `grep -c -- "--- FAIL"` prints `0` for both.

Phase 3: `go test -race ./...` prints only `ok` lines. Base worktree: `TestReserveLostUpdate` fails with `stock = 99, want 98`; fix branch: `ok`. `upper_bound_rate` = 3 / 1200 = 0.0025. Verdict PASS.

---

## Exit Criteria

DONE when the run count was computed from the baseline rate, the unchanged harness ran under every baseline condition, the detector and the base-versus-fix regression check ran, and the verdict follows the table.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `stress_command` differs from the baseline command | **Stop**: rerun the baseline with the current command first; a changed harness cannot be compared. |
| Phase 1 | Required runs exceed what the user can run | **Return**: report INCONCLUSIVE with the computed number. |
| Phase 2 | Failures appear only on the second machine | **Return**: verdict FAIL; record the architecture, since that is often a memory-ordering bug. |
| Phase 3 | Regression test passes on base | **Stop**: the test does not cover the bug; return to `race-deterministic-regression-test`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
