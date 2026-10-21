# Go In-Process Bounded Cache

**One-line description:** Adds a bounded in-process cache to one Go hotspot with either hashicorp/golang-lru/v2 `expirable.LRU` (count-bounded, TTL) or dgraph-io/ristretto (cost-bounded, admission policy), configured from measured entry cost, tested for its asynchronous-set and expiry behavior, and checked with the race detector.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the Go module.
- `cache_plan` (object[], required): Locations from `cache-location-decide`; this flow handles rows containing `in-process`.
- `ttl_table` (object[], required): TTL per entry type from `cache-ttl-from-change-rate`.

---

## Outputs

- `inprocess_cache_change` (object): Files changed, library and version, size or cost configuration with arithmetic, TTL, the test command and its output, and heap measurement after warm-up.

---

## Phase 1: Choose Library and Size

### Entry Criteria
- A `cache_plan` row contains `in-process`.
- `go test ./...` passes; record the summary.

### Actions
1. Choose with this table:

   | Condition | Library |
   |---|---|
   | Entries similar in size, need simple LRU with TTL, need a read immediately after a write to hit | `github.com/hashicorp/golang-lru/v2/expirable` |
   | Entry sizes vary, very high concurrency, want frequency-based admission | `github.com/dgraph-io/ristretto` (v2 module path is `github.com/dgraph-io/ristretto/v2`; check which the module proxy offers with `go list -m -versions github.com/dgraph-io/ristretto/v2`) |

2. Do not write a `map` plus `sync.Mutex` cache by hand for this; it has no bound and no eviction.
3. Measure entry size: marshal five real values and print `len(b)`, or measure heap delta with `runtime.ReadMemStats` around building 10,000 entries in a test. The heap budget is a user input.
4. Size:
   - expirable LRU: `size = floor(budget_bytes / per_entry_bytes)`.
   - ristretto: `MaxCost = budget_bytes`, the cost of each `Set` = the entry's byte size. The ristretto README recommends `NumCounters` about 10 times the number of items expected when full and `BufferItems: 64`; cite the README you read.

### Output
Library choice and configuration with arithmetic.

### Quality Gate
- Configuration numbers trace to a measured entry size and a stated budget.
- `go list -m all | grep -E "golang-lru|ristretto"` shows the chosen module after `go get`.

---

## Phase 2: Implement and Test

### Entry Criteria
- Library chosen and added with `go get`.

### Actions
1. expirable LRU:

   ```go
   cache := expirable.NewLRU[int64, Product](size, nil, ttl)
   if p, ok := cache.Get(id); ok {
       return p, nil
   }
   p, err := s.repo.LoadProduct(ctx, id)
   if err != nil {
       return Product{}, err
   }
   cache.Add(id, p)
   return p, nil
   ```
   It is safe for concurrent use. Test expiry with a short TTL and `time.Sleep` just past it, or by asserting `Len()` after expiry.

2. ristretto:

   ```go
   cache, err := ristretto.NewCache(&ristretto.Config[int64, Product]{
       NumCounters: numCounters, MaxCost: maxCost, BufferItems: 64,
   })
   ok := cache.SetWithTTL(id, p, int64(sizeOf(p)), ttl)
   ```
   `Set` is asynchronous and may be dropped by the admission policy (`ok == false`). A `Get` right after `Set` can miss. In tests call `cache.Wait()` after `Set` before asserting. Never write a test that requires every set to be stored.

3. Write table tests first (second read skips the repo, expiry reloads), see them fail, then implement in the hotspot file only.
4. Store values, not pointers to shared structs, or treat cached pointers as read-only. A caller mutating a cached struct pointer changes it for every goroutine.

### Output
Cached function and passing tests.

### Quality Gate
- `go test ./<pkg>/ -run Cache -v` passes.
- `go test -race ./<pkg>/` exits 0 with no `DATA RACE`.

---

## Phase 3: Measure Heap

### Entry Criteria
- Tests pass.

### Actions
1. Add a benchmark or test that fills the cache to its bound and reads `runtime.MemStats.HeapAlloc` after `runtime.GC()` before and after.
2. Or, in the running service, take heap profiles before and after warm-up: `go tool pprof -top http://localhost:6060/debug/pprof/heap` (requires `import _ "net/http/pprof"` and a listener on that port).
3. For ristretto, read `cache.Metrics` (enable with `Metrics: true` in the config) and record `Ratio()`, `KeysAdded()`, `SetsDropped()` and `SetsRejected()`. Many rejected sets mean the admission policy is refusing entries; check the cost values you pass.

### Output
`inprocess_cache_change`.

### Quality Gate
- HeapAlloc before and after are recorded from command or test output.
- Heap growth is at or under the stated budget.

---

## Worked Example

Illustrative. Budget 128 MiB, product struct about 900 bytes on heap, TTL 60 s.

Phase 1: similar sizes, simple TTL: expirable LRU. size = floor(134217728 / 900) = 149130.

Phase 2: tests fail first (`repo calls = 2, want 1`), then pass. `go test -race ./internal/catalog/` prints `ok`.

Phase 3: test prints `HeapAlloc before=6.1MiB after=131.8MiB`; growth 125.7 MiB, inside 128 MiB.

---

## Exit Criteria

DONE when the hotspot uses a bounded, expiring library cache configured from measured sizes, tests and the race detector pass, and heap growth is measured within budget.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No heap budget | **Stop**: ask for it; never pick a size by habit. |
| Phase 2 | ristretto test flaky on `Get` after `Set` | **Adjust**: add `cache.Wait()` after `Set`; do not add sleeps or retry loops. |
| Phase 2 | Generic type errors with ristretto | **Adjust**: you imported v0 (non-generic) or v2 (generic) by mistake; match the import path to the API you wrote. |
| Phase 3 | Heap growth above budget | **Adjust**: lower size or MaxCost and remeasure. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
