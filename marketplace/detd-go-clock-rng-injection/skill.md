# Go Clock and RNG Injection

**One-line description:** Replaces `time.Now`, timers, global `math/rand` calls, map range order and multi-case `select` on the Go decision path with an injected clock interface, a seeded `math/rand/v2` PCG source and sorted iteration, then bans direct calls with the golangci-lint `forbidigo` linter.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Go module root containing `go.mod`.
- `nondeterminism_sources` (object[], required): Rows from `detd-nondeterminism-inventory` for the go stack with `reaches_decision` of yes or unknown.

---

## Outputs

- `injection_patch` (string): Path to `detd_injection.patch`.
- `seam_tests` (string[]): Test names (for example `TestSameSeedSameOutput`) proving the seams.

---

## Phase 1: Define the Seams

### Entry Criteria
- `go test ./...` exits 0; record the count of `ok` packages.
- `go version` reports the toolchain; `math/rand/v2` needs Go 1.22 or later.

### Actions
1. Add package `seams` with `type Clock interface { NowNanos() int64 }`, a production type returning `time.Now().UnixNano()` for wall time or a monotonic reading for durations, and a `FakeClock` with `Set` and `Advance`. Alternatively adopt an existing fake clock package such as `k8s.io/utils/clock/testing`; check its API with `go doc` before writing calls.
2. RNG: create the generator as `rand.New(rand.NewPCG(seed1, seed2))` from `math/rand/v2` and pass the `*rand.Rand` in. The v2 top level functions (`rand.IntN`, `rand.Float64`) use a randomly seeded global source and cannot be seeded, so they are banned on the decision path.
3. `time.Now()` returns a value with a monotonic reading; `t.Sub(u)` uses it. Replay injects the tick time, so durations are computed from injected `int64` nanoseconds, not from `time.Time` values captured inside the decision.

### Output
`seams` package.

### Quality Gate
- `go vet ./seams/...` exits 0.
- A test draws 3 values from two generators built with the same seeds and asserts equality.

---

## Phase 2: Thread Seams, Sort Maps, Remove Select Races

### Entry Criteria
- Seams compile.

### Actions
1. Edit one call site, run `go test ./...`, repeat. Do not edit many packages before running tests.
2. Map iteration order is randomized by the runtime on purpose. For every `for k, v := range m` that affects output, iterate sorted keys: `for _, k := range slices.Sorted(maps.Keys(m))` (Go 1.23 or later; on older toolchains collect keys into a slice and `sort.Strings` or `slices.Sort`).
3. A `select` with several ready cases picks one uniformly at random. On the decision path, do not let `select` decide input order: drain all channels into one batch and sort by the ordering key from `detd-input-ordering-contract`.
4. Goroutine fan-out that writes results into a shared slice must write to a fixed index per input, not `append` in completion order.
5. Run `go test -race ./...` after the last edit.

### Output
Decision path edited.

### Quality Gate
- `go test -race ./...` exits 0 with no `WARNING: DATA RACE` in output.
- No `_test.go` assertion was removed: `git diff -- '*_test.go' | rg '^-\s*(t\.(Error|Fatal)|require\.|assert\.)'` returns nothing.

---

## Phase 3: Ban and Prove

### Entry Criteria
- Phase 2 tests pass.

### Actions
1. Enable `forbidigo` in `.golangci.yml` and list patterns for `time.Now`, `time.Since`, `time.After`, `time.NewTimer`, `time.NewTicker` and top level `rand.` functions, with an exclusion rule for the `seams` package. The configuration key layout changed between golangci-lint v1 and v2; copy the structure from `golangci-lint help linters` and the official forbidigo docs for your installed version.
2. Run `golangci-lint run ./...` and confirm exit 0.
3. Add `TestSameSeedSameOutput`: two decision instances with the same `FakeClock` and seeds produce byte equal serialized output (`bytes.Equal`).
4. Mutation check: add `_ = time.Now()` in one decision file, run `golangci-lint run`, confirm a forbidigo finding, then `git restore` the file.
5. For tests of code with timers, Go 1.25 provides `testing/synctest` with fake time inside a bubble; check `go doc testing/synctest` for your version before using it.
6. `git diff > detd_injection.patch`.

### Output
`injection_patch`, `seam_tests`.

### Quality Gate
- `golangci-lint run ./...` exits 0 on the final tree and reported forbidigo during the mutation check.
- `go test -run TestSameSeedSameOutput ./...` prints `ok`.

---

## Worked Example

Illustrative only. Source row `arbiter/limits.go:44 for name, lim := range active {`.

Phase 2: changed to `for _, name := range slices.Sorted(maps.Keys(active)) { lim := active[name]`. `go test -race ./...` prints `ok  example.com/arbiter 0.41s`. Phase 3 mutation: `golangci-lint run` prints `arbiter/limits.go:12:6: use of `time.Now` forbidden by pattern ... (forbidigo)`.

---

## Exit Criteria

DONE when every reachable go source row is fixed, forbidigo bans direct calls, the race detector is clean and the seam test passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Toolchain older than Go 1.22 | **Adjust**: use `math/rand` with `rand.New(rand.NewSource(seed))` and record the algorithm; plan the upgrade. |
| Phase 2 | Race detector reports a race | **Stop**: fix the race before any determinism claim; races make replay meaningless. |
| Phase 3 | golangci-lint config rejected | **Adjust**: run `golangci-lint config verify` (v2) and match the documented schema. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
