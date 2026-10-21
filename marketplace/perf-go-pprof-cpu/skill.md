# Go CPU Profile with pprof

**One-line description:** Captures a Go CPU profile from the benchmark (`-cpuprofile`) or a running service (`net/http/pprof`), reads it with `go tool pprof -top`, `-list` and `-peek`, and opens the flame graph view in the pprof web UI.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `workload_spec` (object, required): Sizes, and for services the load and duration.
- `repo_path` (string, required): Module root.
- `bench_command` (string, required): From `perf-bench-baseline-normalize`; the `go test -bench` command to reuse.

---

## Outputs

- `go_cpu_profile` (object): Paths to `perf/profiles/cpu.pprof` and the test binary, the capture command, `go version`, total samples, and the top functions by `flat` and `cum` with `-list` line annotations for the top entries.

---

## Phase 1: Capture

### Entry Criteria
- The benchmark from `bench_command` runs, or the service imports `net/http/pprof`.

### Actions
1. Choose the source:

   | Workload | Capture |
   |---|---|
   | Benchmark exists | Take `bench_command`, set `-count=1`, remove `taskset` if present, and add `-cpuprofile perf/profiles/cpu.pprof -o perf/profiles/pkg.test`. Example: `go test -run='^$' -bench='^BenchmarkBuildReport$/rows=120000' -count=1 -benchtime=<time> -cpuprofile perf/profiles/cpu.pprof -o perf/profiles/pkg.test ./internal/report/` |
   | Long-running service | Add `import _ "net/http/pprof"` and serve `http.ListenAndServe("localhost:6060", nil)` on a separate, non-public listener; under load run `curl -o perf/profiles/cpu.pprof "http://localhost:6060/debug/pprof/profile?seconds=<duration>"` |
   | CLI program | Add `pprof.StartCPUProfile(f)` and `defer pprof.StopCPUProfile()` from `runtime/pprof` behind a `-cpuprofile` flag in `main` |

2. Use `-benchtime` long enough to collect samples: the Go CPU profiler samples at 100 Hz by default (`runtime.SetCPUProfileRate` documentation), so a 1 s run gives about 100 samples.
3. Never expose `/debug/pprof` on a public address. Bind it to `localhost`.
4. Keep the test binary (`-o`); pprof uses it to resolve symbols and source lines.

### Output
`perf/profiles/cpu.pprof` and the binary.

### Quality Gate
- `go tool pprof -top perf/profiles/pkg.test perf/profiles/cpu.pprof | head -5` prints a `Duration:` line and `Total samples` line.

---

## Phase 2: Read in the Terminal

### Entry Criteria
- Profile opens.

### Actions
1. Self time: `go tool pprof -top perf/profiles/pkg.test perf/profiles/cpu.pprof | head -25`.
2. Inclusive time: `go tool pprof -top -cum perf/profiles/pkg.test perf/profiles/cpu.pprof | head -25`.
3. Read the columns:

   | Column | Meaning |
   |---|---|
   | `flat`, `flat%` | samples in the function itself |
   | `sum%` | running total of `flat%` down the list |
   | `cum`, `cum%` | samples in the function or anything it called |

4. For each of the top 5 `flat` functions in your module, annotate lines: `go tool pprof -list 'report\.findCustomer' perf/profiles/pkg.test perf/profiles/cpu.pprof`. The left columns are flat and cum per source line.
5. See callers and callees of one function: `go tool pprof -peek 'report\.findCustomer' perf/profiles/pkg.test perf/profiles/cpu.pprof`.
6. Note runtime functions in the top list: `runtime.mallocgc`, `runtime.gcBgMarkWorker`, `runtime.scanobject` (allocation and GC); `runtime.mapaccess*`, `runtime.mapassign*` (map work); `syscall.Syscall*`, `internal/poll` (I/O); `runtime.lock`, `sync.(*Mutex).Lock`, `runtime.semacquire` (contention).

### Output
Top tables and line annotations.

### Quality Gate
- `flat` and `cum` top lists are recorded.
- Each of the top 5 module functions has `-list` output saved to `perf/profiles/list_<func>.txt`.

---

## Phase 3: Flame Graph View and Record

### Entry Criteria
- Terminal reading done.

### Actions
1. Start the web UI: `go tool pprof -http=localhost:8080 perf/profiles/pkg.test perf/profiles/cpu.pprof`. Use the `VIEW` menu, `Flame Graph`. Width is share of samples; callers above callees in the newer pprof flame view (check the orientation shown in your version). Click a frame to focus; use `REFINE` to hide runtime frames.
2. Use the `Source` view for the same per-line data as `-list`.
3. Fill `go_cpu_profile` with paths, command, version, total samples, top `flat` and `cum` entries, and the saved `-list` files.

### Output
`go_cpu_profile`.

### Quality Gate
- Total samples recorded; every listed function name is copied from pprof output.

---

## Worked Example

Illustrative. Go 1.24, rows=120000.

```
$ go tool pprof -top perf/profiles/pkg.test perf/profiles/cpu.pprof | head -8
Duration: 46.10s, Total samples = 45.73s (99.20%)
      flat  flat%   sum%        cum   cum%
    38.21s 83.56% 83.56%     38.40s 83.97%  example.com/app/internal/report.findCustomer
     2.90s  6.34% 89.90%      3.70s  8.09%  runtime.mallocgc
     1.11s  2.43% 92.33%     44.95s 98.30%  example.com/app/internal/report.(*Builder).AddRow
```

`-list report\.findCustomer` shows `37.9s` on line 92: `for _, c := range b.customers {`.

---

## Exit Criteria

DONE when a CPU profile with resolved symbols exists, flat and cumulative top lists and per-line annotations for the top module functions are saved, and the flame graph view was opened.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Profile has very few samples | **Retry**: raise `-benchtime` or the `seconds` parameter. |
| Phase 1 | Function names show as addresses | **Adjust**: pass the binary to pprof (`-o` test binary). |
| Phase 2 | Top entries are all `runtime.*` GC functions | **Adjust**: record "allocation" for `perf-hotspot-classify` and capture `-memprofile` in `perf-go-alloc-escape-analysis`. |
| Phase 2 | Samples low but wall time high | **Return**: the code waits; capture `/debug/pprof/block` or a trace (`go test -trace`) and classify as I/O or contention. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
