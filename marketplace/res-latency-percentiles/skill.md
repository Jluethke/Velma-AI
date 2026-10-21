# Resilience Latency Percentiles Per Dependency

**One-line description:** Measures p50, p90, p99 and p99.9 latency plus peak request rate for every outbound dependency from Prometheus client histograms (or a k6 measurement when no histogram exists), aggregating buckets correctly so the numbers can set timeouts and concurrency limits.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dependency_map` (object[], required): Output of `res-dependency-map`.
- `metrics_source` (string, required): Prometheus base URL (for example `http://prometheus:9090`), or the literal `none` when the service exports no client latency histograms.
- `measurement_window` (string, required): PromQL range that includes at least one daily traffic peak, for example `7d`. Chosen by the user; the flow does not pick it.

---

## Outputs

- `latency_profile` (object[]): One row per sync dependency: `name`, `p50_ms`, `p90_ms`, `p99_ms`, `p999_ms`, `connect_p99_ms` (or "not measured"), `peak_rps`, `error_rate`, `source` (the exact PromQL or k6 command), `bucket_bounds_ms` (the histogram bucket edges around each percentile), `resolution_warning` (true when a percentile falls in a bucket wider than the value itself or in the `+Inf` bucket).

---

## Phase 1: Find the Client Histogram

### Entry Criteria
- `dependency_map` has at least one row with `mode` = sync.

### Actions
1. If `metrics_source` is `none`, skip to Phase 3.
2. List candidate metric names: `curl -s "<metrics_source>/api/v1/label/__name__/values" | tr ',' '\n' | rg "client.*(duration|latency).*_bucket"`.
3. Prefer, in this order: OpenTelemetry `http_client_request_duration_seconds_bucket` (semantic convention `http.client.request.duration`, unit seconds), `rpc_client_duration_*_bucket` for gRPC, `db_client_operation_duration_seconds_bucket`, then library metrics (for example Micrometer `http_client_requests_seconds_bucket`, Envoy `envoy_cluster_upstream_rq_time_bucket` in milliseconds).
4. Find the label that identifies the dependency: `curl -s "<metrics_source>/api/v1/series?match[]=<metric>" | head -c 2000` and look for `server_address`, `peer_service`, `uri`, `envoy_cluster_name`, or `client_name`.
5. Record the unit from the metric name suffix (`_seconds` or `_milliseconds`; Envoy `upstream_rq_time` is milliseconds). Do NOT assume seconds.

### Output
Per dependency: metric name, identifying label and value, unit.

### Quality Gate
- Every sync dependency maps to one metric and one label selector, or is listed for Phase 3.
- The unit is recorded for every metric.

---

## Phase 2: Query Percentiles and Rate

### Entry Criteria
- Metric and selector known per dependency.

### Actions
1. For each quantile q in 0.5, 0.9, 0.99, 0.999 run, aggregating buckets across instances BEFORE computing the quantile:
   `curl -s --data-urlencode 'query=histogram_quantile(<q>, sum by (le) (rate(<metric>{<selector>}[5m])))' "<metrics_source>/api/v1/query"`
   Then take the maximum of that series over the window with a subquery: `max_over_time(histogram_quantile(<q>, sum by (le) (rate(<metric>{<selector>}[5m])))[<measurement_window>:5m])`.
2. Do NOT average per-instance percentiles (`avg(histogram_quantile(...))`). Percentiles do not average; sum the buckets by `le` first.
3. Read the bucket edges: `curl -s --data-urlencode 'query=sum by (le) (rate(<metric>{<selector>}[<measurement_window>]))' ...`. Record the two `le` values around each percentile in `bucket_bounds_ms`.
4. Set `resolution_warning` true when the percentile lands in the `+Inf` bucket (`histogram_quantile` then returns the highest finite bound, which understates the tail) or when the bucket width exceeds the reported value. Prometheus interpolates linearly inside a bucket, so the true value can be anywhere inside it.
5. Peak rate: `max_over_time(sum(rate(<metric_without_bucket>_count{<selector>}[5m]))[<measurement_window>:5m])`. Error rate: ratio of `_count` with an error status label (for example `http_response_status_code=~"5.."` or `error_type!=""`) to all `_count`.
6. Connect latency: only if a connect-phase metric exists (for example Envoy `envoy_cluster_upstream_cx_connect_ms_bucket`). Otherwise write "not measured". Do NOT reuse request latency as connect latency.
7. Convert every value to milliseconds.

### Output
Filled `latency_profile` rows with `source` set to the exact query.

### Quality Gate
- Every row has four percentiles, `peak_rps`, and the exact PromQL used.
- Every query aggregated with `sum by (le)` (check the `source` strings with `rg "sum by \(le\)"`).

---

## Phase 3: Measure When No Histogram Exists

### Entry Criteria
- At least one sync dependency has no histogram, or `metrics_source` is `none`.

### Actions
1. Choose a staging endpoint of the dependency that performs the same operation the service calls. Never load-test a production dependency without its owner's written approval.
2. Write `latency.js` for k6 that calls the operation at the service's observed rate (from logs or the user):
   ```js
   import http from 'k6/http';
   export const options = { scenarios: { s: { executor: 'constant-arrival-rate', rate: __ENV.RATE, timeUnit: '1s', duration: '10m', preAllocatedVUs: 50 } },
     summaryTrendStats: ['p(50)', 'p(90)', 'p(99)', 'p(99.9)', 'max'] };
   export default function () { http.get(__ENV.TARGET); }
   ```
3. Run `k6 run -e RATE=<rps> -e TARGET=<url> latency.js` and read `http_req_duration` (total) and `http_req_connecting` (connect) from the summary.
4. Set `source` to the full k6 command and mark the row `synthetic: true`. A synthetic run on staging is a lower-confidence number; carry the flag forward.

### Output
`latency_profile` complete for every sync dependency.

### Quality Gate
- Every sync dependency in `dependency_map` has a `latency_profile` row.
- Every synthetic row includes the k6 command and `synthetic: true`.

---

## Worked Example

Illustrative. `metrics_source` = `http://prometheus:9090`, `measurement_window` = `7d`, dependency `payments` with OTel metric and label `server_address="payments.internal"`.

```
histogram_quantile(0.999, sum by (le) (rate(http_client_request_duration_seconds_bucket{server_address="payments.internal"}[5m])))
p50 0.041s  p90 0.088s  p99 0.212s  p99.9 0.610s
buckets around p99.9: le=0.5 and le=0.75  -> resolution_warning: true (bucket width 250 ms)
peak_rps 412  error_rate 0.0021  connect_p99: not measured
```
Row written: `{name: payments, p50_ms: 41, p90_ms: 88, p99_ms: 212, p999_ms: 610, bucket_bounds_ms: {p999: [500, 750]}, resolution_warning: true, peak_rps: 412}`. Dependency `fraud-score` had no histogram; Phase 3 ran `k6 run -e RATE=60 -e TARGET=https://fraud.staging/score latency.js` and got `p(99.9)=930ms`, `synthetic: true`.

---

## Exit Criteria

DONE when every sync dependency has measured percentiles, peak rate, error rate, a reproducible source query or command, and a resolution warning flag.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No label distinguishes dependencies | **Return**: report that client metrics need a peer label; fall back to Phase 3 for those dependencies. |
| Phase 2 | Query returns empty or NaN | **Adjust**: widen the inner rate range from `5m` to the scrape interval times 4; if still empty the dependency had no traffic in the window, so move it to Phase 3. |
| Phase 2 | p99.9 in the `+Inf` bucket | **Return**: set `resolution_warning` true and record "tail unmeasurable with current buckets"; add an open question to add higher bucket bounds. |
| Phase 3 | No staging endpoint exists | **Stop**: record the dependency as "latency unknown"; do not invent a number. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
