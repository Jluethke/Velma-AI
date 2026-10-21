# Prometheus Scrape Configuration For A Service

**One-line description:** Adds the scrape job that brings a service's (or collector's) metrics into Prometheus, using a static or Kubernetes service-discovery job for plain Prometheus or a `ServiceMonitor` for the Prometheus Operator, sets `job` to the service name, checks the config with `promtool check config`, and confirms the target is `up` with the expected series.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_name` (string, required): Becomes the `job` label value.
- `service_metrics_url` (string, required): The endpoint to scrape, for example `http://checkout-api:8000/metrics` or the collector's `http://otel-collector:8889/metrics`.
- `prometheus_url` (string, required): Prometheus base URL.

---

## Outputs

- `scrape_config` (object): The method used, the config snippet or manifest, `promtool check config` output, and the target health line from the targets API.

---

## Phase 1: Choose The Method

### Entry Criteria
- `curl -sf "$service_metrics_url" | head -3` prints metric lines from the machine Prometheus runs on (or a pod in the same network).

### Actions
1. Detect how Prometheus is managed:
   - `kubectl get crd servicemonitors.monitoring.coreos.com` succeeds: Prometheus Operator.
   - Otherwise, find the config file: `curl -s $PROM/api/v1/status/flags | jq -r '.data["config.file"]'`.
2. Pick the FIRST matching row:

| Order | Situation | Method |
|---|---|---|
| 1 | Prometheus Operator present | `ServiceMonitor` |
| 2 | Plain Prometheus, service in Kubernetes | `kubernetes_sd_configs` job with role `endpoints` |
| 3 | Plain Prometheus, fixed hosts | `static_configs` job |

3. If metrics go through the collector's Prometheus exporter, scrape the collector, not each service, and keep the service identity: the exporter puts `service.name` into the `job` label (and `service.instance.id` into `instance`) per the OTel Prometheus compatibility spec, so set `honor_labels: true` on that job or the scraper overwrites them with the collector's own job and instance. Check this behavior against your collector version's prometheus exporter README.

### Output
Chosen method.

### Quality Gate
- The detection command output is pasted with the chosen row number.

---

## Phase 2: Write The Config

### Entry Criteria
- Method chosen.

### Actions
1. ServiceMonitor (the Service must have a named port, here `metrics`):
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: checkout-api
  namespace: shop
  labels:
    release: prometheus   # must match the Prometheus serviceMonitorSelector
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: checkout-api
  endpoints:
    - port: metrics
      path: /metrics
```
Read the required selector labels: `kubectl get prometheus -A -o jsonpath='{.items[*].spec.serviceMonitorSelector}'`. A ServiceMonitor whose labels do not match is silently ignored.
2. Static job (append under `scrape_configs:`; edit only this block):
```yaml
  - job_name: checkout-api
    metrics_path: /metrics
    static_configs:
      - targets: ["checkout-api:8000"]
```
Leave `scrape_interval` unset to inherit the global value unless the user requests otherwise; downstream rate windows depend on it, so record the effective interval.
3. Collector job: same shape with `targets: ["otel-collector:8889"]` and `honor_labels: true`.
4. Check: `promtool check config prometheus.yml` (plain) or `kubectl apply --dry-run=server -f servicemonitor.yaml` (operator).
5. Apply: plain Prometheus `curl -X POST $PROM/-/reload` (needs `--web.enable-lifecycle`) or SIGHUP; operator `kubectl apply -f servicemonitor.yaml`.

### Output
Applied scrape config.

### Quality Gate
- `promtool check config` prints `SUCCESS`, or the server dry-run prints `created (server dry run)` or `configured (server dry run)`.

---

## Phase 3: Confirm The Target

### Entry Criteria
- Config applied; one scrape interval has passed.

### Actions
1. `curl -s $PROM/api/v1/targets | jq -r '.data.activeTargets[] | select(.labels.job=="checkout-api") | "\(.health) \(.scrapeUrl) \(.lastError)"'`
2. Interpret:

| Output | Meaning | Action |
|---|---|---|
| `up ... ` with empty error | scraping | done |
| `down ... connection refused` | wrong port or service not listening on the pod IP | check the named port and container port |
| `down ... 404` | wrong `metrics_path` | fix the path |
| no line at all | job not loaded (selector mismatch or reload missing) | recheck Phase 2 step 1 labels or reload |

3. Confirm series: `curl -s --data-urlencode 'query=count({job="checkout-api"})' $PROM/api/v1/query | jq -r '.data.result[0].value[1]'` is greater than 0, and `up{job="checkout-api"}` is 1.

### Output
`scrape_config`.

### Quality Gate
- The target line shows `up` with an empty `lastError`.
- `up{job="checkout-api"}` returns 1.

---

## Worked Example

Illustrative only.

```
$ kubectl get prometheus -A -o jsonpath='{.items[*].spec.serviceMonitorSelector}'
{"matchLabels":{"release":"prometheus"}}
$ kubectl apply --dry-run=server -f deploy/monitoring/servicemonitor.yaml
servicemonitor.monitoring.coreos.com/checkout-api created (server dry run)
$ kubectl apply -f deploy/monitoring/servicemonitor.yaml
$ curl -s http://prometheus:9090/api/v1/targets | jq -r '.data.activeTargets[] | select(.labels.job=="checkout-api") | "\(.health) \(.scrapeUrl)"'
up http://10.42.1.17:8000/metrics
up http://10.42.2.9:8000/metrics
```
Note the operator sets `job` from the Service name by default; here the Service is named `checkout-api`, so `job="checkout-api"`.

---

## Exit Criteria

DONE when the config passes its check, each target is `up` with no error, and series exist under `job` equal to `service_name`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Metrics endpoint unreachable from Prometheus network | **Stop**: fix networking or the bind address first. |
| Phase 2 | `promtool check config` fails | **Retry**: fix the YAML at the reported line; rerun. |
| Phase 3 | No target line | **Adjust**: ServiceMonitor labels or namespace selector do not match; read the Prometheus resource spec. |
| Phase 3 | `job` label differs from `service_name` | **Adjust**: set `jobLabel` on the ServiceMonitor or rename the Service; record which. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
