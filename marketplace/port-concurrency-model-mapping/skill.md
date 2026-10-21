# Port Concurrency Model Mapping

**One-line description:** Maps every concurrency construct in the source (threads, locks, async tasks, process pools, channels, atomics, OpenMP) to the target's model, finds shared state the source protected by accident (the Python GIL, the JavaScript single thread), and names the race detector or compile-time check that proves the port is free of data races.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the source repository at the reference commit.
- `stack` (string, required): Port pair (`py-ts`, `py-go`, `js-ts`, `java-kotlin`, `c-rust`).

---

## Outputs

- `concurrency_mapping` (object): `constructs` (one row per site: location, source construct, target construct), `accidental_safety` (shared state that was safe only because of the source runtime), `cancellation` (how cancellation and timeouts map), `ordering` (outputs whose order depends on scheduling), and `race_check_command` for the target.

---

## Phase 1: Enumerate Constructs

### Entry Criteria
- `source_repo` at the reference commit.

### Actions
1. Grep the source:
   - Python: `rg -n "import (threading|asyncio|multiprocessing|concurrent)|ThreadPoolExecutor|ProcessPoolExecutor|async def|await |Lock\(|Queue\(|Event\(" --type py`
   - JavaScript: `rg -n "async |await |Promise\.|worker_threads|new Worker|SharedArrayBuffer|Atomics\.|setTimeout|setInterval" --type js`
   - Java: `rg -n "Thread|Runnable|Executor|CompletableFuture|synchronized|volatile|ReentrantLock|Atomic[A-Z]|ConcurrentHashMap|parallelStream|CountDownLatch" --type java`
   - C: `rg -n "pthread_|#pragma omp|_Atomic|atomic_|volatile|sem_|fork\(" --type c`
2. If the count of hits is zero, write "no concurrency" with the commands and skip to Phase 3 action 3.

### Output
Construct list.

### Quality Gate
- Every grep command and its hit count is recorded.

---

## Phase 2: Map Constructs

### Entry Criteria
- Construct list has at least one row.

### Actions
1. Map each construct with the table for the pair.

Python to TypeScript and JavaScript to TypeScript:

| Source | Target |
|---|---|
| `asyncio` coroutine, `await` | `async` function, `await` |
| `asyncio.gather(*aws)` | `Promise.all(arr)` (both keep argument order; `gather(return_exceptions=True)` maps to `Promise.allSettled`) |
| `asyncio.wait_for(aw, t)` | `AbortSignal.timeout(ms)` passed to APIs that accept a signal; for others, `Promise.race` with a timer and clear the timer afterward |
| `threading.Thread` for I/O | `async` I/O; no threads needed |
| `ThreadPoolExecutor` or `multiprocessing` for CPU work | `worker_threads` `Worker`; data is copied with structured clone, not shared |
| `threading.Lock` around shared state touched only by I/O threads | nothing, if all access stays on the event loop; a lock is needed only across `await` points that interleave read-modify-write |

Python to Go:

| Source | Target |
|---|---|
| `threading.Thread`, `ThreadPoolExecutor` | goroutines plus `sync.WaitGroup`, or `golang.org/x/sync/errgroup` when errors must propagate |
| `asyncio.gather` | `errgroup.Group` with results written to a pre-sized slice by index (keeps argument order) |
| `queue.Queue` | buffered `chan T`; close the channel from the single sender |
| `threading.Lock` | `sync.Mutex`; never copy a struct containing one (`go vet` reports it) |
| `asyncio.wait_for`, cancellation | `context.WithTimeout`; pass `ctx` as the first parameter |
| `multiprocessing.Pool` | goroutines (Go uses all cores without processes) |

Java to Kotlin:

| Source | Target |
|---|---|
| `ExecutorService.submit` | keep the executor, or `coroutineScope { async(Dispatchers.Default) { ... } }` |
| Blocking I/O on a pool | `withContext(Dispatchers.IO) { ... }` |
| `CompletableFuture` | `.await()` from kotlinx-coroutines (the JDK 8 integration lives in `kotlinx-coroutines-core` since 1.7) |
| `synchronized` method | `@Synchronized`; inside coroutines use `kotlinx.coroutines.sync.Mutex` and never hold a JVM monitor across a suspension point |
| `volatile` field | `@Volatile` |
| `Thread.sleep` in a coroutine | `delay(...)` |

C to Rust:

| Source | Target |
|---|---|
| `pthread_create` / `pthread_join` | `std::thread::scope` (Rust 1.63+) when threads borrow local data; `std::thread::spawn` with `Arc` otherwise |
| `pthread_mutex_t` beside the data it guards | `Mutex<T>` that owns the data |
| `pthread_cond_t` | `Condvar` used with the same `Mutex` |
| C11 `atomic_*` with `memory_order_relaxed / acquire / release / acq_rel / seq_cst` | `AtomicXxx` with `Ordering::Relaxed / Acquire / Release / AcqRel / SeqCst`, same order per call |
| `volatile` used for thread signaling | an `AtomicBool` or `AtomicXxx`; `volatile` gives no atomicity or ordering in C |
| `#pragma omp parallel for` | `rayon` `par_iter()`; reductions with `.sum()` or `.reduce()` (floating sums may differ in order: record in `ordering`) |
| global mutable state | `static X: Mutex<T>` or `OnceLock<T>`; references to `static mut` are denied by default in Rust 2024 |

2. Fill `accidental_safety`. Check each:
   - Python threads mutating shared `dict`, `list`, or counters without a lock: the GIL makes single operations like `list.append` atomic, but the target has no GIL. In Go, concurrent map writes crash the process with `fatal error: concurrent map writes`. Every such variable needs a `Mutex`, `sync.Map`, or a channel in the port.
   - JavaScript code that reads and writes shared variables between `await` points: safe from data races in JS, but becomes a race if the port moves work to real threads.
   - Python 3.13 free-threaded builds (`python3.13t`) remove the GIL; if the source already runs there, record it.
3. Fill `cancellation`: Python `asyncio.CancelledError`, Go `ctx.Done()`, Kotlin `CancellationException` (must be rethrown), Rust tokio drops a future at its next `.await` when the task is aborted or the `select!` branch loses, JS `AbortSignal`.
4. Fill `ordering`: every output assembled from concurrent results where the source does not guarantee order. These fields become `unordered` in the corpus schema.

### Output
Mapped constructs, `accidental_safety`, `cancellation`, `ordering`.

### Quality Gate
- Every construct row has a target from the pair's table.
- Every shared mutable variable written by more than one thread or task in the source appears in `accidental_safety` with a named guard.

---

## Phase 3: Name the Race Check

### Entry Criteria
- Phase 2 complete, or "no concurrency" recorded.

### Actions
1. Set `race_check_command` for the target:

| Target | Command | What a failure looks like |
|---|---|---|
| Go | `go test -race ./...` | `WARNING: DATA RACE` followed by two goroutine stacks |
| Rust | `cargo build` (Send and Sync are checked at compile time); for `unsafe` code also `cargo +nightly miri test` | compile error mentioning `Send` or `Sync`; Miri `Undefined Behavior` report |
| Kotlin | no built-in detector; run tests with `-Dkotlinx.coroutines.debug` for coroutine names in traces and stress the shared state with `jcstress` if the risk is high | assertion failures or lost updates under stress |
| TypeScript | no data races on one thread; for `worker_threads` with `SharedArrayBuffer`, every access goes through `Atomics` | n/a |
| C (when keeping C parts) | build with `-fsanitize=thread` and run tests | `WARNING: ThreadSanitizer: data race` |

2. If the target has no concurrency, set `race_check_command` to the normal test command and say so.

### Output
`concurrency_mapping`.

### Quality Gate
- `race_check_command` is a runnable command line, not a description.

---

## Worked Example

Illustrative. `stack=py-go`. Source:
```python
counts = {}
def worker(words):
    for w in words:
        counts[w] = counts.get(w, 0) + 1
with ThreadPoolExecutor(4) as ex:
    ex.map(worker, chunks)
print(sorted(counts.items()))
```
Phase 2: `ThreadPoolExecutor` maps to `errgroup`. `accidental_safety`: `counts` is written by 4 threads; the Python version can lose updates too (read and write are separate bytecodes), but rarely. In Go the same code crashes with `fatal error: concurrent map writes`. Guard: each goroutine counts into its own map, and the maps are merged after `g.Wait()`. `ordering`: output is sorted, so no field is unordered.

Phase 3:
```
$ go test -race ./wordcount/...
ok  	example.com/wc/wordcount	1.412s
```

---

## Exit Criteria

DONE when every concurrency construct has a target mapping, every accidentally safe shared variable has a named guard, cancellation and ordering are recorded, and a runnable race check is named.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Concurrency hidden in a library (web server worker pool) | **Adjust**: record the library's model from its docs and treat handlers as concurrent. |
| Phase 2 | Source relies on thread-local storage | **Adjust**: map to `context.Context` values (Go), `ThreadLocal` or coroutine context elements (Kotlin), `thread_local!` (Rust), `AsyncLocalStorage` (Node). |
| Phase 2 | Source has a real race that changes output | **Return**: record it as a source defect; the corpus cannot capture a stable value for it. |
| Phase 3 | `go test -race` reports a race in the port | **Stop**: fix the guard; never delete the test or drop `-race` from the command. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
