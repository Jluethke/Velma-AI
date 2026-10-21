# Go Synchronization Wait Fix

**One-line description:** Replaces `time.Sleep` waits, unsynchronized shared variables and leaked goroutines in a flaky Go test or the code it exercises with channels, `sync.WaitGroup`, `sync.Mutex` or `sync/atomic`, `require.Eventually` where only polling is possible, and a permanent goleak check.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_cause_evidence` (object, required): Race report lines, goleak stacks, suspect files.
- `flake_class` (string, required): `timing`, `race` or `resource_leak`.
- `baseline_command` (string, required): Reproducing command.
- `repo_path` (string, required): Module root.

---

## Outputs

- `go_sync_fix_diff` (string): Unified diff with a note per hunk naming the race or wait it fixes.

---

## Phase 1: List The Sites

### Entry Criteria
- `flake_class` is `timing`, `race` or `resource_leak`. Otherwise return an empty diff.

### Actions
1. For `race`: take each race's two file:line accesses from `root_cause_evidence`.
2. For `timing`: `grep -n -E "time\.Sleep|time\.After\(|<-time\.Tick" <pkg>/*_test.go` and the product functions the test calls.
3. For `resource_leak`: take each goroutine stack from goleak output; find the `go` statement that starts it and what should stop it (context cancel, channel close, `Close()` method).
4. Record for each site what it is waiting for or protecting.

### Output
Site list.

### Quality Gate
- Every site has a file:line and its purpose.

---

## Phase 2: Fix Each Site

### Entry Criteria
- Site list ready.

### Actions
1. One site at a time; run `go test ./<pkg> -run '^<Test>$' -count=1 -race` after each.
2. Use:

| Site | Fix |
|---|---|
| Test sleeps until goroutine finishes | Code returns a `done` channel or accepts a `sync.WaitGroup`; test does `<-done` or `wg.Wait()` |
| Test sleeps until a value appears, no hook possible | `require.Eventually(t, func() bool { return cond() }, <existing wait>, <existing tick>)` from testify, only if testify is already a dependency; otherwise a loop on `time.NewTimer` deadline with the existing wait value |
| Counter or flag written by goroutines | `atomic.Int64` / `atomic.Bool` (Go 1.19+) or guard with `sync.Mutex` |
| Map written concurrently | `sync.Mutex` around all accesses, or `sync.Map` only for its documented use cases |
| Loop variable captured by goroutine (go.mod `go` line below 1.22) | Pass as argument `go func(tc testCase){...}(tc)` or `tc := tc`; with `go 1.22` or later in go.mod each iteration has its own variable |
| `t.Parallel()` subtests reading a slice the parent mutates | Copy per subtest, or stop mutating after subtests start |
| `t.Fatal` / `t.FailNow` called from a non-test goroutine | Send the error on a channel and call `t.Fatal` in the test goroutine; `FailNow` must run on the test goroutine |
| Goroutine with no stop | Pass a `context.Context`; test calls `cancel()` in `t.Cleanup` and waits for exit |
| Leaked `time.Ticker` | `defer ticker.Stop()` |
| `httptest.Server` not closed | `t.Cleanup(srv.Close)` |

3. Timeouts and ticks: reuse values already in the test or package. Do not invent new ones.
4. Do NOT fix a race by adding a sleep, by removing `t.Parallel()` without fixing the shared variable, or by dropping `-race` from the CI command.
5. If the race is in product code, the fix is in product code; add a test comment only if the test changed.

### Output
Edited code.

### Quality Gate
- `go test ./<pkg> -run '^<Test>$' -count=1 -race` exits 0 with no `WARNING: DATA RACE`.
- `go vet ./<pkg>` exits 0 (vet flags some copied-lock and loop-capture mistakes).

---

## Phase 3: Add A Permanent Leak Check And Diff

### Entry Criteria
- Sites fixed.

### Actions
1. If the package has no `TestMain`, add in `main_test.go`: `func TestMain(m *testing.M) { goleak.VerifyTestMain(m) }`. If one exists, add `defer goleak.VerifyNone(t)` at the top of the fixed test. Add the module with `go get go.uber.org/goleak` only if not already in `go.mod`; run `go mod tidy` and include `go.mod` and `go.sum` in the diff.
2. Run the package: `go test ./<pkg> -count=1 -race`. goleak failures print `found unexpected goroutines`.
3. `git -C <repo_path> diff > flk-go-sync.diff`; paste into `go_sync_fix_diff`; delete the file.

### Output
`go_sync_fix_diff`.

### Quality Gate
- Package run exits 0 with goleak active.
- `gofmt -l <changed files>` prints nothing.

---

## Worked Example

Illustrative. Race in `billing.(*Invoice).addLine` (`invoice.go:54`) against `invoice_test.go:86`.

- Phase 1: product code starts `go inv.addLine(l)` per line and returns; test reads `inv.total`.
- Phase 2: `AddLines` now uses a `sync.WaitGroup` and waits before returning; `total` updates happen under `inv.mu`. `go test ./internal/billing -run '^TestInvoiceRounding$' -count=1 -race` prints `ok`.
- Phase 3: `main_test.go` with `goleak.VerifyTestMain(m)`; package run prints `ok  example.com/shop/internal/billing 1.92s`. Diff: `invoice.go`, `main_test.go`, `go.mod`, `go.sum`.

---

## Exit Criteria

DONE when every site is fixed by the table, race and vet runs are clean, goleak is active for the package, and the diff is gofmt-clean.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `flake_class` not matched | **Return**: empty diff. |
| Phase 2 | Fix introduces a deadlock (`fatal error: all goroutines are asleep - deadlock!`) | **Adjust**: a channel has no sender or a lock is taken twice; read the goroutine dump and fix the order. |
| Phase 3 | goleak reports goroutines from a third-party library | **Adjust**: `goleak.IgnoreTopFunction("<pkg.func>")` with a comment; never ignore your own code. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
