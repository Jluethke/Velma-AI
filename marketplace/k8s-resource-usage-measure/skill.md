# Measure Container CPU and Memory Usage

**One-line description:** Measures a container's real CPU and memory usage over a stated window with Prometheus cAdvisor metrics (or a `kubectl top` sampling loop when Prometheus is absent) and a VPA recommender in `Off` mode, and reports percentiles, peaks, CPU throttling and OOM kills so requests and limits are set from data.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cluster_context` (string, required): kubeconfig context name (`kubectl config get-contexts`).
- `namespace` (string, required): Namespace where the workload runs under representative load.
- `app_name` (string, required): Deployment and container name.
- `measurement_window` (string, required): Window length in Prometheus duration syntax, for example `7d`. Chosen by the user so it covers the traffic cycle (weekday peaks, batch hours); this flow does not pick it.
- `load_test_command` (string, optional): Command that drives representative load in a non-production namespace when no production traffic exists yet.
- `probed_deployment` (string, required): Deployment path from `k8s-probe-tuning`; used to read current requests and limits.

---

## Outputs

- `usage_report` (object): `source` (`prometheus`, `kubectl-top`), `window`, `cpu_cores` {p50, p90, p95, p99, max}, `memory_working_set_bytes` {p50, p95, max}, `throttle_ratio` {p95, max}, `oom_kills`, `restarts`, `replicas_observed`, `vpa_recommendation` (target, lowerBound, upperBound, or `not-available`), `queries` (exact text run).

---

## Phase 1: Pick the Data Source

### Entry Criteria
- `kubectl --context "$CTX" get deploy "$APP" -n "$NS"` prints the Deployment with READY replicas above 0. If no instance runs anywhere, deploy to a non-production namespace and run `load_test_command` for the whole window; without that input, **Stop**.

### Actions
1. Check for Prometheus with cAdvisor metrics: `kubectl --context "$CTX" get pods -A -l app.kubernetes.io/name=prometheus` and confirm the query `container_cpu_usage_seconds_total{namespace="NS"}` returns series (Prometheus UI or `curl -s "$PROM/api/v1/query" --data-urlencode 'query=count(container_cpu_usage_seconds_total{namespace="NS"})'`).
2. Check metrics-server: `kubectl --context "$CTX" top pod -n "$NS" --containers`. An error `Metrics API not available` means it is not installed.
3. Check for VPA: `kubectl --context "$CTX" get crd verticalpodautoscalers.autoscaling.k8s.io`.
4. Choose:

| Prometheus cAdvisor series | metrics-server | `source` |
|---|---|---|
| Present | Any | `prometheus` |
| Absent | Present | `kubectl-top` (sampling loop; percentiles are only as good as the sample count) |
| Absent | Absent | **Stop**: no measurement possible; ask the platform team to install metrics-server |

5. Read the Prometheus scrape interval for the kubelet/cAdvisor job (Prometheus UI Status, Targets, or the `ServiceMonitor` `interval`). Set `R` (the rate range) to at least four scrape intervals, matching how Grafana defines `$__rate_interval`.

### Output
`source`, scrape interval, `R`.

### Quality Gate
- The command output that proves the chosen source is recorded.
- `R` is written as a multiple of the recorded scrape interval.

---

## Phase 2: Run the Queries

### Entry Criteria
- `source` decided. The window `W` = `measurement_window`.

### Actions
1. Always filter `container="<app_name>"`. Do NOT use series with `container=""` or `container="POD"`: those are pod-level cgroup aggregates and the pause container, and they double count.
2. Prometheus queries (replace NS, APP, R, W):
   - CPU percentiles: `quantile_over_time(0.95, rate(container_cpu_usage_seconds_total{namespace="NS",container="APP"}[R])[W:R])`, repeated for 0.5, 0.9, 0.99, and `max_over_time(...)` for max. This is per pod series; take `max by ()` across pods for the report, so the worst pod drives sizing.
   - Memory: `max_over_time(container_memory_working_set_bytes{namespace="NS",container="APP"}[W])` and `quantile_over_time(0.95, container_memory_working_set_bytes{namespace="NS",container="APP"}[W])`. Working set is the value the kubelet uses for memory pressure eviction decisions; report it, not `container_memory_usage_bytes` (which includes reclaimable page cache).
   - Throttling: `rate(container_cpu_cfs_throttled_periods_total{namespace="NS",container="APP"}[R]) / rate(container_cpu_cfs_periods_total{namespace="NS",container="APP"}[R])`, as p95 and max over W with a subquery. Non-zero only when a CPU limit is set.
   - OOM kills: `sum(increase(kube_pod_container_status_restarts_total{namespace="NS",container="APP"}[W]))` and `kube_pod_container_status_last_terminated_reason{namespace="NS",container="APP",reason="OOMKilled"}` (both from kube-state-metrics).
   - Replicas: `max_over_time(kube_deployment_status_replicas{namespace="NS",deployment="APP"}[W])`.
3. kubectl-top loop (fallback), sampling interval S chosen by the user and recorded:
```bash
end=$(( $(date +%s) + WINDOW_SECONDS ))
while [ "$(date +%s)" -lt "$end" ]; do
  kubectl --context "$CTX" top pod -n "$NS" -l app.kubernetes.io/name="$APP" --containers --no-headers \
    | awk -v t="$(date +%s)" '$2=="'"$APP"'" {print t","$1","$3","$4}' >> usage.csv
  sleep "$S"
done
```
   CPU is printed in millicores (`250m`) and memory in `Mi`. metrics-server values are short-window averages, so short spikes are missed; record that limitation in the report.
4. Save every query text into `queries` exactly as run.

### Output
Raw numbers per query.

### Quality Gate
- Every number in the report has its query text stored next to it.
- No query text in `queries` lacks the `container="APP"` filter.

---

## Phase 3: Add the VPA Recommendation and Write the Report

### Entry Criteria
- Phase 2 numbers collected.

### Actions
1. If the VPA CRD exists, create a recommender-only VPA (it never evicts pods in this mode):
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata: { name: <app_name>-measure, namespace: <namespace> }
spec:
  targetRef: { apiVersion: apps/v1, kind: Deployment, name: <app_name> }
  updatePolicy: { updateMode: "Off" }
```
2. After it has observed traffic, run `kubectl describe vpa <app_name>-measure -n NS` and copy `Target`, `Lower Bound`, `Upper Bound` for the container. Do NOT use VPA in `Auto` mode together with an HPA on the same CPU or memory metric.
3. Convert units: CPU cores as decimals (`0.25`), memory as bytes and as `Mi` (bytes / 1048576).
4. Write `usage_report`. Add a `caveats` list: window shorter than a full traffic cycle, kubectl-top sampling, or a CPU limit that throttled (throttled usage under-reports true demand).

### Output
`usage_report`.

### Quality Gate
- `usage_report.cpu_cores.max` is at least `usage_report.cpu_cores.p99`, and memory max is at least memory p95 (internal consistency).
- `vpa_recommendation` holds copied values or `not-available` with the reason.

---

## Worked Example

Illustrative only. `orders` in `shop`, `measurement_window=7d`, scrape interval 30s, so `R=2m`.

Phase 2 representative results:
```
quantile_over_time(0.95, rate(container_cpu_usage_seconds_total{namespace="shop",container="orders"}[2m])[7d:2m])
  -> 0.212
max_over_time(container_memory_working_set_bytes{namespace="shop",container="orders"}[7d])
  -> 402653184   (384 Mi)
throttle ratio p95 -> 0.31  (current CPU limit 250m)
OOMKilled last reason -> none; restarts over 7d -> 0
```

Phase 3:
```
$ kubectl describe vpa orders-measure -n shop
    Container Name:  orders
    Lower Bound:     Cpu: 143m  Memory: 301Mi
    Target:          Cpu: 250m  Memory: 410Mi
    Upper Bound:     Cpu: 712m  Memory: 905Mi
```
Caveat recorded: throttle ratio 0.31 means CPU p95 is under-reported while the 250m limit is in place.

---

## Exit Criteria

DONE when `usage_report` holds CPU and memory percentiles, throttling, OOM and restart counts with their query texts, and a VPA recommendation or the reason it is missing.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No running instance and no `load_test_command` | **Stop**: measurement needs real or representative load. |
| Phase 2 | Query returns no data | **Adjust**: check label names with `count by (container, pod) (container_cpu_usage_seconds_total{namespace="NS"})`; some setups use `container_name`. |
| Phase 2 | Window longer than Prometheus retention | **Adjust**: shorten W to the retention and record it as a caveat. |
| Phase 3 | VPA shows no recommendation | **Retry**: wait until the recommender has history; record `not-available` if the window ends first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
