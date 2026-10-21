# Incident Go pprof Goroutine and CPU Capture

**One-line description:** Pulls goroutine dumps, a CPU profile and heap and mutex profiles from a live Go service's `net/http/pprof` endpoint through a port-forward, and reads them to find goroutine pileups, the wait reason they are stuck on, and the hottest functions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `debug_access` (object, required): From `inc-k8s-safe-debug-access`; pod name, namespace and container.
- `hypothesis_table` (object[], required): From `inc-hypothesis-draft`; rows that need Go runtime evidence.

---

## Outputs

- `go_runtime_evidence` (object): {pprof_port, goroutine_total, top_wait_states (state, count, stack top), long_blocked (goroutines waiting minutes), cpu_top, heap_inuse_top, mutex_or_block_top, files, hypotheses_affected}.

---

## Phase 1: Reach the pprof Endpoint

### Entry Criteria
- The service imports `net/http/pprof` (search the code: `grep -rn 'net/http/pprof' --include=*.go .`).

### Actions
1. Find the port it serves on. Commonly a separate admin listener such as `http.ListenAndServe("localhost:6060", nil)`; read the code or config to get the real port. Never assume it.
2. Port-forward to it: `kubectl port-forward pod/<pod> -n <ns> <port>:<port>`. If the listener binds to localhost inside the pod, port-forward still reaches it.
3. Test: `curl -sS http://localhost:<port>/debug/pprof/` lists the available profiles.
4. Do NOT expose pprof through an Ingress or public Service to make this easier. It reveals internals and a CPU profile adds load.
5. If the service does not import pprof, record that; adding it requires a deploy and is a follow-up action, not an incident step.

### Output
Working pprof URL.

### Quality Gate
- The index page lists `goroutine`, `heap` and `profile`.

---

## Phase 2: Goroutine Dumps

### Entry Criteria
- pprof URL works.

### Actions
1. Take a grouped summary and a full dump:
   ```
   curl -sS "http://localhost:<port>/debug/pprof/goroutine?debug=1" > goroutine-grouped.txt
   curl -sS "http://localhost:<port>/debug/pprof/goroutine?debug=2" > goroutine-full.txt
   ```
2. Read the first line of `goroutine-grouped.txt`: `goroutine profile: total N`. Record N and compare with the `go_goroutines` metric over the incident window if exported.
3. In `debug=1`, each block starts with a count followed by `@` and addresses, then the stack. Sort mentally by count; the largest groups are the pileups. Record the top three with their first application frame.
4. In `debug=2`, each goroutine header shows its wait state and, when blocked long enough, the duration, for example `goroutine 4512 [chan receive, 12 minutes]:`. Count states:
   `grep -oE '^goroutine [0-9]+ \[[^],]+' goroutine-full.txt | sed 's/.*\[//' | sort | uniq -c | sort -rn`
5. Read the states:

| Wait state | Usual meaning |
|---|---|
| `IO wait` | waiting on a network socket (normal for idle connections; a pileup means slow downstream) |
| `select`, `chan receive`, `chan send` | waiting on channels; a pileup with minutes-long durations points to a missing sender, unbuffered channel, or leaked goroutine |
| `semacquire`, `sync.Mutex.Lock`, `sync.RWMutex.RLock` | lock contention or a held lock |
| `sync.Cond.Wait` | waiting on a condition, often a pool (for example `database/sql` connection pool when all connections are in use) |
| `running`, `runnable` | CPU work or waiting for a CPU |

6. Repeat the `debug=1` capture after a short wait. Groups that grow between captures are leaking.

### Output
Goroutine files and state counts.

### Quality Gate
- goroutine_total is recorded from the header line.
- The state count command output is pasted.

---

## Phase 3: CPU, Heap and Contention Profiles

### Entry Criteria
- Goroutine evidence is read.

### Actions
1. CPU profile (adds sampling overhead for its duration; the ops lead picks the duration):
   `go tool pprof -top -nodecount=25 "http://localhost:<port>/debug/pprof/profile?seconds=<n>"`
   Read `flat` (time in the function itself) and `cum` (including callees). The highest `flat` entries are hot code.
2. Heap in use: `go tool pprof -sample_index=inuse_space -top -nodecount=25 "http://localhost:<port>/debug/pprof/heap"`. Use `alloc_space` instead when looking for allocation churn.
3. Mutex and block profiles return data only if the program enabled them (`runtime.SetMutexProfileFraction`, `runtime.SetBlockProfileRate`). Check: `go tool pprof -top "http://localhost:<port>/debug/pprof/mutex"`. Empty output means it is not enabled; record that.
4. Save raw profiles for later: add `-proto` and redirect, or `curl -sS -o cpu.pb.gz "...profile?seconds=<n>"`.
5. Map evidence to hypothesis rows: supports or refutes, with the quoted stack or top line.

### Output
`go_runtime_evidence`.

### Quality Gate
- `cpu_top` lists at least the top five `flat` lines from pprof output.
- Each Go-related hypothesis row has supports or refutes plus a quoted line.

---

## Worked Example

Illustrative only. Service `checkout` in Go, pprof on `localhost:6060`.

- Phase 1: `grep` finds `_ "net/http/pprof"` in `cmd/checkout/main.go` and `go http.ListenAndServe("localhost:6060", nil)`. Port-forward 6060. Index lists all profiles.
- Phase 2: `goroutine profile: total 18342`. Top group: `17930 @ ...` with first app frame `checkout/internal/pricing.(*Client).Get`. State counts: `17920 IO wait`, `310 select`, `61 semacquire`. `debug=2` shows `[IO wait, 7 minutes]` on those goroutines. A second capture: 18,890. Growing.
- Phase 3: CPU top flat is `runtime.scanobject` (GC), from heap growth of goroutine stacks. Mutex profile empty (not enabled). H3 (goroutine pileup waiting on pricing-v2) supported.

---

## Exit Criteria

DONE when goroutine totals, state counts, the top pileup stacks and a CPU top list are captured and each Go hypothesis row is decided with a quoted line.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | pprof not imported | **Return**: record "no pprof"; use logs, traces and `kill -QUIT` only with IC approval since SIGQUIT makes the Go runtime dump stacks AND exit. |
| Phase 2 | Dump is huge and slow | **Adjust**: use `debug=1` grouped output only. |
| Phase 3 | `go tool pprof` not installed | **Adjust**: save with curl and read it on a machine with Go installed. |
| Phase 3 | CPU profile request times out | **Retry**: with a shorter `seconds` value and a longer client timeout. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
