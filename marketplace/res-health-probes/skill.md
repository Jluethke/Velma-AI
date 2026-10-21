# Kubernetes Liveness, Readiness and Startup Probes

**One-line description:** Implements separate liveness, readiness and startup endpoints with rules that keep dependency failures out of liveness, configures the Kubernetes probe fields from measured startup and response times instead of guesses, adds SIGTERM drain with readiness flip and preStop, and proves each probe's behavior with kubectl and curl.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the service repository.
- `dependency_map` (object[], required): Output of `res-dependency-map`.
- `k8s_manifest_path` (string, required): Path to the Deployment manifest or Helm values file for the service.

---

## Outputs

- `probe_changes` (object): Endpoint paths and what each checks, probe fields with the measurement behind each, shutdown sequence, manifest diff, and verification output from kubectl and curl.

---

## Phase 1: Implement the Three Endpoints

### Entry Criteria
- Current manifest read; existing probe fields recorded (Kubernetes defaults when unset: `periodSeconds` 10, `timeoutSeconds` 1, `failureThreshold` 3, `successThreshold` 1, `initialDelaySeconds` 0).

### Actions
1. Apply these rules to decide what each endpoint checks:

| Endpoint | Checks | Never checks |
|---|---|---|
| `/livez` (liveness) | the process can serve a trivial request: event loop or thread pool not deadlocked | any dependency (database, cache, other services) |
| `/readyz` (readiness) | the instance finished startup work, is not draining, and local resources it alone owns are usable (for example its own connection pool can hand out a connection) | other services' health, circuit breaker state, shared dependencies whose outage affects every pod |
| startup probe | the same handler as liveness, used only until first success | anything slow beyond startup |

2. Reason for the "never" column: if liveness checks the database, a database outage restarts every pod at once (crash loop, cold caches, connection storms on recovery). If readiness checks a shared dependency, an outage marks every pod not ready and the Service has zero endpoints, turning a partial degradation into a full outage.
3. Responses: 200 with a short body when healthy, 503 when not. Respond from memory: the handler itself must not call the network, so it answers well inside `timeoutSeconds`.
4. For gRPC services implement `grpc.health.v1.Health` and use the native `grpc` probe type (stable since Kubernetes 1.27) or `grpc_health_probe` for older clusters.
5. Do NOT reuse an existing deep `/health` endpoint for liveness if it checks dependencies; leave it for dashboards.

### Output
Three endpoint behaviors implemented.

### Quality Gate
- `rg -n "livez|readyz" <source>` shows handlers whose bodies make no network call (inspect each).
- `curl -s -o /dev/null -w "%{http_code} %{time_total}\n" localhost:<port>/livez` prints 200 locally.

---

## Phase 2: Set Probe Fields From Measurements

### Entry Criteria
- Endpoints deployed to a test cluster.

### Actions
1. Measure startup: deploy, then `kubectl get pod <pod> -o jsonpath='{.status.containerStatuses[0].state.running.startedAt}'` and compare with the first successful readiness time in `kubectl get events --field-selector involvedObject.name=<pod>` or app logs. Repeat for 5 pod starts; record the slowest.
2. Startup probe: `periodSeconds` (keep default 10 unless the user says otherwise) and `failureThreshold = ceil(slowest_startup_s / periodSeconds)` plus the margin the user specifies (if none, record an open question and use exactly the computed value). With a startup probe, liveness does not run until startup succeeds, so remove large `initialDelaySeconds` from liveness.
3. Probe `timeoutSeconds`: measure handler latency under load with `kubectl exec <pod> -- sh -c 'for i in $(seq 1 200); do curl -s -o /dev/null -w "%{time_total}\n" localhost:<port>/livez; done' | sort -n | tail -1` during a load test. If the slowest is above the default 1 s, the process is overloaded; fix that rather than raising the timeout blindly, and record the number.
4. Liveness `failureThreshold x periodSeconds` is how long a hung process lives before restart. Keep defaults (3 x 10 s) unless the user gives a requirement; write it down.
5. Readiness uses the same defaults unless the user specifies faster removal.
6. Write the manifest:
   ```yaml
   startupProbe:   { httpGet: { path: /livez, port: http }, periodSeconds: 10, failureThreshold: 6 }
   livenessProbe:  { httpGet: { path: /livez, port: http } }
   readinessProbe: { httpGet: { path: /readyz, port: http } }
   ```
7. Validate: `kubectl apply --dry-run=server -f <k8s_manifest_path>` (or `helm template ... | kubectl apply --dry-run=server -f -`).

### Output
Manifest probe fields with sources.

### Quality Gate
- Every non-default probe field has a measurement or user input written next to it.
- Server-side dry run prints no errors.

---

## Phase 3: Graceful Shutdown and Verification

### Entry Criteria
- Probes configured.

### Actions
1. On SIGTERM the app must: set a draining flag so `/readyz` returns 503, keep serving in-flight and new requests while endpoints propagate, then stop accepting and finish in-flight requests, then exit.
2. Add a preStop delay so the endpoint removal propagates before the app stops listening: `lifecycle: { preStop: { sleep: { seconds: <n> } } }` (the `sleep` action is beta and on by default from Kubernetes 1.30; on older clusters use `exec: { command: ["sleep", "<n>"] }`, which needs a `sleep` binary in the image). `<n>` is a user input or the measured endpoint propagation time.
3. `terminationGracePeriodSeconds` (default 30) must exceed preStop plus the longest request (`request_deadline_ms`); otherwise pods are killed mid-request.
4. Verify readiness isolation: block a shared dependency (for example scale the cache to 0 in the test namespace) and confirm with `kubectl get endpoints <svc>` that pods stay listed and `kubectl get pods` shows no restarts.
5. Verify liveness restarts a hung process: trigger a deliberate hang in a test build (for example a debug endpoint guarded by a test flag that blocks the event loop) and watch `kubectl get pod -w` for `RESTARTS` increasing and `kubectl describe pod` showing `Liveness probe failed`.
6. Verify drain: run a constant k6 load and `kubectl rollout restart deployment/<name>`; the k6 summary must show `http_req_failed` 0 for connection errors during the rollout.

### Output
`probe_changes` with verification output.

### Quality Gate
- Shared dependency outage: endpoints unchanged and zero restarts (saved command output).
- Rollout under load: k6 `http_req_failed` rate is 0.

---

## Worked Example

Illustrative. Service `checkout` on Kubernetes 1.30; old manifest had `livenessProbe` on `/health`, which pings Postgres and Redis.

Phase 1: `/livez` returns 200 from memory; `/readyz` returns 503 while draining or until the startup cache warm-up finishes; `/health` kept for dashboards only.

Phase 2: slowest of 5 starts = 52 s; `failureThreshold = ceil(52/10) = 6`; user accepted no extra margin. Liveness timing under load: max 0.08 s, defaults kept.

Phase 3: preStop sleep 10 s (user), grace 45 s (`10 + 2.6 s deadline`, rounded up by user). Scaling Redis to 0: `kubectl get endpoints checkout` still lists 6 addresses; 0 restarts. Rollout under 300 rps: `http_req_failed: 0.00%`.

---

## Exit Criteria

DONE when liveness checks only the process, readiness checks only instance-local state and draining, startup covers measured startup time, probe fields have sources, shutdown drains without errors, and all three behaviors are proven in a cluster.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Team insists readiness checks the database | **Return**: record the risk (all pods unready on DB outage) and the owner's decision. |
| Phase 2 | Health handler slower than 1 s under load | **Adjust**: move the handler off the busy pool or make it constant-time; do not only raise `timeoutSeconds`. |
| Phase 3 | Errors during rollout | **Adjust**: increase preStop to the measured propagation time and check the app keeps serving after SIGTERM. |
| Phase 3 | Cluster older than 1.30 | **Adjust**: use the `exec` sleep preStop form. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
