# Cache Stampede Request Coalescing

**One-line description:** Collapses concurrent misses for the same key inside one process into a single load using the stack's standard primitive (Go `singleflight`, a Node promise map, a Python asyncio task map or per-key lock, Java Caffeine `get` with a mapping function or Spring `@Cacheable(sync = true)`), with correct error sharing and cleanup.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository.
- `stampede_plan` (object[], required): Rows from `cache-stampede-risk-assess` that include `coalescing`.
- `stack` (string, required): `python`, `node`, `go` or `java`.

---

## Outputs

- `coalescing_change` (object): Files changed, primitive used, error and cancellation behavior, and the concurrency test result (loader calls before and after).

---

## Phase 1: Write the Concurrency Test First

### Entry Criteria
- `stampede_plan` row includes `coalescing`.
- The suite is green; record the summary.

### Actions
1. Write a test that fires K concurrent reads for one missing key, where K is at least N from `stampede_plan`, against a loader that sleeps briefly inside (to hold the miss window open) and counts calls. The sleep is inside the fake loader to simulate work, not to order the test.
2. Add a second test: the loader raises an error; all K callers receive the error, and the NEXT call after that tries the loader again (errors are not cached).
3. Run both. The first must fail now (loader called about K times).

### Output
Failing concurrency test.

### Quality Gate
- The first test fails with a loader count near K, recorded verbatim.

---

## Phase 2: Implement With the Stack Primitive

### Entry Criteria
- Failing test exists.

### Actions
1. Use only the row for `stack`:

   | `stack` | Primitive | Notes |
   |---|---|---|
   | `go` | `golang.org/x/sync/singleflight`: `v, err, shared := g.Do(key, func() (any, error) {...})` | One `singleflight.Group` per cache, as a struct field. The function runs with the FIRST caller's context; if that caller cancels, everyone gets the error. Run the load with `context.WithoutCancel(ctx)` (Go 1.21 and later) plus its own timeout. Use `DoChan` if callers need their own deadline with `select`. |
   | `node` | `const inflight = new Map<string, Promise<T>>()`; if `inflight.has(key)` return it; else create the promise, store it, and `finally(() => inflight.delete(key))` | Delete in `finally` so a rejected promise is removed and the next call retries. If the repo uses `lru-cache`, its `fetch()` already coalesces (see `cache-node-inprocess-lru`). |
   | `python` (asyncio) | `inflight: dict[str, asyncio.Task]`; reuse an existing task, else `asyncio.create_task(load())`, store it, and remove it in a `done` callback or `finally` | Await with `asyncio.shield(task)` if one caller's cancellation must not cancel the shared load. |
   | `python` (threads) | Per-key lock: `with locks_lock: lock = locks.setdefault(key, threading.Lock())`, then `with lock:` re-check the cache, load, set | Re-check the cache after acquiring the lock; otherwise waiters each load again. Remove idle locks or bound the dict, or it grows with every key. |
   | `java` | Caffeine `cache.get(key, k -> load(k))` (atomic per key), or `AsyncLoadingCache`; in Spring, `@Cacheable(cacheNames = "...", key = "...", sync = true)` | `sync = true` coalesces per JVM for the annotated method; it cannot be combined with `unless`. |

2. Coalescing works per process. With P processes, up to P loads still happen per expiry; add `cache-stampede-redis-lock` if `stampede_plan` lists `lock`.
3. Never store a failed result in the in-flight map beyond the current wave.
4. Edit only the cache module.

### Output
Coalesced read path.

### Quality Gate
- Both tests from Phase 1 pass.
- The full suite passes.

---

## Phase 3: Check Under Load

### Entry Criteria
- Tests pass.

### Actions
1. In staging, force an expiry of a hot key (`redis-cli DEL <key>` or restart for in-process) under steady load.
2. Count loader executions in the next d_p99 seconds (miss-path counter or `pg_stat_statements.calls` delta).
3. Expected: at most one per process (P). Compare with the forced-expiry count before this change.
4. Go only: if goroutine counts rise under load, check that `DoChan` results are always read or that callers do not leak; read `runtime.NumGoroutine()` or `/debug/pprof/goroutine?debug=1`.

### Output
`coalescing_change`.

### Quality Gate
- Loader executions after the forced expiry are recorded and are at most P.

---

## Worked Example

Illustrative. Go service, 6 pods, N = 54 for category counts.

Phase 1: 60 goroutines on a missing key: `loader calls = 60, want 1`.

Phase 2: `singleflight.Group` field added; load runs under `context.WithoutCancel(ctx)` with a 2 s timeout (user input). Both tests pass; error test shows all 60 callers get `errBoom` and a later call retries.

Phase 3: forced expiry in staging: 6 loads (one per pod), down from 51.

---

## Exit Criteria

DONE when concurrent misses in one process trigger one load, errors are shared but not cached, cancellation of one caller does not fail the others (where the stack allows), and staging shows at most one load per process per expiry.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Test passes before the change | **Adjust**: the loader is not slow enough to overlap callers, or callers are not concurrent; fix the test. |
| Phase 2 | After one error, every later call fails | **Adjust**: the rejected promise or task is not removed; delete it in `finally`. |
| Phase 2 | Spring rejects `sync = true` with `unless` | **Adjust**: remove `unless` and handle nulls in `cache-negative-result-caching`. |
| Phase 3 | Loads above P | **Adjust**: some code path bypasses the coalesced function; grep for direct loader calls. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
