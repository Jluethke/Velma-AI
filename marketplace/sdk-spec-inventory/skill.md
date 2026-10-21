# SDK Spec Inventory

**One-line description:** Extracts the facts an SDK design depends on from a validated OpenAPI spec with yq and jq: OpenAPI version, servers, every operation, security schemes, pagination style per list operation, error schemas, idempotency headers and rate-limit headers.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `validated_spec` (string, required): Path to a spec with zero Spectral errors.
- `readiness_report` (object, required): Output of `sdk-spec-sdk-readiness-rules`. Generation must not be blocked.

---

## Outputs

- `api_inventory` (object): `openapi_version`, `servers`, `operations` (method, path, operationId, tag, success status, request body media type), `auth_schemes`, `pagination_styles` with the operations using each, `error_model`, `idempotency_header`, `rate_limit_headers`, `operation_count`.

---

## Phase 1: Bundle and Convert

### Entry Criteria
- `readiness_report` does not mark generation as blocked.
- `yq` (mikefarah yq v4) and `jq` are installed: `yq --version` and `jq --version` both print versions.

### Actions
1. If the spec spans several files, bundle it first: `npx @redocly/cli bundle <validated_spec> -o build/openapi.bundled.yaml`. A single file is used as is.
2. Convert to JSON for jq: `yq -o=json build/openapi.bundled.yaml > build/openapi.json`.
3. Record `openapi_version`: `jq -r .openapi build/openapi.json`.
4. Record `servers`: `jq '.servers' build/openapi.json`. If `servers` is absent, record that the base URL must be a required client option.
5. Do NOT use the python-yq wrapper (kislyuk/yq); its syntax differs. `yq --version` must mention `mikefarah`.

### Output
`build/openapi.json`.

### Quality Gate
- `jq empty build/openapi.json` exits 0.
- `openapi_version` starts with `3.0` or `3.1`.

---

## Phase 2: Operations and Auth

### Entry Criteria
- `build/openapi.json` exists.

### Actions
1. List every operation:
   ```bash
   jq -r '.paths | to_entries[] | .key as $p | .value | to_entries[]
     | select(.key | IN("get","put","post","delete","patch","head","options","trace"))
     | [.key, $p, .value.operationId, (.value.tags // ["untagged"])[0]] | @tsv' build/openapi.json
   ```
2. Count lines and record `operation_count`.
3. List security schemes: `jq '.components.securitySchemes' build/openapi.json`. Map each with this table into `auth_schemes`:

| `type` | Extra fields | `auth_schemes` entry |
|---|---|---|
| `apiKey` | `in: header` / `query` / `cookie`, `name` | `apiKey` with location and name |
| `http` | `scheme: bearer` | `bearer` (static token) |
| `http` | `scheme: basic` | `basic` |
| `oauth2` | `flows.clientCredentials` | `oauth2_client_credentials` with `tokenUrl` and scopes |
| `oauth2` | `flows.authorizationCode` | `oauth2_authorization_code` (needs refresh support) |
| `openIdConnect` | `openIdConnectUrl` | `oidc`; read the discovery document for the token endpoint |

4. Record global `security` and any operation-level `security` overrides, including `security: []` (no auth) on public operations.

### Output
Operations table and `auth_schemes`.

### Quality Gate
- Number of operation rows equals the number of method keys under `paths` (`jq '[.paths[] | keys[] | select(IN("get","put","post","delete","patch","head","options","trace"))] | length' build/openapi.json`).
- Every scheme in `components.securitySchemes` has an `auth_schemes` entry.

---

## Phase 3: Pagination, Errors, Idempotency, Rate Limits

### Entry Criteria
- Operations table exists.

### Actions
1. For each GET operation returning an array or a list envelope, classify pagination with this table (first matching row wins):

| Evidence in spec | Style |
|---|---|
| Response header `Link` declared, or docs mention `rel="next"` | `link_header` |
| Query parameter named `cursor`, `after`, `before`, `starting_after`, `page_token`, `pageToken`, `continuation_token`, and a response field such as `next_cursor`, `next_page_token`, `has_more` | `cursor` |
| Query parameters `offset` and `limit` | `offset` |
| Query parameters `page` and `per_page` / `page_size` / `pageSize` | `offset` (page-number variant) |
| None of the above | `none` |

   Query parameters: `jq -r '.paths["/v1/users"].get.parameters[]? | select(.in=="query") | .name' build/openapi.json`.
2. Error model: list response codes per operation (`jq '.paths[][] | .responses? | keys' build/openapi.json`). Record whether errors use `application/problem+json` (RFC 9457 Problem Details) or a custom schema, and the schema name.
3. Idempotency: search header parameters named `Idempotency-Key` (or similar) per operation: `jq -r '.. | objects | select(.in? == "header") | .name' build/openapi.json | sort -u`.
4. Rate limits: search response headers such as `Retry-After`, `RateLimit-Limit`, `RateLimit-Remaining`, `X-RateLimit-Remaining`: `jq -r '.. | objects | .headers? // empty | keys[]' build/openapi.json | sort -u`.
5. Write `api_inventory`. Mark any field you could not determine from the spec as `unknown` with the reason. Do NOT guess from naming habits of other APIs.

### Output
`api_inventory`.

### Quality Gate
- Every GET operation that returns a list has a `pagination_styles` value (including `none`).
- `error_model`, `idempotency_header` and `rate_limit_headers` are each set or marked `unknown` with a reason.

---

## Worked Example

Illustrative only. Spec: 3.0.3, 42 operations.

```
$ jq -r .openapi build/openapi.json
3.0.3
$ jq '.components.securitySchemes' build/openapi.json
{ "ApiKeyAuth": { "type": "apiKey", "in": "header", "name": "X-API-Key" },
  "OAuth": { "type": "oauth2", "flows": { "clientCredentials": { "tokenUrl": "https://auth.example.com/oauth/token", "scopes": { "users:read": "" } } } } }
$ jq -r '.. | objects | select(.in? == "header") | .name' build/openapi.json | sort -u
Idempotency-Key
```
`api_inventory.pagination_styles = { cursor: ["listUsers","listEvents"], link_header: ["listAuditLogs"], none: ["getUser", ...] }`, `error_model = problem+json (components/schemas/Problem)`, `rate_limit_headers = ["Retry-After"]`.

---

## Exit Criteria

DONE when `api_inventory` lists every operation, every auth scheme, a pagination style per list endpoint, and the error, idempotency and rate-limit facts, with unknowns marked.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `yq` is the Python wrapper | **Adjust**: install mikefarah yq v4 and rerun. |
| Phase 1 | Bundle fails on an external ref | **Stop**: report the unresolved ref; inventory from a partial spec is wrong. |
| Phase 2 | Operation without operationId | **Return**: send back to `sdk-spec-sdk-readiness-rules`; that rule should have caught it. |
| Phase 3 | Pagination evidence conflicts (both `cursor` and `offset` params) | **Adjust**: record both and read the operation description; if still unclear, mark `unknown` and ask the API owner. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
