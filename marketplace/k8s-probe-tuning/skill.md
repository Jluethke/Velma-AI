# Readiness, Liveness and Startup Probe Tuning

**One-line description:** Writes the three probes into the Deployment from the stack's health endpoints and a measured startup time, using Kubernetes default probe values unless a measurement says otherwise, and blocks the classic mistakes (liveness checking dependencies, liveness equal to readiness, initialDelaySeconds used instead of a startupProbe).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `wired_deployment` (string, required): Deployment path from `k8s-configmap-secret-wiring`.
- `image_ref` (string, required): Image to measure startup with.
- `py_health_endpoints` (object, optional): From `k8s-py-health-endpoints` when `stack` is python.
- `node_health_endpoints` (object, optional): From `k8s-node-health-endpoints` when `stack` is node.
- `go_health_endpoints` (object, optional): From `k8s-go-health-endpoints` when `stack` is go.
- `jvm_health_endpoints` (object, optional): From `k8s-jvm-health-endpoints` when `stack` is java.

---

## Outputs

- `probed_deployment` (string): Deployment path with `startupProbe`, `readinessProbe`, `livenessProbe` set, plus a comment block citing the measured startup time.

---

## Phase 1: Select Endpoints and Measure Startup

### Entry Criteria
- Exactly one of the four `*_health_endpoints` inputs is present. If none or more than one, **Stop**.

### Actions
1. Read from the present input: liveness path, readiness path, port name, probe kind (`http` or `grpc`), and `host_header` (Python/Django only).
2. Measure time from container start to the first 200 on the readiness path, repeated N times. N is chosen by the user and recorded (more runs show more of the spread; one run is never enough to call a maximum):
```bash
for i in $(seq 1 "$N"); do
  docker rm -f st >/dev/null 2>&1
  start=$(date +%s.%N)
  docker run -d --name st -p 18080:<container_port> <image_ref> >/dev/null
  until [ "$(curl -s -o /dev/null -w '%{http_code}' localhost:18080<readiness_path>)" = "200" ]; do sleep 0.2; done
  echo "$(date +%s.%N) - $start" | bc
done; docker rm -f st
```
   Pass the same environment the pod gets (`--env-file`) so dependency checks can pass. If readiness needs a dependency that is unreachable locally, time the liveness path instead and record that substitution.
3. If a CPU request is already known (LimitRange default: `kubectl get limitrange -n NS -o yaml`), add `--cpus=<request in cores>` to `docker run`. CPU-starved JVM and Python apps start much slower than on a laptop.
4. Record `startup_max_seconds` = the largest of the N values.

### Output
Endpoint set and `startup_max_seconds`.

### Quality Gate
- N and all N measured values are recorded, and `startup_max_seconds` equals the largest.
- The path measured (readiness or liveness substitute) is named.

---

## Phase 2: Write the Probes

### Entry Criteria
- Phase 1 complete.

### Actions
1. Start from the Kubernetes defaults and change a field only with a reason written next to it: `initialDelaySeconds: 0`, `periodSeconds: 10`, `timeoutSeconds: 1`, `successThreshold: 1`, `failureThreshold: 3`. `successThreshold` must be 1 for liveness and startup probes (the API rejects other values).
2. Probe purposes, which decide the endpoint:

| Probe | Endpoint | Effect on failure |
|---|---|---|
| `startupProbe` | liveness path | Container restarted if it never passes; liveness and readiness are disabled until it succeeds |
| `readinessProbe` | readiness path | Pod removed from Service EndpointSlices; no restart |
| `livenessProbe` | liveness path | Container killed and restarted |

3. Startup probe budget: `failureThreshold * periodSeconds` must be at least `startup_max_seconds`. Compute `failureThreshold = ceil(startup_max_seconds / periodSeconds)` with `periodSeconds: 10`. Extra margin above the measured maximum is an open question for the user; write the chosen margin and who chose it in the comment block.
4. Do NOT use `initialDelaySeconds` on the liveness probe to cover slow startup. The startupProbe does that without delaying detection of a later hang.
5. Liveness and readiness must use DIFFERENT paths when the readiness path checks dependencies. If they are identical, a dependency outage restarts every pod.
6. Write the probe block per probe kind:
```yaml
startupProbe:
  httpGet: { path: <liveness_path>, port: <port_name> }
  periodSeconds: 10
  failureThreshold: <computed>
readinessProbe:
  httpGet: { path: <readiness_path>, port: <port_name> }
  periodSeconds: 10
  timeoutSeconds: 1
  failureThreshold: 3
livenessProbe:
  httpGet: { path: <liveness_path>, port: <port_name> }
  periodSeconds: 10
  timeoutSeconds: 1
  failureThreshold: 3
```
   - gRPC: replace `httpGet` with `grpc: { port: <number> }` (the `grpc` probe takes a port number, not a name; `service:` is optional). Built-in gRPC probes are GA since Kubernetes 1.27; check `kubectl version` and `kubectl explain pod.spec.containers.livenessProbe.grpc`.
   - Django: add `httpHeaders: [{ name: Host, value: <host_header> }]` to each `httpGet`.
   - Do NOT use `exec` probes that run `curl` or `wget`: distroless images do not have them, and each probe forks a process.
7. Write the comment block above `startupProbe`: `# startup measured: <values>, max <startup_max_seconds>s, method <docker run ...>`.

### Output
Probe blocks in the Deployment.

### Quality Gate
- `yq '.spec.template.spec.containers[0].startupProbe.failureThreshold * .spec.template.spec.containers[0].startupProbe.periodSeconds' deployment.yaml` is at least `startup_max_seconds`.
- `yq '.spec.template.spec.containers[0].livenessProbe.initialDelaySeconds // 0' deployment.yaml` prints 0.
- `kubectl apply --dry-run=server -f deployment.yaml` prints `(server dry run)`.

---

## Phase 3: Confirm in a Test Namespace

### Entry Criteria
- A non-production namespace is available; otherwise record that `k8s-rollout-status-watch` performs this check.

### Actions
1. `kubectl apply -n <test-ns> -f deployment.yaml` (with its ConfigMap and Secret).
2. `kubectl get pods -n <test-ns> -l app.kubernetes.io/name=<app> -w` until READY shows `1/1`, then stop the watch.
3. Measure in-cluster startup: `kubectl get pod <pod> -n <test-ns> -o jsonpath='{.status.containerStatuses[0].state.running.startedAt}{" "}{.status.conditions[?(@.type=="Ready")].lastTransitionTime}{"\n"}'`. The difference is the real startup time. If it exceeds the startup budget, recompute `failureThreshold` from this value.
4. `kubectl get events -n <test-ns> --field-selector involvedObject.name=<pod> | grep -E "Unhealthy|Killing"` must print nothing after the pod is Ready.

### Output
`probed_deployment`.

### Quality Gate
- RESTARTS column for the pod is 0.
- The events grep printed nothing.

---

## Worked Example

Illustrative only. Spring Boot app, `jvm_health_endpoints`: `/livez`, `/readyz` on port name `http`.

Phase 1 with `--cpus=0.5` and N=5 chosen by the user: 24.1, 22.8, 25.3, 23.9, 24.6 seconds; `startup_max_seconds=25.3`.

Phase 2: `failureThreshold = ceil(25.3 / 10) = 3`; user chose one extra period of margin, so 4 (comment records "margin chosen by service owner"). Readiness and liveness keep defaults.

Phase 3:
```
$ kubectl get pod billing-6d9f-xk2 -n billing-test -o jsonpath='...'
2026-10-20T14:02:11Z 2026-10-20T14:02:39Z
```
In-cluster startup 28 seconds, inside the 40-second budget. RESTARTS 0, no Unhealthy events.

---

## Exit Criteria

DONE when all three probes are set with a startup budget covering the measured maximum, liveness never checks dependencies, and a test pod becomes Ready with zero restarts.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Readiness never returns 200 locally | **Adjust**: time the liveness path and record the substitution; check `--env-file`. |
| Phase 2 | API rejects `successThreshold` on liveness | **Adjust**: set it to 1. |
| Phase 3 | `Liveness probe failed: ... context deadline exceeded` | **Adjust**: the endpoint is slower than `timeoutSeconds`; make liveness cheaper rather than raising the timeout. |
| Phase 3 | Pod restarts during startup | **Retry**: recompute the startup budget from the in-cluster measurement. |
| Phase 3 | `Readiness probe failed: HTTP probe failed with statuscode: 400` on Django | **Adjust**: add the `Host` header from `host_header`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
