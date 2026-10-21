# RED Metrics Specification For Request-Driven Components

**One-line description:** Turns each request-driven component in the signal plan into an exact RED specification (Rate, Errors, Duration) using OpenTelemetry HTTP, RPC and messaging semantic convention names, their Prometheus-exported names, allowed label sets, an explicit error classification table, and the PromQL that reads each signal.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `signal_plan` (object, required): Output of `obs-signal-inventory`; uses components whose `method` contains `RED`.

---

## Outputs

- `red_metric_spec` (object): Per component: instrument name (OTel), exported Prometheus series names, unit, allowed labels, error rule, and the three PromQL queries (rate, error ratio, latency quantile), plus `job` label value.

---

## Phase 1: Map Components To Instruments

### Entry Criteria
- `signal_plan.components` has at least one `RED` or `RED+USE` entry.

### Actions
1. Map each component with this table (names from the OpenTelemetry semantic conventions; check the semconv version the instrumentation library emits, older libraries emit `http.server.duration` in milliseconds):

| Component kind | OTel instrument | Type, unit | Prometheus-exported series |
|---|---|---|---|
| HTTP server | `http.server.request.duration` | histogram, `s` | `http_server_request_duration_seconds_bucket`, `_sum`, `_count` |
| gRPC server | `rpc.server.duration` | histogram, `ms` in current semconv | `rpc_server_duration_milliseconds_bucket`, `_sum`, `_count` |
| Message consumer | `messaging.process.duration` | histogram, `s` | `messaging_process_duration_seconds_bucket`, `_sum`, `_count` |
| Batch or scheduled job | custom: `job.run.duration` histogram plus `job.last_success` gauge (unix seconds) | histogram `s`, gauge `s` | `job_run_duration_seconds_*`, `job_last_success_seconds` |
| Direct Prometheus client (no OTel) | `http_requests_total` counter and `http_request_duration_seconds` histogram | counter, histogram | as named |

2. Rate and error counts come from the histogram's `_count` series. A separate request counter is not needed when a duration histogram exists.
3. Allowed labels for HTTP: `http_request_method`, `http_route`, `http_response_status_code`, plus `job` and `instance` added by Prometheus. `http_route` must be the route template. Forbidden: `url_full`, `url_path` with IDs, user IDs, query strings. Record forbidden labels in the spec so the cardinality audit can check for them.
4. Confirm the real exported names by scraping once: `curl -s <collector>:8889/metrics | rg '^(http|rpc|messaging)_' | cut -d'{' -f1 | sort -u`. Use the names printed, not the table, when they differ.

### Output
Instrument map per component.

### Quality Gate
- Every RED component has an instrument and exported series names copied from the scrape output in step 4.

---

## Phase 2: Classify Errors

### Entry Criteria
- Instrument map exists.

### Actions
1. HTTP default error rule: `http_response_status_code=~"5.."` counts as a server error. 4xx is a client error and is NOT counted, with these explicit questions for the user, recorded as open questions until answered:
   - Should `429 Too Many Requests` count, because the service shed load?
   - Should `499` (client closed request, an nginx convention) or timeouts count?
2. gRPC: the status code attribute is `rpc_grpc_status_code` (numeric). Default server-error set, from the gRPC status code documentation describing server-side failures: `UNKNOWN (2)`, `DEADLINE_EXCEEDED (4)`, `UNIMPLEMENTED (12)`, `INTERNAL (13)`, `UNAVAILABLE (14)`, `DATA_LOSS (15)`. Client-caused codes such as `INVALID_ARGUMENT (3)`, `NOT_FOUND (5)`, `PERMISSION_DENIED (7)` are not server errors. Present this set to the user for confirmation.
3. Messaging: OTel sets `error_type` on failed processing; error rule is `error_type!=""`.
4. Exclude health and readiness probes from all RED queries with `http_route!~"/healthz|/readyz|/livez|/health"` (adjust to the routes listed in `signal_plan`).

### Output
Error rule per component.

### Quality Gate
- Each component has exactly one error rule as a PromQL label matcher.
- Open questions for 429/499 are recorded or answered.

---

## Phase 3: Write The PromQL

### Entry Criteria
- Error rules set.

### Actions
1. Use `$__rate_interval` in Grafana, and in rules a window of at least four times the scrape interval (the definition Grafana documents for `$__rate_interval`; a window shorter than two scrapes makes `rate()` return nothing). Read the scrape interval: `curl -s $PROM/api/v1/status/config | jq -r '.data.yaml' | rg scrape_interval`.
2. Write, per HTTP component (replace `JOB`):
   - Rate: `sum(rate(http_server_request_duration_seconds_count{job="JOB",http_route!~"/healthz|/readyz"}[5m]))`
   - Error ratio: `sum(rate(http_server_request_duration_seconds_count{job="JOB",http_response_status_code=~"5.."}[5m])) / sum(rate(http_server_request_duration_seconds_count{job="JOB"}[5m]))`
   - Latency p99: `histogram_quantile(0.99, sum by (le) (rate(http_server_request_duration_seconds_bucket{job="JOB"}[5m])))`
   The `5m` here assumes a scrape interval of 75 s or less; recompute from step 1.
3. Rules for quantiles: aggregate buckets with `sum by (le)` BEFORE `histogram_quantile`. Never average quantiles across instances (`avg(histogram_quantile(...))` is mathematically wrong).
4. Run each query against Prometheus: `curl -s --data-urlencode 'query=<expr>' $PROM/api/v1/query | jq '.data.result | length'`.

### Output
`red_metric_spec`.

### Quality Gate
- Every query returns `"status":"success"` and a result length of at least 1 after test traffic.
- No query applies `avg` to `histogram_quantile` output: `rg -n "avg\(histogram_quantile" ` on the spec returns nothing.

---

## Worked Example

Illustrative only.

Input: `checkout-api` HTTP server, scrape interval 15s.
```
$ curl -s otel-collector:8889/metrics | rg '^http_' | cut -d'{' -f1 | sort -u
http_server_request_duration_seconds_bucket
http_server_request_duration_seconds_count
http_server_request_duration_seconds_sum
$ curl -s --data-urlencode 'query=sum(rate(http_server_request_duration_seconds_count{job="checkout-api"}[1m]))' \
    http://prometheus:9090/api/v1/query | jq -c '.data.result'
[{"metric":{},"value":[1760969531.2,"41.6"]}]
```
Window: 4 x 15s = 60s, so `[1m]`. Spec excerpt:
```json
{"component":"http","job":"checkout-api","error_rule":"http_response_status_code=~\"5..\"",
 "open_questions":["count 429 as error?"],
 "labels_allowed":["http_request_method","http_route","http_response_status_code"],
 "labels_forbidden":["url_full","user_id"]}
```

---

## Exit Criteria

DONE when each request-driven component has exported names confirmed by a scrape, a single error rule, and three PromQL queries that return data.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Exported names differ from the table | **Adjust**: use the scraped names; record the semconv version. |
| Phase 1 | No duration histogram is emitted | **Return**: go back to the stack SDK setup flow; RED needs it. |
| Phase 2 | User has not decided on 429 | **Adjust**: exclude it and record the open question. |
| Phase 3 | Query returns empty | **Retry**: widen the window to at least four scrape intervals, send traffic, rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
