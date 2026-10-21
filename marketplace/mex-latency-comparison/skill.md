# Latency Comparison Old Path vs New Path

**One-line description:** Measures latency of the old and new paths under the same open-model load with k6's `constant-arrival-rate` executor (which avoids coordinated omission), in alternating runs to expose drift, reads p50, p95 and p99 from k6's summary and from server-side histograms, and reports the difference against the user's latency SLO.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `routing_config` (object, optional): From `mex-strangler-proxy-routing`; how to target each backend. Absent for `in_process`.
- `deployment_decision` (string, required): `in_process` or `service`.
- `parity_report` (object, required): From `mex-shadow-traffic-diff`.
- `latency_slo` (string, optional): Target such as "p99 < 300 ms on GET /api/invoices/{id}". If absent, the report gives the measured difference and states that no pass or fail threshold was provided.
- `load_profile` (object, optional): Request rate, duration and request mix. If absent, ask the user, or derive the rate from production access logs (peak requests per second on the routes in scope) and record the source.

---

## Outputs

- `latency_report` (object): Load profile and its source, k6 script path, per run (A1, B1, A2, B2) p50, p95, p99, max, error rate and dropped iterations, server-side quantiles, the A-vs-A drift, the A-vs-B difference, and a verdict (`within_slo`, `exceeds_slo`, `inconclusive`, or `no_slo_given`).

---

## Phase 1: Set Up Comparable Targets

### Entry Criteria
- `parity_report.parity_ok` is true (latency of a wrong answer does not matter).

### Actions
1. Define A (old) and B (new) targets:
   - `service`: A = monolith directly or proxy with the split at 0 percent; B = proxy with a test key routed to the new service (header or cookie from `routing_config`), so both go through the same proxy hop.
   - `in_process`: A = flag off, B = flag on for the test key, same deployment.
2. Same environment for both: same instance sizes, same database, warmed caches. Run a warm-up of the same script before measuring and discard it.
3. Install k6 from the official packages (`k6 version` prints the version). Do not use `ab`; it is a closed-model tool that hides queueing delay.

### Output
Targets A and B.

### Quality Gate
- A single request to each target returns the expected backend in `X-Backend` (service) or the expected flag state in logs (in-process).

---

## Phase 2: Run the Load

### Entry Criteria
- Targets ready, `load_profile` known.

### Actions
1. k6 script `latency.js` with an open-model executor:
   ```js
   import http from 'k6/http';
   import { check } from 'k6';
   export const options = {
     scenarios: { steady: {
       executor: 'constant-arrival-rate',
       rate: __ENV.RATE, timeUnit: '1s', duration: __ENV.DURATION,
       preAllocatedVUs: __ENV.VUS, maxVUs: __ENV.MAX_VUS } },
     summaryTrendStats: ['avg', 'p(50)', 'p(95)', 'p(99)', 'max'],
   };
   export default function () {
     const res = http.get(`${__ENV.BASE}/api/invoices/${ids[Math.floor(Math.random()*ids.length)]}`,
       { headers: { 'X-Customer-Id': __ENV.KEY } });
     check(res, { 'status 200': r => r.status === 200 });
   }
   ```
   Define `ids` from a fixture file of real IDs with `open()` at init time. `RATE` and `DURATION` come from `load_profile`.
2. Run in the order A, B, A, B: `k6 run -e BASE=$A -e KEY=$KEY_A -e RATE=... -e DURATION=... --summary-export=a1.json latency.js`, then the same for B1, A2, B2.
3. Read from each summary: `http_req_duration` p50, p95, p99, max; `http_req_failed` rate; `dropped_iterations`. A non-zero `dropped_iterations` means k6 could not sustain the rate (raise `maxVUs` or the load generator size); the run is invalid.
4. Server-side view for the same windows, if Prometheus histograms exist: `histogram_quantile(0.99, sum by (le) (rate(<request_duration_bucket_metric>{route="/api/invoices/{id}"}[5m])))`. The metric name depends on the instrumentation library (for example OpenTelemetry's `http.server.request.duration`, exported with a Prometheus-safe name); read it from `/metrics`, do not guess.

### Output
Four summaries and server-side quantiles.

### Quality Gate
- Each of the four runs has `dropped_iterations` = 0 (or absent) and its summary JSON exists.

---

## Phase 3: Compare and Decide

### Entry Criteria
- Four valid runs.

### Actions
1. Drift: compare A1 vs A2 for each percentile. This is the noise floor of this environment.
2. Difference: compare mean of B vs mean of A for each percentile.
3. Verdict, first matching row:

   | Condition | Verdict |
   |---|---|
   | The A1 to A2 spread is larger than the A to B difference | `inconclusive` (environment noise dominates; stabilize or lengthen runs) |
   | No `latency_slo` given | `no_slo_given`, report the numbers |
   | B meets the SLO on every percentile it names and error rate did not rise | `within_slo` |
   | Otherwise | `exceeds_slo` |

4. For `exceeds_slo` in a `service` decision, list likely causes to check in order: extra calls per request (N+1 across the network; compare with `decision_evidence` calls-per-request), missing connection pooling or keepalive in the HTTP client, serialization cost of large payloads, a missing index in the new database, cold caches.

### Output
`latency_report`.

### Quality Gate
- The report contains all four runs' numbers copied from the summary files, the drift, the difference, and a verdict from the table.

---

## Worked Example

Illustrative. `latency_slo` "p99 < 300 ms", `load_profile` 120 rps for 10 minutes from last week's peak in access logs.

| Run | p50 | p95 | p99 | failed | dropped |
|---|---|---|---|---|---|
| A1 | 41 ms | 118 ms | 241 ms | 0.00% | 0 |
| B1 | 44 ms | 121 ms | 252 ms | 0.00% | 0 |
| A2 | 40 ms | 115 ms | 238 ms | 0.00% | 0 |
| B2 | 45 ms | 124 ms | 249 ms | 0.00% | 0 |

Drift p99 (A1 vs A2): 3 ms. Difference p99 (B vs A): about 11 ms, larger than drift. B p99 under 300 ms. Verdict `within_slo`.

---

## Exit Criteria

DONE when four valid alternating runs exist, drift and difference are computed from the summary files, and the verdict follows from the table.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Parity not established | **Stop**: run `mex-shadow-traffic-diff` first. |
| Phase 2 | `dropped_iterations` above zero | **Retry**: increase `maxVUs` or run k6 from a larger machine; do not lower the rate without the user. |
| Phase 2 | Production load test not permitted | **Adjust**: run in staging and mark the report as staging-only. |
| Phase 3 | Verdict `inconclusive` | **Retry**: lengthen `DURATION` with the user's agreement, or isolate noisy neighbors; then rerun all four. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
