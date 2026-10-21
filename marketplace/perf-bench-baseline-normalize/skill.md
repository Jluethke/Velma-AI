# Benchmark Baseline Normalization

**One-line description:** Converts the raw output of whichever benchmark harness ran (pytest-benchmark, tinybench, go test with benchstat, criterion.rs, JMH or hyperfine) into one common baseline record with median, spread, sample count, unit and raw-sample file path, and fixes the exact command that every later comparison must reuse.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_bench_raw` (object, optional): From `perf-py-pytest-benchmark-harness`.
- `node_bench_raw` (object, optional): From `perf-node-tinybench-harness`.
- `go_bench_raw` (object, optional): From `perf-go-bench-benchstat-harness`.
- `rust_bench_raw` (object, optional): From `perf-rust-criterion-harness`.
- `jvm_bench_raw` (object, optional): From `perf-jvm-jmh-harness`.
- `cli_bench_raw` (object, optional): From `perf-hyperfine-cli-harness`.
- `perf_spec` (object, required): Primary metric, unit and statistic.

At least one of the six raw inputs must be present. When a micro benchmark and `cli_bench_raw` are both present, both are normalized.

---

## Outputs

- `baseline_results` (object): One entry per benchmark and size: `tool`, `name`, `size`, `unit`, `n_samples`, `median`, `spread` (with its kind), `interval` if the tool gives one, `raw_samples_path`, `commit`. Written to `perf/baseline.json`.
- `bench_command` (string): The exact command line that produced the baseline, to be reused unchanged for every later A/B run.

---

## Phase 1: Locate and Parse Each Raw Result

### Entry Criteria
- At least one raw input is present and its file path exists (`test -f <path>`).

### Actions
1. For each present input, read the fields from this table. Do not compute a statistic the tool already reports; copy it.

   | Input | File | Median | Spread | Samples |
   |---|---|---|---|---|
   | `py_bench_raw` | pytest-benchmark JSON | `benchmarks[i].stats.median` (seconds) | `stats.iqr` (kind `iqr`) | `stats.data` (needs `--benchmark-save-data`) |
   | `node_bench_raw` | tinybench export | the median field if your version has one; else compute the median of the samples array | `sd` (kind `stddev`) or `rme` (kind `relative_margin`) | the samples array named in the harness header |
   | `go_bench_raw` | raw `go test` text | benchstat table value | benchstat `±` (kind `ci_pct`) | each `Benchmark...` line `ns/op` value |
   | `rust_bench_raw` | `target/criterion/<group>/<id>/<baseline>/estimates.json` | `median.point_estimate` (ns) | `median.confidence_interval` (kind `ci`) | `sample.json` (`iters`, `times`; per-iteration time = `times[k]/iters[k]`) |
   | `jvm_bench_raw` | JMH JSON | `primaryMetric.score` is the mean; compute the median of the flattened `primaryMetric.rawData` | `scoreError` (kind `ci_99.9_halfwidth`) | flattened `rawData` |
   | `cli_bench_raw` | hyperfine JSON | `results[i].median` (seconds) | `results[i].stddev` (kind `stddev`) | `results[i].times` |

2. Convert every median and spread to the unit in `perf_spec` (record the conversion factor).
3. Write the raw samples for each benchmark and size into `perf/samples/baseline_<name>_<size>.txt`, one number per line, same unit. The significance check reads these files.

### Output
Parsed entries and sample files.

### Quality Gate
- Every entry has a non-null `median`, `unit` and `n_samples` greater than 0.
- `wc -l perf/samples/baseline_*.txt` shows a line count equal to each entry's `n_samples`.

---

## Phase 2: Fix the Command and Check Noise

### Entry Criteria
- Parsed entries exist.

### Actions
1. Copy the exact command from the raw input's `command` field into `bench_command`. If two harnesses ran, use the one matching `perf_spec.level` and record the other in `baseline_results.secondary_command`.
2. Compute the coefficient of variation for each entry: sample standard deviation divided by sample mean, from the sample file. Record it as `cv`. This is a reported number, not a pass/fail threshold.
3. If two entries for the same benchmark exist from two runs (a rerun during the harness flow), record both; do not pick the faster one.
4. Record `git rev-parse HEAD` as `commit` in every entry.

### Output
`bench_command`, entries with `cv` and `commit`.

### Quality Gate
- `bench_command` is a single non-empty line that appears verbatim in the raw input.
- Every entry has `cv` and a 40-character `commit`.

---

## Phase 3: Save the Baseline

### Entry Criteria
- Entries complete.

### Actions
1. Write `perf/baseline.json`.
2. Validate: `python -m json.tool perf/baseline.json`.
3. Print a short table: name, size, median, unit, n, cv.

### Output
`baseline_results`, `bench_command`.

### Quality Gate
- `perf/baseline.json` parses with exit code 0.
- The printed table has one row per benchmark and size listed in `perf/workload_spec.json` (field `sizes`).

---

## Worked Example

Illustrative. Only `go_bench_raw` present, unit ms.

- Phase 1: benchstat median `2.910 s ± 1%` for rows=30000 becomes `median: 2910.0, unit: ms, spread: {kind: ci_pct, value: 1}`; 10 `ns/op` lines written to `perf/samples/baseline_BuildReport_30000.txt` after dividing by 1e6.
- Phase 2: `bench_command` = `taskset -c 2 go test -run='^$' -bench='^BenchmarkBuildReport$' -benchmem -count=10 -benchtime=1s ./internal/report/`. `cv` = 0.009.
- Phase 3:

```
name           size     median     unit  n   cv
BuildReport    30000    2910.0     ms    10  0.009
BuildReport    120000   45120.0    ms    10  0.016
```

---

## Exit Criteria

DONE when `perf/baseline.json` holds every benchmark and size with a copied median, a typed spread, sample count, unit, commit and a matching sample file, and `bench_command` is fixed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No raw input present | **Stop**: run the harness flow for the stack first. |
| Phase 1 | pytest-benchmark JSON lacks `stats.data` | **Return**: to `perf-py-pytest-benchmark-harness` and rerun with `--benchmark-save-data`. |
| Phase 1 | Field names differ (tool version change) | **Adjust**: open the file, find the equivalent field, record the mapping. |
| Phase 2 | Raw input has no `command` field | **Return**: to the harness flow; a baseline without its command cannot be reproduced. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
