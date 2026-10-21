# Go Goroutine Dump for Deadlocks and Leaks

**One-line description:** Captures every goroutine's stack from a hung Go test or process (SIGQUIT, test timeout panic, or pprof `goroutine?debug=2`), groups goroutines by wait reason, and finds the lock or channel cycle, plus goroutine leaks with `goleak`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the Go module root.
- `stress_command` (string, required): From `race-stress-harness`.
- `failure_class` (string, required): From `race-symptom-triage`. This flow applies to `deadlock`, `livelock` and `goroutine-or-thread-leak`; other classes return an empty report.

---

## Outputs

- `go_hang_report` (object): `dump_file`, `groups` (wait reason, count, top in-module frame), `cycle` (ordered list of goroutine id, resource held, resource waited on), `leaked_goroutines` (from `goleak`), and `classification` (`lock-cycle`, `channel-no-sender`, `channel-no-receiver`, `waitgroup-never-done`, `leak`, `spin`).

---

## Phase 1: Capture the Dump

### Entry Criteria
- `failure_class` is `deadlock`, `livelock` or `goroutine-or-thread-leak`.

### Actions
1. Pick the capture method with this table:

| Situation | Method |
|---|---|
| Whole program blocks and the runtime notices | The runtime prints `fatal error: all goroutines are asleep - deadlock!` followed by all stacks. Save stderr. |
| Test hangs | Run with a test timeout: `go test -run '^TestX$' -timeout <user max seconds>s ./pkg 2>&1 | tee /tmp/hang.txt`. On expiry `go test` panics with `panic: test timed out after ...` and prints all goroutines. |
| Running process, can signal it | `kill -QUIT <pid>`; the Go runtime prints all goroutine stacks to stderr and exits with status 2. Set `GOTRACEBACK=all` (or `system` to include runtime goroutines) in the environment before start if you need more detail. |
| Running server, must not exit | Import `_ "net/http/pprof"` behind an internal-only listener, then `curl -s http://127.0.0.1:<port>/debug/pprof/goroutine?debug=2 > /tmp/hang.txt`. |

2. Do not use the `-race` build for the dump unless the hang only appears with `-race`; the race runtime changes timing.
3. For livelock (CPU high), also take a 30-second CPU profile from pprof (`/debug/pprof/profile?seconds=30`) or `go test -cpuprofile cpu.out`, then `go tool pprof -top cpu.out`. The duration is the pprof handler's documented default; change it if the hang is shorter.
4. Take a second dump after the operation should have finished. A goroutine that is in the same frame in both dumps is stuck; one that moved is slow.

### Output
One or two saved dump files.

### Quality Gate
- The dump file contains lines matching `^goroutine [0-9]+ \[` (`grep -c "^goroutine " /tmp/hang.txt` prints a number greater than 0).
- For a running process, two dumps exist with recorded timestamps.

---

## Phase 2: Group and Find the Cycle

### Entry Criteria
- Dump file exists.

### Actions
1. Count goroutines by wait reason: `grep -oE "^goroutine [0-9]+ \[[^],]+" /tmp/hang.txt | sed 's/.*\[//' | sort | uniq -c | sort -rn`.
2. Read the wait reasons with this table:

| Wait reason in header | Meaning | Look at |
|---|---|---|
| `sync.Mutex.Lock` or `semacquire` with `sync.(*Mutex).Lock` in the stack | Waiting for a mutex | Which goroutine holds that mutex |
| `sync.RWMutex.RLock` / `sync.RWMutex.Lock` | Waiting for a read or write lock | A pending writer blocks new readers |
| `chan receive` | Waiting on `<-ch` | Is any goroutine able to send or close `ch` |
| `chan send` | Waiting on `ch <-` | Is any goroutine receiving; unbuffered channel with no reader |
| `select` (no cases ready) | Waiting on every case | Each channel in the select |
| `semacquire` with `sync.(*WaitGroup).Wait` | `wg.Wait()` | A missing `wg.Done()` or `Add` after `Wait` started |
| `IO wait` | Network or file wait | External dependency, not a lock |
| `running` / `runnable` in both dumps, same frames | Spin | Livelock or busy loop |

The header may also include a duration such as `[chan receive, 12 minutes]`; it means the goroutine has been blocked at least that long.
3. Build the cycle for lock waits. Go dumps do not print the lock owner. For each blocked goroutine, record the mutex variable from the in-module frame (for example `s.mu` at `store.go:40`). Then search the other goroutines' stacks for frames inside a function that holds that mutex (a frame after its `Lock()` call and before `Unlock()`). Write edges "goroutine A holds X, waits Y". A closed loop of edges is the deadlock.
4. For channel waits, list every send, receive and close site for that channel: `rg -n "<chan name>\s*<-|<-\s*<chan name>|close\(<chan name>\)" <pkg dir>`. If no live goroutine sits at a matching site, classify `channel-no-sender` or `channel-no-receiver`.
5. Optional, for repeated lock-order deadlocks: swap `sync.Mutex` for `github.com/sasha-s/go-deadlock` in a throwaway branch; it reports lock-order inversions and long waits with both stacks. Revert the branch after reading the report.

### Output
Groups table, cycle edges and a classification.

### Quality Gate
- The groups table counts sum to the total from `grep -c "^goroutine "`.
- A `lock-cycle` classification lists at least two edges that close the loop, each with file:line; otherwise the classification is something else.

---

## Phase 3: Check for Goroutine Leaks

### Entry Criteria
- Classification done, or `failure_class` is `goroutine-or-thread-leak`.

### Actions
1. Add `go.uber.org/goleak` to the test module: `go get go.uber.org/goleak`.
2. In the harness test add `defer goleak.VerifyNone(t)` as the first line, or add `func TestMain(m *testing.M) { goleak.VerifyTestMain(m) }` in the package.
3. Run the harness once: `go test -run '^TestX$' -count=1 ./pkg`. goleak fails the test with `found unexpected goroutines:` followed by each leaked goroutine's stack.
4. Record each leaked goroutine's top in-module frame in `leaked_goroutines`. Typical causes: a goroutine blocked on a channel send after the receiver returned on timeout (fix with a buffered channel of size 1 or a `select` with `ctx.Done()`), a `time.Ticker` never stopped, a missing `cancel()` for a context.
5. Do not add `goleak.IgnoreTopFunction` for in-module functions to silence a finding. Ignore options are only for known third-party background goroutines, each named with a reason.

### Output
`go_hang_report`.

### Quality Gate
- The goleak run output is saved; a leak classification cites a `found unexpected goroutines` block.
- Every `IgnoreTopFunction` added names a function outside `repo_path`.

---

## Worked Example

Illustrative only.

`go test -run '^TestTransfer$' -timeout 30s ./bank 2>&1 | tee /tmp/hang.txt` ends with `panic: test timed out after 30s`.

Grouping prints:
```
      2 sync.Mutex.Lock
      1 chan receive
```
Stacks: goroutine 21 `[sync.Mutex.Lock]` in `(*Bank).Transfer` at `bank.go:40` (`to.mu.Lock()`), with the frame at line 39 `from.mu.Lock()` already passed. Goroutine 22 the same function, called with the two accounts swapped. Edges: G21 holds acct A, waits acct B; G22 holds acct B, waits acct A. Classification `lock-cycle`. goleak run after a fix candidate: no output, pass.

---

## Exit Criteria

DONE when a dump was captured and saved, every goroutine is counted in a wait-reason group, the classification is backed by edges or channel site lists, and goleak was run.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `failure_class` is not a hang class | **Return**: emit an empty `go_hang_report` with classification `not-applicable`. |
| Phase 1 | SIGQUIT is caught by the program (`signal.Notify` on SIGQUIT) | **Adjust**: use the pprof endpoint or the test timeout method. |
| Phase 1 | On Windows, no SIGQUIT | **Adjust**: use the test timeout method or pprof. |
| Phase 2 | Lock owner cannot be found in any stack | **Adjust**: the owner returned without `Unlock` (missing `defer mu.Unlock()` on an error path); search with `rg -n "Lock\(\)" <file>` and check every return between Lock and Unlock. |
| Phase 3 | goleak reports goroutines from a third-party library | **Adjust**: add `goleak.IgnoreTopFunction("<full function name>")` with a comment naming the library. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
