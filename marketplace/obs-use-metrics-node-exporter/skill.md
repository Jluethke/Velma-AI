# USE Metrics For Hosts, Containers And Pools

**One-line description:** Builds the USE (Utilization, Saturation, Errors) query table for CPU, memory, disk, network and filesystem from node_exporter, for containers from cAdvisor and kube-state-metrics, and for application pools from their client metrics, then runs every query against Prometheus and marks each cell as present, missing or not applicable.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `signal_plan` (object, required): Output of `obs-signal-inventory`; uses `USE` and `RED+USE` components.
- `prometheus_url` (string, required): Base URL of Prometheus, for example `http://prometheus:9090`.

---

## Outputs

- `use_queries` (object): A table resource x {utilization, saturation, errors} where each cell holds a PromQL expression, its result count, and status `present`, `missing` (with the exporter or flag needed) or `n/a` (with reason).

---

## Phase 1: Confirm Exporters

### Entry Criteria
- `prometheus_url` answers: `curl -s $PROM/-/ready` prints a ready message.

### Actions
1. List scrape jobs and their health:
`curl -s $PROM/api/v1/targets | jq -r '.data.activeTargets[] | "\(.labels.job) \(.health)"' | sort | uniq -c`
2. Check which exporters exist by probing one metric each:

| Exporter | Probe query |
|---|---|
| node_exporter | `node_cpu_seconds_total` |
| cAdvisor (kubelet) | `container_cpu_usage_seconds_total` |
| kube-state-metrics | `kube_pod_container_resource_limits` |

`curl -s --data-urlencode 'query=count(<probe>)' $PROM/api/v1/query | jq -r '.data.result[0].value[1] // "0"'`
3. If node_exporter is missing on hosts that run the service, record it as `missing` for all host rows; do not write queries against metrics that do not exist.

### Output
Exporter presence list.

### Quality Gate
- The targets command output and each probe result are pasted.

---

## Phase 2: Host And Container Queries

### Entry Criteria
- Exporter presence known.

### Actions
1. Fill this table (sources: node_exporter metric names; method from Brendan Gregg's USE Method checklist for Linux). Replace `[5m]` with at least four scrape intervals.

| Resource | Utilization | Saturation | Errors |
|---|---|---|---|
| CPU | `1 - avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m]))` | `rate(node_pressure_cpu_waiting_seconds_total[5m])` (PSI, Linux 4.20+, pressure collector) or `node_load1 / on(instance) count by (instance) (node_cpu_seconds_total{mode="idle"})` | n/a on most hardware (record) |
| Memory | `1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes` | `rate(node_pressure_memory_waiting_seconds_total[5m])` or `rate(node_vmstat_pgmajfault[5m])` | `node_edac_uncorrectable_errors_total` (edac collector, only on ECC hosts) |
| Disk | `rate(node_disk_io_time_seconds_total[5m])` | `rate(node_disk_io_time_weighted_seconds_total[5m])` | not in node_exporter; record `missing (smartctl_exporter)` |
| Network | `rate(node_network_receive_bytes_total[5m]) / node_network_speed_bytes` (speed is often 0 on virtual NICs: then n/a) | `rate(node_network_receive_drop_total[5m]) + rate(node_network_transmit_drop_total[5m])` | `rate(node_network_receive_errs_total[5m]) + rate(node_network_transmit_errs_total[5m])` |
| Filesystem | `1 - node_filesystem_avail_bytes{fstype!="tmpfs",fstype!="overlay"} / node_filesystem_size_bytes{fstype!="tmpfs",fstype!="overlay"}` | n/a | `node_filesystem_device_error` |

2. Containers (Kubernetes):

| Resource | Utilization | Saturation | Errors |
|---|---|---|---|
| CPU | `sum by (pod) (rate(container_cpu_usage_seconds_total{container!=""}[5m])) / sum by (pod) (kube_pod_container_resource_limits{resource="cpu"})` | `sum by (pod) (rate(container_cpu_cfs_throttled_periods_total[5m])) / sum by (pod) (rate(container_cpu_cfs_periods_total[5m]))` | n/a |
| Memory | `sum by (pod) (container_memory_working_set_bytes{container!=""}) / sum by (pod) (kube_pod_container_resource_limits{resource="memory"})` | n/a | `kube_pod_container_status_last_terminated_reason{reason="OOMKilled"}` |

3. Pods without limits make the divisions empty; record `n/a (no limit set)` rather than dividing by requests silently.
4. Check node_exporter collectors before claiming a metric is absent: `node_exporter --help | rg collector.pressure` (or read the exporter's `/metrics` for `node_scrape_collector_success`).

### Output
Host and container rows.

### Quality Gate
- Every cell is a query, `missing (<exporter or flag>)`, or `n/a (<reason>)`. No empty cells.

---

## Phase 3: Pools And Execution

### Entry Criteria
- Host and container rows filled.

### Actions
1. For each `USE` component in `signal_plan` (connection, thread, worker pools), find its metrics. Common sources:

| Library | Utilization | Saturation | Errors |
|---|---|---|---|
| HikariCP via Micrometer | `hikaricp_connections_active / hikaricp_connections_max` | `hikaricp_connections_pending` | `rate(hikaricp_connections_timeout_total[5m])` |
| OTel semconv DB client pool | `db_client_connection_count{state="used"} / db_client_connection_max` | `db_client_connection_pending_requests` | `rate(db_client_connection_timeouts_total[5m])` |
| Go `database/sql` with an exporter | depends on exporter; scrape and record names | | |

Confirm names with `curl -s <metrics endpoint> | rg -i "pool|connection" | cut -d'{' -f1 | sort -u`. Older OTel semconv used `db.client.connections.*` names; use what the scrape prints.
2. If a pool exposes no metrics, record `missing` and the instrumentation needed.
3. Run every query: `curl -s --data-urlencode "query=$Q" $PROM/api/v1/query | jq '.status, (.data.result|length)'`.
4. Mark each cell `present` (status success, length at least 1) or `missing`.

### Output
`use_queries`.

### Quality Gate
- Each `present` cell has a pasted result length of at least 1.
- Each `missing` cell names the exporter, collector flag or instrumentation that would supply it.

---

## Worked Example

Illustrative only.

```
$ curl -s --data-urlencode 'query=count(node_cpu_seconds_total)' http://prometheus:9090/api/v1/query | jq -r '.data.result[0].value[1]'
64
$ curl -s --data-urlencode 'query=rate(node_pressure_cpu_waiting_seconds_total[1m])' http://prometheus:9090/api/v1/query | jq '.data.result|length'
4
$ curl -s --data-urlencode 'query=hikaricp_connections_pending' http://prometheus:9090/api/v1/query | jq '.data.result|length'
0
```
Result: CPU saturation `present`; pool saturation `missing (Micrometer HikariCP binder not enabled)`.

---

## Exit Criteria

DONE when every resource row has all three cells filled with a verified query, a named missing source, or a reason for n/a.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Prometheus not ready | **Stop**: no queries can be verified. |
| Phase 2 | PSI metrics absent | **Adjust**: use the load-average or major-fault alternative and record kernel version. |
| Phase 2 | `node_network_speed_bytes` is 0 | **Adjust**: mark network utilization `n/a (virtual NIC reports no speed)`. |
| Phase 3 | Pool metric names differ from the table | **Adjust**: use the scraped names. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
