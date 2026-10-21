# Test Suite Speedup Report

**One-line description:** Measures the final suite with the same hyperfine method and machine as the baseline, compares old and new commands run for run, attributes the gain to each committed change, and writes a report that states only measured results alongside the coverage verdict.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `baseline_report` (object, required): From `tsp-baseline-lock`.
- `hotspot_plan` (object, required): From `tsp-hotspot-classify`, with item statuses updated by the fix flows.
- `parallel_command` (string, required): From `tsp-order-isolation-check`.
- `coverage_verdict` (object, required): From `tsp-coverage-parity-gate`.
- `run_count` (integer, required): Same value as the baseline.
- `test_command` (string, required): The baseline command, for the side-by-side run.

---

## Outputs

- `speedup_report` (object): Machine facts matching the baseline, hyperfine results for `test_command` and `parallel_command` at the final commit, the baseline numbers, per-change attribution, items still `todo` or not fixable, the coverage verdict, and a plain statement of what was and was not proven.

---

## Phase 1: Same-Machine Final Timing

### Entry Criteria
- `coverage_verdict` is `PASS`.
- Machine facts (CPU count, OS, tool versions) match `baseline_report`; if not, record the differences.

### Actions
1. At the final commit, run both commands in one hyperfine session so they share conditions:
   `hyperfine --runs <run_count> --warmup 1 --export-json final.json '<test_command>' '<parallel_command>'`
   For Go, add `-count=1` to both so the test cache does not skip work.
2. Read `results[i].min`, `median`, `max` for both.
3. Decide with this rule, which uses no fixed percentage:

| Comparison | Statement allowed |
|---|---|
| Every run of the new command is faster than the fastest baseline run (`max(new) < min(baseline)`) | "Faster: median X s to Y s" |
| Ranges overlap | "No separable difference measured at `run_count` runs" |
| New command slower | "Slower", and Phase 2 finds which change caused it |

### Output
Final timing block.

### Quality Gate
- `final.json` has two results with `run_count` times each.
- The statement is the table row that matches the numbers.

---

## Phase 2: Attribute the Gain

### Entry Criteria
- Final timing recorded.

### Actions
1. List commits since the baseline: `git log --oneline <baseline sha>..HEAD`.
2. Group them by `hotspot_plan` item. For each group, the per-item seconds come from that fix flow's before and after measurement (`py_sleep_fixes`, `node_boundary_mocks` and so on), not from estimates.
3. For the serial-equivalent check, compare `test_command` at the final commit with the baseline median: this shows the gain from removing waste (sleeps, network, database setup) without parallelism. The difference between `test_command` and `parallel_command` at the final commit shows the gain from parallelism.
4. List items not done (`todo`, `not fixable`) with their attributed seconds.

### Output
Attribution table.

### Quality Gate
- Every attribution row cites the fix-flow row it came from.
- Open items are listed with their reasons.

---

## Phase 3: Write the Report

### Entry Criteria
- Phases 1 and 2 complete.

### Actions
1. Write `speedup_report` with these sections in order: Summary (two sentences, from the Phase 1 statement), Environment, Timing (table: command, min, median, max for baseline, final serial, final parallel), Changes (attribution table), Coverage (four numbers and verdict from `coverage_verdict`), Open Items, Method (hyperfine version, runs, warmup).
2. Save it as a Markdown file outside the source tree or in a `docs/` path the user names.
3. Do NOT claim CI time savings unless CI run durations were measured (`tsp-ci-test-tool-cache`, `tsp-ci-shard-by-timing` record them); otherwise say CI was not measured.
4. Do NOT round in the direction that helps; copy values as hyperfine prints them.

### Output
`speedup_report`.

### Quality Gate
- Every number in the report appears in `final.json`, `baseline-hyperfine.json`, `coverage_verdict`, or a fix-flow output.
- The report contains a Coverage section with the verdict.

---

## Worked Example

Illustrative. `stack=python`, 8 CPUs, `run_count=5`.

- Phase 1: `final.json`: `pytest` min 37.9 s, median 38.6 s, max 39.4 s; `pytest -n 8 --dist loadfile` min 9.8 s, median 10.1 s, max 10.6 s. Baseline min 81.95 s. Statement: "Faster: median 83.87 s to 10.1 s."
- Phase 2: serial at final commit 38.6 s versus baseline 83.87 s: waste removal. Attribution: DB rollback 28.6 s, fixture scope 21.0 s, sleep 6.0 s, network 4.0 s (from fix-flow rows). Open: `test_pdf_render` (CPU, not pushed down).
- Phase 3: report saved to `docs/test-speed-2026-10.md`; coverage 5417 of 6131 covered, verdict `PASS`; CI not measured.

---

## Exit Criteria

DONE when `speedup_report` states the measured result by the decision rule, attributes gains to committed changes from fix-flow measurements, includes the coverage verdict, and lists open items.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `coverage_verdict` is `FAIL` | **Stop**: no speed claim is reported while coverage dropped. |
| Phase 1 | Machine differs from the baseline | **Adjust**: also re-time the baseline commit on this machine (`git worktree add ../base <baseline sha>`) and compare against that. |
| Phase 2 | Attributed seconds do not add up to the measured gain | **Adjust**: report both totals; overlapping effects (for example sleeps inside DB fixtures) make sums inexact. |
| Phase 3 | User asks for a percentage target | **Return**: report the measured numbers; a target is the user's input, not a result. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
