# HorizontalPodAutoscaler with autoscaling/v2

**One-line description:** Writes an `autoscaling/v2` HorizontalPodAutoscaler on CPU utilization relative to requests, checks every precondition the HPA silently depends on (metrics-server, requests set, no conflicting `spec.replicas` under GitOps, no VPA on the same metric), and proves it scales by reading `kubectl describe hpa` under load.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `rollout_deployment` (string, required): Deployment path from `k8s-rolling-update-pdb`.
- `usage_report` (object, required): Output of `k8s-resource-usage-measure`.
- `min_replicas` (integer, required): Minimum replicas, chosen by the owner (at least 2 if a PDB with `maxUnavailable: 1` must allow drains without downtime).
- `max_replicas` (integer, required): Maximum replicas, chosen by the owner within the namespace quota.
- `target_cpu_utilization` (integer, required): Target average CPU utilization as a percent of the CPU request, chosen by the owner.

---

## Outputs

- `hpa_manifest` (string): Path to `hpa.yaml`, plus notes on `spec.replicas` handling for GitOps.

---

## Phase 1: Check Preconditions

### Entry Criteria
- `max_replicas` > `min_replicas` (otherwise no HPA is needed; this step is skipped by the chain condition).

### Actions
1. metrics-server: `kubectl get apiservice v1beta1.metrics.k8s.io` must show `AVAILABLE True`, and `kubectl top pod -n NS` must print values.
2. Requests: `yq '.spec.template.spec.containers[].resources.requests.cpu' deployment.yaml` must print a value for EVERY container, including sidecars. CPU utilization is computed against the sum of container requests; a missing request makes the HPA report `<unknown>` and never scale.
3. VPA conflict: `kubectl get vpa -n NS`. A VPA in `Auto` or `Recreate` mode on the same Deployment that controls CPU or memory conflicts with an HPA on CPU or memory. A recommender-only VPA (`updateMode: "Off"`) is fine.
4. Quota: `max_replicas * requests.cpu` and `max_replicas * requests.memory` must fit the ResourceQuota `Hard` minus other workloads' `Used`. Write the arithmetic.
5. Capacity sanity from the usage report: expected replicas at peak = `ceil(peak_cpu_total / (requests.cpu * target_cpu_utilization / 100))`, where `peak_cpu_total` = `usage_report.cpu_cores.max` times `usage_report.replicas_observed`. If this exceeds `max_replicas`, record it: at the measured peak the HPA would saturate.

### Output
Precondition results.

### Quality Gate
- `kubectl get apiservice v1beta1.metrics.k8s.io` output shows `True`.
- Every container has a CPU request.

---

## Phase 2: Write the HPA

### Entry Criteria
- Preconditions met.

### Actions
1. Write `hpa.yaml`:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: <app>, namespace: <namespace> }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: <app> }
  minReplicas: <min_replicas>
  maxReplicas: <max_replicas>
  metrics:
    - type: Resource
      resource:
        name: cpu
        target: { type: Utilization, averageUtilization: <target_cpu_utilization> }
```
2. Leave `spec.behavior` out unless the owner has a measured reason. Defaults to know when reading behavior: scale down uses a 300-second stabilization window; scale up has no stabilization window. The controller ignores changes within a tolerance (kube-controller-manager `--horizontal-pod-autoscaler-tolerance`, default 0.1).
3. Scaling formula the controller uses (Kubernetes docs): `desiredReplicas = ceil(currentReplicas * currentMetricValue / desiredMetricValue)`. Record it in notes so readers can predict behavior.
4. `spec.replicas` in the Deployment fights the HPA when a tool reapplies the manifest:

| Applied by | Action |
|---|---|
| `kubectl apply` by hand or CI | Remove `spec.replicas` from the Deployment manifest after the first creation; otherwise every apply resets the count |
| Helm | Wrap `replicas:` in `{{- if not .Values.autoscaling.enabled }}` |
| Kustomize | Remove `replicas` from the base when the HPA is in the same overlay |
| Argo CD | Remove `spec.replicas`, or add `ignoreDifferences` for `group: apps, kind: Deployment, jsonPointers: [/spec/replicas]` with sync option `RespectIgnoreDifferences=true` |
| Flux | Remove `spec.replicas` from the manifest |

5. Memory-based scaling: do not add a memory metric for runtimes whose memory does not fall after load drops (JVM heap, Node heap growth); the HPA would scale up and never scale down. Add it only with a measurement showing memory tracks load.

### Output
`hpa.yaml` and the replicas handling note.

### Quality Gate
- `kubectl apply --dry-run=server -f hpa.yaml` prints `(server dry run)`.
- The replicas handling row is named for the delivery method.

---

## Phase 3: Prove Scaling

### Entry Criteria
- HPA applied in a test namespace with the Deployment.

### Actions
1. `kubectl get hpa <app> -n NS`. The TARGETS column must show a number like `12%/70%`, not `<unknown>/70%`.
2. `kubectl describe hpa <app> -n NS` and read the Conditions:

| Condition | Healthy value | If not |
|---|---|---|
| `AbleToScale` | `True` | Check the scale target name and RBAC events |
| `ScalingActive` | `True` | `False` with `FailedGetResourceMetric` means metrics or requests are missing |
| `ScalingLimited` | `False` normally | `True` with `TooManyReplicas` means `maxReplicas` reached |

3. Generate load (the team's load test or `kubectl run load -n NS --rm -it --image=busybox --restart=Never -- /bin/sh -c "while true; do wget -q -O- http://<app>; done"`), watch `kubectl get hpa <app> -n NS -w`, and record the time from load start to the first replica increase. Stop the load and record scale down after the stabilization window.

### Output
`hpa_manifest`.

### Quality Gate
- TARGETS shows a numeric current value.
- Under load, the REPLICAS column increased above `min_replicas` (copy the watch lines).

---

## Worked Example

Illustrative only. `orders`, requests `212m`, `min_replicas=3`, `max_replicas=10`, `target_cpu_utilization=70` (owner choice), Argo CD delivery.

Phase 1: metrics API `True`; quota 10 * 212m = 2.12 CPU, fits 4 CPU hard minus 1.1 used. Peak: 0.48 * 3 = 1.44 cores; `ceil(1.44 / (0.212 * 0.70)) = 10`, at the max, recorded as a saturation risk.

Phase 2: `spec.replicas` removed from the base Deployment; Argo CD row noted.

Phase 3:
```
$ kubectl get hpa orders -n shop-test -w
NAME     REFERENCE           TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
orders   Deployment/orders   14%/70%   3         10        3          4m
orders   Deployment/orders   161%/70%  3         10        3          5m
orders   Deployment/orders   161%/70%  3         10        7          5m
```

---

## Exit Criteria

DONE when the HPA reads a numeric metric, scales up under load, its replica field is not overwritten by the delivery tool, and quota covers `max_replicas`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | metrics-server missing | **Stop**: the HPA cannot work on resource metrics without it. |
| Phase 1 | Quota cannot fit `max_replicas` | **Return**: ask the owner to lower `max_replicas` or raise quota. |
| Phase 3 | TARGETS `<unknown>` | **Adjust**: a container lacks a CPU request or metrics lag after creation; check again after one metrics resolution interval. |
| Phase 3 | Replica count flips back after each sync | **Adjust**: apply the Phase 2 replicas row for the delivery tool. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
