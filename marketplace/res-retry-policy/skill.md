# Retry Policy With Backoff, Jitter and Retry Budgets

**One-line description:** Decides, per dependency and per operation, which failures may be retried, how many attempts fit the timeout plan, the exponential backoff with full jitter, the single layer that owns retries, and the retry budget that stops retry storms, using decision tables instead of judgment.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dependency_map` (object[], required): Output of `res-dependency-map`, with `idempotent` per operation and `retry_layers`.
- `timeout_plan` (object[], required): Output of `res-timeout-budget`, with `max_attempts_allowed` and `budget_check`.

---

## Outputs

- `retry_policy` (object[]): One row per dependency operation: `name`, `operation`, `retry_on` (exact error classes and status codes), `never_retry_on`, `max_attempts`, `backoff` (`base_ms`, `cap_ms`, `jitter` = full, and the source of the numbers), `honor_retry_after` (true/false), `owning_layer` (the one place retries live), `layers_to_disable` (file:line of every other retry), `budget` (mechanism and parameters with their source), and `open_questions`.

---

## Phase 1: Classify Retryable Failures

### Entry Criteria
- Every operation in `dependency_map` has `idempotent` set.

### Actions
1. Apply this table to each operation; first matching row wins:

| Failure observed by the client | Operation idempotent, or sends an idempotency key the server honors | Not idempotent |
|---|---|---|
| Connection refused, DNS failure, or connect timeout (request never sent) | retry | retry |
| HTTP 429 or 503 with `Retry-After` | retry after the header's delay | retry after the header's delay |
| HTTP 502, 503, 504, 408 | retry | do NOT retry |
| Read timeout or connection reset after the request was sent | retry | do NOT retry (the server may have applied it) |
| HTTP 500 | retry only if the dependency documents 500 as transient | do NOT retry |
| Any other 4xx (400, 401, 403, 404, 409, 422) | do NOT retry | do NOT retry |
| gRPC `UNAVAILABLE` | retry | retry only if the server documents it was not processed |
| gRPC `DEADLINE_EXCEEDED` | do NOT retry (the deadline is shared across attempts) | do NOT retry |
| gRPC `RESOURCE_EXHAUSTED` | retry only with server pushback (`grpc-retry-pushback-ms`) | do NOT retry |
| gRPC `ABORTED` | retry the whole transaction at the caller, not the single RPC | same |
| SQL serialization failure (SQLSTATE `40001`) or deadlock (`40P01`) | retry the whole transaction | retry the whole transaction |
| SQL statement timeout (`57014`) | do NOT retry | do NOT retry |

2. Write `retry_on` and `never_retry_on` as the exact exception class names or status codes for the client library recorded in `dependency_map.client_library`.
3. Do NOT retry a request that failed because the client's own deadline expired. The remaining budget is already spent.

### Output
`retry_on` and `never_retry_on` per operation.

### Quality Gate
- Every non-idempotent operation's `retry_on` contains only "request never sent" failures and `Retry-After` responses.
- Every row names concrete exception classes or codes, not "transient errors".

---

## Phase 2: Attempts and Backoff With Full Jitter

### Entry Criteria
- Retry conditions set.

### Actions
1. Set `max_attempts` = `timeout_plan.max_attempts_allowed` for the dependency. Never higher. If it is 1, the operation has no retries; record it and skip the rest of this phase for that row.
2. Use full jitter from the AWS Architecture Blog post "Exponential Backoff And Jitter" (Brooker, 2015): `sleep_ms = random_uniform(0, min(cap_ms, base_ms * 2 ** attempt))`, where `attempt` starts at 0 for the first retry.
3. Take `base_ms` and `cap_ms` from one named source and write the source: the user's input, the dependency's published guidance (for example a cloud SDK's documented backoff), or the default of the library that will implement it (for example cockatiel `ExponentialBackoff` initialDelay 128 ms and maxDelay 30000 ms; resilience4j `waitDuration` 500 ms; cenkalti/backoff `InitialInterval` 500 ms, `MaxInterval` 60 s). Do NOT write a number with no source.
4. Recheck the budget: `sum(per_try_timeout_ms x max_attempts) + sum of maximum backoff sleeps <= request_deadline_ms`. If it does not fit, reduce `max_attempts` for the least critical dependency first, and record the change.
5. `honor_retry_after` = true for every HTTP dependency. When the header's delay exceeds the remaining deadline, fail immediately instead of sleeping.

### Output
`max_attempts`, `backoff`, and `honor_retry_after` per row.

### Quality Gate
- The budget recheck arithmetic is written out and is at most `request_deadline_ms`.
- Every `base_ms` and `cap_ms` has a written source.

---

## Phase 3: One Owning Layer and a Retry Budget

### Entry Criteria
- Attempts and backoff set.

### Actions
1. Choose `owning_layer` with this table (AWS Builders' Library "Timeouts, retries, and backoff with jitter" warns that retries at several layers multiply: 3 attempts at each of 3 layers is 27 calls):

| Situation | owning_layer |
|---|---|
| A service mesh (Envoy, Istio) is in the path and the team manages its config | the mesh route; disable app retries for that dependency |
| An SDK has built-in retries (AWS SDK, Google Cloud client, Stripe) | the SDK, configured explicitly; remove the app loop |
| Otherwise | the application client wrapper (one function per dependency) |

2. List every other retry for the same call in `layers_to_disable` with file:line (from `dependency_map.retry_layers`).
3. Choose the budget mechanism and copy its documented parameters:

| owning_layer | Budget mechanism | Documented defaults to start from |
|---|---|---|
| Envoy or Istio | cluster `circuit_breakers.thresholds.retry_budget` | `budget_percent` 20%, `min_retry_concurrency` 3 |
| gRPC client with service config | `retryThrottling` (gRFC A6) | no default: `maxTokens` and `tokenRatio` are required user inputs |
| App wrapper | a token bucket that earns a fraction of a token per success and spends one per retry (same shape as Finagle `RetryBudget`, defaults ttl 10 s, minRetriesPerSec 10, percentCanRetry 0.2) | Finagle values, or user input |

4. Record the source of every budget number. If the user wants another value, record it as a user input.

### Output
Final `retry_policy`.

### Quality Gate
- Every dependency has exactly one `owning_layer`, and every other retry location is listed in `layers_to_disable`.
- Every row with `max_attempts` above 1 has a `budget` with a named source.

---

## Worked Example

Illustrative. `payments` POST `/charge` sends `Idempotency-Key` (documented by the payments API), `max_attempts_allowed` 2 from a raised deadline; `sqs` SendMessage, AWS SDK plus an app loop.

Phase 1, `payments`: `retry_on` = `httpx.ConnectError`, `httpx.ConnectTimeout`, `httpx.ReadTimeout`, status 502/503/504/408, 429 and 503 with `Retry-After`; `never_retry_on` = other 4xx, 500.

Phase 2: `max_attempts` 2; backoff from tenacity `wait_random_exponential(multiplier=0.1, max=1)` chosen by the user: base 100 ms, cap 1000 ms. Check: `45 + 930 + 750*2 + 100 = 2575 <= 2600` (deadline raised to 2600 in the plan).

Phase 3: `sqs` owning_layer = botocore with `retries={"mode": "standard"}`; `layers_to_disable` = `checkout/events.py:30` (app `for` loop). `payments` owning_layer = app wrapper, budget = token bucket with Finagle defaults, source cited.

---

## Exit Criteria

DONE when every operation has explicit retry conditions, attempts that fit the deadline, sourced full-jitter backoff, one owning layer, and a sourced retry budget.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Idempotency of an operation unknown | **Adjust**: treat it as not idempotent until the dependency's docs say otherwise. |
| Phase 2 | No source for base or cap | **Return**: list it as an open question for the user; do not pick a number. |
| Phase 2 | Budget does not fit even with 1 attempt | **Return**: send back to `res-timeout-budget`; retries are not possible. |
| Phase 3 | Mesh owns retries but the team cannot change mesh config | **Adjust**: choose the app wrapper and list the mesh retry in `open_questions` for the platform owner. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
