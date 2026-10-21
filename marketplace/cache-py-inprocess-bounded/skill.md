# Python In-Process Bounded Cache

**One-line description:** Adds a size-bounded, expiring in-process cache to one Python hotspot with cachetools `TTLCache` and a lock (or `functools.lru_cache` for pure functions), sized from measured entry bytes and a memory budget, and avoids the method-cache leak, shared mutable results and per-worker duplication.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the Python repository.
- `cache_plan` (object[], required): Locations from `cache-location-decide`; this flow handles rows containing `in-process`.
- `ttl_table` (object[], required): TTL per entry type from `cache-ttl-from-change-rate`.

---

## Outputs

- `inprocess_cache_change` (object): Files changed, cache type, `maxsize` and how it was computed, TTL, the test command and its output, and the measured memory after warm-up.

---

## Phase 1: Choose the Primitive and Size It

### Entry Criteria
- A `cache_plan` row contains `in-process`.
- `pytest -q` is green; record the summary line.

### Actions
1. Pick with this table:

   | Condition | Primitive |
   |---|---|
   | Pure function of hashable arguments, result never goes stale (no TTL needed) | `functools.lru_cache(maxsize=N)` |
   | Result can go stale (TTL needed) | `cachetools.TTLCache(maxsize=N, ttl=T)` |
   | Async function (`async def`) | `cachetools` with a manual `asyncio.Lock`, or `async-lru` package; `functools.lru_cache` on an `async def` caches the coroutine object, which can be awaited only once |

2. Never use `maxsize=None` or `functools.cache`; both are unbounded and grow until the process is killed.
3. Measure entry size: build one real result and measure the deep size with `pympler`: `python -c "from pympler import asizeof; import app.catalog as c; print(asizeof.asizeof(c.load_product(42)))"`. `sys.getsizeof` does not include nested objects and undercounts.
4. Compute `N = floor(memory_budget_bytes / (entry_bytes + key_bytes))`. The memory budget per process is a user input. Multiply the per-process budget by the number of worker processes (Gunicorn `--workers`, uWSGI `processes`) to get the host total, and confirm it fits the container memory limit.

### Output
Primitive choice and `maxsize` with the arithmetic shown.

### Quality Gate
- `maxsize` is a finite integer computed from a measured entry size and a stated budget.
- The host-total memory (per-process budget times workers) is written down next to the container limit.

---

## Phase 2: Implement

### Entry Criteria
- Primitive and size chosen.

### Actions
1. Write a failing test first: call the function twice, assert the loader ran once; for TTL caches, build the cache with a fake timer (`TTLCache(maxsize=N, ttl=T, timer=fake_clock)`) and assert a reload after advancing the clock past T.
2. Implement in the hotspot module only:

   ```python
   from cachetools import TTLCache, cached
   from threading import Lock

   _product_cache = TTLCache(maxsize=PRODUCT_MAXSIZE, ttl=PRODUCT_TTL)
   _product_lock = Lock()

   @cached(_product_cache, lock=_product_lock)
   def get_product(product_id: int) -> Product:
       return repo.load_product(product_id)
   ```
   `cachetools` caches are not thread-safe; the `lock=` argument is required under threaded servers (Gunicorn `gthread`, any thread pool). The lock guards the cache, not the loader, so two threads can still both load the same missing key; add coalescing from `cache-stampede-request-coalescing` if that matters.
3. Do NOT decorate instance methods with `functools.lru_cache`. The cache holds `self` in its keys and keeps every instance alive (flake8-bugbear and Ruff flag this as B019). Cache a module-level function, or use `cachetools.cachedmethod` with a per-instance cache.
4. Return immutable values (tuples, frozen dataclasses) or copy on return. A caller that mutates a cached dict changes it for every later caller.

### Output
Cached function and passing tests.

### Quality Gate
- The new tests and `pytest -q` exit 0.
- `ruff check --select B019 <file>` reports no findings (if Ruff is in the repo).

---

## Phase 3: Measure Under Load

### Entry Criteria
- Tests pass.

### Actions
1. Expose counters: for `lru_cache`, `get_product.cache_info()` returns `hits`, `misses`, `maxsize`, `currsize`. For cachetools, count hits and misses in a wrapper, or use `cache-hit-miss-instrument`.
2. Run the service locally under realistic load until `currsize` reaches `maxsize` (or stops growing).
3. Read process memory: `ps -o rss= -p <pid>` (kilobytes) before and after warm-up. The growth must be close to `maxsize * (entry_bytes + key_bytes)`; a much larger growth means the size estimate was wrong.
4. Remember each worker process holds its own copy and its own hit ratio. A write in one worker does not clear the others; that staleness lasts up to TTL.

### Output
`inprocess_cache_change`.

### Quality Gate
- RSS growth and `currsize` are recorded from command output.
- `currsize <= maxsize` in the recorded numbers.

---

## Worked Example

Illustrative. Gunicorn with 4 workers, container limit 2 GiB, per-process budget 64 MiB, TTL 30 s.

Phase 1: `asizeof` prints `1840` bytes per product; key about 72 bytes. N = floor(67108864 / 1912) = 35098. Host total 4 x 64 MiB = 256 MiB, under 2 GiB.

Phase 2: `TTLCache(maxsize=35098, ttl=30)` with a `Lock`. Tests pass: `pytest -q` prints `219 passed`.

Phase 3: RSS rose from 182,400 KB to 248,900 KB (about 65 MiB), `currsize` 35098.

---

## Exit Criteria

DONE when the hotspot uses a bounded, expiring, locked in-process cache sized from measured bytes, tests pass, and memory after warm-up matches the estimate.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No memory budget given | **Stop**: ask for it; do not pick a maxsize by habit. |
| Phase 2 | `TypeError: unhashable type: 'list'` | **Adjust**: convert list arguments to tuples at the call boundary, or use a `key=` function with `cachetools.keys.hashkey`. |
| Phase 3 | RSS growth far above the estimate | **Adjust**: remeasure entry size with `asizeof` on several real entries and recompute N. |
| Phase 3 | Stale reads across workers reported | **Return**: hand to `cache-event-invalidation-pubsub` for a broadcast, or shorten TTL. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
