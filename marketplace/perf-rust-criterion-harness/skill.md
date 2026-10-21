# Rust Benchmark Harness with criterion.rs

**One-line description:** Adds a criterion.rs benchmark target for the slow Rust function at each workload size using `std::hint::black_box`, runs it with criterion's warmup and sampling, and saves a named baseline whose `estimates.json` files feed the comparison.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `perf_spec` (object, required): From `perf-metric-workload-define`.
- `workload_spec` (object, required): Sizes, inputs, sample settings.
- `bench_env_report` (object, required): Pinned core and machine state.
- `repo_path` (string, required): Crate root containing `Cargo.toml`.

---

## Outputs

- `rust_bench_raw` (object): Baseline name, paths to `target/criterion/<group>/<id>/<baseline>/estimates.json` and `sample.json` for each size, the command, `rustc` and criterion versions, and per-size point estimate with its confidence interval.

---

## Phase 1: Add the Benchmark Target

### Entry Criteria
- `cargo --version` exits 0. The target function is public or reachable from a bench (`pub` in a library crate).

### Actions
1. Add criterion as a dev dependency: `cargo add --dev criterion --features html_reports`. Record the version written to `Cargo.toml`.
2. Append to `Cargo.toml` (this is the only edit to an existing file):

```toml
[[bench]]
name = "build_report"
harness = false

[profile.bench]
debug = true        # symbols for later profiling; does not change optimization level
```

`harness = false` is required; without it the built-in libtest harness runs and criterion's `main` is ignored.
3. Create `benches/build_report.rs`:

```rust
use criterion::{criterion_group, criterion_main, BenchmarkId, Criterion};
use std::hint::black_box;
use mycrate::report::build_report;          // the real path; grep for `pub fn build_report`

fn bench(c: &mut Criterion) {
    let mut group = c.benchmark_group("build_report");
    for n in [30_000usize, 120_000] {        // from workload_spec.sizes
        let rows = mycrate::testdata::rows(n);   // setup outside the timed closure
        group.bench_with_input(BenchmarkId::from_parameter(n), &rows, |b, rows| {
            b.iter(|| build_report(black_box(rows)))
        });
    }
    group.finish();
}

criterion_group!(benches, bench);
criterion_main!(benches);
```

4. Wrap inputs in `black_box` so the optimizer cannot constant-fold them. Return the result from the closure; criterion keeps returned values alive.
5. If each iteration consumes or mutates its input, use `b.iter_batched(|| rows.clone(), |r| build_report_owned(r), BatchSize::LargeInput)` so the clone is not timed.

### Output
Bench target and `Cargo.toml` entries.

### Quality Gate
- `cargo bench --bench build_report --no-run` exits 0.
- `grep -n "harness = false" Cargo.toml` finds the line under the `[[bench]]` entry.

---

## Phase 2: Run and Save a Baseline

### Entry Criteria
- The bench compiles.

### Actions
1. Run on the pinned core:

```bash
taskset -c <core> cargo bench --bench build_report -- --save-baseline before
```

2. Criterion defaults (criterion.rs user guide): 100 samples, 3 s warmup, 5 s measurement, significance level 0.05, noise threshold 0.01 (1%), confidence level 0.95. Keep them unless `workload_spec` sets other values; then pass them as `--sample-size <n>`, `--warm-up-time <s>`, `--measurement-time <s>` after the `--` and record the change. Run `cargo bench --bench build_report -- --help` to confirm the flags for your version.
3. If criterion warns `Unable to complete 100 samples in 5.0s`, it is telling you the suggested measurement time; either accept the longer run with `--measurement-time` or reduce `--sample-size`, and record which.
4. Do not run `cargo bench` without `--bench <name>` in a workspace with many benches; it runs all of them.

### Output
`target/criterion/build_report/<n>/before/` directories.

### Quality Gate
- `ls target/criterion/build_report/*/before/estimates.json` lists one file per size.
- Console output contains a `time:` line for every size.

---

## Phase 3: Read the Output and Record

### Entry Criteria
- Baseline saved.

### Actions
1. Read the console line `time:   [44.812 s 45.020 s 45.241 s]`: the middle value is the point estimate, the outer values are the lower and upper bounds of the confidence interval at the configured level.
2. Read the outlier report (`Found 7 outliers among 100 measurements (7.00%)` split into low/high mild/severe). Mild outliers are common; many severe outliers mean noise.
3. Read the exact numbers from `target/criterion/build_report/<n>/before/estimates.json`: `median.point_estimate`, `median.confidence_interval.lower_bound` and `upper_bound`, all in nanoseconds.
4. Fill `rust_bench_raw` with baseline name `before`, file paths, the command, versions and per-size values.

### Output
`rust_bench_raw`.

### Quality Gate
- Every size has a median point estimate and both bounds read from `estimates.json`.
- `rust_bench_raw.baseline` equals the `--save-baseline` name.

---

## Worked Example

Illustrative. Crate `mycrate`, sizes 30,000 and 120,000.

- Phase 1: `cargo bench --bench build_report --no-run` prints `Finished bench [optimized + debuginfo]`.
- Phase 2: `cargo bench --bench build_report -- --save-baseline before`.
- Phase 3:

```
build_report/30000      time:   [1.1931 s 1.2007 s 1.2090 s]
Found 4 outliers among 100 measurements (4.00%)
  3 (3.00%) high mild
  1 (1.00%) high severe
build_report/120000     time:   [18.744 s 18.902 s 19.061 s]
```

`estimates.json` for 120000: `"median": {"point_estimate": 18897120344.0, ...}`.

---

## Exit Criteria

DONE when a named criterion baseline exists for every size, the medians and intervals are read from `estimates.json`, and the bench target uses `black_box` with setup outside the timed closure.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Function is private to a binary crate | **Adjust**: move the logic into `src/lib.rs` as a separate, reviewed change first, or use `perf-hyperfine-cli-harness`. |
| Phase 1 | `error: Unrecognized option` when running | **Stop**: `harness = false` is missing. |
| Phase 2 | Each sample takes many seconds | **Adjust**: reduce `--sample-size` as a recorded user decision; criterion's documented minimum is 10. |
| Phase 3 | Many high severe outliers | **Return**: to `perf-bench-env-stabilize`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
