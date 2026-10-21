# Minimal Leak Fix per Cause and Stack

**One-line description:** Applies the smallest correct fix for a confirmed leak from a cause-by-stack fix table (bounded caches, paired unregistration, weak references, context cancellation, RAII ownership, allocator settings), one root cause per change, and rejects the common non-fixes such as forced GC calls, bigger heaps and scheduled restarts.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_cause` (object[], required): From `leak-root-cause-confirm`. Only `confirmed` entries are fixed.
- `confirm_experiment` (object, required): From `leak-root-cause-confirm`. Must have verdict `confirmed`.
- `stack` (string, required): `python`, `node`, `browser`, `jvm`, `go` or `cpp`.

---

## Outputs

- `leak_fix` (string): Branch name and commit hash of the fix, with `git diff --stat` output.
- `fix_rationale` (object): For each root cause fixed: the fix-table row used, the bound or lifetime chosen and where its value came from, and the existing tests run with their pass result.

---

## Phase 1: Choose the Fix

### Entry Criteria
- `confirm_experiment.verdict` == `confirmed`.

### Actions
1. Find the row for the root cause's causes-table id and your `stack`:

   | Cause | python | node / browser | jvm | go | cpp |
   |---|---|---|---|---|---|
   | C1 unbounded cache | `functools.lru_cache(maxsize=<bound>)`, `cachetools.TTLCache`; key on stable ids, not request objects | `lru-cache` package with `max`/`ttl`; `WeakMap` when keyed by an object whose lifetime should decide | Caffeine or Guava with `maximumSize` or `expireAfterWrite`; `WeakHashMap` only for identity-keyed metadata | bounded LRU (for example `hashicorp/golang-lru`) or explicit delete on session end | bounded container with eviction |
   | C2 listener | `disconnect`/`unsubscribe` in `close()` or context manager `__exit__`; `weakref.WeakMethod` for bound methods | `off`/`removeListener` with the same function reference; `{ once: true }`; `AbortController` `signal` option on `addEventListener`; React `useEffect` cleanup | `removeListener` in `close()`/`@PreDestroy` | unregister in `defer` | disconnect in destructor (RAII) |
   | C3 closure | capture only needed fields, not `self` or request | capture ids, not `req`/`ctx`; null large captures after use | static nested class instead of anonymous inner class | copy needed values before `go func` | capture by value, not `this` |
   | C5 resource | `with` statement | `stream.destroy()` / `pipeline()` | try-with-resources | `defer resp.Body.Close()` after error check; `rows.Close()` | `std::unique_ptr` / scope guard |
   | C6 timer | `timer.cancel()` | `clearInterval(handle)`; `unref()` does not free, it only stops keeping the loop alive | `ScheduledFuture.cancel(false)` and executor `shutdown()` | `defer ticker.Stop()` and exit loop on `ctx.Done()` | join and stop timer thread |
   | C7 thread-local | clear in `finally` | `AsyncLocalStorage` store scoped with `run()` | `ThreadLocal.remove()` in `finally` | not applicable | reset in pool hook |
   | C8 label cardinality | label values from a fixed set | same | same | same | same |
   | C9 task never exits | keep references to tasks and cancel on shutdown | reject or resolve pending promises on timeout | `Future.cancel` with timeouts | `ctx` plumbing; buffered result channel of 1 | `std::jthread` with stop token |
   | C10 native buffer | drop references to buffers; `del` large arrays | `buf = null` after use; avoid `Buffer.allocUnsafeSlow` pools held forever | release direct buffers by dropping references; Netty `release()` | `C.free` in `defer` | `free`/`delete` on every path; `std::weak_ptr` to break `shared_ptr` cycles |
   | C11 reload | avoid `importlib.reload` in production | dispose old module state on hot reload | stop threads and deregister JDBC drivers on undeploy | not applicable | `dlclose` after releasing all symbols |
   | C12 allocator | `MALLOC_ARENA_MAX` or jemalloc via `LD_PRELOAD` in the service environment | same | same, set in container env | `debug.FreeOSMemory` is not a fix; check `GOMEMLIMIT` and `HeapReleased` | arena setting or allocator swap |

2. A bound (cache size, TTL) is a number. It must come from a stated source: a product requirement, the number of distinct keys measured in production logs, or a user answer. If none exists, record it as an open question in `fix_rationale` and use the value only after the user confirms it.
3. Rejected non-fixes. Never submit these as the fix:
   - `gc.collect()`, `System.gc()`, `global.gc()`, `runtime.GC()`, `debug.FreeOSMemory()` calls in request paths.
   - Raising `-Xmx`, `--max-old-space-size`, container memory limits, or `GOMEMLIMIT`.
   - Scheduled restarts or worker recycling (`max_requests` in gunicorn) as the only change. Recycling may stay as a safety net, but the leak fix must stand without it.
   - `setMaxListeners(0)` or suppressing sanitizer reports for project code.

### Output
Chosen fix row and bound source.

### Quality Gate
- The chosen row is named, and any numeric bound has a written source or is listed as an open question.

---

## Phase 2: Apply One Change

### Entry Criteria
- Fix chosen.

### Actions
1. Create the fix branch: `git switch -c fix/leak-<short-name>`.
2. Edit only the files needed for this one root cause. Do not refactor nearby code, rename symbols or reformat files in the same change. If the fix touches more than the holder's file and its direct caller, write down why.
3. Do not invent APIs. Before using a library call (for example `cachetools.TTLCache`, `events.addAbortListener`, Caffeine `expireAfterAccess`), confirm it exists in the installed version: Python `python -c "import cachetools; help(cachetools.TTLCache)"`; Node `node -e "console.log(typeof require('node:events').addAbortListener)"`; Java and Go: open the dependency's docs for the exact version in the lockfile.
4. Run the existing test suite: `pytest -q`, `npm test`, `mvn -q test` or `./gradlew test`, `go test ./...`, `ctest --output-on-failure`. All tests that passed before must still pass. Do not delete, skip or weaken any test to make it pass.
5. Commit: `git commit -m "fix: <cause> leak in <component>"`.

### Output
`leak_fix`, `fix_rationale`.

### Quality Gate
- `git diff --stat main...HEAD` (or your base branch) lists only the intended files.
- The test command's summary line is saved and shows zero failures.
- `git diff main...HEAD -- '*test*'` shows no removed or skipped tests.

---

## Worked Example

Illustrative only.

Input: root cause C1 at `orders/pricing.py:41`, `stack` = `python`.

Phase 1: row C1 python. `Cart` objects are unique per request, so the cache key must change: cache on `(cart.sku_tuple(), cart.region)`, which has a finite number of distinct values. Bound: product analytics shows 1,840 distinct sku and region combinations in the last 30 days; user confirms `maxsize=4096`.

Phase 2: `fix/leak-quote-cache`; `pricing.py` changes `quote_for(cart)` to `quote_for_key(cart.sku_tuple(), cart.region)` with `@functools.lru_cache(maxsize=4096)`; `views.py:77` call updated. `pytest -q` prints `412 passed in 38.10s`. `git diff --stat` shows 2 files, 11 insertions, 6 deletions.

---

## Exit Criteria

DONE when one confirmed root cause is fixed on its own branch with a sourced bound (if any), existing tests pass unchanged, and the diff touches only the intended files.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `confirm_experiment` verdict is `rejected` | **Stop**: do not fix an unconfirmed cause; return to `leak-root-cause-confirm`. |
| Phase 1 | No source for a bound value | **Adjust**: record the open question and ask the user; do not pick a number. |
| Phase 2 | Existing tests fail after the fix | **Adjust**: fix the change, not the tests; if a test relied on the leaking behavior, report it to the user before touching it. |
| Phase 2 | API not present in the installed version | **Adjust**: use the alternative in the same table cell, or upgrade the dependency in a separate change. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
