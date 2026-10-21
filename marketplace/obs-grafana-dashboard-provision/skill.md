# Grafana Service Dashboard As Code

**One-line description:** Builds a Grafana dashboard JSON for one service with an SLO row, a RED row and a USE row from the verified queries, using a datasource template variable and `$__rate_interval`, provisions it from a file provider or the HTTP API with a fixed `uid`, and checks every panel query returns data through the Prometheus API.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `red_metric_spec` (object, required): Output of `obs-red-metrics-spec`.
- `use_queries` (object, required): Output of `obs-use-metrics-node-exporter`; only `present` cells are used.
- `slo_spec` (object, required): Output of `obs-slo-error-budget-define`.
- `grafana_url` (string, required): Grafana base URL. A service account token with Editor role on the target folder is read from the environment variable `GRAFANA_TOKEN`; never paste it into files.

---

## Outputs

- `dashboard_json` (object): Dashboard file path, `uid`, panel list with each query and its result count, provisioning method, and the Grafana API response.

---

## Phase 1: Build The JSON

### Entry Criteria
- At least one RED component and one SLO exist.
- `curl -s -H "Authorization: Bearer $GRAFANA_TOKEN" $GRAFANA_URL/api/health` returns `"database": "ok"`.

### Actions
1. Create `dashboards/checkout-api.json` with this skeleton. Keep `id` null and set a fixed `uid` so links in runbooks stay stable:
```json
{
  "id": null,
  "uid": "checkout-api-svc",
  "title": "checkout-api service",
  "tags": ["service", "slo"],
  "timezone": "utc",
  "schemaVersion": 39,
  "templating": {"list": [
    {"name": "datasource", "type": "datasource", "query": "prometheus"},
    {"name": "job", "type": "constant", "query": "checkout-api"}
  ]},
  "panels": []
}
```
`schemaVersion` must not exceed what the target Grafana writes; read it by exporting any existing dashboard (`curl -s -H "Authorization: Bearer $GRAFANA_TOKEN" $GRAFANA_URL/api/dashboards/uid/<any>` and reading `.dashboard.schemaVersion`).
2. Panels, in rows, each with `"datasource": {"type": "prometheus", "uid": "${datasource}"}`. Never hardcode a datasource name or uid; the dashboard then breaks in every other environment.

| Row | Panel | Type | Unit | Query |
|---|---|---|---|---|
| SLO | Availability SLI (3d window) | stat | `percentunit` | `1 - slo:error_ratio:rate3d{slo="checkout-availability"}` (3d is the longest recorded window; do not title it as the full SLO window) |
| SLO | Burn rate 1h | timeseries | none | `slo:error_ratio:rate1h{slo="checkout-availability"} / 0.001` with a threshold line at 14.4 |
| RED | Request rate | timeseries | `reqps` | `sum by (http_route) (rate(http_server_request_duration_seconds_count{job="$job"}[$__rate_interval]))` |
| RED | Error ratio | timeseries | `percentunit` | error ratio query from `red_metric_spec` with `[$__rate_interval]` |
| RED | Latency p50 / p90 / p99 | timeseries | `s` | `histogram_quantile(0.99, sum by (le) (rate(http_server_request_duration_seconds_bucket{job="$job"}[$__rate_interval])))` and the same for 0.5, 0.9 |
| USE | One panel per `present` cell | timeseries | `percentunit` for ratios | from `use_queries` |

3. Use `[$__rate_interval]` in every `rate()` on the dashboard; Grafana sets it to at least four times the scrape interval configured on the datasource. Set the datasource "Scrape interval" setting to the real scrape interval, or `$__rate_interval` is computed from the wrong base.
4. The 0.001 in the burn-rate panel is `1 - slo_target`; take it from `slo_spec`.
5. Validate JSON: `jq empty dashboards/checkout-api.json && echo JSON_OK`.

### Output
Dashboard JSON file.

### Quality Gate
- `jq empty` prints `JSON_OK`.
- `jq '[.panels[] | .datasource.uid] | unique' dashboards/checkout-api.json` prints only `["${datasource}"]`.

---

## Phase 2: Provision

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Pick one method:

| Grafana managed by | Method |
|---|---|
| Config files (Docker, Helm values, VM) | File provisioning |
| Shared instance without file access | HTTP API |

2. File provisioning: add `provisioning/dashboards/services.yaml`:
```yaml
apiVersion: 1
providers:
  - name: services
    folder: Services
    type: file
    allowUiUpdates: false
    options:
      path: /var/lib/grafana/dashboards/services
```
and mount `dashboards/` at that path. With `allowUiUpdates: false`, edits in the UI cannot be saved, which keeps the repo as the source of truth.
3. HTTP API:
```
jq '{dashboard: ., folderUid: "services", overwrite: true, message: "provisioned from repo"}' dashboards/checkout-api.json \
 | curl -s -X POST -H "Authorization: Bearer $GRAFANA_TOKEN" -H "Content-Type: application/json" \
     --data-binary @- "$GRAFANA_URL/api/dashboards/db"
```
The response contains `"status": "success"`, the `uid` and `url`. `overwrite: true` replaces the dashboard with the same `uid`; confirm with the user before overwriting a dashboard you did not create.

### Output
Provisioned dashboard.

### Quality Gate
- `curl -s -H "Authorization: Bearer $GRAFANA_TOKEN" $GRAFANA_URL/api/dashboards/uid/checkout-api-svc | jq -r '.dashboard.title'` prints `checkout-api service`.

---

## Phase 3: Verify Every Panel Has Data

### Entry Criteria
- Dashboard provisioned.

### Actions
1. Extract every query, replace `$__rate_interval` with four times the scrape interval and `$job` with the job, and run it against Prometheus:
```
jq -r '.panels[].targets[]?.expr' dashboards/checkout-api.json \
 | sed -e 's/\$__rate_interval/1m/g' -e 's/\$job/checkout-api/g' \
 | while read -r q; do n=$(curl -s --data-urlencode "query=$q" $PROM/api/v1/query | jq '.data.result|length'); echo "$n  $q"; done
```
2. Any `0` is a broken panel. Fix the query (wrong label, wrong metric name) and rerun. Do not delete the panel to make the check pass.
3. Open the dashboard URL and confirm it renders without "No data" or datasource errors; record the URL in the output.

### Output
`dashboard_json`.

### Quality Gate
- Every query line in the step 1 output starts with a number of 1 or more.
- The dashboard URL is recorded.

---

## Worked Example

Illustrative only.

```
$ jq empty dashboards/checkout-api.json && echo JSON_OK
JSON_OK
$ jq '{dashboard: ., folderUid: "services", overwrite: true}' dashboards/checkout-api.json | curl -s -X POST \
    -H "Authorization: Bearer $GRAFANA_TOKEN" -H "Content-Type: application/json" --data-binary @- http://grafana:3000/api/dashboards/db
{"id":41,"slug":"checkout-api-service","status":"success","uid":"checkout-api-svc","url":"/d/checkout-api-svc/checkout-api-service","version":1}
$ (panel check)
1  1 - slo:error_ratio:rate3d{slo="checkout-availability"}
6  sum by (http_route) (rate(http_server_request_duration_seconds_count{job="checkout-api"}[1m]))
0  sum by (pod) (rate(container_cpu_cfs_throttled_periods_total{pod=~"checkout.*"}[1m])) / ...
```
The `0` row: cAdvisor drops the `pod` label in this cluster's relabeling; query fixed to use `container_label_io_kubernetes_pod_name` after reading the series labels, then rerun shows 3.

---

## Exit Criteria

DONE when the dashboard is provisioned with a fixed uid and templated datasource, and every panel query returns data.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Grafana health check fails or 401 | **Stop**: token or URL is wrong; ask for a valid service account token. |
| Phase 2 | API returns `412 Precondition Failed` (version mismatch or name exists) | **Adjust**: a dashboard with the same title or uid exists; confirm with the user before `overwrite: true`. |
| Phase 2 | File-provisioned dashboard not appearing | **Adjust**: check Grafana logs for the provisioning path and the mount. |
| Phase 3 | A panel query returns 0 | **Retry**: fix the query against real series labels and rerun the check. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
