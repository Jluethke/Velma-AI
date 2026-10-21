# Auth OAuth Authorization Code with PKCE

**One-line description:** Implements the OAuth 2.0 authorization code flow with PKCE S256 (RFC 7636) as required for all clients by the OAuth 2.0 Security Best Current Practice (RFC 9700), using Authlib (Python), openid-client v6 (Node) or golang.org/x/oauth2 (Go), with `state` and `nonce` bound to the browser session, exact redirect URI matching, and a check against the RFC 7636 Appendix B test vector.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `idp_issuer_url` (string, required): The identity provider's issuer URL, for example `https://login.example-idp.com/tenant`.
- `auth_mechanism_decision` (object, required): Output of `auth-session-vs-token-decision`; `external_idp` must be true.

---

## Outputs

- `oauth_client_config` (object): Discovery metadata excerpt, client type (confidential or public), registered redirect URIs, library and version, where `state`, `nonce` and `code_verifier` are stored, and the callback handler location.

---

## Phase 1: Read IdP Metadata

### Entry Criteria
- `auth_mechanism_decision.external_idp` is true.

### Actions
1. Fetch discovery: `curl -s "$ISSUER/.well-known/openid-configuration" | jq '{issuer, authorization_endpoint, token_endpoint, jwks_uri, code_challenge_methods_supported, response_types_supported, token_endpoint_auth_methods_supported}'`. For a pure OAuth server (no OIDC) try `/.well-known/oauth-authorization-server` (RFC 8414).
2. The `issuer` value printed must exactly equal `idp_issuer_url` (including trailing slash or its absence). If it differs, use the printed value and tell the user.
3. Require `"S256"` in `code_challenge_methods_supported`. If the field is missing, check the IdP docs; never fall back to `plain`.
4. Client type: if the code runs on a server that can keep a secret, it is confidential (use `client_secret_basic`, `client_secret_post`, or `private_key_jwt` from `token_endpoint_auth_methods_supported`); SPAs and native apps are public (no secret, PKCE mandatory).

### Output
Metadata excerpt and client type.

### Quality Gate
- `jq` output shows `S256` in `code_challenge_methods_supported`, or the IdP doc page stating S256 support is cited.
- `issuer` string is recorded exactly as returned.

---

## Phase 2: Build the Authorization Request

### Entry Criteria
- Metadata recorded.

### Actions
1. Generate per login attempt and store server-side in the pre-login session (BFF) or in `sessionStorage` (pure public SPA, last resort): `code_verifier` (43 to 128 characters from `[A-Z a-z 0-9 - . _ ~]`, RFC 7636 section 4.1), `state` and `nonce` (each from a CSPRNG, at least 128 bits).
2. `code_challenge = BASE64URL(SHA256(ASCII(code_verifier)))` without padding, `code_challenge_method=S256`.
3. Stack specifics:
   - Python Authlib (Flask client): `oauth.register("idp", server_metadata_url=ISSUER + "/.well-known/openid-configuration", client_id=..., client_secret=..., client_kwargs={"scope": "openid email profile", "code_challenge_method": "S256"})`; `return oauth.idp.authorize_redirect(REDIRECT_URI)` generates and stores `state`, `nonce` and the verifier in the Flask session.
   - Node openid-client v6: `const config = await client.discovery(new URL(ISSUER), CLIENT_ID, CLIENT_SECRET)`; `const verifier = client.randomPKCECodeVerifier()`; `const challenge = await client.calculatePKCECodeChallenge(verifier)`; `client.buildAuthorizationUrl(config, { redirect_uri, scope: "openid email", code_challenge: challenge, code_challenge_method: "S256", state, nonce })`.
   - Go: `verifier := oauth2.GenerateVerifier()`; `url := conf.AuthCodeURL(state, oauth2.S256ChallengeOption(verifier), oauth2.SetAuthURLParam("nonce", nonce))`.
4. The `redirect_uri` must match a registered URI exactly (RFC 9700 section 2.1). Register full URIs, no wildcards.
5. Do NOT use the implicit grant (`response_type=token`) or the resource owner password grant; RFC 9700 says they should not be used.

### Output
Login route that redirects to the IdP.

### Quality Gate
- RFC 7636 Appendix B vector reproduces in your environment: `printf '%s' 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk' | openssl dgst -sha256 -binary | openssl base64 -A | tr '+/' '-_' | tr -d '='` prints `E9Melhoa2OwvFrEMTJguCHaoeKt8URWbuGJSstw-cM`, and your code's challenge function returns the same for that input in a unit test.
- `curl -s -o /dev/null -w '%{redirect_url}\n' "$APP/login"` shows `code_challenge_method=S256`, a `state` and a `nonce`.

---

## Phase 3: Handle the Callback

### Entry Criteria
- Login redirect works.

### Actions
1. On the callback: if the query has `error`, show a generic failure and log `error` and `error_description`.
2. Compare the returned `state` to the stored one with a constant-time compare; mismatch or missing stored state returns 400. Delete the stored `state`, `nonce` and verifier after one use.
3. If the authorization response includes `iss` (RFC 9207), check it equals the recorded issuer; this blocks mix-up attacks when several IdPs are configured.
4. Exchange the code:
   - Authlib: `token = oauth.idp.authorize_access_token()` (sends the verifier and validates the ID token, including nonce, when `openid` scope is used).
   - openid-client v6: `const tokens = await client.authorizationCodeGrant(config, new URL(req.originalUrl, BASE_URL), { pkceCodeVerifier: verifier, expectedState: state, expectedNonce: nonce })`.
   - Go: `tok, err := conf.Exchange(ctx, code, oauth2.VerifierOption(verifier))`; then validate the ID token with `auth-oidc-id-token-validation` (golang.org/x/oauth2 does not).
5. In a BFF, keep tokens server-side and give the browser only the session cookie.
6. Rotate the session ID after login.

### Output
`oauth_client_config`.

### Quality Gate
- Test: callback with a wrong `state` returns 400.
- Test: replaying the same callback URL a second time fails (verifier and state already consumed; the IdP also rejects reused codes).
- `rg -n "response_type=token|grant_type=password" .` has no hits.

---

## Worked Example

Illustrative only. Node BFF, Okta-style issuer.

Phase 1:
```
$ curl -s https://login.example-idp.com/oauth2/default/.well-known/openid-configuration | jq -c .code_challenge_methods_supported
["S256"]
```
Client type confidential (Express server), `client_secret_basic`.

Phase 2:
```
$ curl -s -o /dev/null -w '%{redirect_url}\n' http://localhost:3000/login
https://login.example-idp.com/oauth2/default/v1/authorize?redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&scope=openid+email&code_challenge=Q7x...&code_challenge_method=S256&state=f1c...&nonce=9ab...&client_id=0oa...&response_type=code
```

Phase 3: `npx jest tests/oauth-callback.test.ts` prints `2 passed` (bad state 400, replay fails).

---

## Exit Criteria

DONE when the client uses code + PKCE S256 with exact redirect URIs, `state` and `nonce` are single use and checked, tokens stay server-side for browser apps, and the test vector and callback tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | IdP does not support S256 | **Stop**: report to the user; do not use `plain`. |
| Phase 2 | IdP returns `redirect_uri_mismatch` | **Adjust**: register the exact URI (scheme, host, port, path) in the IdP console; no wildcards. |
| Phase 3 | `invalid_grant` on exchange | **Retry**: check the same verifier is sent that produced the challenge and the code was not used twice; check clock skew. |
| Phase 3 | State missing because the session cookie was not sent back | **Adjust**: the pre-login cookie needs `SameSite=Lax` (not `Strict`) so it survives the top-level redirect from the IdP. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
