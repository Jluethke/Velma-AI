# Synchronization Primitive Choice: Atomic, Mutex, Channel or Confinement

**One-line description:** Chooses exactly one synchronization mechanism per race site with a fixed decision table (atomic, mutex, read-write lock, channel or queue, once-initializer, concurrent map compound operation, confinement, database operation) and names the exact type and method for the stack.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `stack` (string, required): One of `go`, `cpp`, `rust`, `java`, `python`, `node`.
- `race_sites` (object[], required): From `race-findings-consolidate`.
- `shared_state_inventory` (object[], required): From `race-shared-state-inventory`; gives every access to the target, not just the two in the report.

---

## Outputs

- `sync_design` (object[]): One row per race site: `site_id`, `shared_target`, `mechanism` (table row name), `exact_api` (type and methods for `stack`), `critical_section` (first and last line that must be inside the guard), `all_access_sites` (every read and write from the inventory that must use the mechanism), `rejected_alternatives` (with the table reason).

---

## Phase 1: Describe the Invariant and Access Shape

### Entry Criteria
- `race_sites` has rows whose kind is `data-race`, `lost-update`, `visibility`, `await-interleaving` or `lock-cycle`. Rows of kind `db-anomaly` or `duplicate-effect` take their fix from the database and idempotency reports; copy that fix as mechanism `database-operation` and skip the table.

### Actions
1. For each site, answer these five questions from the code and inventory, in writing:
   - Q1: How many memory words does the invariant cover? (one counter or flag = one; balance plus history list = several)
   - Q2: Is the operation a pure read-modify-write of one value with no other decision? (increment, max, set-if-unset)
   - Q3: Ratio of reads to writes, from the inventory access counts (state the counts; do not guess "read-mostly").
   - Q4: Is a value handed from one context to another and then not touched by the sender? (producer-consumer)
   - Q5: Is it initialized once and then only read?
2. Record `all_access_sites`: every read and write of the target from `shared_state_inventory`. The mechanism must cover all of them, not only the two in the race report.

### Output
Answers Q1 to Q5 per site and the full access list.

### Quality Gate
- Every site has written answers to all five questions.
- `all_access_sites` includes both accesses in the site's report.

---

## Phase 2: Apply the Decision Table

### Entry Criteria
- Answers exist.

### Actions
1. Take the first row whose condition holds:

| # | Condition | Mechanism |
|---|---|---|
| 1 | Stack is `node`, no `worker_threads`, and the read and write have no `await` between them after the fix | No primitive: make the read-modify-write synchronous (remove the await from between) |
| 2 | Q5 yes | Once-initializer |
| 3 | Q4 yes | Channel or queue (transfer ownership) |
| 4 | Q1 = one word AND Q2 yes | Atomic |
| 5 | Target is a map or dict and each update touches one key with a compound operation | Concurrent map compound operation |
| 6 | Q3 shows reads far outnumber writes AND profiling (not intuition) showed mutex contention | Read-write lock |
| 7 | Every access can be moved to one owning thread, goroutine, actor or event loop | Confinement |
| 8 | Otherwise | Mutex |

2. Map the mechanism to the exact API for `stack`:

| Mechanism | go | java | cpp | rust | python | node |
|---|---|---|---|---|---|---|
| Atomic | `atomic.Int64` `.Add`, `.CompareAndSwap` (Go 1.19+ typed atomics) | `AtomicLong.incrementAndGet`, `LongAdder` for write-heavy counters read rarely | `std::atomic<T>::fetch_add`, `compare_exchange_weak` loop | `AtomicU64::fetch_add(1, Ordering::...)` | No user-level atomics: use Mutex row | `Atomics.add` on `SharedArrayBuffer` (workers only) |
| Mutex | `sync.Mutex` with `defer mu.Unlock()` | `synchronized` block or `ReentrantLock` with `unlock()` in `finally` | `std::mutex` with `std::lock_guard` / `std::scoped_lock` | `std::sync::Mutex<T>` holding the data | `threading.Lock` with `with lock:`; `asyncio.Lock` for coroutines | `async-mutex` `Mutex.runExclusive` (per key) |
| Read-write lock | `sync.RWMutex` | `ReentrantReadWriteLock` or `StampedLock` | `std::shared_mutex` with `std::shared_lock` | `std::sync::RwLock<T>` | No stdlib RW lock: use Mutex row | Not applicable |
| Channel or queue | `chan T` (one owner sends, one receives) | `BlockingQueue` (`ArrayBlockingQueue`, `LinkedBlockingQueue`) | queue guarded by `std::mutex` + `std::condition_variable` | `std::sync::mpsc` or `crossbeam-channel` if already a dependency | `queue.Queue` (threads), `asyncio.Queue` (coroutines) | Not applicable on one thread; `MessagePort` between workers |
| Once-initializer | `sync.Once` / `sync.OnceValue` (Go 1.21+) | Holder-class idiom or `volatile` field with double-checked locking | function-local `static` (thread-safe init since C++11) or `std::call_once` | `std::sync::OnceLock` (Rust 1.70+) | Initialize at import time, or `with lock:` around the check | Module-level promise cached once |
| Concurrent map compound operation | `sync.Map` only for the two uses its docs list (write-once keys read many times; goroutines on disjoint keys); otherwise map + `sync.Mutex` | `ConcurrentHashMap.merge`, `compute`, `computeIfAbsent` | map + `std::mutex` | `dashmap` if already a dependency, else `Mutex<HashMap>` | `dict` + `threading.Lock` | `Map` + synchronous update |
| Confinement | One goroutine owns the state; others send requests on a channel | Single-thread executor (`Executors.newSingleThreadExecutor`) | One worker thread with a task queue | One task owns the state; others send via channel | One thread or the event loop owns it; others use `loop.call_soon_threadsafe` | Event loop already confines it; see row 1 |

3. Check version requirements in the language docs (`go.mod` `go` directive, `java -version`, compiler standard flag, `rust-version`, `python -V`) before choosing an API marked with a version.
4. Set `critical_section` to the smallest line range that contains every read the decision depends on and every write the decision makes. A mutex around only the write does not fix a check-then-act.
5. Record `rejected_alternatives`, for example "Atomic rejected: invariant covers two fields (Q1 = 2)".

### Output
`sync_design`.

### Quality Gate
- Every row's `mechanism` is the FIRST table row whose condition holds, with the row number written.
- Every row's `critical_section` includes the read the decision depends on (cite its line) and the write.

---

## Phase 3: Check for Traps

### Entry Criteria
- `sync_design` drafted.

### Actions
1. Reject and redo any row that has one of these traps:
   - Atomic chosen, but code does `load` then `store` instead of one `fetch_add` or a `compare_exchange` loop.
   - Go `sync.Mutex` embedded in a struct that is copied by value (check `go vet` copylocks).
   - Java `volatile` used for a compound update (`count++` on a volatile is still a race).
   - Python `asyncio.Lock` used to guard state touched by threads, or `threading.Lock` held across an `await`.
   - C++ `std::atomic` with `memory_order_relaxed` used to publish data another thread reads after seeing a flag (needs release/acquire).
   - Read-write lock chosen without a profile.
   - Mutex held while calling out to I/O or callbacks (see `race-lock-ordering` rule R3).
2. Confirm every site in `all_access_sites` will use the mechanism; one unguarded reader keeps the race.

### Output
Final `sync_design`.

### Quality Gate
- No row matches a trap from step 1 (each trap checked and marked "no" per row).
- Every access site in `all_access_sites` is listed under the mechanism.

---

## Worked Example

Illustrative only.

Site: `Store.stock` map in Go, race write `reserve.go:51`, read `reserve.go:47`. Inventory adds a reader at `report.go:20`.

Phase 1: Q1 = several (map); Q2 = no (reserve checks stock >= qty, then decrements); Q3 = 2 reads, 2 writes; Q4 no; Q5 no.

Phase 2: rows 1 to 7 fail (row 5 fails: the check-and-decrement is not a single `sync.Map` operation); row 8 Mutex. API `sync.Mutex` field `mu` with `s.mu.Lock(); defer s.mu.Unlock()`. `critical_section` = `reserve.go:46-52` (read at 47 through write at 51). `all_access_sites` = 47, 51, `restock.go:18`, `report.go:20`.

Phase 3: struct `Store` is passed as `*Store` everywhere (`go vet` clean); no I/O inside lines 46 to 52.

---

## Exit Criteria

DONE when each race site has one mechanism chosen by the first matching table row, an exact stack API, a critical section covering the decision, every access site listed, and no trap present.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Inventory missing accesses that the race report shows | **Adjust**: add them to `all_access_sites` and note the inventory gap. |
| Phase 2 | API needs a newer language version than the project uses | **Adjust**: use the older equivalent from the same row (for example `atomic.AddInt64` before typed atomics). |
| Phase 2 | Read-write lock wanted but no profile exists | **Adjust**: choose Mutex now; record profiling as a follow-up. |
| Phase 3 | Critical section must include a network call | **Adjust**: restructure: read and copy under the lock, call outside, then re-check and write under the lock (or use the database operation). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
