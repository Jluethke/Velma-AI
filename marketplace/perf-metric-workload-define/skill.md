# Performance Metric and Workload Definition

**One-line description:** Turns a vague "this is slow" into a written performance spec: one primary metric with its unit and statistic, the exact workload and input sizes that reproduce the slowness, and the goal, all saved to `perf/perf_spec.json` before any benchmark or profiler runs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_description` (string, required): What is slow, in the user's words, plus where it lives (function name, HTTP route, CLI command, batch job name).
- `stack` (string, required): One of `python`, `node`, `go`, `rust`, `jvm`, `c`, `cpp`.
- `workload_kind` (string, required): One of `library` (a function called in-process), `server` (a request/response service), `cli` (a whole process run from a shell), `batch` (a long job over a dataset).
- `run_command` (string, required): The exact shell command that runs the slow code today, for example `python -m app.report --input data/orders.csv` or `curl -s localhost:8080/api/search?q=shoe`.
- `perf_goal` (string, optional): A target the user or an SLO already states, for example "p99 under 250 ms at 200 requests per second" or "nightly job under 40 minutes". Absent means the goal is "a statistically significant improvement".

---

## Outputs

- `perf_spec` (object): Primary metric, unit, statistic, direction (lower or higher is better), secondary metrics, goal with its source, and the measurement level (micro benchmark, process, or load test). Written to `perf/perf_spec.json`.
- `workload_spec` (object): Exact command, input files with checksums, at least two input sizes, warm or cold cache choice, warmup and repetition counts taken from tool defaults or user input, and for servers the arrival rate and duration. Written to `perf/workload_spec.json`.

---

## Phase 1: Pick the Metric From the Workload Kind

### Entry Criteria
- `target_description`, `stack`, `workload_kind` and `run_command` are present.
- `stack` is one of the seven listed values. If not, stop and ask.

### Actions
1. Create the folder `perf/` at the repository root if it does not exist. All files from this chain go there. Do not put them anywhere else.
2. Choose the primary metric with this table. Do not mix rows.

   | `workload_kind` | Primary metric | Statistic | Measurement level |
   |---|---|---|---|
   | `library` | time per operation (ns/op or us/op) | median of repetitions | micro benchmark (pytest-benchmark, tinybench, go test -bench, criterion, JMH) |
   | `cli` | wall-clock time of the whole process | median of runs | process (hyperfine) |
   | `batch` | wall-clock time per job, plus CPU time (user+sys) | median of runs | process (hyperfine, or `/usr/bin/time -v` for one long run) |
   | `server` | latency percentiles p50 and p99 at a fixed arrival rate | percentile over all requests | load test with a constant arrival rate |

3. Record secondary metrics: allocations per operation (B/op and allocs/op) for `library`; peak RSS (`/usr/bin/time -v` field "Maximum resident set size") for `cli` and `batch`; throughput and error count for `server`.
4. For `server`, write down that the load generator must use a fixed arrival rate (open model). Tools that do this: `wrk2` with `-R <rate>`, k6 with the `constant-arrival-rate` executor, `vegeta attack -rate=<rate>`. A closed-loop tool such as plain `wrk` or `ab` waits for each response before sending the next, so it hides queueing delay (the coordinated omission problem described by Gil Tene). Do not use a closed-loop tool to report percentiles.
5. Set direction: time and latency are lower-is-better; throughput is higher-is-better.

### Output
Draft `perf_spec` with metric, unit, statistic, direction, secondary metrics and level.

### Quality Gate
- `perf_spec.primary_metric` matches the table row for `workload_kind` exactly.
- For `server`, `perf_spec.load_tool` is one of `wrk2`, `k6`, `vegeta` and the open-model note is present.

---

## Phase 2: Pin Down the Workload

### Entry Criteria
- Draft `perf_spec` exists.

### Actions
1. Run `run_command` once exactly as given. Record the exit code and the wall time printed by `time <run_command>` (bash) or `Measure-Command { <run_command> }` (PowerShell). If the exit code is not 0, stop: a failing command cannot be measured.
2. List every input the command reads (files, database tables, environment variables, flags). For each input file, record its path and SHA-256 (`sha256sum <file>` on Linux, `shasum -a 256 <file>` on macOS, `Get-FileHash <file>` on Windows).
3. Choose at least two input sizes taken from real data (for example the median production file and the largest production file). Two sizes are needed later to measure how time grows with input size. Write both sizes into `workload_spec.sizes`. If only one real size exists, create a second by truncating or duplicating the real input and record how it was made.
4. Choose warm or cold cache with this rule: if the production run reads data that a previous run already loaded (a long-lived server, a repeated library call), measure warm. If production runs once on fresh data (a nightly batch after a reboot or container start), measure cold and note that cold runs need a cache-drop prepare step on Linux (`sync; echo 3 | sudo tee /proc/sys/vm/drop_caches`).
5. Set warmup and repetition counts to the documented defaults of the harness the chain will use, and write the default and its source into `workload_spec`. Examples: hyperfine runs at least 10 times by default (`--min-runs`) and runs 0 warmup runs unless `--warmup` is given; criterion.rs defaults to 100 samples, 3 s warmup, 5 s measurement; JMH defaults are listed by `java -jar benchmarks.jar -h`. If the user gave counts, use theirs and say so.
6. For `server`, record the arrival rate and test duration. Take them from `perf_goal` or from production traffic logs. If neither exists, record them as an open question in `workload_spec.open_questions` and do not invent them.

### Output
Draft `workload_spec`.

### Quality Gate
- `run_command` exited 0 and the exit code is recorded.
- `workload_spec.sizes` has 2 or more entries, each traceable to a real file or a recorded transformation.
- Every input file has a SHA-256 recorded.

---

## Phase 3: State the Goal and Save

### Entry Criteria
- Draft `perf_spec` and `workload_spec` exist.

### Actions
1. If `perf_goal` is present, copy it verbatim into `perf_spec.goal` with `goal_source: "user"`. Convert it to the primary metric's unit.
2. If `perf_goal` is absent, set `perf_spec.goal` to `"statistically significant improvement in the primary metric"` and `goal_source: "default"`. Do not invent a percentage target.
3. Write `perf/perf_spec.json` and `perf/workload_spec.json` with 2-space indentation.
4. Validate both files parse: `python -m json.tool perf/perf_spec.json` and `python -m json.tool perf/workload_spec.json` (or `node -e "JSON.parse(require('fs').readFileSync('perf/perf_spec.json','utf8'))"`).

### Output
`perf_spec` and `workload_spec`.

### Quality Gate
- Both JSON files parse with exit code 0.
- `perf_spec.goal_source` is `user` or `default`; no numeric target appears that is not in `perf_goal`.

---

## Worked Example

Illustrative. Input: `target_description` = "CSV order report takes too long", `stack` = `python`, `workload_kind` = `batch`, `run_command` = `python -m app.report --input data/orders_2026-09.csv`, no `perf_goal`.

- Phase 1: batch row selected. Primary metric wall-clock seconds, statistic median, secondary CPU time and peak RSS, level process.
- Phase 2: `time python -m app.report --input data/orders_2026-09.csv` prints `real 0m48.212s`, exit 0. Inputs: `data/orders_2026-09.csv` (SHA-256 `9f2c...e1`). Sizes: 120,000 rows (September file) and 30,000 rows (`head -n 30001` of the same file, recorded). Cold cache chosen because the job runs once after container start.
- Phase 3: goal set to "statistically significant improvement", `goal_source: default`. `python -m json.tool perf/perf_spec.json` exits 0.

```json
{"primary_metric": "wall_clock_seconds", "statistic": "median", "direction": "lower_is_better",
 "secondary": ["cpu_seconds_user_sys", "max_rss_kb"], "level": "process",
 "goal": "statistically significant improvement in the primary metric", "goal_source": "default"}
```

---

## Exit Criteria

DONE when `perf/perf_spec.json` and `perf/workload_spec.json` exist, parse, name one primary metric chosen from the table, list two or more real input sizes with checksums, and contain no numeric target or count that lacks a source.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `stack` or `workload_kind` not in the allowed list | **Stop**: ask the user to pick from the list. |
| Phase 1 | User wants "faster" with no metric | **Adjust**: use the table row for `workload_kind`; record the choice in `perf_spec.notes`. |
| Phase 2 | `run_command` exits non-zero | **Stop**: report the error output; fixing correctness comes before measuring speed. |
| Phase 2 | Input data is private and cannot be copied | **Adjust**: generate synthetic data with the same row count and column types; record the generator command. |
| Phase 2 | Server arrival rate unknown | **Return**: record it in `workload_spec.open_questions` and ask the user; do not guess a rate. |
| Phase 3 | JSON does not parse | **Retry**: fix the syntax and rerun `python -m json.tool`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
