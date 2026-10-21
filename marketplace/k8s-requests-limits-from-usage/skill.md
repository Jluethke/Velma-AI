# Set Requests and Limits from Measured Usage

**One-line description:** Converts a measured usage report into CPU and memory requests and limits with a QoS-class decision table, checks them against LimitRange, ResourceQuota and node allocatable, writes them with correct units, and verifies the pod's resulting QoS class.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `probed_deployment` (string, required): Deployment path from `k8s-probe-tuning`.
- `usage_report` (object, required): Output of `k8s-resource-usage-measure`.
- `request_percentile` (string, required): Which measured percentile sets requests: `p50`, `p90`, `p95` or `p99`. Chosen by the service owner; this flow does not pick it.
- `qos_target` (string, required): `guaranteed` or `burstable`.
- `memory_headroom` (number, required): Multiplier of at least 1.0 applied to observed peak memory for the memory limit, chosen by the service owner and recorded with their name.
- `namespace` (string, required): Target namespace.

---

## Outputs

- `resourced_deployment` (string): Deployment path with `resources.requests` and `resources.limits` written and a comment citing each number's source.

---

## Phase 1: Read Namespace and Node Constraints

### Entry Criteria
- `usage_report.cpu_cores` and `usage_report.memory_working_set_bytes` are present.

### Actions
1. `kubectl get limitrange -n "$NS" -o yaml`. Record `default`, `defaultRequest`, `min`, `max` and `maxLimitRequestRatio` for type `Container`. A value outside `min`/`max` is rejected at admission.
2. `kubectl describe resourcequota -n "$NS"`. If the quota lists `limits.cpu` or `limits.memory`, every container MUST set that limit or the pod is rejected (`must specify limits.cpu`).
3. Node capacity: `kubectl get nodes -o custom-columns=NAME:.metadata.name,CPU:.status.allocatable.cpu,MEM:.status.allocatable.memory`. The largest node's allocatable bounds any single pod's requests.
4. Note the measurement caveats from `usage_report.caveats`. If `throttle_ratio.p95` is above 0, measured CPU is capped by the existing limit; record that CPU numbers are a floor.

### Output
Constraint list.

### Quality Gate
- Each command's output (or "No resources found") is recorded.

---

## Phase 2: Compute the Numbers

### Entry Criteria
- Constraints recorded.

### Actions
1. Apply this table. `P` = the `request_percentile` value from `usage_report`; `MAX` = the observed max; `H` = `memory_headroom`.

| Field | `guaranteed` | `burstable` |
|---|---|---|
| `requests.cpu` | `cpu_cores.P` | `cpu_cores.P` |
| `limits.cpu` | equal to `requests.cpu` (required for Guaranteed) | omit, unless the ResourceQuota requires `limits.cpu`; then use `cpu_cores.max` |
| `requests.memory` | `memory.max * H` | `memory.P` |
| `limits.memory` | equal to `requests.memory` (required for Guaranteed) | `memory.max * H` |

2. Reasons behind the table, to write in the comment block:
   - CPU is compressible: above its limit a container is throttled (CFS quota), not killed. Without a CPU limit, a container can use idle CPU on the node.
   - Memory is not compressible: above its limit the container is OOMKilled (exit code 137). Under node memory pressure the kubelet evicts pods whose usage exceeds their requests first.
   - Guaranteed QoS requires every container in the pod to have CPU and memory requests equal to limits.
3. Round CPU up to whole millicores (`0.2117` cores becomes `212m`). Round memory up to whole `Mi` (bytes / 1048576, ceiling).
4. Units rule: memory uses `Mi` or `Gi` (binary) or `M`/`G` (decimal). NEVER write a lowercase `m` on memory: `512m` means 0.512 bytes. CPU uses `m` (millicores) or a decimal core count.
5. Check each number against LimitRange `min`/`max`, `maxLimitRequestRatio` (limit divided by request), and the largest node's allocatable. A request larger than every node's allocatable leaves the pod Pending with `Insufficient cpu` or `Insufficient memory`.
6. Sidecars: repeat for every container in the pod. Guaranteed applies to the pod only when all containers qualify.

### Output
Computed requests and limits per container.

### Quality Gate
- For `guaranteed`, requests equal limits for both resources in every container.
- No memory quantity matches the regex `^[0-9.]+m$`.
- Every number fits inside the LimitRange bounds and below the largest node allocatable.

---

## Phase 3: Write and Verify

### Entry Criteria
- Numbers pass the Phase 2 gate.

### Actions
1. Write `resources:` under the container in the Deployment. Add a comment above it: `# from usage_report window=<W>, source=<source>, percentile=<P>, headroom=<H> chosen by <owner>`.
2. `kubectl apply --dry-run=server -f deployment.yaml -n "$NS"`.
3. After the next rollout (by `k8s-rollout-status-watch` or in a test namespace), read the QoS class: `kubectl get pod -n "$NS" -l app.kubernetes.io/name=<app> -o jsonpath='{range .items[*]}{.metadata.name}{" "}{.status.qosClass}{"\n"}{end}'`. It must print `Guaranteed` or `Burstable` matching `qos_target`.
4. After the window of real traffic with the new values, rerun `k8s-resource-usage-measure`. If `oom_kills` is above 0, return to Phase 2 with the new peak.

### Output
`resourced_deployment`.

### Quality Gate
- The dry run prints `(server dry run)`.
- The qosClass printed by step 3 equals the target (capitalized form).

---

## Worked Example

Illustrative only. `usage_report`: CPU p95 0.212 cores, max 0.48; memory p95 371 Mi, max 384 Mi; `request_percentile=p95`, `qos_target=burstable`, `memory_headroom=1.25` chosen by the orders team lead. No ResourceQuota on limits; LimitRange max 2 CPU, 2Gi.

Phase 2:
- `requests.cpu`: 0.212 rounds to `212m`. `limits.cpu`: omitted.
- `requests.memory`: ceil(371) = `371Mi`. `limits.memory`: 384 * 1.25 = 480 = `480Mi`.

Phase 3:
```yaml
# from usage_report window=7d, source=prometheus, percentile=p95, headroom=1.25 chosen by orders lead
resources:
  requests: { cpu: 212m, memory: 371Mi }
  limits:   { memory: 480Mi }
```
```
$ kubectl get pod -n shop -l app.kubernetes.io/name=orders -o jsonpath='...'
orders-5c7f9d8b6-2kq7l Burstable
orders-5c7f9d8b6-9vbnm Burstable
```

---

## Exit Criteria

DONE when every container has requests (and limits per the table) traceable to the usage report, units are correct, admission accepts them, and the running pods show the target QoS class.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | ResourceQuota exhausted (`exceeded quota`) | **Stop**: report the quota numbers; raising quota is a namespace owner decision. |
| Phase 2 | Request exceeds largest node allocatable | **Stop**: the app needs fewer resources per replica or larger nodes; report both options. |
| Phase 2 | `maxLimitRequestRatio` violated | **Adjust**: raise the request toward the limit until the ratio fits. |
| Phase 3 | Pods OOMKilled after rollout | **Return**: to Phase 2 with the new observed peak; never remove the memory limit to hide it. |
| Phase 3 | QoS class differs from target | **Adjust**: a container (often a sidecar) lacks equal requests and limits; fix it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
