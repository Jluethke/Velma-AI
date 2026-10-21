# Strangler Fig Routing at the Proxy

**One-line description:** Puts a routing layer in front of the monolith (nginx or Envoy, or the existing ingress) that sends the extracted endpoints to the new service by path, splits traffic by a sticky key for gradual rollout, and keeps every other path on the monolith, with a one-line rollback and a request-level header showing which backend answered.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `module_interface` (object, required): From `mex-interface-boundary-contract`; operations exposed by the new service.
- `deployment_decision` (string, required): Must be `service`.
- `traffic_entry` (string, required): How requests reach the monolith today: `nginx`, `envoy`, `kubernetes_ingress`, `cloud_load_balancer`, or `in_app_router`.

---

## Outputs

- `routing_config` (object): Proxy type, the route table (path or method to backend), the split mechanism and its sticky key, the backend-identifying response header, the config file paths, the config validation command output, and the rollback command.

---

## Phase 1: Build the Route Table

### Entry Criteria
- `deployment_decision` is `service`.
- The new service is deployed in the target environment and passes its health check.

### Actions
1. List the external routes that map to the extracted operations, from `extraction_brief.entry_points`. Example: `POST /api/invoices`, `GET /api/invoices/{id}`, `GET /api/invoices?order_id=`.
2. For each route, record: path prefix or exact match, methods, whether it reads or writes, and any auth the monolith applies before the handler (session middleware, CSRF, rate limits). The new service or the proxy must apply the same auth; list it.
3. Routes are moved by prefix only when every path under the prefix is extracted. Otherwise use exact paths or regex with methods.

### Output
Route table.

### Quality Gate
- Every extracted operation has at least one route, and every route has its auth requirement recorded.

---

## Phase 2: Write the Proxy Config

### Entry Criteria
- Route table complete.

### Actions
1. nginx (`traffic_entry=nginx`):
   ```nginx
   upstream monolith { server monolith:8080; }
   upstream billing  { server billing:9090; }

   # sticky split: same customer always goes to the same side
   split_clients "${cookie_customer_id}" $invoices_backend {
       # rollout: add a line such as "5%  billing;" above the next line;
       # the percentage comes from the flag plan in mex-flag-cutover
       *    monolith;
   }

   server {
     location /api/invoices {
       proxy_pass http://$invoices_backend;
       add_header X-Backend $invoices_backend always;
       proxy_set_header X-Request-ID $request_id;
     }
     location / { proxy_pass http://monolith; }
   }
   ```
   `split_clients` hashes the key with MurmurHash2; pick a key present on every request (a cookie, `$http_x_customer_id`, or `$remote_addr` as a last resort). The `billing` percentage line is the rollout knob; with no such line, all traffic stays on the monolith. Check the `split_clients` docs for the percentage formats your nginx version accepts. Validate with `nginx -t`, apply with `nginx -s reload`.
2. Envoy (`traffic_entry=envoy`): a route with `match: { prefix: "/api/invoices" }` and `route: { weighted_clusters: { clusters: [ {name: billing, weight: 0}, {name: monolith, weight: 100} ] } }`, plus `response_headers_to_add` with an `X-Backend` header per cluster. For sticky routing, use a header match on a user cohort or a hash policy as described in the Envoy route docs. Validate with `envoy --mode validate -c envoy.yaml`.
3. Kubernetes ingress: ingress-nginx supports canary ingresses (`nginx.ingress.kubernetes.io/canary: "true"`, `canary-weight`, `canary-by-header`, `canary-by-cookie`); other controllers differ, read their docs. Cloud load balancers: weighted target groups or URL maps per provider docs.
4. `in_app_router`: no proxy; routing happens in the monolith's handler using the feature flag from `mex-flag-cutover`, which forwards to the service through the HTTP client implementation of the interface. Record this and skip to Phase 3.
5. Do not change timeouts or retries for the monolith routes. For the new routes, set an explicit upstream timeout and no automatic retries on non-idempotent methods (nginx `proxy_next_upstream` must not include `non_idempotent`).

### Output
Proxy config with the split at 0 percent to the new service.

### Quality Gate
- The proxy's validation command (`nginx -t` or `envoy --mode validate`) succeeds.
- With the split at 0 percent, `curl -si https://<host>/api/invoices/INV-1 | grep -i x-backend` prints `monolith`.

---

## Phase 3: Prove Routing and Rollback

### Entry Criteria
- Config applied in a non-production environment.

### Actions
1. Set the split to 100 percent for a test key only (for example a header match or a test cookie value), send requests, and confirm `X-Backend: billing` and correct responses.
2. Confirm untouched routes still go to the monolith: `curl -si https://<host>/api/orders/1 | grep -i x-backend`.
3. Rollback drill: remove the `billing` percentage line (or set the Envoy weight to 0), reload, and confirm traffic returns to `monolith` within the reload. Record the exact command as `routing_config.rollback`.
4. Commit the proxy config to its repository; do not hand-edit production proxies.

### Output
`routing_config`.

### Quality Gate
- Test key requests show `X-Backend: billing`; other requests show `monolith`.
- The rollback drill result is recorded with timestamps.

---

## Worked Example

Illustrative. nginx in front of a Django monolith.

```
$ nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
$ curl -si -b customer_id=test-0001 https://staging.shop/api/invoices/INV-1 | grep -i x-backend
X-Backend: billing
$ curl -si https://staging.shop/api/orders/7 | grep -i x-backend
X-Backend: monolith
```
Rollback drill: `billing` line removed, `nginx -s reload`, next request `X-Backend: monolith`.

---

## Exit Criteria

DONE when the extracted routes can be shifted to the new service by a single sticky split value, all other routes stay on the monolith, the backend is visible per response, and rollback is drilled.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Monolith auth middleware has no equivalent in the service | **Stop**: implement or proxy-enforce auth before any traffic shifts. |
| Phase 2 | Split key missing on some requests | **Adjust**: those requests hash the empty string and all land on one side; choose a key always present or default them to the monolith explicitly. |
| Phase 2 | Directive not recognized | **Stop**: check `nginx -V` for the module or the Envoy version docs; do not guess syntax. |
| Phase 3 | Rollback leaves some traffic on the service | **Retry**: check for cached DNS or keepalive connections; document the drain time. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
