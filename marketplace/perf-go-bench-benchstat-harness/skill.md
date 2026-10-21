# Go Benchmark Harness with go test -bench and benchstat

**One-line description:** Writes a Go `Benchmark` function per workload size that the compiler cannot optimize away, runs it with `-count` repetitions and `-benchmem`, and summarizes the samples with benchstat to get a median and confidence interval baseline.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `perf_spec` (object, required): From `perf-metric-workload-define`.
- `workload_spec` (object, required): Sizes, inputs, repetition count.
- `bench_env_report` (object, required): Pinned core and machine state.
- `repo_path` (string, required): Module root containing `go.mod`.

---

## Outputs

- `go_bench_raw` (object): Path to `perf/bench/go_baseline.txt` (raw `go test -bench` output), path to `perf/bench/go_baseline.benchstat.txt`, the exact command, `go version`, benchstat version, and per-benchmark sec/op, B/op and allocs/op with their ± ranges.

---

## Phase 1: Write the Benchmark

### Entry Criteria
- `go version` exits 0 and `go.mod` exists in `repo_path`.

### Actions
1. Read the Go version from `go.mod` (`go` directive). It decides the loop form:

   | Go version | Loop form | Sink needed |
   |---|---|---|
   | 1.24 or newer | `for b.Loop() { ... }` (setup before the loop is excluded from timing automatically) | no; `b.Loop` keeps call arguments and results alive |
   | older than 1.24 | `for i := 0; i < b.N; i++ { ... }` with `b.ResetTimer()` after setup | yes; assign the result to a package-level variable |

2. Create one new file `<pkg>/<target>_bench_test.go` in the same package as the target. Do not edit existing `_test.go` files.
3. Use sub-benchmarks for sizes so the names carry the size:

```go
package report

import (
	"fmt"
	"testing"
)

var sink Report // used only with the b.N loop form

func BenchmarkBuildReport(b *testing.B) {
	for _, n := range []int{30000, 120000} { // from workload_spec.sizes
		rows := loadRows(b, n) // setup, not timed
		b.Run(fmt.Sprintf("rows=%d", n), func(b *testing.B) {
			b.ReportAllocs()
			for b.Loop() { // Go 1.24+; else: b.ResetTimer(); for i := 0; i < b.N; i++ { sink = BuildReport(rows) }
				BuildReport(rows)
			}
		})
	}
}
```

4. Never put `b.StopTimer()`/`b.StartTimer()` inside a tight loop; the timer calls cost more than short bodies and distort results.

### Output
`<pkg>/<target>_bench_test.go`.

### Quality Gate
- `go vet ./<pkg>/` exits 0.
- `go test -run='^$' -bench='^BenchmarkBuildReport$' -benchtime=1x ./<pkg>/` prints one line per size and `ok`.

---

## Phase 2: Run with Repetitions

### Entry Criteria
- The benchmark runs once.

### Actions
1. Install benchstat: `go install golang.org/x/perf/cmd/benchstat@latest`. Record `go version -m $(go env GOPATH)/bin/benchstat | head -3`.
2. Run (Linux, pinned core):

```bash
taskset -c <core> go test -run='^$' -bench='^BenchmarkBuildReport$' \
  -benchmem -count=<repetitions> -benchtime=<from workload_spec, default 1s> \
  ./<pkg>/ | tee perf/bench/go_baseline.txt
```

3. Flag meanings: `-run='^$'` skips unit tests; `-count` repeats the whole benchmark to give benchstat independent samples (the benchstat documentation examples use `-count=10`); `-benchtime` sets time per sample (Go default 1s) or a fixed iteration count with the `x` suffix; `-benchmem` adds B/op and allocs/op.
4. Do not use `-cpu` lists or `-race` for the baseline; the race detector slows code by a large factor.
5. Summarize: `benchstat perf/bench/go_baseline.txt | tee perf/bench/go_baseline.benchstat.txt`.

### Output
Raw and summarized files.

### Quality Gate
- `grep -c '^BenchmarkBuildReport' perf/bench/go_baseline.txt` equals sizes multiplied by `-count`.
- The benchstat file has a `sec/op` table with one row per size.

---

## Phase 3: Read benchstat and Record

### Entry Criteria
- benchstat summary exists.

### Actions
1. Read each row: `BuildReport/rows=30000-8   2.910 ± 1%`. The value is the median; `± 1%` is the confidence interval half-width as a percentage of the median; the `-8` suffix is GOMAXPROCS.
2. If benchstat prints `¹ need >= 6 samples for confidence interval at level 0.95`, the run had too few samples; rerun with a higher `-count`.
3. Read the `B/op` and `allocs/op` tables the same way. Record them; allocation flows use them later.
4. Fill `go_bench_raw` with both file paths, the command, versions and per-size values.

### Output
`go_bench_raw`.

### Quality Gate
- Every size has a sec/op median and a ± value (no footnote about too few samples).
- `go_bench_raw.command` matches the command that produced `go_baseline.txt`.

---

## Worked Example

Illustrative. Package `internal/report`, Go 1.24, sizes 30,000 and 120,000, `-count=10`.

- Phase 1: `go test -run='^$' -bench='^BenchmarkBuildReport$' -benchtime=1x ./internal/report/` prints two lines and `ok`.
- Phase 2: 20 benchmark lines in `go_baseline.txt`.
- Phase 3:

```
                               │ go_baseline.txt │
                               │     sec/op      │
BuildReport/rows=30000-8            2.910 ± 1%
BuildReport/rows=120000-8           45.12 ± 2%
                               │      B/op       │
BuildReport/rows=30000-8          1.412Gi ± 0%
                               │    allocs/op    │
BuildReport/rows=30000-8          3.601M ± 0%
```

---

## Exit Criteria

DONE when `perf/bench/go_baseline.txt` holds `-count` samples per size with B/op and allocs/op, the benchstat summary shows a confidence interval for each, and the command and versions are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `b.Loop undefined` | **Adjust**: the toolchain is older than 1.24; use the `b.N` form with a sink. |
| Phase 1 | Benchmark result is suspiciously tiny (under a nanosecond) | **Stop**: the compiler removed the call; add the sink or switch to `b.Loop`. |
| Phase 2 | `benchstat: command not found` | **Adjust**: add `$(go env GOPATH)/bin` to `PATH`. |
| Phase 3 | Confidence interval footnote | **Retry**: rerun with a higher `-count`. |
| Phase 3 | ± value large relative to the median | **Return**: to `perf-bench-env-stabilize`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
