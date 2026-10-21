# Envoy and Istio Retry Policy With a Retry Budget

**One-line description:** Moves retries for mesh-owned dependencies into Envoy route retry_policy (retry_on, num_retries, per_try_timeout, retry_back_off) with a cluster retry_budget, or into an Istio VirtualService and DestinationRule, splitting routes by HTTP method so non-idempotent calls are never retried, and verifies the rendered config and retry counters.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `retry_policy` (object[], required): Output of `res-retry-policy`; only rows with `owning_layer` = mesh are used.
- `timeout_plan` (object[], required): Output of `res-timeout-budget`.
- `mesh_type` (string, required): `envoy` (static or xDS-managed Envoy config files) or `istio`.

---

## Outputs

- `mesh_retry_config` (object[]): Per dependency: file path of the config written, the exact YAML fields set, the rendered config check command and its output, and counter values from the verification run.

---

## Phase 1: Map Policy Fields to Mesh Fields

### Entry Criteria
- At least one `retry_policy` row has `owning_layer` = mesh.

### Actions
1. Translate `retry_on` with this table. Envoy does not know which methods are idempotent, so non-idempotent routes get only the "request never reached the upstream" conditions:

| Policy condition | Envoy `retry_on` token | Use on non-idempotent route |
|---|---|---|
| Connect refused or connect timeout | `connect-failure` | yes |
| HTTP/2 REFUSED_STREAM (server did not process) | `refused-stream` | yes |
| 502, 503, 504 | `gateway-error` | no |
| Any 5xx (includes 500 and resets) | `5xx` | no; only when the policy retries 500 |
| Reset after request sent | `reset` | no |
| Specific codes such as 429 or 408 | `retriable-status-codes` plus `retriable_status_codes: [429]` | no unless the dependency honors idempotency keys |
| gRPC UNAVAILABLE | `unavailable` | per policy |
| gRPC DEADLINE_EXCEEDED | do not add `deadline-exceeded` | no |

2. `num_retries` = `max_attempts - 1`. Envoy's default when a retry policy is present is 1.
3. `per_try_timeout` = `per_try_timeout_ms` from the timeout plan. The route `timeout` (Envoy default 15 s) covers all attempts; set it to the dependency's share of `request_deadline_ms`.
4. `retry_back_off.base_interval` and `max_interval` from `retry_policy.backoff` (Envoy defaults 25 ms and 10 times the base when unset). Envoy already applies fully jittered exponential backoff.
5. Budget: `retry_budget.budget_percent` and `min_retry_concurrency` from `retry_policy.budget` (Envoy defaults 20% and 3).

### Output
Field mapping table per dependency.

### Quality Gate
- No non-idempotent route maps to `5xx`, `gateway-error`, `reset`, or `retriable-status-codes` without a documented idempotency key.

---

## Phase 2: Write the Config

### Entry Criteria
- Mapping complete.

### Actions
1. Envoy (`mesh_type` = envoy): in the route configuration, one route per method class:
   ```yaml
   routes:
   - match: { prefix: "/", headers: [{ name: ":method", string_match: { exact: "GET" } }] }
     route:
       cluster: payments
       timeout: 1.6s
       retry_policy:
         retry_on: "connect-failure,refused-stream,gateway-error"
         num_retries: 1
         per_try_timeout: 0.75s
         retry_back_off: { base_interval: 0.1s, max_interval: 1s }
         retry_host_predicate: [{ name: envoy.retry_host_predicates.previous_hosts,
           typed_config: { "@type": type.googleapis.com/envoy.extensions.retry.host.previous_hosts.v3.PreviousHostsPredicate } }]
   - match: { prefix: "/" }
     route:
       cluster: payments
       timeout: 0.75s
       retry_policy: { retry_on: "connect-failure,refused-stream", num_retries: 1, per_try_timeout: 0.75s }
   ```
   And on the cluster:
   ```yaml
   circuit_breakers:
     thresholds:
     - priority: DEFAULT
       retry_budget: { budget_percent: { value: 20.0 }, min_retry_concurrency: 3 }
   ```
   When `retry_budget` is set, the cluster's `max_retries` threshold is ignored.
2. Validate: `envoy --mode validate -c envoy.yaml` must print `configuration 'envoy.yaml' OK`.
3. Istio (`mesh_type` = istio): VirtualService per host, with method-matched HTTP routes:
   ```yaml
   apiVersion: networking.istio.io/v1
   kind: VirtualService
   metadata: { name: payments }
   spec:
     hosts: [payments.prod.svc.cluster.local]
     http:
     - match: [{ method: { exact: GET } }]
       timeout: 1.6s
       retries: { attempts: 1, perTryTimeout: 0.75s, retryOn: "connect-failure,refused-stream,gateway-error" }
       route: [{ destination: { host: payments.prod.svc.cluster.local } }]
     - timeout: 0.75s
       retries: { attempts: 1, perTryTimeout: 0.75s, retryOn: "connect-failure,refused-stream" }
       route: [{ destination: { host: payments.prod.svc.cluster.local } }]
   ```
   Istio `attempts` is the number of retries. Without a VirtualService, Istio applies its default retry policy (2 attempts on `connect-failure,refused-stream,unavailable,cancelled,retriable-status-codes`); check the docs for your Istio version. Use `networking.istio.io/v1beta1` on versions before 1.22.
4. Istio has no first-class retry budget field. Cap concurrent retries with DestinationRule `trafficPolicy.connectionPool.http.maxRetries` (value from the policy as a user input), or patch `retry_budget` with an EnvoyFilter after reading the Istio EnvoyFilter docs for your version. Record which one was used.
5. Run `istioctl analyze -n <namespace>` and require no errors.
6. Remove app-level retries for these dependencies (they are listed in `layers_to_disable`), or the mesh and app multiply attempts.

### Output
Config files written and validated.

### Quality Gate
- `envoy --mode validate` prints OK, or `istioctl analyze` reports no errors.
- Rendered route shows the policy: `istioctl proxy-config route <pod>.<ns> --name <route> -o json | jq '.. | .retryPolicy? // empty'` lists `numRetries` and `perTryTimeout` as planned.

---

## Phase 3: Verify With Counters

### Entry Criteria
- Config applied in a non-production environment.

### Actions
1. Make the upstream fail on demand (for example `res-toxiproxy-faults`, or a test upstream that returns 503 on a header).
2. Send traffic and read counters. Envoy: `curl -s localhost:9901/stats | rg "cluster\.payments\.upstream_rq_retry"`. Istio sidecar: `kubectl exec <pod> -c istio-proxy -- pilot-agent request GET stats | rg "payments.*upstream_rq_retry"`.
3. Read: `upstream_rq_retry` (retries made), `upstream_rq_retry_success`, `upstream_rq_retry_overflow` (retries refused by the budget or `max_retries`), `upstream_rq_retry_limit_exceeded` (gave up after `num_retries`).
4. Expected: with GETs failing 503 once, `upstream_rq_retry` rises by about the failed count and `upstream_rq_retry_success` likewise; with POSTs failing 503, `upstream_rq_retry` does not rise; with all calls failing, `upstream_rq_retry_overflow` rises once retries exceed the budget.

### Output
`mesh_retry_config` with counter values.

### Quality Gate
- POST failures produced zero retries (counter delta 0 during the POST-only run).
- `upstream_rq_retry_overflow` delta is above 0 in the all-fail run, proving the budget is live.

---

## Worked Example

Illustrative. `mesh_type` = istio, `payments` GET and POST; policy GET `max_attempts` 2, per try 750 ms; budget via `maxRetries` = 50 (user input).

Phase 2 writes the VirtualService above and a DestinationRule with `connectionPool: { http: { maxRetries: 50 } }`. `istioctl analyze -n prod` prints `No validation issues found when analyzing namespace: prod.`

Phase 3 with fault injection on GET:
```
cluster.outbound|8080||payments.prod.svc.cluster.local.upstream_rq_retry: 412
cluster.outbound|8080||payments.prod.svc.cluster.local.upstream_rq_retry_success: 405
cluster.outbound|8080||payments.prod.svc.cluster.local.upstream_rq_retry_overflow: 0
```
POST-only run: `upstream_rq_retry` unchanged.

---

## Exit Criteria

DONE when mesh-owned dependencies have validated retry config split by idempotency, a budget or retry cap, no duplicate app retries, and counter evidence for retries, no-retry on POST, and overflow.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `owning_layer` = mesh rows | **Return**: nothing to do; output an empty `mesh_retry_config`. |
| Phase 2 | `envoy --mode validate` fails | **Adjust**: read the error's field path; fix that field only. |
| Phase 2 | Team cannot change mesh config | **Return**: send the dependency back to `res-retry-policy` with owning layer app. |
| Phase 3 | Counters do not move | **Adjust**: confirm traffic goes through the sidecar (`istioctl proxy-status`) and the route name matches. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
