# SDK OAuth Client Credentials

**One-line description:** Implements an OAuth 2.0 client credentials token provider (RFC 6749 section 4.4) that fetches, caches and proactively renews the access token with a single in-flight request under concurrency, retries a request once on a 401 with a fresh token, and uses the standard library for the stack where one exists.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `api_inventory` (object, required): Output of `sdk-spec-inventory`; `auth_schemes` contains `oauth2_client_credentials` with `tokenUrl` and scopes.
- `stack` (string, required): `python`, `typescript` or `go`.
- `project_dir` (string, required): SDK repository root.
- `token_expiry_skew_seconds` (integer, optional): How many seconds before `expires_in` runs out the token is renewed. When absent, use the library default (Go `golang.org/x/oauth2` uses 10 seconds) or record it as a user decision.

---

## Outputs

- `token_provider` (object): Token URL, client authentication method, scopes, cache and renewal rule, the skew value with its source, the file implementing it, and test results for caching, concurrency and 401 recovery.

---

## Phase 1: Pin the Protocol Details

### Entry Criteria
- `tokenUrl` is known (from the spec or the API docs).

### Actions
1. Determine client authentication at the token endpoint from the API docs:

| Docs say | Method | Request |
|---|---|---|
| HTTP Basic, or nothing stated | `client_secret_basic` (RFC 6749 section 2.3.1) | `Authorization: Basic base64(urlencode(client_id) + ":" + urlencode(client_secret))` |
| Credentials in the body | `client_secret_post` | form fields `client_id`, `client_secret` |
| Private key JWT | `private_key_jwt` (RFC 7523) | Out of scope here; use a library that implements it |

2. The token request is `POST tokenUrl` with `Content-Type: application/x-www-form-urlencoded` and body `grant_type=client_credentials` plus `scope=<space-separated scopes>` when scopes are required. Some providers also require an `audience` or `resource` parameter (RFC 8707); include it only when the docs say so.
3. A success response is JSON with `access_token`, `token_type` (expect `Bearer`, compared case-insensitively) and usually `expires_in` in seconds. Client credentials responses normally carry no refresh token (RFC 6749 section 4.4.3); renew by requesting a new token.
4. Record the skew: `token_expiry_skew_seconds` if given, else the library default with its source, else an open question. Do NOT invent a value.

### Output
Protocol facts.

### Quality Gate
- Client authentication method, request fields and skew source are recorded.

---

## Phase 2: Implement the Provider

### Entry Criteria
- Protocol facts recorded.

### Actions
1. Use a maintained implementation where the stack has one:

| Stack | Implementation |
|---|---|
| go | `golang.org/x/oauth2/clientcredentials`: `cfg := clientcredentials.Config{ClientID: id, ClientSecret: secret, TokenURL: url, Scopes: scopes}`; `cfg.TokenSource(ctx)` returns a caching, auto-renewing source; `cfg.Client(ctx)` returns an `*http.Client` that sets the header. Set `AuthStyle` on `Endpoint` when the method must be forced (`oauth2.AuthStyleInHeader` or `oauth2.AuthStyleInParams`). Pass your timeout-configured client via `context.WithValue(ctx, oauth2.HTTPClient, hc)`. |
| python | Authlib `OAuth2Client` for httpx (`authlib.integrations.httpx_client`) with `fetch_token(url, grant_type="client_credentials")`, or a handwritten provider (Action 2). Confirm automatic renewal behavior for this grant in the Authlib docs for the installed version before relying on it. |
| typescript | Handwritten provider (Action 2), or `openid-client` if the provider supports OIDC discovery; check its docs for the client credentials function name in the installed version. |

2. Handwritten provider contract (python and typescript):
   - State: `token`, `expires_at` (monotonic clock: `time.monotonic()` in Python, `performance.now()` in Node), and one `pending` fetch.
   - `get_token()`: if `token` exists and `now < expires_at - skew`, return it. Else if a fetch is pending, await that same fetch. Else start one fetch, store it as `pending`, and clear `pending` when it settles (success or failure).
   - Python sync: guard with `threading.Lock`; Python async: `asyncio.Lock`; TypeScript: share the pending `Promise`.
   - If `expires_in` is missing, do not cache beyond one request unless the docs state a lifetime; record this.
3. Attach `Authorization: Bearer <token>` in the shared transport.
4. On a 401 from the API: invalidate the cached token, get a new one, and retry the original request ONCE. A second 401 raises the authentication error. Never loop.
5. Never log `client_secret` or `access_token`; redact both in reprs and errors.

### Output
Token provider implementation.

### Quality Gate
- Type checker passes (`mypy`, `npx tsc --noEmit`, `go vet ./...`).

---

## Phase 3: Test Caching, Concurrency and 401 Recovery

### Entry Criteria
- Provider compiles.

### Actions
1. Mock both the token endpoint and the API (respx/pytest-httpserver, msw, or `httptest`).
2. Test cache: two API calls with a token valid for 3600 seconds hit the token endpoint once.
3. Test renewal: inject a fake clock (or set `expires_in` to a value at or below the skew) and assert the second call fetches a new token.
4. Test single flight: start 20 concurrent API calls on a cold cache (Python `ThreadPoolExecutor` or `asyncio.gather`, TypeScript `Promise.all`, Go goroutines with `sync.WaitGroup`) and assert the token endpoint was called exactly once.
5. Test 401 recovery: the API returns 401 once, then 200; assert two token fetches and one successful result. Test that 401 twice raises the authentication error after exactly two API attempts.
6. Test request shape: the token request has `grant_type=client_credentials` and the chosen client authentication.
7. Go: run with `-race`.

### Output
`token_provider`.

### Quality Gate
- All tests pass: `pytest -q`, `npx vitest run`, or `go test ./... -race -count=1`.
- The single-flight test asserts a token-endpoint call count of exactly 1 (grep the assertion).
- Mutation check: remove the pending-fetch sharing and confirm the single-flight test fails; restore.

---

## Worked Example

Illustrative only. `stack = typescript`, token URL `https://auth.example.com/oauth/token`, Basic client auth, scope `users:read`, skew from user: 30.

```
$ npx vitest run src/auth/clientCredentials.test.ts
 ✓ caches token across calls
 ✓ renews within skew window
 ✓ 20 concurrent calls fetch one token
 ✓ retries once on 401 with fresh token
 ✓ raises AuthenticationError on second 401
 Test Files  1 passed (1)
      Tests  5 passed (5)
```
Mutation (each call starts its own fetch): `expected 20 to be 1` in the single-flight test. Restored.

---

## Exit Criteria

DONE when tokens are fetched with the documented client authentication, cached until expiry minus a sourced skew, fetched once under concurrency, and a 401 triggers exactly one refresh-and-retry, all proven by tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Docs do not state client authentication method | **Adjust**: try `client_secret_basic` against a sandbox; if rejected with `invalid_client`, try `client_secret_post`; record which worked. |
| Phase 2 | Token endpoint returns `invalid_scope` | **Stop**: report the scopes requested; do not drop scopes silently. |
| Phase 3 | Concurrency test flaky | **Adjust**: use a barrier or delayed token response so all calls start before the first fetch completes; do not add sleeps to make it pass. |
| Phase 3 | 401 retry loops | **Stop**: the retry-once guard is missing; fix before continuing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
