# Rolling Update Strategy, Graceful Termination and PodDisruptionBudget

**One-line description:** Sets replicas, `maxSurge`/`maxUnavailable`, termination grace and a preStop delay from the app's measured drain time, adds a `policy/v1` PodDisruptionBudget that never blocks node drains, spreads pods across nodes and zones, and proves a rollout drops zero requests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `hardened_deployment` (string, required): Deployment path from `k8s-security-context-hardening`.
- `replica_count` (integer, required): Steady-state replicas chosen by the service owner (the HPA minimum when an HPA is used).
- `namespace` (string, required): Target namespace.
- `py_health_endpoints` (object, optional): Supplies `sigterm_exit_seconds` for Python.
- `node_health_endpoints` (object, optional): Supplies `sigterm_exit_seconds` for Node.js.
- `go_health_endpoints` (object, optional): Supplies `sigterm_exit_seconds` for Go.
- `jvm_health_endpoints` (object, optional): Supplies `sigterm_exit_seconds` and `shutdown_phase_timeout` for the JVM.

---

## Outputs

- `rollout_deployment` (string): Deployment path with `replicas`, `strategy`, `minReadySeconds`, `progressDeadlineSeconds`, `terminationGracePeriodSeconds`, `lifecycle.preStop`, `topologySpreadConstraints`.
- `pdb_manifest` (string): Path to `pdb.yaml`.

---

## Phase 1: Choose the Update Strategy

### Entry Criteria
- `replica_count` is at least 1.

### Actions
1. Strategy type:

| Condition | `strategy.type` |
|---|---|
| Old and new versions cannot run at the same time (incompatible schema change, singleton lock, exclusive volume) | `Recreate` (accepts downtime; record why) |
| Otherwise | `RollingUpdate` |

2. Surge and unavailability. Kubernetes defaults are `maxSurge: 25%` (rounded up) and `maxUnavailable: 25%` (rounded down). Read the ResourceQuota headroom: `kubectl describe resourcequota -n "$NS"` (Used versus Hard for `requests.cpu`, `requests.memory`, `pods`).

| Quota room for one extra pod | `replica_count` | Setting |
|---|---|---|
| Yes | any | `maxSurge: 1`, `maxUnavailable: 0` (capacity never drops; needs room for one extra pod) |
| No | 2 or more | `maxSurge: 0`, `maxUnavailable: 1` (capacity drops by one pod during the rollout) |
| No | 1 | Not possible without downtime; **Stop** and report: raise quota or accept `Recreate` |

3. `progressDeadlineSeconds`: Kubernetes default 600. It must be larger than the startup probe budget (`failureThreshold * periodSeconds` of the startupProbe) plus image pull time. Keep the default when that holds; otherwise raise it and record the arithmetic.
4. `minReadySeconds`: default 0. A value above 0 makes the controller wait that long after Ready before counting a pod available; set it only if the owner wants to catch crashes shortly after readiness, and record the owner's value.
5. Write `spec.replicas: <replica_count>`. If an HPA will manage this Deployment and the manifest is applied by GitOps, record that `spec.replicas` must be removed or ignored (see `k8s-hpa-autoscaling`).

### Output
Strategy block.

### Quality Gate
- The quota row is named with the `Used` and `Hard` numbers copied.
- `progressDeadlineSeconds` is larger than the startup probe budget, shown as arithmetic.

---

## Phase 2: Graceful Termination Timing

### Entry Criteria
- Exactly one `*_health_endpoints` input is present with `sigterm_exit_seconds`.

### Actions
1. When a pod is deleted, Kubernetes removes it from EndpointSlices and sends SIGTERM at about the same time; proxies and Ingress controllers keep sending traffic until they observe the endpoint change. A `preStop` delay keeps the old process serving during that window.
2. preStop form. Check support: `kubectl explain deployment.spec.template.spec.containers.lifecycle.preStop.sleep`.

| `explain` result | Form |
|---|---|
| Field documented | `lifecycle: { preStop: { sleep: { seconds: <S> } } }` (no binary needed; works on distroless) |
| `field "sleep" does not exist` | `lifecycle: { preStop: { exec: { command: ["sleep", "<S>"] } } }`, only if the image has `sleep`; distroless images do not |

3. `S` (preStop seconds) is the endpoint propagation delay of this cluster's data path. It is not a universal constant: Phase 3 measures it. Start with the value the platform team documents for their Ingress controller or service mesh, or record it as an open question and let Phase 3 decide.
4. `terminationGracePeriodSeconds` (default 30) covers preStop plus the app's drain: it must be greater than `S + sigterm_exit_seconds`, and greater than `S + shutdown_phase_timeout` for the JVM. Keep 30 when that holds; otherwise raise it and write the arithmetic.
5. Spread pods (avoid all replicas on one node or zone):
```yaml
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: ScheduleAnyway
    labelSelector: { matchLabels: { app.kubernetes.io/name: <app>, app.kubernetes.io/instance: <app> } }
  - maxSkew: 1
    topologyKey: kubernetes.io/hostname
    whenUnsatisfiable: ScheduleAnyway
    labelSelector: { matchLabels: { app.kubernetes.io/name: <app>, app.kubernetes.io/instance: <app> } }
```
   Check node labels exist first: `kubectl get nodes -L topology.kubernetes.io/zone`. If the zone column is empty, keep only the hostname constraint.

### Output
Termination and spread settings.

### Quality Gate
- `terminationGracePeriodSeconds > S + sigterm_exit_seconds` is written with numbers.

---

## Phase 3: PodDisruptionBudget and Zero-Error Rollout Test

### Entry Criteria
- Phases 1 and 2 written to the Deployment.

### Actions
1. Write `pdb.yaml`:
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: <app>, namespace: <namespace> }
spec:
  maxUnavailable: 1
  unhealthyPodEvictionPolicy: AlwaysAllow
  selector:
    matchLabels: { app.kubernetes.io/name: <app>, app.kubernetes.io/instance: <app> }
```
   - `maxUnavailable: 1` keeps working when an HPA changes the replica count. Never set `minAvailable` equal to the replica count, or `maxUnavailable: 0`: both make `ALLOWED DISRUPTIONS` 0 and block every node drain.
   - With `replica_count` 1 any PDB blocks drains of that node; skip the PDB and record that a drain causes downtime, or raise replicas.
   - `unhealthyPodEvictionPolicy: AlwaysAllow` lets a drain evict pods that are not Ready (for example crash looping) instead of being blocked by them. Check support with `kubectl explain pdb.spec.unhealthyPodEvictionPolicy`.
2. Apply to a test namespace and read `kubectl get pdb -n NS`. The `ALLOWED DISRUPTIONS` column must be at least 1 when all pods are Ready.
3. Zero-error rollout test. In one terminal, send continuous requests through the Ingress or Service and count failures:
```bash
ok=0; fail=0; end=$(( $(date +%s) + DURATION ))
while [ "$(date +%s)" -lt "$end" ]; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "$URL")
  case "$code" in 2*|3*|4*) ok=$((ok+1));; *) fail=$((fail+1));; esac
done; echo "ok=$ok fail=$fail"
```
   In another terminal: `kubectl rollout restart deployment/<app> -n NS && kubectl rollout status deployment/<app> -n NS`.
4. `fail` must be 0 (status 000 means a connection error; 502, 503, 504 come from the proxy). If `fail` is above 0, raise `S` and repeat; record each run's `S` and `fail` so the final `S` is a measured value.

### Output
`rollout_deployment`, `pdb_manifest`.

### Quality Gate
- `kubectl get pdb` shows `ALLOWED DISRUPTIONS` of at least 1.
- The rollout test prints `fail=0`, with the final `S` recorded.

---

## Worked Example

Illustrative only. `orders`, `replica_count=3`, quota has room, Python `sigterm_exit_seconds=1.84`, startupProbe budget 40 seconds.

Phase 1: `maxSurge: 1`, `maxUnavailable: 0`; `progressDeadlineSeconds` stays 600 (600 > 40 + pull time).

Phase 2: `preStop.sleep` field exists on this v1.31 cluster. Platform team gives no value, so test runs decide `S`. Grace: 30 > S + 1.84 for S up to 28.

Phase 3:
```
$ kubectl get pdb -n shop-test
NAME     MIN AVAILABLE   MAX UNAVAILABLE   ALLOWED DISRUPTIONS   AGE
orders   N/A             1                 1                     2m
```
Run with S=0: `ok=1712 fail=9`. Run with S=5: `ok=1730 fail=0`. Final `S=5`, measured.

---

## Exit Criteria

DONE when the strategy fits the quota, termination timing covers preStop plus measured drain, the PDB allows one disruption, and a restart under traffic shows zero failed requests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Rollout stuck with `exceeded quota` events | **Adjust**: switch to the `maxSurge: 0` row or raise quota through the namespace owner. |
| Phase 2 | `sleep` not found in preStop exec | **Adjust**: use `preStop.sleep` if supported, or add the delay inside the app's SIGTERM handler. |
| Phase 3 | `ALLOWED DISRUPTIONS` is 0 with all pods Ready | **Adjust**: PDB selector or numbers are wrong; compare selector with pod labels. |
| Phase 3 | Failures continue with large `S` | **Return**: to the stack health endpoint flow; the app likely closes connections before finishing in-flight requests. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
