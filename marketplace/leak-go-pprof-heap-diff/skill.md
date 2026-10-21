# Go pprof Heap Profile Diff (inuse vs alloc)

**One-line description:** Exposes `net/http/pprof`, fetches two heap profiles with `gc=1` across a fixed load window, and diffs them with `go tool pprof -base` on `inuse_space` and `inuse_objects` to find call sites whose live memory grows, keeping `alloc_space` only for allocation-rate questions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `leak_brief` (object, required): From `leak-intake-load-recipe`. Binary, host and how to reach it.
- `load_recipe` (object, required): From `leak-intake-load-recipe`.
- `cause_hypotheses` (object[], required): From `leak-classic-causes-triage`.

---

## Outputs

- `go_heap_diff` (object[]): Top functions by `inuse_space` delta between the two profiles (flat and cum), with `inuse_objects` delta, the source lines from `list`, and the profile file paths.

---

## Phase 1: Expose the Profiling Endpoint

### Entry Criteria
- `go version` prints the toolchain; the service source is available.

### Actions
1. If the service does not already expose pprof, add on a branch, in `main`:
   ```go
   import (
       "log"
       "net/http"
       _ "net/http/pprof"
   )
   go func() { log.Println(http.ListenAndServe("127.0.0.1:6060", nil)) }()
   ```
   The blank import registers handlers on `http.DefaultServeMux`. If the app uses its own mux, register `pprof.Index`, `pprof.Profile` and friends from `net/http/pprof` explicitly, or keep the separate listener above.
2. Bind to `127.0.0.1` only. Reach it with `kubectl port-forward pod/<pod> 6060:6060` or an SSH tunnel. Never expose pprof publicly.
3. Leave `runtime.MemProfileRate` at its default (one sample per 512 KiB allocated on average, per the `runtime` docs). Changing it requires setting it as early as possible in `main`, and the default is enough to find a steady leak.

### Output
Reachable `/debug/pprof/` endpoint.

### Quality Gate
- `curl -s http://127.0.0.1:6060/debug/pprof/ | head` prints the profile index (lists `heap`, `goroutine`, `allocs`).

---

## Phase 2: Capture Two Heap Profiles

### Entry Criteria
- Endpoint reachable.

### Actions
1. Warm up with `load_recipe` to `warmup_ops`.
2. Fetch profile 1: `curl -s -o heap1.pb.gz 'http://127.0.0.1:6060/debug/pprof/heap?gc=1'`. `gc=1` runs a garbage collection before the profile so in-use numbers reflect live data.
3. Run N operations.
4. Fetch profile 2 the same way into `heap2.pb.gz`.
5. Note: the heap profile is as of the most recently completed GC cycle; `gc=1` makes that cycle happen right before the fetch.

### Output
`heap1.pb.gz`, `heap2.pb.gz`.

### Quality Gate
- `go tool pprof -top heap2.pb.gz | head -5` prints a header with `Type: inuse_space`.

---

## Phase 3: Diff and Read

### Entry Criteria
- Two profiles exist.

### Actions
1. Diff live bytes: `go tool pprof -sample_index=inuse_space -base heap1.pb.gz -top -cum <binary> heap2.pb.gz`. Passing the binary is optional with modern Go (symbols are embedded) but helps for `list`.
2. Diff live object counts: same command with `-sample_index=inuse_objects`.
3. Choose the index by question:

   | Question | Sample index |
   |---|---|
   | What is still live and growing (the leak) | `inuse_space`, `inuse_objects` |
   | What allocates the most (GC pressure, not a leak) | `alloc_space`, `alloc_objects` |

   Do not report `alloc_space` growth as a leak: alloc counts are cumulative since start and always grow.
4. Read `flat` (memory allocated directly in that function) and `cum` (including callees). The leak site is usually the function with the largest positive `flat` delta; the function holding it is found by reading code paths in `cum` order.
5. Inspect source for the top entries: `go tool pprof -sample_index=inuse_space -base heap1.pb.gz <binary> heap2.pb.gz` then at the prompt `list <FuncRegex>`; or open the web UI with `-http=127.0.0.1:8081` and use the Source and Flame Graph views.
6. pprof shows where memory was allocated, not who keeps it. Use the allocation site to find the data structure and then search where that value is stored (map insert, slice append, channel buffer, goroutine closure). If `runtime.malg` or stack growth dominates, go to `leak-go-goroutine-leak`.

### Output
`go_heap_diff`.

### Quality Gate
- The two `-top` diff outputs (space and objects) are saved, and each `go_heap_diff` entry quotes its flat delta from them.
- Each entry has `list` output lines for the allocating function.

---

## Worked Example

Illustrative only.

Input: Go HTTP service, H1 = C1 package-level map in `session/store.go`.

Phase 2: profiles at 10,000 and 60,000 requests.

Phase 3:
```
$ go tool pprof -sample_index=inuse_space -base heap1.pb.gz -top heap2.pb.gz
Type: inuse_space
Showing nodes accounting for 48.51MB, 97.1% of 49.95MB total
      flat  flat%   sum%        cum   cum%
   31.01MB 62.08% 62.08%    31.01MB 62.08%  example.com/svc/session.(*Store).Put
   17.50MB 35.03% 97.11%    17.50MB 35.03%  encoding/json.(*decodeState).literalStore
```
`list Put` shows `s.items[id] = sess` at `store.go:44`; no delete path except `Logout`. `inuse_objects` delta for `Put` is +50,000, one per request.

---

## Exit Criteria

DONE when two `gc=1` heap profiles are diffed on in-use indexes and each growing allocation site has its source line and the structure that stores the value.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cannot change the code to add pprof | **Adjust**: if the binary is a test, use `go test -memprofile mem.out`; for production, ask for a debug build. |
| Phase 2 | Profiles nearly identical, RSS still grows | **Return**: to `leak-managed-vs-native-split`; check `HeapReleased`, `StackInuse` and cgo. |
| Phase 3 | `list` prints no source | **Adjust**: pass the matching binary and run from the module root, or use `-source_path`. |
| Phase 3 | Growth only in `alloc_space` | **Stop**: that is allocation rate, not a leak; report it as a performance item. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
