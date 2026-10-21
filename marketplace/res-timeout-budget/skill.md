# Resilience Timeout Budget From Measured Percentiles

**One-line description:** Derives a per-try timeout, a connect timeout, and an attempt allowance for every dependency from its measured latency percentile and an accepted false-timeout rate, then checks that the sequential call path fits inside the inbound request deadline.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dependency_map` (object[], required): Output of `res-dependency-map`.
- `latency_profile` (object[], required): Output of `res-latency-percentiles`.
- `request_deadline_ms` (number, required): The longest the inbound request may take end to end, from the service's SLO or from its own caller's timeout. A user input; never derived here.
- `false_timeout_rate` (number, required): Fraction of healthy calls the user accepts being cut off by a timeout, for example 0.001. The AWS Builders' Library article "Timeouts, retries, and backoff with jitter" gives 0.1% (p99.9) as an example of this choice.

---

## Outputs

- `timeout_plan` (object[]): One row per sync dependency: `name`, `percentile_used` (1 minus `false_timeout_rate`), `per_try_timeout_ms`, `connect_timeout_ms` (or "open question"), `max_attempts_allowed`, `path_position` (sequential or parallel group), `deadline_propagation` (how the remaining budget is passed downstream), plus a top-level `budget_check` with `request_deadline_ms`, `sequential_worst_case_ms`, `fits` (true/false), and `open_questions`.

---

## Phase 1: Per-Try Timeout From the Percentile

### Entry Criteria
- Every sync dependency in `dependency_map` has a `latency_profile` row.
- `0 < false_timeout_rate < 1`.

### Actions
1. Compute `percentile_used = 1 - false_timeout_rate` (0.001 gives 0.999).
2. If `latency_profile` has that percentile, set `per_try_timeout_ms` to it. If it does not (for example 0.9995), stop and re-run `res-latency-percentiles` for that quantile; do NOT interpolate between p99 and p99.9.
3. If the row has `resolution_warning: true`, set `per_try_timeout_ms` to the upper bucket bound from `bucket_bounds_ms` (the true value is at most that bound) and note it.
4. If the row has `synthetic: true`, copy that flag; the value came from staging.
5. `connect_timeout_ms`: set from `connect_p99_ms` at the same `percentile_used` if measured; otherwise write "open question: connect latency not measured" and do not choose a number.
6. Do NOT add a "safety margin" multiplier. A multiplier is an invented constant. The false-timeout rate is the margin.

### Output
Per-row `per_try_timeout_ms` and `connect_timeout_ms`.

### Quality Gate
- Every `per_try_timeout_ms` equals a value present in `latency_profile` (or its bucket upper bound), traceable by name and percentile.
- No row contains a multiplier or a round-number timeout without a source.

---

## Phase 2: Build the Call Path

### Entry Criteria
- Per-try timeouts set.

### Actions
1. For each inbound route listed in `dependency_map.callers`, open the handler and write the order of dependency calls.
2. Mark calls awaited one after another as sequential. Mark calls started together and joined (`asyncio.gather`, `Promise.all`, `errgroup.Group`, `CompletableFuture.allOf`) as one parallel group; the group's cost is its slowest member.
3. Record the handler's own processing time if measured (server histogram minus dependency time); otherwise record "not measured" in `open_questions`.

### Output
Ordered call path per route.

### Quality Gate
- Every route that reaches a critical or degradable dependency has a written call order with file:line for each call.

---

## Phase 3: Fit Attempts Into the Deadline

### Entry Criteria
- Call paths written.

### Actions
1. For the worst route, compute `sequential_worst_case_ms = sum over sequential steps of (per_try_timeout_ms x attempts + total backoff between attempts)` with attempts = 1 first.
2. If attempts = 1 already exceeds `request_deadline_ms`, set `fits: false`, set every `max_attempts_allowed` to 1, and add an open question: "the deadline cannot cover p<percentile> latency of <dependencies>; raise the deadline, lower `false_timeout_rate`, or make a call parallel or async". Do not shrink timeouts below the measured percentile to force a fit.
3. Otherwise raise attempts for critical dependencies one at a time while the sum stays within `request_deadline_ms`. Backoff time comes later from `res-retry-policy`; reserve it here as "to be added" and recheck there.
4. Set `deadline_propagation` per kind: gRPC propagates automatically through the `grpc-timeout` header when the client passes the inbound context deadline; Go passes `ctx` carrying `context.WithDeadline`; HTTP has no standard header, so record "open question: choose a header or compute remaining budget locally".
5. Every downstream call must use `min(per_try_timeout_ms, remaining_deadline_ms)`. Write this rule into the plan.

### Output
`timeout_plan` with `budget_check`.

### Quality Gate
- `budget_check.sequential_worst_case_ms` is recomputable from the rows (show the arithmetic).
- `fits` is true, or `open_questions` names the dependencies that break the budget.

---

## Worked Example

Illustrative. `request_deadline_ms` = 2000, `false_timeout_rate` = 0.001.

Phase 1: `payments` p99.9 = 610 ms but `resolution_warning` with bounds [500, 750], so `per_try_timeout_ms` = 750. `fraud-score` p99.9 = 930 ms, synthetic. `postgres` p99.9 = 45 ms. Connect latency not measured for any: three open questions.

Phase 2: the `POST /orders` handler at `api/orders.py:50-61` awaits `postgres` (read cart), then `fraud-score`, then `payments`, all sequential.

Phase 3:
```
attempts=1: 45 + 930 + 750 = 1725 ms <= 2000  fits
payments attempts=2: 45 + 930 + 750*2 = 2475 > 2000  rejected
max_attempts_allowed: postgres 1, fraud-score 1, payments 1
open question: second payments attempt needs 475 ms more deadline or a parallel fraud check
```

---

## Exit Criteria

DONE when every sync dependency has a per-try timeout traceable to a measured percentile, an attempt allowance that fits the deadline (or an open question saying why not), and a deadline propagation rule.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Required percentile missing | **Return**: send back to `res-latency-percentiles` with the quantile to add. |
| Phase 1 | `latency_profile` says "latency unknown" | **Stop**: the dependency has no timeout basis; list it as an open question and do not set a value. |
| Phase 2 | Handler order depends on runtime branches | **Adjust**: compute the budget for the longest branch. |
| Phase 3 | Attempts = 1 does not fit | **Return**: report `fits: false` with the open question; never shorten a timeout below the measured percentile. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
