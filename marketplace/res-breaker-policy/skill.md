# Circuit Breaker Policy per Dependency

**One-line description:** Decides which dependencies get a circuit breaker and specifies each breaker's failure definition, window type, minimum call volume, failure and slow-call thresholds, open duration and half-open probes from named library defaults or user inputs, checked against the measured baseline error rate so the breaker never trips in normal traffic.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dependency_map` (object[], required): Output of `res-dependency-map`.
- `latency_profile` (object[], required): Output of `res-latency-percentiles` (uses `error_rate`, `peak_rps`, percentiles).
- `retry_policy` (object[], required): Output of `res-retry-policy`.

---

## Outputs

- `breaker_policy` (object[]): One row per dependency with a breaker: `name`, `scope` (one breaker per dependency or per endpoint), `counts_as_failure`, `never_counts`, `window` (`type` count or time, `size`), `minimum_calls`, `failure_rate_threshold`, `slow_call_threshold_ms`, `slow_call_rate_threshold`, `open_duration`, `half_open_probes`, `open_error` (what the caller receives when open), `fallback_ref` (or "none yet"), `sources` (where each number came from), and `open_questions`. Dependencies without a breaker are listed with the reason.

---

## Phase 1: Decide Which Dependencies Get a Breaker

### Entry Criteria
- `dependency_map` rows have `criticality` and `mode`.

### Actions
1. Apply this table:

| Condition | Breaker |
|---|---|
| `mode` = async and the call runs in a queue consumer with its own retry and dead letter | no; the queue absorbs failures |
| `mode` = sync and the dependency is a remote network call | yes |
| In-process library or local file | no |
| Database used through a connection pool | yes, but count only connection and timeout errors, never constraint violations |

2. Set `scope`: one breaker per dependency. Use one per endpoint only when the dependency's endpoints fail independently (for example separate backends behind one host), and say which evidence shows that (different error rates per endpoint in `latency_profile`).
3. Do NOT share one breaker across unrelated dependencies; a failing cache would then block payments.

### Output
List of breaker candidates with scope.

### Quality Gate
- Every sync remote dependency in `dependency_map` is either a candidate or listed with a reason from the table.

---

## Phase 2: Define Failure and Window

### Entry Criteria
- Candidates listed.

### Actions
1. `counts_as_failure`: connect errors, timeouts (the per-try timeout firing), and HTTP 5xx or gRPC UNAVAILABLE / INTERNAL / DEADLINE_EXCEEDED. Copy exact class names from the matching `retry_policy.retry_on` row.
2. `never_counts`: HTTP 4xx (the caller's fault, not the dependency's health), business errors, and the caller's own cancellation. Counting 4xx opens the breaker when one user sends bad input.
3. `slow_call_threshold_ms`: set to the dependency's `per_try_timeout_ms` only if the library supports slow-call detection (resilience4j does); otherwise "not supported by library".
4. Window type: compute `size / trough_rps` (seconds to fill a count window of the library's default size at the lowest traffic rate; get the trough with `min_over_time` on the same rate query used for `peak_rps`). If that time is longer than the library's default open duration, use a time-based window, because a count window would then mix calls from minutes apart. Otherwise use count-based. Write the arithmetic as the reason.
5. Choose the target library from the stack (pybreaker, opossum, gobreaker, resilience4j) and copy its documented defaults as the starting point, citing them:

| Library | Trip rule default | Open duration default | Half-open default |
|---|---|---|---|
| resilience4j | failureRateThreshold 50%, slidingWindowSize 100, minimumNumberOfCalls 100, slowCallRateThreshold 100%, slowCallDurationThreshold 60000 ms | waitDurationInOpenState 60000 ms | permittedNumberOfCallsInHalfOpenState 10 |
| opossum | errorThresholdPercentage 50, rollingCountTimeout 10000 ms, volumeThreshold 0 | resetTimeout 30000 ms | one trial call |
| sony/gobreaker | ReadyToTrip: ConsecutiveFailures > 5 | Timeout 60 s | MaxRequests 1 |
| pybreaker | fail_max 5 consecutive failures | reset_timeout 60 s | one trial call |

6. Replace a default only with a user input, and record the user as the source. Do NOT pick "nicer" numbers.

### Output
Failure definition and window per breaker.

### Quality Gate
- No breaker counts HTTP 4xx as failure (check every `counts_as_failure`).
- Every numeric field has an entry in `sources`.

---

## Phase 3: Check Against Baseline and Wire Interactions

### Entry Criteria
- Draft rows complete.

### Actions
1. Baseline check: if `latency_profile.error_rate` for the dependency is at or above `failure_rate_threshold` (for rate-based breakers), the breaker trips in normal traffic. Record an open question; do not raise the threshold silently.
2. Consecutive-failure breakers (gobreaker default, pybreaker): estimate the chance of N consecutive failures at the baseline error rate p as p^N per window of N calls. If `peak_rps x 60 x p^N` is 1 or more, false trips per minute are expected at peak; record an open question.
3. Minimum volume: `minimum_calls` must be reachable in the window at off-peak rates, or the breaker never evaluates at night. Compute `trough_rps x window_seconds` and compare.
4. `open_error`: the exception or status the caller receives when open (for example `CallNotPermittedException`, `pybreaker.CircuitBreakerError`, `gobreaker.ErrOpenState`, opossum `EOPENBREAKER`). Add it to `retry_policy.never_retry_on` for the same dependency: retrying an open breaker only burns the budget.
5. Order: retry wraps the breaker (each attempt passes the breaker), the breaker wraps the timeout. Write that order into the row.
6. `fallback_ref`: "none yet" unless code already has one; `res-graceful-degradation` fills it.

### Output
Final `breaker_policy`.

### Quality Gate
- Every row shows the baseline check arithmetic and its result.
- Every `open_error` also appears in the dependency's retry `never_retry_on` list.

---

## Worked Example

Illustrative. `payments`: sync, `error_rate` 0.0021, `peak_rps` 412, trough 1.2 rps, stack java.

Phase 2: resilience4j default size 100; `100 / 1.2 = 83 s`, longer than the 60 s default open duration, so time-based. User supplies `slidingWindowSize` 60 (seconds) and is recorded as the source. `counts_as_failure` = `ConnectException`, `HttpTimeoutException`, `RetryableStatusException`; slow-call threshold 750 ms.

Phase 3: `0.0021 < 0.50` passes. Minimum calls 100 vs trough `1.2 x 60 = 72` calls per window: unreachable at night, so **Adjust**: user sets `minimumNumberOfCalls` 50, recorded as user input. `open_error` `CallNotPermittedException` added to payments `never_retry_on`. Order: Retry(CircuitBreaker(TimeLimiter(call))).

---

## Exit Criteria

DONE when every sync remote dependency either has a fully specified breaker with sourced numbers and a passing baseline check, or a written reason for having none.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Stack library unknown | **Return**: ask for `stack`; the defaults table depends on it. |
| Phase 3 | Baseline error rate exceeds the threshold | **Return**: open question for the dependency owner; the dependency is unhealthy or the failure definition counts non-health errors. |
| Phase 3 | Minimum calls unreachable off-peak | **Adjust**: switch to a time window or record a user-input minimum; note the source. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
