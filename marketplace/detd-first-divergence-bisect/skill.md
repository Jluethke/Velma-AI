# First Divergence Root Cause and Commit Bisect

**One-line description:** Turns a replay divergence into a root cause by reproducing it with one command, diffing per-function intermediate values at the diverging tick, and, when the divergence appeared after a code change, running `git bisect run` with a script that maps the harness exit code to good, bad or skip.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `divergence_report` (object[], required): Output of `detd-replay-harness-bitexact`.
- `replay_harness` (object, required): Harness command and exit code meanings.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `divergence_root_cause` (object[]): Per diverged recording: category (clock, rng, scheduling, hash_order, float, io_order, environment, code_change, harness_bug), the commit or file and line, the evidence command, and the fix applied or proposed.

---

## Phase 1: Reproduce in One Command

### Entry Criteria
- `divergence_report` has at least one `diverged` row. If none, **Return** with an empty `divergence_root_cause`.

### Actions
1. Write `replay_one.sh` that builds the current tree and runs the harness on exactly one recording, limited to the diverging tick plus the ticks before it (or from a snapshot just before it, see `detd-state-snapshot-restore`).
2. Run it three times. Record whether the divergence appears every time.

| Result | Meaning |
|---|---|
| Diverges 3 of 3 at the same tick and field | Deterministic difference: code, float policy or environment |
| Diverges sometimes, or at different ticks | Remaining nondeterminism: rerun `detd-double-run-check` |

### Output
Reproduction script and its classification.

### Quality Gate
- The three runs are logged with their exit codes.

---

## Phase 2: Diff Intermediates at the Diverging Tick

### Entry Criteria
- Divergence reproduces.

### Actions
1. Add temporary trace output (behind a flag, not on by default) at entry and exit of each function the step calls at that tick, printing inputs and results in exact form (`float.hex()`, `%a`, raw integers).
2. Produce two traces: one from the recorded build or platform (or the last good commit), one from the current. Diff with `diff -u trace_good.txt trace_bad.txt | head -n 60`.
3. The first differing line names the function. Classify with the category list in Outputs.
4. Remove the trace code or keep it behind the flag; do not leave it on.

### Output
First diverging function with category.

### Quality Gate
- The diff's first differing line is quoted in the root cause row.

---

## Phase 3: Bisect Code Changes

### Entry Criteria
- Category is `code_change`, or a known good commit exists where the recording replays identical.

### Actions
1. Make `replay_one.sh` return: 0 when identical, 1 when diverged, 125 when the commit cannot be built or tested (git bisect treats 125 as skip). Map any other harness error to 125. Exit codes 1 to 127 except 125 mean bad to `git bisect run`; do not return 128 or higher, which aborts the bisect.
2. Run: `git bisect start <bad_commit> <good_commit>`, then `git bisect run ./replay_one.sh`.
3. Git prints `<sha> is the first bad commit`. Save `git bisect log > bisect.log`.
4. Always finish with `git bisect reset`.
5. Decide whether the change was intended:

| Change intended (spec changed) | Action |
|---|---|
| Yes | Regenerate expected outputs for affected recordings through the corpus label process, with the change request linked |
| No | Fix the code; the recording stays as the expectation |

### Output
`divergence_root_cause`.

### Quality Gate
- `bisect.log` exists and ends with the first bad commit.
- `git status` after `git bisect reset` shows the original branch.

---

## Worked Example

Illustrative only. `drive_017` diverges at tick 431 `outputs.speed_cap`. Phase 1: 3 of 3 at the same field. Phase 2: first trace difference in `margin_for(grade=0x1.99999999999ap-4)`: `0x1.4p+3` versus `0x1.2p+3`. Phase 3: `git bisect run ./replay_one.sh` prints `a1b2c3d is the first bad commit`, which changed `>` to `>=` in `margin_for`. Not intended; fixed.

---

## Exit Criteria

DONE when each diverged recording has a classified root cause with evidence, and any bisect was reset.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Divergence does not reproduce | **Adjust**: classify as remaining nondeterminism; return to `detd-double-run-check`. |
| Phase 2 | Trace changes the result | **Adjust**: tracing altered evaluation (for example forced a store that removed excess precision); write traces after computing, from copies. |
| Phase 3 | Many commits skipped | **Return**: report the skipped range from `bisect.log` as the candidate set. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
