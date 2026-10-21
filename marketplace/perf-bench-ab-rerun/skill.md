# Interleaved A/B Benchmark Rerun

**One-line description:** Re-measures the base commit (A) and the changed commit (B) in the same session with the identical benchmark command, alternating A and B runs so machine drift hits both equally, and writes paired raw sample files for the significance check.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `applied_change` (object, required): From `perf-one-change-apply`; supplies `base_commit` and `head_commit`.
- `baseline_results` (object, required): From `perf-bench-baseline-normalize`; supplies the tool, unit and sample count.
- `bench_command` (string, required): The exact command fixed at baseline.
- `bench_env_report` (object, required): Machine settings that must still hold.

---

## Outputs

- `ab_samples` (object): For each benchmark and size, paths to `perf/samples/A_<name>_<size>.txt` and `perf/samples/B_<name>_<size>.txt` (one value per line, baseline unit), the run order used, the number of rounds, the tool, and the environment check result.

---

## Phase 1: Re-Check the Environment and Build Both Sides

### Entry Criteria
- `applied_change.head_commit` exists and its tests passed.

### Actions
1. Re-run the checks from `bench_env_report`: governor (`cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor | sort -u`), turbo setting, `uptime`. If any differs from the report, restore it first.
2. Build both sides into separate locations so switching does not rebuild in between:

   | Tool in `baseline_results` | Build A and B |
   |---|---|
   | go test -bench | `git checkout <base_commit> && go test -c -o perf/bin/A.test ./<pkg>/`, then `git checkout <head_commit> && go test -c -o perf/bin/B.test ./<pkg>/` |
   | hyperfine (compiled) | build release at each commit and copy the binary to `perf/bin/A` and `perf/bin/B` |
   | hyperfine (Python, Node) | `git worktree add perf/wt/A <base_commit>` and `git worktree add perf/wt/B <head_commit>` |
   | criterion | no separate build; uses saved baselines (see Phase 2) |
   | pytest-benchmark, tinybench, JMH | `git worktree add perf/wt/A <base_commit>` and `git worktree add perf/wt/B <head_commit>`; build JMH jars in each |

3. Return the main checkout to `<head_commit>` when done.

### Output
Two runnable sides.

### Quality Gate
- Both A and B artifacts or worktrees exist, and `git -C perf/wt/A rev-parse HEAD` (or the build log) shows `base_commit`, B shows `head_commit`.
- Environment values match `bench_env_report`.

---

## Phase 2: Run Interleaved

### Entry Criteria
- Both sides ready.

### Actions
1. Use the same number of samples as the baseline (`baseline_results.n_samples`) per side.
2. Run with the tool-specific interleaving:

   | Tool | Interleaved procedure |
   |---|---|
   | go | loop `n` times: `taskset -c <core> perf/bin/A.test -test.run='^$' -test.bench='<regex>' -test.benchmem -test.count=1 >> perf/samples/A_go.txt`, then the same with `B.test` into `B_go.txt` |
   | hyperfine | one invocation with both commands: `hyperfine --warmup <n> --runs <n> --export-json perf/bench/ab.json 'perf/bin/A <args>' 'perf/bin/B <args>'`. hyperfine runs all runs of one command, then the next; to interleave, run it `n` times with `--runs 1` each and append results, or accept the block order and record it |
   | pytest-benchmark | alternate: run `bench_command` in `perf/wt/A` with `--benchmark-json=perf/bench/A_<i>.json`, then in `perf/wt/B` with `B_<i>.json`, for i in 1..k rounds of fewer rounds each |
   | tinybench | alternate whole script runs in each worktree, appending samples |
   | criterion | `cargo bench --bench <name> -- --save-baseline A` at `base_commit`, then `cargo bench --bench <name> -- --baseline A` at `head_commit` (criterion compares to the saved baseline); repeat the pair once more in reverse order (save at B, compare A) to check drift |
   | JMH | run each jar with the same flags and `-rf json`, alternating A then B for each fork set |

3. Do not change any flag of `bench_command` other than the path or output file. Same size, same warmup, same core.
4. Do not use the machine during the run.

### Output
Raw A and B results.

### Quality Gate
- The run log shows alternating A and B entries (or the recorded block order for tools that cannot interleave).
- Each side has the same sample count.

---

## Phase 3: Write Paired Sample Files

### Entry Criteria
- Raw results exist.

### Actions
1. Extract each sample into `perf/samples/A_<name>_<size>.txt` and `perf/samples/B_<name>_<size>.txt` using the same field mapping as `perf-bench-baseline-normalize`, in the baseline unit.
2. Compare the new A median with `baseline_results.median`. If they differ by more than the baseline spread, record "drift between baseline and A/B session"; the A/B comparison is still valid because both sides were measured together.
3. Remove worktrees after extraction: `git worktree remove perf/wt/A` and `git worktree remove perf/wt/B`.
4. Fill `ab_samples`.

### Output
`ab_samples`.

### Quality Gate
- `wc -l perf/samples/A_*.txt perf/samples/B_*.txt` shows equal counts per pair.
- `git worktree list` shows no `perf/wt/` entries.

---

## Worked Example

Illustrative. Go, BuildReport rows=30000, 10 samples.

- Phase 1: governor `performance` confirmed; `A.test` built at `3b1e0c9`, `B.test` at `a41c9e2`.
- Phase 2: 10 loops of `A.test` then `B.test` with `-test.count=1`.
- Phase 3: `A_BuildReport_30000.txt` median 2915 ms (baseline 2910 ms, within spread); `B_BuildReport_30000.txt` median 61 ms; 10 lines each.

---

## Exit Criteria

DONE when A and B were measured in one session with the baseline command and settings, in interleaved (or recorded) order, and equal-length sample files exist for every benchmark and size.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Environment drifted (governor reset after reboot) | **Retry**: reapply controls from `bench_env_report`, then continue. |
| Phase 1 | Base commit no longer builds (toolchain changed) | **Stop**: record versions; both sides must use one toolchain. |
| Phase 2 | B crashes or fails | **Return**: to `perf-one-change-apply`; the change is not valid. |
| Phase 3 | Sample counts differ | **Retry**: rerun the missing side's runs. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
