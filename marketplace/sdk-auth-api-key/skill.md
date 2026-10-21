# SDK API Key Auth

**One-line description:** Adds API key authentication exactly as the spec's `apiKey` security scheme declares it (header, query or cookie, exact name), reads the key from an option or a named environment variable, applies it only to operations that require it, and keeps the key out of logs, reprs and error messages.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `api_inventory` (object, required): Output of `sdk-spec-inventory`; `auth_schemes` must contain an `apiKey` entry.
- `stack` (string, required): `python`, `typescript` or `go`.
- `project_dir` (string, required): SDK repository root.

---

## Outputs

- `api_key_auth` (object): Location and name of the key, environment variable name, the file implementing it, the operations exempted by `security: []`, and the redaction test results.

---

## Phase 1: Read the Scheme

### Entry Criteria
- `api_inventory.auth_schemes` has an `apiKey` entry.

### Actions
1. Copy `in` and `name` exactly from the scheme. Header names are case-insensitive on the wire, but use the spec's spelling.
2. If `in: query`, record a security warning: query strings appear in server access logs and proxies. The SDK still must follow the spec.
3. If `in: header` and `name: Authorization`, check the API docs for a required prefix (for example `Bearer ` or `Token `). Do NOT add a prefix the docs do not state.
4. List operations with `security: []`: `jq -r '.paths | to_entries[] | .key as $p | .value | to_entries[] | select(.value.security? == []) | "\(.key) \($p)"' build/openapi.json`. These must be sent without the key.
5. Choose the environment variable name: user-supplied, or `<VENDOR>_API_KEY` in upper snake case. Record it.

### Output
Scheme facts and exempt operations.

### Quality Gate
- `in`, `name` and the environment variable name are recorded.
- The exempt-operation command was run and its output recorded (empty is a valid result).

---

## Phase 2: Implement

### Entry Criteria
- Scheme facts recorded.

### Actions
1. Resolve the key in this order: explicit constructor argument, then environment variable, then raise a configuration error at client construction (not at first request).
2. Apply it in the shared transport, per stack:

| Stack | Where | Code |
|---|---|---|
| python (httpx) | `httpx.Auth` subclass | `def auth_flow(self, request): request.headers["X-API-Key"] = self._key; yield request` |
| python (openapi-generator) | `Configuration` | `Configuration(host=..., api_key={"ApiKeyAuth": key})` where the dict key is the security scheme name from the spec |
| typescript (openapi-fetch) | middleware | `onRequest({ request }) { request.headers.set("X-API-Key", key); return request; }` |
| go (oapi-codegen) | request editor | `WithRequestEditorFn(func(ctx context.Context, r *http.Request) error { r.Header.Set("X-API-Key", key); return nil })` |

   For `in: query`, set the parameter on the URL (`url.searchParams.set`, `httpx.URL.copy_add_param`, `q := r.URL.Query(); q.Set(...); r.URL.RawQuery = q.Encode()`).
3. Skip the key for exempt operations by passing an internal per-request flag; do not maintain a second client.
4. Redact: Python `__repr__` of the client and config prints `api_key='***'`; TypeScript avoids putting the key on an enumerable property (use a `#private` field); Go struct holding the key implements `String()` and `GoString()` that mask it. Error messages and debug logs that print headers must replace the key value with `***`.

### Output
Auth implementation.

### Quality Gate
- The type checker passes: `mypy acme_client`, `npx tsc --noEmit`, or `go vet ./...`.

---

## Phase 3: Test

### Entry Criteria
- Implementation compiles.

### Actions
1. Test 1: a call to an authenticated operation sends the header with the exact value (assert on the mock server's received request).
2. Test 2: a call to an exempt operation sends no key header.
3. Test 3: constructing the client with no key and no environment variable raises the configuration error. Clear the variable inside the test (`monkeypatch.delenv`, `vi.stubEnv`, `t.Setenv(name, "")`).
4. Test 4 (redaction): `repr(client)` / `JSON.stringify(client)` / `fmt.Sprintf("%v %#v", cfg, cfg)` does not contain the key; an error raised from a 401 response does not contain the key.
5. Run the suite for the stack and record results.

### Output
`api_key_auth`.

### Quality Gate
- All four tests exist (grep test names) and the suite exits 0.
- Mutation check: temporarily remove the redaction and confirm Test 4 fails; restore.

---

## Worked Example

Illustrative only. Scheme `ApiKeyAuth: { type: apiKey, in: header, name: X-API-Key }`, `stack = python` with httpx, env var `ACME_API_KEY`. `GET /v1/health` has `security: []`.

```
$ pytest tests/test_auth_api_key.py -q
....                                                         [100%]
4 passed in 0.09s
$ # mutation: __repr__ returns the raw key
$ pytest tests/test_auth_api_key.py -q -k redact
F
E   AssertionError: assert 'sk_test_123' not in "AcmeClient(api_key='sk_test_123')"
```
Redaction restored; 4 passed.

---

## Exit Criteria

DONE when the key is sent exactly as the scheme declares, omitted for exempt operations, resolved from argument then environment, and absent from every repr, log and error message, with tests proving each.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Several apiKey schemes (header and query) | **Adjust**: implement the header scheme as default; expose the other only if an operation requires it alone. |
| Phase 2 | Generated code already sets the key differently | **Adjust**: use the generated mechanism and add redaction around it; do not add a second header. |
| Phase 3 | Redaction mutation does not fail Test 4 | **Stop**: the test does not check the right string; fix the test before continuing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
