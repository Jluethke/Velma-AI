# Go Test Sleep Replacement

**One-line description:** Removes `time.Sleep` and fixed `time.After` waits from Go tests by synchronizing on channels or `sync.WaitGroup`, injecting a clock or a sleep function into production code, or running the test inside a `testing/synctest` bubble on Go versions that support it, one test per change, with a mutation check.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Module root.
- `hotspot_plan` (object, required): From `tsp-hotspot-classify`; items with cause `sleep`.

---

## Outputs

- `go_sleep_fixes` (object): One row per item: package, test, sleep kind, technique, commit SHA, test seconds before and after, mutation result, full-suite result with `-race`.

---

## Phase 1: Classify Each Sleep

### Entry Criteria
- At least one `sleep` item is `todo`.

### Actions
1. Record `go version` and the `go` directive in `go.mod`.
2. Classify:

| Pattern | Kind |
|---|---|
| Test sleeps after starting a goroutine so it can finish | `wait_goroutine` |
| Production code sleeps in a retry, backoff, ticker, or timeout path, and the test waits for it | `prod_timer` |
| Code compares `time.Now()` against a deadline or TTL | `clock_read` |
| Test sleeps "to let the server start" | `server_ready` |

### Output
Kind per item.

### Quality Gate
- Go version and each item's kind recorded.

---

## Phase 2: Apply One Fix

### Entry Criteria
- One item selected; `go test ./...` green.

### Actions
1. Time before: `go test -count=1 -run '^TestName$' -v ./pkg/...`; record the `--- PASS: TestName (N.NNs)` value.
2. Apply the technique:

| Kind | Technique |
|---|---|
| `wait_goroutine` | Have the goroutine signal completion: `done := make(chan struct{})`, `close(done)` at its end, and in the test `select { case <-done: case <-time.After(<old sleep value>): t.Fatal("timeout") }`. The old sleep value becomes the upper bound, so the test returns as soon as the work is done. For several goroutines use `sync.WaitGroup`. |
| `prod_timer` | Option A: inject the delay or a sleep function through a struct field or option (`type Retrier struct { Sleep func(time.Duration) }` defaulting to `time.Sleep`); the test passes a recorder func and asserts the recorded durations. Option B, Go 1.25 or newer: wrap the test body in `synctest.Test(t, func(t *testing.T) { ... })` from `testing/synctest`; inside the bubble `time.Sleep` and timers use a fake clock that advances when every goroutine in the bubble is blocked. On Go 1.24 the package was experimental behind `GOEXPERIMENT=synctest` with `synctest.Run`; check `go doc testing/synctest` for your version before using it. |
| `clock_read` | Inject a clock: a `Now func() time.Time` field, or a clock interface. Third-party clocks exist (for example `github.com/jonboulle/clockwork`); check its README for the current API before importing. `synctest` also fakes `time.Now` inside the bubble on supported versions. |
| `server_ready` | Use `httptest.NewServer` (ready when it returns), or poll the address with `net.Dial` in a loop bounded by the old sleep value. |

3. Production code changes in `prod_timer` and `clock_read` are allowed only as a new optional field or option with the old behavior as the default. Do NOT change public function signatures that other packages call.
4. Do NOT lower sleep values, delete assertions, or add `t.Skip`.

### Output
One-item change.

### Quality Gate
- `go vet ./...` prints nothing.
- `git diff --stat` shows the test file plus at most one production file for an injected field.

---

## Phase 3: Prove and Commit

### Entry Criteria
- Change applied.

### Actions
1. Time after with the same command as Phase 2 step 1.
2. Race check: `go test -count=1 -race -run '^TestName$' ./pkg/...`. Channel and WaitGroup changes must be race-free.
3. Mutation check: break the behavior (skip the retry, remove the `close(done)` in production), run the test, confirm `--- FAIL`, revert with `git checkout -- <file>`.
4. Full suite: `go test -count=1 ./...`; must pass.
5. Commit and record the row.

### Output
Row in `go_sleep_fixes`.

### Quality Gate
- Race run prints `ok` and no `WARNING: DATA RACE`.
- Mutation run prints `--- FAIL: TestName`.
- Full suite prints no `FAIL` lines.

---

## Worked Example

Illustrative. Go 1.25. Item: `notify.TestRetryBackoff`, `notify/retry_test.go:44` `time.Sleep(3 * time.Second)`; production `Send` retries with `time.Sleep(backoff)`.

- Phase 1: kind `prod_timer`.
- Phase 2: test body wrapped in `synctest.Test(t, func(t *testing.T) { err := Send(ctx, msg); ... })`; the sleep in the test removed because `Send` returns after its retries in fake time.
- Phase 3: `--- PASS: TestRetryBackoff (9.01s)` becomes `(0.00s)`. Race run `ok`. Mutation `maxAttempts = 1` gives `--- FAIL: TestRetryBackoff`. Full suite passes.

---

## Exit Criteria

DONE when every `sleep` item is `done` with a committed one-item change, a clean race run, a failing mutation run and a passing full suite, or recorded as not fixable with the reason.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `synctest` reports deadlock | **Adjust**: a goroutine waits on I/O or a channel outside the bubble; use injection (Option A) instead. |
| Phase 2 | Go version lacks `testing/synctest` | **Adjust**: use Option A. |
| Phase 3 | Race detector reports a race in the new channel code | **Retry**: send on the channel after the shared write, not before. |
| Phase 3 | Mutation still passes | **Stop**: revert; the test no longer checks the behavior. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
