# Fault Injection per Dependency With Toxiproxy

**One-line description:** Puts Toxiproxy between the service and each dependency in a test environment and runs a fixed fault matrix (latency below and above the per-try timeout, blackhole via the timeout toxic, connection reset, proxy down, bandwidth limit, recovery) with toxiproxy-cli, comparing observed timeouts, retries, breaker transitions and fallbacks against the plans.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dependency_map` (object[], required): Output of `res-dependency-map`.
- `timeout_plan` (object[], required): Output of `res-timeout-budget`.
- `breaker_policy` (object[], required): Output of `res-breaker-policy`.

---

## Outputs

- `fault_results` (object[]): One row per dependency and fault: toxic command run, expected behavior (from the plans), observed behavior with metric values and timestamps, verdict PASS or FAIL, and the evidence (command output, PromQL results).

---

## Phase 1: Insert Toxiproxy

### Entry Criteria
- A non-production environment (local docker compose, CI, or a test namespace). Never production.
- The service exports retry, breaker and fallback metrics from earlier flows.

### Actions
1. Start Toxiproxy: `docker run -d --name toxiproxy -p 8474:8474 -p 26379:26379 -p 28080:28080 ghcr.io/shopify/toxiproxy` (publish one port per proxied dependency). In docker compose, add it as a service on the same network.
2. Create one proxy per dependency (TCP level): `toxiproxy-cli create --listen 0.0.0.0:26379 --upstream redis:6379 redis` and `toxiproxy-cli create --listen 0.0.0.0:28080 --upstream payments:8080 payments`. Check flag names with `toxiproxy-cli create --help` for your version.
3. Point the service's dependency address at the proxy by changing its `config_key` (from `dependency_map`) in the test environment only, for example `REDIS_URL=redis://toxiproxy:26379`.
4. TLS dependencies: Toxiproxy passes TLS bytes through, but the client now connects to a different hostname, so certificate verification fails. Use a test certificate that includes the proxy hostname, or a plaintext test double of the dependency. Do NOT disable certificate verification in production code to make the test pass.
5. Confirm the path: `toxiproxy-cli list` shows each proxy `enabled`, and a request through the service succeeds; `toxiproxy-cli inspect payments` shows no toxics.

### Output
Proxies in place with traffic flowing.

### Quality Gate
- `toxiproxy-cli list` output saved, every planned dependency present.
- A baseline load run (k6 at a fixed rate) shows the service's normal success rate with proxies in path.

---

## Phase 2: Run the Fault Matrix

### Entry Criteria
- Baseline run saved.

### Actions
1. Run a constant k6 load against the service for the whole phase (`constant-arrival-rate` at the measured normal rate) so every fault is observed under traffic.
2. For each dependency, run each fault for at least the breaker's window plus its open duration, then remove the toxic and wait for recovery before the next fault. Use these toxics (attribute values come from the plans; nothing else is invented):

| Fault | Command | Expected (from the plans) |
|---|---|---|
| Slow but within timeout | `toxiproxy-cli toxic add -t latency -a latency=<p99_ms> payments` | no timeouts, no retries, breaker stays closed |
| Slow beyond timeout | `toxiproxy-cli toxic add -t latency -a latency=<per_try_timeout_ms + p50_ms> payments` | each try times out at `per_try_timeout_ms`; retries per policy; breaker opens after `minimum_calls`; fallback or `open_error` served |
| Blackhole | `toxiproxy-cli toxic add -t timeout -a timeout=0 payments` (data stops, connection held open) | same as slow beyond timeout; this catches clients with no read timeout |
| Connection reset | `toxiproxy-cli toxic add -t reset_peer -a timeout=0 payments` | fast connect or read errors; retries only for retryable cases; breaker opens |
| Dependency down | `toxiproxy-cli toggle payments` (disables the proxy; run again to enable) | connection refused immediately; retries allowed for all methods (request never sent); breaker opens |
| Low bandwidth | `toxiproxy-cli toxic add -t bandwidth -a rate=<KB/s from user> payments` | large responses exceed timeout; small ones succeed |

   Toxics apply downstream by default; add `--upstream` to affect requests (check `toxiproxy-cli toxic add --help`).
3. Remove a toxic by name: `toxiproxy-cli toxic remove -n latency_downstream payments` (default name is `<type>_<stream>`). Reset everything between faults: `curl -s -X POST localhost:8474/reset`.
4. During each fault record: request outcomes from k6 (status split and p99), client metrics such as retry counters, `breaker_transitions_total` or `resilience4j_circuitbreaker_state`, `degraded_responses_total`, and bulkhead rejections, all with timestamps.
5. Do NOT run two faults at once in this phase; a combined fault makes it impossible to attribute behavior.

### Output
Observations per fault.

### Quality Gate
- Every dependency has a row for each of the six faults with the exact command and timestamps.
- The proxy was reset between faults (reset calls logged).

---

## Phase 3: Compare and Judge

### Entry Criteria
- Observations recorded.

### Actions
1. For each row compare observed to expected:
   - Timeout: p99 latency of calls to the dependency during "slow beyond timeout" is close to `per_try_timeout_ms` times attempts plus backoff, not the toxic's latency.
   - Retries: retry counter delta equals failed first attempts for retryable operations and is 0 for non-idempotent operations on read timeouts.
   - Breaker: transition to open appears in the metrics; calls to the dependency (toxiproxy shows no new connections, or the client call counter stops rising) stop while open; half-open then closed after the toxic is removed and `open_duration` passes.
   - Fallback: `degraded_responses_total` rises with the matrix's fallback type; auth stays fail-closed.
2. Verdict PASS only when every expected item is observed with evidence. Anything else is FAIL with the missing item named.
3. For each FAIL, name the flow that owns the fix (`res-*-timeouts`, retry flows, breaker flows, `res-graceful-degradation`).
4. Do NOT mark PASS from code reading; every PASS needs a metric value or command output.

### Output
`fault_results` with verdicts.

### Quality Gate
- Every row has a verdict and evidence values.
- Every FAIL names the owning flow.

---

## Worked Example

Illustrative. `payments` per try 750 ms, `max_attempts` 2, breaker min calls 50 in 60 s, open 60 s; p50 41 ms, p99 212 ms.

Phase 2, blackhole: `toxiproxy-cli toxic add -t timeout -a timeout=0 payments` at 10:02:00. Observed: payments client p99 1.6 s (2 tries x 750 ms plus backoff), `resilience4j_circuitbreaker_state{name="payments",state="open"} 1` at 10:02:19, `degraded_responses_total` flat (payments is fail_fast), k6 shows 503 with `Retry-After` for `/orders`. `half_open` at 10:03:19 then back to open (toxic still present). Toxic removed at 10:04:00; `half_open` at 10:04:19, probes succeed, `closed` at 10:04:20.

Phase 3: PASS for blackhole. Connection reset: FAIL, POST `/charge` retried after a reset that happened after sending (retry counter rose by 1,204); owner flow `res-py-tenacity-retry` (predicate counts `httpx.RemoteProtocolError` as retryable).

---

## Exit Criteria

DONE when every dependency has been through all six faults under load with toxics applied one at a time, and each fault has an evidence-backed PASS or a FAIL routed to the owning flow.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Service cannot be pointed at the proxy (address hardcoded) | **Stop**: make the address configurable first; this is a defect in itself. |
| Phase 1 | TLS verification fails through the proxy | **Adjust**: use a test certificate for the proxy hostname or a plaintext test double. |
| Phase 2 | Toxic has no visible effect | **Adjust**: traffic bypasses the proxy (connection pooling to the old address or DNS caching); restart the service after changing the address. |
| Phase 3 | Behavior differs between runs | **Retry**: rerun the fault twice; report both results if they still differ. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
