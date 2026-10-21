# End-To-End Signal Emission Verification

**One-line description:** Sends tagged test traffic and proves, with before/after numbers, that each signal is emitted and joined: a JSON log line with the request ID and a trace ID, the same trace retrievable from the trace backend, RED counters that increased by the number of requests sent, healthy rule evaluation, and dashboard queries with data; any signal with zero delta is reported as not running.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `signal_plan` (object, required): Output of `obs-signal-inventory`.
- `service_metrics_url` (string, required): The scrape endpoint carrying the service's metrics (service `/metrics` or the collector's Prometheus exporter).
- `prometheus_url` (string, required): Prometheus base URL.
- `collector_config` (object, optional): Output of `obs-otel-collector-pipeline`, for collector counters.
- `trace_query_url` (string, optional): Trace backend query base URL (Tempo `http://tempo:3200`, Jaeger query `http://jaeger:16686`).
- `alert_rules` (object, optional): Output of `obs-burn-rate-alert-rules`.
- `dashboard_json` (object, optional): Output of `obs-grafana-dashboard-provision`.

---

## Outputs

- `emission_report` (object): One row per signal (logs, traces, metrics, collector, rules, dashboard) with the command run, the before value, the after value, the delta, and status `emitting`, `not running` or `skipped (input not given)`.

---

## Phase 1: Baseline And Tagged Traffic

### Entry Criteria
- The service is running in the target environment and reachable.

### Actions
1. Record baselines BEFORE sending traffic:
   - Request count: `curl -s --data-urlencode 'query=sum(http_server_request_duration_seconds_count{job="checkout-api",http_route="/orders"})' $PROM/api/v1/query | jq -r '.data.result[0].value[1]'`
   - Direct scrape count: `curl -s "$service_metrics_url" | rg '^http_server_request_duration_seconds_count\{.*http_route="/orders"' `
   - Collector (if given): `curl -s <collector>:8888/metrics | rg '^otelcol_(receiver_accepted_spans|exporter_sent_spans)'`
2. Send exactly N tagged requests (N chosen by the user; the example uses 20) with unique request IDs:
`for i in $(seq 1 20); do curl -s -o /dev/null -w '%{http_code}\n' -H "X-Request-ID: verify-$i-$(date +%s)" http://checkout-api:8000/orders; done | sort | uniq -c`
3. Wait at least one scrape interval plus one metric export interval (`OTEL_METRIC_EXPORT_INTERVAL`, spec default 60 s) before reading metrics again. Reading too early produces a false zero delta.

### Output
Baselines and the list of request IDs sent with their status codes.

### Quality Gate
- Baseline values are pasted, and the traffic loop output shows N responses with their codes.

---

## Phase 2: Logs And Traces

### Entry Criteria
- Traffic sent.

### Actions
1. Find one tagged log line: from the log store or `kubectl logs deploy/checkout-api -n shop --since=5m | rg 'verify-1-'`. Parse it with `jq .` and read `request_id` and `trace_id`.
2. Status rules:

| Observation | Status |
|---|---|
| Line parses, has `request_id`, `trace_id` 32 hex | logs `emitting` |
| Line parses, no `trace_id` | logs `emitting`, correlation `not running` |
| No line with the ID | logs `not running` |

3. Retrieve that trace from the backend (if `trace_query_url` given):
   - Tempo: `curl -s $TRACE/api/traces/<trace_id> | jq '.batches | length'`
   - Jaeger: `curl -s $TRACE/api/traces/<trace_id> | jq '.data[0].spans | length'`
   A positive span count marks traces `emitting`. A 404 with head sampling below 1 may be a sampled-out trace: try the other tagged requests before concluding `not running`.
4. Confirm propagation: the trace should contain spans from every downstream service the route calls (from `signal_plan`). Missing downstream spans means context propagation is broken at that hop.

### Output
Logs and traces rows.

### Quality Gate
- The parsed log line and the trace span count are pasted.

---

## Phase 3: Metrics, Rules And Dashboard

### Entry Criteria
- Logs and traces checked.

### Actions
1. Re-run the baseline queries. Delta = after - before.
2. Status rules:

| Delta | Status |
|---|---|
| Equals N (or N plus other live traffic, when the service is not isolated) | `emitting` |
| Greater than 0 but less than N | `emitting` with loss: check sampling of metrics (should be none), export interval, or counter resets from restarts |
| 0 | `not running`: do not report success |

3. Counter resets: if a pod restarted during the test, raw counter values drop. Use `increase(...[5m])` instead of raw values when `kube_pod_container_status_restarts_total` changed.
4. Collector: accepted and sent span counters must both increase; send failures must not.
5. Rules (if `alert_rules` given): `curl -s $PROM/api/v1/rules | jq -r '.data.groups[].rules[] | select(.health!="ok") | .name'` must print nothing.
6. Dashboard (if `dashboard_json` given): rerun the panel check from `obs-grafana-dashboard-provision` Phase 3; every panel count at least 1.
7. Write `emission_report`. Any `not running` row makes the overall result FAIL. Say FAIL plainly.

### Output
`emission_report`.

### Quality Gate
- Every row has a command, before, after and delta, or `skipped (input not given)`.
- The overall result is FAIL if any row is `not running`.

---

## Worked Example

Illustrative only.

```
before: sum(http_server_request_duration_seconds_count{job="checkout-api",http_route="/orders"}) = 1840
$ for i in $(seq 1 20); do curl ... ; done | sort | uniq -c
     20 200
$ kubectl logs deploy/checkout-api -n shop --since=5m | rg 'verify-1-' | head -1 | jq -c '{request_id,trace_id}'
{"request_id":"verify-1-1760970000","trace_id":"4bf92f3577b34da6a3ce929d0e0e4736"}
$ curl -s http://tempo:3200/api/traces/4bf92f3577b34da6a3ce929d0e0e4736 | jq '.batches | length'
3
after (75 s later): 1860, delta 20
```
| Signal | Before | After | Delta | Status |
|---|---|---|---|---|
| logs | n/a | line found | n/a | emitting |
| traces | n/a | 3 batches | n/a | emitting |
| http count | 1840 | 1860 | 20 | emitting |
| collector accepted spans | 9120 | 9180 | 60 | emitting |

Overall: PASS.

---

## Exit Criteria

DONE when every signal row has measured before/after evidence, zero-delta signals are reported as not running, and the overall PASS or FAIL is stated from the rows.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Service unreachable | **Stop**: nothing can be verified. |
| Phase 2 | Trace 404 for all tagged requests | **Adjust**: check sampling config; if sampling is 1, mark traces `not running`. |
| Phase 3 | Delta 0 right after traffic | **Retry**: wait one more export plus scrape interval, query again; if still 0, mark `not running`. |
| Phase 3 | Any row `not running` | **Return**: send back to the flow that owns that signal; report FAIL. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
