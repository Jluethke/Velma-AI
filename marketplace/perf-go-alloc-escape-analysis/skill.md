# Go Allocation Profile and Escape Analysis

**One-line description:** Measures Go allocations per operation with `-benchmem`, captures a heap profile with `-memprofile` read by `alloc_space` and `alloc_objects`, and explains each hot allocation with the compiler's escape analysis output from `-gcflags=-m`, so fixes target values that escape to the heap.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `classified_hotspots` (object[], required): From `perf-hotspot-classify`.
- `bench_command` (string, required): From `perf-bench-baseline-normalize`.
- `repo_path` (string, required): Module root.

---

## Outputs

- `go_alloc_profile` (object): B/op and allocs/op per size, path to `perf/profiles/mem.pprof`, top functions and lines by `alloc_space` and `alloc_objects`, and the escape analysis messages (`escapes to heap`, `moved to heap`) for those lines with the reason the compiler gave.

---

## Phase 1: Capture the Heap Profile

### Entry Criteria
- `bench_command` includes `-benchmem` or can have it added.

### Actions
1. From `bench_command`, set `-count=1`, drop `taskset`, and add `-memprofile perf/profiles/mem.pprof -memprofilerate=1 -o perf/profiles/pkg.test`:

```bash
go test -run='^$' -bench='^BenchmarkBuildReport$/rows=30000' -benchmem -count=1 \
  -memprofile perf/profiles/mem.pprof -memprofilerate=1 -o perf/profiles/pkg.test ./internal/report/
```

   `-memprofilerate=1` records every allocation (the default samples one per 512 KB, per `runtime.MemProfileRate` documentation). It slows the run; do not use its timings.
2. Record `B/op` and `allocs/op` from the benchmark line.

### Output
`mem.pprof` and per-op numbers.

### Quality Gate
- The benchmark line contains `B/op` and `allocs/op` values.
- `go tool pprof -sample_index=alloc_space -top perf/profiles/pkg.test perf/profiles/mem.pprof | head -3` prints a header.

---

## Phase 2: Read Allocation Sites

### Entry Criteria
- Heap profile exists.

### Actions
1. By bytes: `go tool pprof -sample_index=alloc_space -top perf/profiles/pkg.test perf/profiles/mem.pprof | head -20`.
2. By count (drives GC work more than bytes for small objects): `go tool pprof -sample_index=alloc_objects -top perf/profiles/pkg.test perf/profiles/mem.pprof | head -20`.
3. The heap profile also has `inuse_space` and `inuse_objects`; those show live memory at the end, not churn. Use `alloc_*` for performance work.
4. Annotate the top 3 module functions: `go tool pprof -sample_index=alloc_objects -list 'report\.\(\*Builder\)\.AddRow' perf/profiles/pkg.test perf/profiles/mem.pprof`.

### Output
Top allocation sites by bytes and objects with line annotations.

### Quality Gate
- Both `alloc_space` and `alloc_objects` top lists are recorded.
- Each top module function has a saved `-list` output with per-line values.

---

## Phase 3: Explain with Escape Analysis

### Entry Criteria
- Hot allocating lines known.

### Actions
1. Print the compiler's decisions for the package: `go build -gcflags='-m' ./internal/report/ 2>&1 | tee perf/profiles/escape.txt`. Use `-gcflags='-m -m'` for the reason chain on a specific line.
2. For each hot line, find its message in `escape.txt` by file:line and record it. Common messages and causes:

   | Message | Typical cause | Typical fix (for the next flow) |
   |---|---|---|
   | `moved to heap: x` | address of a local taken and kept beyond the function (returned, stored in a struct or closure) | return by value, or let the caller pass a buffer |
   | `... escapes to heap` on an argument to `fmt.Sprintf`, `fmt.Println` | conversion to `interface{}` (`any`) | use `strconv.Append*`/`strconv.Itoa`, or a typed writer |
   | `make([]T, n) escapes to heap` | size not constant or slice outlives the function | preallocate once and reuse; pass capacity |
   | `func literal escapes to heap` | closure stored or passed to a goroutine | hoist the closure or pass parameters |
   | no message but high `alloc_objects` | slice growth by `append` | `make([]T, 0, expectedLen)` |

3. Fill `go_alloc_profile` with per-op numbers, top sites and matched messages.

### Output
`go_alloc_profile`.

### Quality Gate
- Every hot line has either an escape message copied from `escape.txt` or "no message; append growth" with the `append` line cited.

---

## Worked Example

Illustrative. rows=30000.

```
BenchmarkBuildReport/rows=30000-8   1   2934112050 ns/op   1516200112 B/op   3601877 allocs/op
$ go tool pprof -sample_index=alloc_objects -top ... | head -4
      flat  flat%   sum%        cum   cum%
   1800000 49.97% 49.97%    1800000 49.97%  example.com/app/internal/report.(*Builder).AddRow
    960000 26.65% 76.62%     960000 26.65%  fmt.Sprintf
$ grep 'report.go:71' perf/profiles/escape.txt
internal/report/report.go:71:14: &Entry{...} escapes to heap
internal/report/report.go:73:22: ... argument escapes to heap
```

Line 71 stores a pointer per entry in a slice of `*Entry`; line 73 builds a key with `fmt.Sprintf("%d-%s", id, sku)`.

---

## Exit Criteria

DONE when per-op allocation numbers, top sites by bytes and objects, and the escape analysis message for each hot line are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Benchmark too slow with `-memprofilerate=1` | **Adjust**: use the smaller size or the default rate, and record it. |
| Phase 2 | Top sites are in `encoding/json` or another library | **Adjust**: use `-peek` to find the project caller. |
| Phase 3 | Line not in `escape.txt` | **Adjust**: build with `-gcflags='-m -m'` and search the function name; inlining moves messages to the caller line. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
