# Bulkhead Concurrency Limits per Dependency

**One-line description:** Sizes a per-dependency concurrency limit from measured peak rate and p99 latency using Little's law, implements it with the stack's own primitive (asyncio.Semaphore or httpx.Limits, cockatiel bulkhead, x/sync/semaphore, resilience4j Bulkhead), and proves with a saturation test that a slow dependency cannot consume the capacity of the others.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the service repository.
- `stack` (string, required): `python`, `node`, `go`, or `java`.
- `dependency_map` (object[], required): Output of `res-dependency-map`.
- `latency_profile` (object[], required): Output of `res-latency-percentiles` (uses `peak_rps`, `p99_ms`).

---

## Outputs

- `bulkhead_changes` (object[]): One row per dependency: computed limit with arithmetic, max wait, primitive used with file:line, rejection error, metric name, isolation test name and result.

---

## Phase 1: Size the Limits

### Entry Criteria
- Every sync dependency has `peak_rps` and `p99_ms`.

### Actions
1. For each sync dependency compute `limit = ceil(peak_rps x p99_ms / 1000)`. By Little's law (L = lambda x W), this is the number of calls in flight at peak if every call took the p99 time. It serves peak traffic at p99 latency and stops excess calls from piling up when the dependency slows further.
2. If the row is `synthetic: true` or has `resolution_warning: true`, carry that flag into the row; the limit inherits the uncertainty.
3. Max wait for a permit: 0 (reject immediately) when the policy is fail-fast, or the remaining request deadline when queueing is acceptable. Never an unbounded wait. If the user has not said which, record an open question and use 0.
4. Check the connection pool: the client pool for the dependency must allow at least `limit` connections (or HTTP/2 streams), or the pool becomes a hidden second bulkhead with its own unbounded wait. Record the pool setting: httpx `Limits(max_connections=...)` (default 100), Go `Transport.MaxConnsPerHost` (default 0 = no limit) and `MaxIdleConnsPerHost` (default 2), undici `Agent({ connections })` (default no limit), HikariCP `maximumPoolSize` (default 10).
5. Sum the limits of all dependencies called from one worker; if the server's own worker or thread count is lower than one dependency's limit, that dependency can still take every worker. Record the server worker count (gunicorn `--workers`/`--threads`, Tomcat `server.tomcat.threads.max` default 200, Go has no fixed count) and flag any dependency whose limit is at or above it.

### Output
Limits table with arithmetic.

### Quality Gate
- Every limit row shows `peak_rps x p99_ms / 1000` with the numbers from `latency_profile`.
- Every pool setting is recorded and is at least the limit, or flagged.

---

## Phase 2: Implement With the Stack Primitive

### Entry Criteria
- Limits sized.

### Actions
1. Use exactly the primitive for `stack`, one instance per dependency, created once:

| stack | Primitive | Reject signal |
|---|---|---|
| python (asyncio) | `sem = asyncio.Semaphore(limit)`; acquire with `async with asyncio.timeout(max_wait_s): await sem.acquire()` then `try: ... finally: sem.release()` | `TimeoutError` while waiting; raise a `BulkheadFull` error |
| python (threads) | a dedicated `concurrent.futures.ThreadPoolExecutor(max_workers=limit)` per dependency plus `threading.BoundedSemaphore(limit)` with `acquire(timeout=max_wait_s)` | `acquire` returns False |
| node | cockatiel `bulkhead(limit, queueSize)` with `queueSize` 0 for fail-fast; `policy.execute(fn)` | `BulkheadRejectedError` |
| go | `semaphore.NewWeighted(int64(limit))` from `golang.org/x/sync/semaphore`; `TryAcquire(1)` for fail-fast, or `Acquire(ctx, 1)` with the request ctx | `TryAcquire` false or `Acquire` returns ctx error |
| java | resilience4j `@Bulkhead(name = "payments")` with `resilience4j.bulkhead.instances.payments.max-concurrent-calls` (default 25) and `max-wait-duration` (default 0) | `BulkheadFullException` |

2. For asyncio, an alternative is `httpx.AsyncClient(limits=httpx.Limits(max_connections=limit), timeout=httpx.Timeout(..., pool=max_wait_s))`, which raises `httpx.PoolTimeout`. Use it only when one client serves exactly one dependency.
3. Always release in `finally` (python), `defer sem.Release(1)` right after a successful acquire (go). A missed release permanently shrinks the bulkhead.
4. Place the bulkhead inside the retry and breaker: Retry(CircuitBreaker(Bulkhead(Timeout(call)))). Add the reject error to the retry `never_retry_on` and to the breaker's `never_counts` (a full bulkhead is local overload, not dependency failure).
5. Export a gauge of permits in use and a counter of rejections per dependency (for example `bulkhead_in_use{dependency}` and `bulkhead_rejected_total{dependency}`), or use the library's metrics (resilience4j `resilience4j_bulkhead_available_concurrent_calls`).
6. One dependency per change; run tests between changes.

### Output
Bulkheads in code with metrics.

### Quality Gate
- `rg -n "Semaphore\(|NewWeighted|bulkhead\(|@Bulkhead" <source dirs>` shows one bulkhead per sync dependency, none built inside a request handler.
- Existing tests pass after each change.

---

## Phase 3: Prove Isolation

### Entry Criteria
- Bulkheads in place.

### Actions
1. Write an isolation test per stack: stub dependency A to hang (never respond until the test ends), stub dependency B to respond immediately.
2. Start `limit_A + 5` concurrent calls to A. Assert exactly 5 are rejected with the stack's reject signal (fail-fast mode), and `bulkhead_in_use{dependency="A"}` equals `limit_A`.
3. While A is saturated, make 20 calls to B. Assert all 20 succeed. This is the property the bulkhead exists for.
4. Release A's stub; assert permits return to zero in use (no leak).
5. Run the test 20 times to catch races: `pytest -q -k bulkhead --count 20` (pytest-repeat), `go test -race -count 20 -run Bulkhead ./...`, or the runner's repeat option.

### Output
`bulkhead_changes` with isolation results.

### Quality Gate
- The isolation test passes on all 20 repetitions.
- After release, in-use permits read 0.

---

## Worked Example

Illustrative. `stack` = go. `payments` peak 412 rps, p99 212 ms; `fraud-score` peak 60 rps, p99 480 ms.

Phase 1: `payments` limit `ceil(412 x 0.212) = ceil(87.3) = 88`; `fraud-score` `ceil(60 x 0.48) = ceil(28.8) = 29`. `MaxConnsPerHost` 0 (unlimited, fine) but `MaxIdleConnsPerHost` 2 flagged: connections churn above 2 idle; open question raised. Max wait: user chose fail-fast.

Phase 2: `internal/payments/client.go:18 sem: semaphore.NewWeighted(88)`; `if !c.sem.TryAcquire(1) { return nil, ErrBulkheadFull }; defer c.sem.Release(1)`.

Phase 3: `go test -race -count 20 -run Bulkhead ./internal/...` prints `ok` with 93 calls to hung `payments` giving 5 `ErrBulkheadFull`, and 20/20 `fraud-score` calls succeeding.

---

## Exit Criteria

DONE when every sync dependency has a bulkhead sized from measured rate and latency, implemented with the stack primitive in the right wrapper order, with metrics, and a repeated isolation test proving a hung dependency cannot block the others.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `peak_rps` or `p99_ms` missing | **Return**: send back to `res-latency-percentiles`; do not guess a limit. |
| Phase 1 | Server worker count below a limit | **Return**: open question; the bulkhead cannot protect a thread pool smaller than itself. |
| Phase 3 | Permits in use stay above 0 after release | **Stop**: a code path skips release; find it before continuing. |
| Phase 3 | Calls to B fail during saturation | **Adjust**: A and B share a pool or executor; split them. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
