# Flaky Fix Verification At Same Count

**One-line description:** Verifies a flaky-test fix by rerunning the unchanged baseline command at the same run count used to measure the flake, once in fixed order and once shuffled, and reports PASS only on zero failures with the probability that an unfixed test would have shown zero and the upper confidence bound on the remaining rate.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_async_fix_diff` (string, optional): From `flk-py-async-wait-fix`.
- `node_async_fix_diff` (string, optional): From `flk-node-async-wait-fix`.
- `go_sync_fix_diff` (string, optional): From `flk-go-sync-wait-fix`.
- `py_fixture_fix_diff` (string, optional): From `flk-py-fixture-isolation-fix`.
- `py_xdist_fix_diff` (string, optional): From `flk-py-xdist-collision-fix`.
- `node_isolation_fix_diff` (string, optional): From `flk-node-jest-isolation-fix`.
- `go_isolation_fix_diff` (string, optional): From `flk-go-test-isolation-fix`.
- `py_time_fix_diff` (string, optional): From `flk-py-freeze-time-fix`.
- `node_time_fix_diff` (string, optional): From `flk-node-fake-timers-fix`.
- `go_time_fix_diff` (string, optional): From `flk-go-clock-injection-fix`.
- `seed_fix_diff` (string, optional): From `flk-random-seed-pin`.
- `network_fix_diff` (string, optional): From `flk-network-stub-isolate`.
- `py_leak_fix_diff` (string, optional): From `flk-py-resource-warning-fix`.
- `node_leak_fix_diff` (string, optional): From `flk-node-open-handles-fix`.
- `baseline_command` (string, required): From `flk-classify-root-cause`, used unchanged.
- `baseline_rate` (object, required): `{failed, runs}` before the fix.
- `repeat_count` (integer, required): N from `flk-run-count-derive`.
- `detection_confidence` (number, required): c used to derive N.
- `repo_path` (string, required): Repository root with the fix applied.

---

## Outputs

- `verification_verdict` (string): `PASS` or `FAIL`.
- `post_fix_rate_report` (object): `{fixed_order: {failed, runs}, shuffled: {failed, runs, seeds}, p_zero_if_unfixed, rate_upper_bound, ci_run_url, diffs_applied[]}`.

---

## Phase 1: Confirm What Is Being Verified

### Entry Criteria
- At least one fix diff is non-empty.

### Actions
1. List non-empty diffs as `diffs_applied`. Confirm each is applied: `git -C <repo_path> diff --stat` (or the fix branch's `git log -1 --stat`) shows its files.
2. Confirm the command is unchanged: compare `baseline_command` character for character with what you are about to run. Do not drop env vars, seeds, worker counts or the loop.
3. Confirm the run count: the loop or `--count` / `-count` value equals `repeat_count`, and `baseline_rate.runs` equals `repeat_count`. If the baseline used a different count, use the larger of the two and say so.
4. Confirm no masking was introduced: `git -C <repo_path> diff | grep -n -E "rerunfailures|reruns|retryTimes|forceExit|@pytest\.mark\.skip|test\.skip|t\.Skip\(|xfail|\.only\(|-p no:randomly|shuffle=off"` prints nothing. Any hit is a **Stop**.

### Output
Confirmed setup.

### Quality Gate
- The masking grep output is empty and recorded.

---

## Phase 2: Rerun

### Entry Criteria
- Setup confirmed.

### Actions
1. Fixed order: run `baseline_command` exactly. Record `failed` and `runs`.
2. Shuffled: run the same selection with order randomization at the same count, a fresh seed per run:
   - python: add `-p randomly` (no fixed seed) and read each `Using --randomly-seed=` line.
   - node: add `--randomize` (Jest 29.2+) and `--showSeed`.
   - go: add `-shuffle=on` and read each `-test.shuffle` line.
3. Run the fixed-order set once in CI as well (a workflow dispatch or a temporary job on the fix branch) so the runner type is the one that flaked. Record `ci_run_url`.
4. Do NOT stop at the first green batch, reduce N, or run only the single test when the baseline ran a suite.

### Output
Counts.

### Quality Gate
- Both modes report runs == `repeat_count`, read from the command output.

---

## Phase 3: Decide

### Entry Criteria
- Counts recorded.

### Actions
1. Compute with a command, not by hand. Let p0 = `baseline_rate.failed / baseline_rate.runs`, N = `repeat_count`, c = `detection_confidence`:
   `python -c "p0=8/149; N=149; c=0.95; print('p_zero_if_unfixed', (1-p0)**N); print('rate_upper_bound', 1-(1-c)**(1/N))"`
   - `p_zero_if_unfixed` is the chance an unchanged test would have produced zero failures in N runs.
   - `rate_upper_bound` is the exact one-sided upper bound on the remaining per-run failure rate after zero failures in N runs, at confidence c (approximately 3/N at c = 0.95, the "rule of three").
2. Verdict:

| fixed_order.failed | shuffled.failed | CI run | Verdict |
|---|---|---|---|
| 0 | 0 | green | `PASS` |
| 0 | > 0 | any | `FAIL`: an order-dependent cause remains; return to the order flow with the failing seed |
| > 0 | any | any | `FAIL`: return to `flk-classify-root-cause` with the new signatures |
| 0 | 0 | red on this test | `FAIL`: environment-specific; return to the classifier with the CI log |

3. Report numbers, not adjectives: "0/149 fixed, 0/149 shuffled; an unfixed test at 8/149 would show zero failures with probability 0.00027; remaining rate below 0.0199 at 95% confidence."

### Output
`verification_verdict`, `post_fix_rate_report`.

### Quality Gate
- The computation command and its printed output are pasted into the report.
- The verdict cites its table row.

---

## Worked Example

Illustrative. Node, whole-file loop baseline 8/149, `repeat_count` = 149, c = 0.95, `node_isolation_fix_diff` applied.

- Phase 1: masking grep empty. Command identical to baseline.
- Phase 2: fixed order `pass=149 fail=0`; `--randomize` loop `pass=149 fail=0` with seeds printed; CI dispatch run green.
- Phase 3: `python -c "p0=8/149; N=149; c=0.95; print((1-p0)**N, 1-(1-c)**(1/N))"` prints `0.000268... 0.01990...`. Verdict `PASS`.

---

## Exit Criteria

DONE when both modes ran at `repeat_count` with the unchanged baseline command, the masking grep is empty, and the verdict follows the table with computed probabilities.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | All fix diffs empty | **Stop**: nothing to verify; return to the classifier. |
| Phase 1 | Masking grep finds a hit | **Stop**: remove the mask; masking is not a fix. |
| Phase 2 | Runs aborted partway | **Retry**: rerun the full N; partial counts are not reported. |
| Phase 3 | Any failure | **Return**: to the flow named in the verdict table with the failing output. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
