# Graceful Degradation and Fallback Matrix

**One-line description:** Builds a fallback matrix that assigns each dependency operation one fallback by decision table (stale cache with bounded age, static default, omitted section, deferred write through an outbox, or explicit fast failure), implements each fallback on breaker-open, timeout and bulkhead-reject paths, marks degraded responses, and proves every fallback with forced-failure tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the service repository.
- `dependency_map` (object[], required): Output of `res-dependency-map`.
- `breaker_policy` (object[], required): Output of `res-breaker-policy` (its `open_error` per dependency).

---

## Outputs

- `fallback_matrix` (object[]): One row per dependency operation: `name`, `operation`, `fallback_type`, `trigger_errors` (exact classes: open breaker, timeout, bulkhead reject, connect error), `max_staleness` (user input, or n/a), `degraded_marker` (header or body field), `metric`, file:line of the implementation, test name and result, and `owner_approval` for any fallback that changes business behavior.

---

## Phase 1: Assign a Fallback per Operation

### Entry Criteria
- Every operation in `dependency_map` has `criticality` and `idempotent`.

### Actions
1. Apply this table; first match wins:

| Operation | fallback_type |
|---|---|
| Authentication or authorization check | `fail_closed`: deny. Never allow access because the auth service is down. |
| Money movement, inventory reservation, or any write the user must see confirmed | `fail_fast`: return the breaker's `open_error` (503 with Retry-After) with a clear message. Never return fake success. |
| Write the business accepts processing later (analytics, email, audit export) | `defer_write`: store in an outbox table in the service's own database in the same transaction, return 202 Accepted, relay later |
| Read of data with a cache already in the code path | `stale_cache`: serve the last cached value up to `max_staleness` |
| Read for optional page content (recommendations, avatars, counts) | `omit_or_default`: omit the section or use a static default |
| Anything else | `fail_fast` |

2. `max_staleness` is a product decision: ask the owner and record their answer. Do not choose it.
3. Any `defer_write` or `stale_cache` row changes what users see; record `owner_approval` with the owner's name and date before implementing it.
4. Do NOT invent a fallback that calls a second copy of the same failing dependency; a correlated failure takes both down.

### Output
Draft matrix with approvals.

### Quality Gate
- Every auth row is `fail_closed` and every money-movement row is `fail_fast`.
- Every `stale_cache` row has a `max_staleness` with an owner as source.

---

## Phase 2: Implement Fallbacks

### Entry Criteria
- Matrix approved.

### Actions
1. `trigger_errors` for each row: the breaker `open_error` (for example `CallNotPermittedException`, `pybreaker.CircuitBreakerError`, opossum `EOPENBREAKER`, `gobreaker.ErrOpenState`), the per-try timeout exception, the bulkhead reject error, and connect errors. Do NOT trigger fallbacks on 4xx; those are caller errors and must reach the caller.
2. `stale_cache`: on success write `{value, fetched_at}` to the cache with a TTL of at least `max_staleness`; on trigger read it, check `now - fetched_at <= max_staleness`, and serve it; if too old or missing, fall through to `fail_fast`. HTTP caches can express the same rule with `Cache-Control: stale-if-error=<seconds>` (RFC 5861) when a CDN or proxy honors it.
3. `omit_or_default`: return the response without the section and with the field set to `null` or the static default listed in the matrix.
4. `defer_write`: insert into `outbox(id, topic, payload, created_at, sent_at)` in the same database transaction as the main write; a relay worker sends unsent rows with the retry policy. Return 202 with an id the client can poll.
5. Mark every degraded response with the `degraded_marker` (for example response header `X-Degraded: recommendations`) and increment `degraded_responses_total{dependency,fallback}`. A fallback without a metric hides an outage.
6. Fallback code must be cheap and local: no network call to the failed dependency, no unbounded loops. Place it at the call wrapper (resilience4j `fallbackMethod`, opossum `breaker.fallback()`, a `try/except` around the pybreaker call, or an `if errors.Is(...)` branch in Go).
7. One dependency per change; run tests between changes.

### Output
Fallbacks implemented with markers and metrics.

### Quality Gate
- `rg -n "degraded_responses_total" <source>` shows the metric incremented in every fallback path in the matrix.
- No fallback path makes a network call to the dependency it replaces (check each fallback function body).

---

## Phase 3: Prove Each Fallback

### Entry Criteria
- Fallbacks in place.

### Actions
1. For each row write a test that forces each `trigger_errors` class (open the breaker with the library's force-open method or by tripping it; make the stub hang past the timeout; fill the bulkhead) and asserts:
   - `stale_cache`: response equals the cached value, `X-Degraded` present; with the cached value older than `max_staleness`, the response is the `fail_fast` error.
   - `omit_or_default`: the section is absent or default; status 200.
   - `defer_write`: 202, one outbox row with the payload, and no call to the failed dependency.
   - `fail_fast`: the planned status and Retry-After, within the per-try timeout plus a small margin.
   - `fail_closed`: 401 or 403, never 200.
2. Assert the metric increments once per degraded response.
3. Assert that a 4xx from the dependency is passed through (no fallback, no marker).
4. Run the project's test command filtered to these tests and save the output.

### Output
`fallback_matrix` with test results.

### Quality Gate
- Every row has a passing test for every trigger class it lists.
- The 4xx pass-through test passes.

---

## Worked Example

Illustrative. Dependencies: `auth`, `payments`, `recommendations`, `catalog` (read, Redis cache exists), `email`.

Phase 1 matrix: `auth` fail_closed; `payments` fail_fast; `recommendations` omit_or_default (empty list); `catalog` stale_cache, `max_staleness` 15 minutes (product owner, 2026-10-20); `email` defer_write via outbox (owner approved).

Phase 2: `catalog/service.py:44` catches `pybreaker.CircuitBreakerError` and `httpx.ReadTimeout`, reads `catalog:{sku}` from Redis, checks `fetched_at`, and sets `X-Degraded: catalog`.

Phase 3: `pytest -q -k fallback` prints `14 passed`; the test with a 20-minute-old cache value gets 503 as designed.

---

## Exit Criteria

DONE when every dependency operation has an approved fallback from the table, triggered only by dependency-health errors, marked and counted, and proven by forced-failure tests including the stale limit and 4xx pass-through.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Owner unavailable for `max_staleness` or approval | **Return**: implement `fail_fast` for that row and record the open question. |
| Phase 2 | No cache exists for a read the owner wants as stale_cache | **Adjust**: implement as `fail_fast` now and list adding a cache as a separate task. |
| Phase 3 | Fallback test passes but no metric increments | **Adjust**: add the counter; a silent fallback is not accepted. |
| Phase 3 | Fallback triggers on 4xx | **Stop**: fix the trigger list before continuing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
