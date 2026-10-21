# Go Goroutine Leak Hunt

**One-line description:** Samples `runtime.NumGoroutine`, diffs grouped goroutine profiles (`debug=1`) across a fixed load to find stacks whose count grows per operation, reads blocked state and wait time from `debug=2`, and names the channel, lock or context that never releases them.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `leak_brief` (object, required): From `leak-intake-load-recipe`.
- `load_recipe` (object, required): From `leak-intake-load-recipe`.
- `cause_hypotheses` (object[], required): From `leak-classic-causes-triage`. C6 and C9 entries are checked first; each report entry records the hypothesis id it confirms, or "none".

---

## Outputs

- `go_goroutine_report` (object[]): For each growing goroutine stack: the creating `go` statement (file:line from "created by"), the blocking frame and state (for example `chan send`, `select`, `IO wait`, `sync.Mutex.Lock`), count at each checkpoint, growth per operation, and the missing release (receiver, cancel, Close, Stop).

---

## Phase 1: Confirm Goroutine Growth

### Entry Criteria
- `/debug/pprof/` is reachable as set up in `leak-go-pprof-heap-diff` Phase 1 (same `net/http/pprof` import).

### Actions
1. Read the count at three checkpoints (warmup, +N ops, +2N ops). Either:
   - `curl -s 'http://127.0.0.1:6060/debug/pprof/goroutine?debug=1' | head -1` prints `goroutine profile: total <count>`.
   - Or log `runtime.NumGoroutine()` from the app.
2. Also read `StackInuse` from `runtime.MemStats` if available; every goroutine owns a stack, so a goroutine leak is also a memory leak.
3. Wait after the load stops for at least the longest timeout configured in the service (read it from config, for example the HTTP client `Timeout` or server `WriteTimeout`), then read the count again. Goroutines still alive after every timeout has passed are leaked, not slow.

### Output
Goroutine counts at four points (three under load, one after quiet).

### Quality Gate
- Four `total` values are recorded; growth per operation is computed between the first and third.

---

## Phase 2: Diff Grouped Stacks

### Entry Criteria
- Count grows with operations or stays high after quiet.

### Actions
1. Save grouped profiles at the first and third checkpoints:
   `curl -s 'http://127.0.0.1:6060/debug/pprof/goroutine?debug=1' > g1.txt` and later `> g3.txt`.
   Each group starts with `<count> @ <addresses>` followed by `#` lines with function and file:line.
2. Compare the leading counts of identical stacks. A quick way: `go tool pprof -top -base g1.pb.gz g3.pb.gz` on binary profiles fetched without `debug` (`curl -s -o g1.pb.gz http://127.0.0.1:6060/debug/pprof/goroutine`).
3. For the top growing stack, fetch full detail once: `curl -s 'http://127.0.0.1:6060/debug/pprof/goroutine?debug=2' > g_full.txt`. Each goroutine shows `goroutine 1234 [chan send, 14 minutes]:` and ends with `created by <func> in goroutine <n>` plus file:line.
4. Read the state with this table:

   | State in brackets | Usual cause |
   |---|---|
   | `chan send` | sender on an unbuffered or full channel whose receiver returned early (timeout or error path) |
   | `chan receive` | receiver waiting on a channel nobody closes |
   | `select` | select without a `ctx.Done()` case, or with a context that is never canceled |
   | `IO wait` | network read with no deadline; often HTTP response bodies not closed and drained |
   | `semacquire`, `sync.Mutex.Lock`, `sync.WaitGroup.Wait` | lock never released, or `wg.Done()` missing on an error path |
   | `sleep` with a `time.Ticker` frame | `ticker.Stop()` never called and the loop never exits |

### Output
Growing stacks with state and creation site.

### Quality Gate
- The growing stack's count in `g1.txt` and `g3.txt` is quoted, and its `created by` file:line is copied from `g_full.txt`.

---

## Phase 3: Name the Missing Release

### Entry Criteria
- Creation site known.

### Actions
1. Open the creating file at the `go` statement. Trace every exit path of the goroutine and of its caller.
2. Check, in order:
   1. Is there a `context.Context` passed in, and does every blocking operation select on `ctx.Done()`?
   2. Does the caller call the `cancel` returned by `context.WithCancel` or `WithTimeout` on every path (`defer cancel()`)? `go vet` reports some lost cancel functions (the `lostcancel` check).
   3. Does the result channel have buffer space for the sender if the receiver gives up (`make(chan T, 1)` for a single result)?
   4. For HTTP clients: is `resp.Body.Close()` deferred after every successful `Do`?
   5. For tickers: is `ticker.Stop()` deferred and does the loop exit on `ctx.Done()`?
3. Write the finding; do not change code here.
4. Plan the guard for the regression flow: `go.uber.org/goleak`, used as `defer goleak.VerifyNone(t)` in a test or `goleak.VerifyTestMain(m)` in `TestMain`, fails a test when goroutines remain after it.

### Output
`go_goroutine_report`.

### Quality Gate
- Each report entry names which of the five checks fails, with file:line.
- `go vet ./...` output is saved (it may or may not flag the issue).

---

## Worked Example

Illustrative only.

Input: count 212 at 10,000 requests, 5,190 at 60,000, 5,190 after 2 minutes quiet (client timeout 5 s).

Phase 2: `g3.txt` group:
```
4978 @ 0x43e2ce 0x40a4a5 ...
#	0x6c1b2f	example.com/svc/price.fetchQuote.func1+0x8f	/src/price/client.go:58
```
`g_full.txt`: `goroutine 88121 [chan send, 1 minutes]:` ... `created by example.com/svc/price.fetchQuote in goroutine 88003 /src/price/client.go:51`.

Phase 3: `client.go:51` starts a goroutine that sends on `ch := make(chan quote)` (unbuffered); the caller returns on `<-time.After(timeout)` without reading `ch`. Check 3 fails.

---

## Exit Criteria

DONE when goroutine growth is measured, each growing stack has its creation site and blocking state, and the failing release check is named.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Count rises under load and returns to baseline after quiet | **Stop**: not a leak; goroutines finish after their timeouts. |
| Phase 2 | Stacks are only runtime or net/http internals | **Adjust**: read the `created by` line; it points into your code or the HTTP server, and server connection goroutines point at unclosed client bodies. |
| Phase 2 | pprof endpoint not available | **Adjust**: send `SIGQUIT` to a test instance to dump all goroutine stacks to stderr (the process exits). |
| Phase 3 | Several stacks grow | **Adjust**: report each one; fix order is by count growth. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
