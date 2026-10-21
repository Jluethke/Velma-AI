# Load Shedding With a Measured Concurrency Limit

**One-line description:** Finds the service's saturation knee with a k6 ramping-arrival-rate test, derives an in-flight request limit from it with Little's law, implements priority-aware shedding middleware for the stack that returns a fast 503 with Retry-After, and proves goodput holds at twice the knee load.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the service repository.
- `stack` (string, required): `python`, `node`, `go`, or `java`.
- `latency_profile` (object[], required): Output of `res-latency-percentiles`, used to confirm dependencies are not the bottleneck during the test.
- `request_deadline_ms` (number, required): Inbound request deadline; a response later than this is not goodput.

---

## Outputs

- `load_shed_changes` (object): Knee measurement (rate, p99, in-flight), the derived limit with arithmetic, middleware file:line, priority classes, and the overload test comparison (goodput and p99 with and without shedding).

---

## Phase 1: Measure the Knee

### Entry Criteria
- A staging copy of the service with production-like instance size and dependencies (or dependencies stubbed at their measured latency).
- Server metrics exported: a request duration histogram (for example `http_server_request_duration_seconds`) and an in-flight gauge if available.

### Actions
1. Write `knee.js`:
   ```js
   import http from 'k6/http';
   export const options = { scenarios: { ramp: { executor: 'ramping-arrival-rate', startRate: Number(__ENV.START), timeUnit: '1s',
     preAllocatedVUs: 200, maxVUs: 5000, stages: [{ target: Number(__ENV.END), duration: '15m' }] } } };
   export default function () { http.get(__ENV.TARGET, { timeout: `${__ENV.DEADLINE_MS}ms` }); }
   ```
   `START` is the current peak rate per instance; `END` is a rate the user expects to exceed capacity (for example 3 times current peak, a user choice).
2. Run against ONE instance: `k6 run -e START=<r> -e END=<r> -e TARGET=<url> -e DEADLINE_MS=<request_deadline_ms> knee.js`.
3. During the run, chart per minute: throughput `sum(rate(http_server_request_duration_seconds_count{instance="<i>"}[1m]))`, p99 `histogram_quantile(0.99, sum by (le) (rate(http_server_request_duration_seconds_bucket{instance="<i>"}[1m])))`, and mean latency `rate(..._sum[1m]) / rate(..._count[1m])`.
4. The knee is the first minute where either p99 exceeds `request_deadline_ms` or throughput stops rising while offered load rises. Record that minute's throughput X_knee and mean latency W_knee.
5. Check dependencies did not saturate first (their latency in the same minutes against `latency_profile`); if one did, the limit belongs in that dependency's bulkhead, not here. Record which.
6. Derive the in-flight limit: `limit = ceil(X_knee x W_knee)` (Little's law). For multi-process servers divide by the process count to get a per-process limit (gunicorn `--workers`, Node cluster workers).

### Output
Knee numbers and the limit.

### Quality Gate
- The knee minute, X_knee, W_knee and the limit arithmetic are written with the PromQL used.
- Dependency saturation check recorded.

---

## Phase 2: Implement Shedding Middleware

### Entry Criteria
- Limit derived.

### Actions
1. Define priority classes: `never_shed` (liveness/readiness endpoints, metrics), `critical` (user-facing writes the business names), `sheddable` (everything else). Shed `sheddable` at `limit` and `critical` only at `limit` plus the critical reserve the user specifies. If the user gives no reserve, use one class and record an open question.
2. Implement for `stack`, as the outermost middleware after routing (it must run before any expensive work):

| stack | Implementation |
|---|---|
| python ASGI | middleware with an `int` in-flight counter per process (one event loop, no lock needed); if `inflight >= limit` return 503 immediately, else increment, `await call_next`, decrement in `finally` |
| node | Express/Fastify hook with a module counter; decrement on `res.on('finish')` and `res.on('close')` (both, guarded so it happens once) |
| go | `sem := make(chan struct{}, limit)`; in the handler `select { case sem <- struct{}{}: defer func(){ <-sem }(); next.ServeHTTP(w, r); default: shed(w) }` |
| java | Netflix `concurrency-limits` servlet filter (`com.netflix.concurrency.limits`), configured with a fixed limit (`FixedLimit`) equal to the derived value; check the library README for builder names. Tomcat `server.tomcat.threads.max` and `accept-count` are not a substitute: queued connections still time out at the client. |

3. Shed response: status 503, header `Retry-After` (seconds; a user input or the breaker open duration if known), small body, no dependency calls. Count `shed_total{class}`.
4. Queue-time shedding (optional, when the load balancer adds a request-start header such as nginx `proxy_set_header X-Request-Start "t=${msec}";`): if `now - start > request_deadline_ms`, shed; the client has already given up.
5. Do NOT shed health endpoints. A shed readiness probe makes Kubernetes remove the pod, which moves its load onto the remaining pods and spreads the overload.

### Output
Middleware with metrics.

### Quality Gate
- Unit test: with the limit set to 2 and two requests held open, a third request gets 503 with `Retry-After`, and `/readyz` still returns 200.
- `shed_total` metric is present at `/metrics`.

---

## Phase 3: Prove Goodput Under Overload

### Entry Criteria
- Middleware deployed to staging.

### Actions
1. Run a constant-arrival-rate test at 2 x X_knee for 10 minutes, once with shedding disabled (feature flag or limit set very high) and once enabled.
2. For each run compute goodput: rate of 2xx responses with duration at most `request_deadline_ms` (k6: tag the check `res.status === 200 && res.timings.duration <= DEADLINE`, read the `checks` rate times request rate).
3. Compare: with shedding, goodput should stay near X_knee and accepted-request p99 within the deadline; without shedding, latency for all requests rises and goodput drops. Record both.
4. Check shed responses are fast: p99 of 503 response time from k6 (`http_req_duration{status:503}` via a tagged threshold or summary).

### Output
`load_shed_changes` with both runs.

### Quality Gate
- Goodput with shedding is at least goodput without shedding at 2 x X_knee (both numbers saved).
- Accepted-request p99 with shedding is at or below `request_deadline_ms`.

---

## Worked Example

Illustrative. `stack` = go, `request_deadline_ms` = 2000, current per-instance peak 150 rps.

Phase 1: `k6 run -e START=150 -e END=450 ...`; at minute 9 throughput flattens at 318 rps while p99 crosses 2000 ms; mean latency that minute 0.41 s. `limit = ceil(318 x 0.41) = 131`. Dependencies stayed within their `latency_profile` p99.

Phase 2: `internal/http/shed.go` with `make(chan struct{}, 131)`; `/healthz` and `/readyz` bypass.

Phase 3 at 636 rps:
```
shedding off: goodput 41 rps, p99 9.8 s
shedding on:  goodput 309 rps, accepted p99 1.7 s, 503 p99 3 ms, shed_total 327/s
```

---

## Exit Criteria

DONE when the in-flight limit is derived from a measured knee, middleware sheds by priority with a fast 503 and Retry-After while never shedding health checks, and an overload test shows goodput held near the knee.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No knee within the ramp | **Retry**: ask the user for a higher `END`; do not extrapolate. |
| Phase 1 | A dependency saturates first | **Return**: send it to `res-bulkhead-partition`; the service limit is not the bottleneck. |
| Phase 3 | Goodput with shedding is lower | **Adjust**: the middleware runs after expensive work or counts wrongly; move it earlier and check decrements on client disconnect. |
| Phase 3 | No staging environment | **Stop**: overload tests on production need explicit owner approval. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
