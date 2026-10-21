# SDK Token Refresh

**One-line description:** Adds refresh-token handling for user-delegated OAuth tokens (RFC 6749 section 6): single-flight refresh, refresh token rotation per RFC 9700, a pluggable token store with a save callback, the `invalid_grant` stop condition, and the RFC 6750 `invalid_token` 401 trigger.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `token_provider` (object, required): Output of `sdk-auth-oauth-client-credentials`; reused for the cache and single-flight structure.
- `api_inventory` (object, required): Output of `sdk-spec-inventory`; shows whether `oauth2_authorization_code` (or another flow issuing refresh tokens) is present.
- `stack` (string, required): `python`, `typescript` or `go`.
- `project_dir` (string, required): SDK repository root.

---

## Outputs

- `refresh_policy` (object): Trigger rules, rotation handling, token store interface, failure mapping, and test results.

---

## Phase 1: Decide Whether Refresh Applies

### Entry Criteria
- `api_inventory.auth_schemes` is known.

### Actions
1. Apply this table:

| Auth scheme | Refresh token? | Action |
|---|---|---|
| `oauth2_client_credentials` only | No (RFC 6749 section 4.4.3) | Renewal is already handled by the token provider; record "not applicable" and stop |
| `oauth2_authorization_code`, `oidc`, or a device flow | Usually yes | Continue |
| Static bearer or API key | No | Record "not applicable" and stop |

2. The SDK does not run the browser authorization step. It accepts an initial token set (`access_token`, `refresh_token`, `expires_at`) from the caller.

### Output
Applicability decision.

### Quality Gate
- The decision cites the table row.

---

## Phase 2: Implement Refresh

### Entry Criteria
- Refresh applies.

### Actions
1. Token store interface, so callers persist rotated tokens:
   - python: `class TokenStore(Protocol): def load(self) -> TokenSet | None: ...; def save(self, tokens: TokenSet) -> None: ...`
   - typescript: `interface TokenStore { load(): Promise<TokenSet | undefined>; save(t: TokenSet): Promise<void>; }`
   - go: `type TokenStore interface { Load(ctx context.Context) (*oauth2.Token, error); Save(ctx context.Context, t *oauth2.Token) error }`. With `golang.org/x/oauth2`, `cfg.TokenSource(ctx, tok)` refreshes automatically; wrap it to call `Save` when the returned token's `AccessToken` changes.
2. Refresh request: `POST tokenUrl`, form body `grant_type=refresh_token&refresh_token=<value>` plus client authentication as configured, and `scope` only if narrowing (RFC 6749 section 6).
3. Rotation: if the response includes a new `refresh_token`, replace the stored one and call `save` before returning the access token. RFC 9700 (OAuth 2.0 Security Best Current Practice) describes rotation where the old refresh token becomes invalid after use; a lost update locks the user out.
4. Single flight is mandatory: with rotation, two parallel refreshes use the same refresh token and the second fails with `invalid_grant`. Reuse the pending-fetch pattern from `token_provider`.
5. Triggers: (a) proactive, when `now >= expires_at - skew`; (b) reactive, on a 401 whose `WWW-Authenticate` header has `error="invalid_token"` (RFC 6750 section 3.1), or any 401 if the API omits that header. Retry the original request once after refresh.
6. Failure mapping: token endpoint returns HTTP 400 with `{"error": "invalid_grant"}` (RFC 6749 section 5.2): raise a distinct `ReauthenticationRequired` error, clear stored tokens via the store, and do NOT retry. Network errors and 5xx from the token endpoint: surface as connection or server errors; the retry flow decides.

### Output
Refresh implementation.

### Quality Gate
- Type checker passes (`mypy`, `npx tsc --noEmit`, `go vet ./...`).

---

## Phase 3: Test

### Entry Criteria
- Implementation compiles.

### Actions
1. Test rotation: refresh returns a new refresh token; assert `save` was called with it and the next refresh sends the new value.
2. Test single flight with rotation: mock token endpoint accepts each refresh token once and returns `invalid_grant` for reuse; fire 10 concurrent calls with an expired access token; assert all succeed and the endpoint saw one refresh.
3. Test reactive trigger: API returns 401 with `WWW-Authenticate: Bearer error="invalid_token"` once; assert one refresh and one retry.
4. Test `invalid_grant`: refresh returns 400 `invalid_grant`; assert `ReauthenticationRequired` is raised, the store was cleared, and the token endpoint was called once.
5. Run the suite; Go with `-race`.

### Output
`refresh_policy`.

### Quality Gate
- All four tests pass.
- Mutation check: remove the `save` call and confirm the rotation test fails; restore.

---

## Worked Example

Illustrative only. `stack = python`, authorization code scheme present, Authlib not used.

```
$ pytest tests/test_token_refresh.py -q
....                                                         [100%]
4 passed in 0.31s
$ # mutation: skip store.save() after rotation
$ pytest tests/test_token_refresh.py -q -k rotation
F
E   AssertionError: expected save() to be called with refresh_token='rt_2'
```

---

## Exit Criteria

DONE when refresh runs once under concurrency, rotated refresh tokens are persisted through the store before use, `invalid_grant` ends in a re-authentication error without retry, and tests prove each rule.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Only client credentials present | **Return**: record not applicable; the token provider covers renewal. |
| Phase 2 | Provider does not return `expires_in` | **Adjust**: rely on the reactive 401 trigger only; record it. |
| Phase 3 | Concurrency test passes without single flight | **Stop**: the mock does not reject reused refresh tokens; fix the mock first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
