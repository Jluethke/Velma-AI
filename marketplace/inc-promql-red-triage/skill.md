# Incident PromQL RED Triage

**One-line description:** Queries Prometheus over its HTTP API for rate, errors and duration (RED) plus saturation on the affected services, finds the exact minute each signal moved, and ranks which service moved first so the investigation starts at the right place.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `incident_record` (object, required): Affected services and declared_at time.
- `prometheus_url` (string, required): Base URL of the Prometheus (or Prometheus-compatible, such as Thanos Query or Grafana Mimir) query API, for example `http://prometheus.monitoring:9090`.
- `sli_queries` (object, optional): The organization's own PromQL for each service's request rate, error ratio and latency quantile. When absent, Phase 1 discovers metric names.

---

## Outputs

- `metric_findings` (object): For each affected service and dependency: the query used, the pre-incident value, the incident value, and the first UTC minute the value moved; plus the ordered list of which signal moved first.

---

## Phase 1: Find the Right Metric Names

### Entry Criteria
- `prometheus_url` answers: `curl -sS "$PROM/-/ready"` prints a ready message, or `curl -sS "$PROM/api/v1/status/buildinfo"` returns `"status":"success"`.

### Actions
1. If `sli_queries` is present, use those queries and skip to Phase 2.
2. Otherwise list metric names and filter for request metrics:
   ```
   curl -sS "$PROM/api/v1/label/__name__/values" | tr ',' '\n' | grep -E 'http_server|http_request|grpc_server|requests_total|duration_seconds'
   ```
3. Map what you found to the query shape. Use the metric names that actually exist; never type a metric name that the command above did not print.

| Instrumentation found | Rate | Error ratio | Latency |
|---|---|---|---|
| OpenTelemetry semantic conventions (`http_server_request_duration_seconds_bucket`) | `sum by (service_name) (rate(http_server_request_duration_seconds_count[W]))` | same with `{http_response_status_code=~"5.."}` divided by the total | `histogram_quantile(Q, sum by (le) (rate(http_server_request_duration_seconds_bucket[W])))` |
| Prometheus client conventions (`http_requests_total`, `http_request_duration_seconds_bucket`) | `sum(rate(http_requests_total[W]))` | `sum(rate(http_requests_total{status=~"5.."}[W])) / sum(rate(http_requests_total[W]))` | `histogram_quantile(Q, sum by (le) (rate(http_request_duration_seconds_bucket[W])))` |
| gRPC (`grpc_server_handled_total`) | `sum(rate(grpc_server_handled_total[W]))` | rate with `grpc_code!="OK"` divided by total | use the `grpc_server_handling_seconds_bucket` histogram |

4. Label names (`status`, `code`, `http_response_status_code`, `service`, `job`) differ by exporter. Check them with `curl -sS "$PROM/api/v1/series" --data-urlencode 'match[]=<metric>' | head -c 2000`.
5. Choose the range window W: read `scrape_interval` from `curl -sS "$PROM/api/v1/status/config"`. Use at least four times the scrape interval, which is the rule Grafana documents for `$__rate_interval`. Q (the quantile) comes from the service's SLO; if none exists use the one the dashboards already show and record it.

### Output
A list of verified queries per service.

### Quality Gate
- Every metric name in the queries appears in the label values output.
- Each query returns `"status":"success"` with a non-empty `result` when run once with `/api/v1/query`.

---

## Phase 2: Pull the Incident Window

### Entry Criteria
- Verified queries exist.

### Actions
1. Set START to two hours before `declared_at` and END to now, both as RFC 3339 or Unix seconds. Set STEP to the scrape interval.
2. Run each query over the window:
   ```
   curl -sS -G "$PROM/api/v1/query_range" \
     --data-urlencode 'query=<promql>' \
     --data-urlencode "start=$START" --data-urlencode "end=$END" --data-urlencode "step=$STEP" \
     | jq -r '.data.result[] | .metric as $m | .values[] | "\(.[0] | todate) \(.[1]) \($m)"' > <service>-<signal>.txt
   ```
3. Add saturation queries for each service's pods if cAdvisor and kube-state-metrics are present:
   - CPU throttling: `sum by (pod) (rate(container_cpu_cfs_throttled_periods_total{namespace="<ns>"}[W])) / sum by (pod) (rate(container_cpu_cfs_periods_total{namespace="<ns>"}[W]))`
   - Restarts: `sum by (pod) (increase(kube_pod_container_status_restarts_total{namespace="<ns>"}[W]))`
   - OOM kills: `kube_pod_container_status_last_terminated_reason{reason="OOMKilled",namespace="<ns>"}`
4. Do NOT use `irate` for this comparison; it shows only the last two samples and hides when a change started.

### Output
One text file of time and value per query.

### Quality Gate
- Every file is non-empty (`wc -l <file>` prints more than zero).
- The first timestamp in each file is at or before START plus one STEP.

---

## Phase 3: Find Onset and Order

### Entry Criteria
- Window files exist.

### Actions
1. For each series, write down the baseline value (the median over the first hour of the window) and the incident value (the value at `declared_at`).
2. Find the onset minute: the first timestamp after which the value stays on the incident side of the baseline for the rest of the window. Read it directly from the file; do not eyeball a graph.
3. Sort all onsets ascending. The earliest onset is the first candidate place to look. A dependency (database, cache, downstream API) whose onset precedes the caller's is a stronger candidate than the caller.
4. Fill `metric_findings` with query, baseline, incident value and onset for each series, plus the ordered onset list.

### Output
`metric_findings`.

### Quality Gate
- Every series in `metric_findings` has a numeric baseline, incident value and onset (or "no change").
- The onset list is sorted by time.

---

## Worked Example

Illustrative only. Services: checkout, payments. `scrape_interval` = 15s, so W = 1m.

- Phase 1: Label values show `http_server_request_duration_seconds_bucket` with label `http_response_status_code`. Query for the checkout error ratio: `sum(rate(http_server_request_duration_seconds_count{service_name="checkout",http_response_status_code=~"5.."}[1m])) / sum(rate(http_server_request_duration_seconds_count{service_name="checkout"}[1m]))`.
- Phase 2: `query_range` from 12:06Z to 14:30Z, step 15s, writes `checkout-errors.txt` with 577 lines.
- Phase 3: checkout error ratio baseline 0.002, incident 0.31, onset 13:59:30Z. payments p99 baseline 0.18 s, incident 0.19 s, no change. checkout CPU throttling onset 13:59:15Z. Ordered list: checkout throttling, then checkout errors. Payments is not the first mover.

---

## Exit Criteria

DONE when `metric_findings` lists verified queries, baseline, incident values and onsets for every affected service and its direct dependencies, sorted by onset.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Prometheus is unreachable | **Adjust**: use the Grafana Explore UI on the same data source and record the queries by hand. |
| Phase 1 | No request metrics exist for a service | **Return**: mark the service "uninstrumented" and use logs from the log flows instead. |
| Phase 2 | Query returns "exceeded maximum resolution" | **Adjust**: raise STEP to a larger multiple of the scrape interval and rerun. |
| Phase 3 | No series changed | **Return**: report "metrics show no change"; the problem may be outside instrumented paths. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
