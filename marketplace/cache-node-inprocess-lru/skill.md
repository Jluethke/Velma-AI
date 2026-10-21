# Node In-Process LRU Cache

**One-line description:** Adds a bounded in-process cache to one Node.js hotspot with the `lru-cache` package, bounded by entry count or by bytes through `maxSize` and `sizeCalculation`, with `ttl`, and uses its `fetchMethod` so concurrent misses for one key share a single load.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the Node.js repository.
- `cache_plan` (object[], required): Locations from `cache-location-decide`; this flow handles rows containing `in-process`.
- `ttl_table` (object[], required): TTL per entry type from `cache-ttl-from-change-rate`.

---

## Outputs

- `inprocess_cache_change` (object): Files changed, `lru-cache` version, bound type (`max` or `maxSize`) and value with the arithmetic, `ttl`, the test command and its output, and heap usage after warm-up.

---

## Phase 1: Install and Size

### Entry Criteria
- A `cache_plan` row contains `in-process`.
- The test suite is green; record the summary.

### Actions
1. `npm ls lru-cache`. Many packages depend on it, so a version may already be present transitively. Add it as a direct dependency anyway (`npm install lru-cache`) so your code does not rely on another package's version. Record the major version; v7 renamed options (`maxAge` became `ttl`) and v10 switched to the named export `import { LRUCache } from 'lru-cache'`. Read the README of the installed version before writing options.
2. Choose the bound:

   | Condition | Bound |
   |---|---|
   | Entries have similar size | `max` (entry count) |
   | Entry sizes vary widely (lists, documents) | `maxSize` (total units) with `sizeCalculation: (v) => Buffer.byteLength(JSON.stringify(v))` |

3. Measure: serialize five real entries and print `Buffer.byteLength(JSON.stringify(v))`. For `max`, compute `max = floor(budget_bytes / largest_measured_bytes)`. The heap budget is a user input. Note that `byteLength` of JSON approximates heap size but V8 object overhead makes the real heap size larger; Phase 3 measures the real figure.
4. Count processes: each `cluster` worker or PM2 instance holds its own copy.

### Output
Bound type and value with arithmetic.

### Quality Gate
- The bound is a finite number derived from measured bytes and a stated budget.
- The installed major version is recorded and the README for it was opened.

---

## Phase 2: Implement With fetchMethod

### Entry Criteria
- Size chosen.

### Actions
1. Write failing tests first: two concurrent `getProduct(42)` calls with `Promise.all` cause one repository call; a call after TTL reloads (use fake timers: lru-cache reads time through `performance.now()` by default; check the README section on testing with fake timers for your version, or inject `perf` if the version supports it).
2. Implement in the hotspot module:

   ```ts
   import { LRUCache } from 'lru-cache';

   const productCache = new LRUCache<number, Product>({
     max: PRODUCT_MAX,
     ttl: PRODUCT_TTL_MS,
     fetchMethod: async (id) => repo.loadProduct(id),
   });

   export const getProduct = (id: number) => productCache.fetch(id);
   ```
   `ttl` is in milliseconds. `fetch()` coalesces concurrent calls for the same key into one `fetchMethod` call.
3. If `fetchMethod` returns `undefined`, nothing is cached and `fetch` resolves `undefined`. Leave missing-row handling to `cache-negative-result-caching`.
4. Do not set `allowStale: true` unless the stale-serving window was approved in `ttl_table`; it returns expired values.
5. Return frozen objects (`Object.freeze`) or copies. Callers that mutate a cached object change it for everyone.

### Output
Cached function and passing tests.

### Quality Gate
- The new tests pass and the full suite passes.
- `grep -n "new LRUCache" <file>` shows a `max` or `maxSize` option on the same object.

---

## Phase 3: Measure Heap

### Entry Criteria
- Tests pass.

### Actions
1. Start the service with `node --expose-gc` locally and drive realistic traffic until `productCache.size` stops growing.
2. Call `global.gc()` then read `process.memoryUsage().heapUsed` before warm-up and after. Record both.
3. If heap growth is larger than the budget, lower `max` (or switch to `maxSize`) and repeat.
4. Optionally take a heap snapshot (`node --inspect`, Chrome DevTools Memory tab) and confirm the retained size of the `LRUCache` object.

### Output
`inprocess_cache_change`.

### Quality Gate
- Heap before and after warm-up are recorded from `process.memoryUsage()` output.
- Heap growth is at or under the stated budget.

---

## Worked Example

Illustrative. Express app, 2 PM2 instances, heap budget 50 MB per instance, TTL 30 s.

Phase 1: `npm ls lru-cache` shows `lru-cache@10.2.0` direct. Five products measure 980 to 1,310 bytes; `max = floor(50000000 / 1310) = 38167`.

Phase 2: tests pass; the `Promise.all` test shows one repository call.

Phase 3: `heapUsed` 41.2 MB before, 118.6 MB after: 77 MB growth, above budget because V8 overhead is about 1.5x the JSON bytes. Lower `max` to 24000; rerun shows 49.1 MB growth.

---

## Exit Criteria

DONE when the hotspot uses a bounded lru-cache with TTL and fetch coalescing, tests pass, and measured heap growth is within budget.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `TypeError: LRUCache is not a constructor` | **Adjust**: version mismatch between default and named export; use the import form the installed README shows. |
| Phase 1 | No heap budget given | **Stop**: ask for it; do not invent `max`. |
| Phase 2 | Constructor throws about missing bound | **Adjust**: add `max` or `maxSize`; an unbounded cache is not allowed by this flow. |
| Phase 3 | Heap keeps growing after `size` stops | **Return**: the leak is elsewhere; hand to a memory leak investigation, not this flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
