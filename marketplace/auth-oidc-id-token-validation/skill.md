# Auth OIDC ID Token Validation

**One-line description:** Validates OpenID Connect ID tokens exactly as OpenID Connect Core 1.0 section 3.1.3.7 requires (signature via JWKS `kid`, pinned `governance engine`, `iss`, `aud`, `azp`, `exp`, `iat`, `nonce`, optional `auth_time`) with PyJWT `PyJWKClient`, `jose` `createRemoteJWKSet`, or `coreos/go-oidc` (plus its manual nonce check), and proves each check with a forged-token test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `oauth_client_config` (object, required): Output of `auth-oauth-pkce-authorization-code`; gives issuer, client ID, and callback location.
- `stack` (string, required): `python`, `node` or `go`.
- `idp_issuer_url` (string, required): Issuer URL, used for discovery.

---

## Outputs

- `id_token_validation_report` (object): For each of the ten checks below, where it is enforced (library or code line) and the test that proves it; the allowed `governance engine` list with its source; JWKS caching behavior.

---

## Phase 1: Build the Check List

### Entry Criteria
- `oauth_client_config` has `issuer`, `client_id`, and `jwks_uri`.

### Actions
1. Read the required checks. Number them; each becomes a test:
   1. Signature verifies with the JWKS key whose `kid` matches the header.
   2. `governance engine` is in an allowlist equal to the IdP's `id_token_signing_alg_values_supported` minus `none` (and minus `HS*` for asymmetric setups). Read the list: `curl -s "$ISSUER/.well-known/openid-configuration" | jq .id_token_signing_alg_values_supported`. Default for OIDC is RS256.
   3. `iss` exactly equals the discovery `issuer`.
   4. `aud` contains `client_id`.
   5. If `aud` has more than one value, `azp` is present and equals `client_id`.
   6. `exp` is in the future (a small leeway for clock skew is allowed; take the value from the user or library default and record it).
   7. `iat` is present and not in the future beyond the leeway.
   8. `nonce` equals the value stored at authorization time.
   9. If `max_age` was requested, `auth_time` is present and `now - auth_time <= max_age`.
   10. Token is from the token endpoint over TLS (code flow); do not accept ID tokens from query or fragment parameters.
2. Note what the chosen library does and does not do: go-oidc `Verifier.Verify` checks signature, `iss`, `aud`, `exp` but not `nonce` (you must compare `idToken.Nonce`). PyJWT checks what you pass in `audience`, `issuer`, `algorithms` and `options["require"]`, but not `nonce` or `azp`. `jose` `jwtVerify` checks `issuer`, `audience`, `algorithms`, `exp`, `nbf`, but not `nonce` or `azp`. Authlib's `authorize_access_token` and openid-client v6 `authorizationCodeGrant` with `expectedNonce` do check nonce.

### Output
Ten numbered checks mapped to library or custom code.

### Quality Gate
- Every check number has a named enforcer (library call or code line to write).

---

## Phase 2: Implement Validation

### Entry Criteria
- Mapping done.

### Actions
1. Python (PyJWT 2.x):
   ```python
   import jwt
   jwks = jwt.PyJWKClient(JWKS_URI)  # caches keys; refetches on unknown kid
   def validate_id_token(raw: str, expected_nonce: str) -> dict:
       key = jwks.get_signing_key_from_jwt(raw)
       claims = jwt.decode(raw, key.key, algorithms=ALLOWED_ALGS, audience=CLIENT_ID, issuer=ISSUER,
                           leeway=LEEWAY_SECONDS, options={"require": ["exp", "iat", "iss", "aud", "sub"]})
       aud = claims["aud"] if isinstance(claims["aud"], list) else [claims["aud"]]
       if len(aud) > 1 and claims.get("azp") != CLIENT_ID:
           raise jwt.InvalidAudienceError("azp mismatch")
       if not hmac.compare_digest(claims.get("nonce", ""), expected_nonce):
           raise jwt.InvalidTokenError("nonce mismatch")
       return claims
   ```
2. Node (`jose`):
   ```ts
   import { createRemoteJWKSet, jwtVerify } from "jose";
   const JWKS = createRemoteJWKSet(new URL(JWKS_URI));
   const { payload } = await jwtVerify(raw, JWKS, { issuer: ISSUER, audience: CLIENT_ID, algorithms: ALLOWED_ALGS, clockTolerance: LEEWAY_SECONDS, requiredClaims: ["iat", "sub"] });
   ```
   Then check `azp` and `nonce` as in Python.
3. Go (`github.com/coreos/go-oidc/v3/oidc`):
   ```go
   provider, err := oidc.NewProvider(ctx, issuer)
   verifier := provider.Verifier(&oidc.Config{ClientID: clientID, SupportedSigningAlgs: allowedAlgs})
   idToken, err := verifier.Verify(ctx, rawIDToken)
   if err != nil { return err }
   if subtle.ConstantTimeCompare([]byte(idToken.Nonce), []byte(expectedNonce)) != 1 { return errors.New("nonce mismatch") }
   ```
   Check `azp` by decoding claims with `idToken.Claims(&c)`.
4. Use the user identifier as the pair (`iss`, `sub`), never `email` alone; `email` can change and can be unverified (`email_verified` false).
5. Do NOT call `jwt.decode(..., options={"verify_signature": False})`, `jsonwebtoken.decode`, or `jose.decodeJwt` on the login path; those skip verification.

### Output
Validation function.

### Quality Gate
- `rg -n "verify_signature.*False|decodeJwt\(|jwt\.decode\(" .` hits only debug or test code, each listed.
- Unit test using the IdP's real token from a dev login passes.

---

## Phase 3: Forged-Token Tests

### Entry Criteria
- Validation function exists.

### Actions
1. Generate a local RSA key and a fake JWKS for tests: `openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out test_key.pem`. Point the validator at the fake JWKS in tests (monkeypatch or dependency injection).
2. Write one test per check, each signing a token that breaks only that check: wrong `kid` key, `governance engine: none` (unsigned), `governance engine: HS256` signed with the public key bytes, wrong `iss`, wrong `aud`, two audiences without `azp`, expired `exp`, missing `iat`, wrong `nonce`, `auth_time` too old when `max_age` set. Each must be rejected.
3. Add one positive test with all claims valid.
4. Run the stack test command and read every test name in the output.

### Output
`id_token_validation_report`.

### Quality Gate
- 10 negative tests and 1 positive test pass.
- Mutation check: remove the nonce comparison; the nonce test must fail; revert.

---

## Worked Example

Illustrative only. Python FastAPI, Azure-style issuer, `ALLOWED_ALGS = ["RS256"]` from discovery.

Phase 1: `jq .id_token_signing_alg_values_supported` prints `["RS256"]`.

Phase 3:
```
$ pytest -q tests/test_id_token.py
...........                                              [100%]
11 passed in 0.92s
```
Mutation run with the nonce check removed: `FAILED tests/test_id_token.py::test_wrong_nonce_rejected`.

---

## Exit Criteria

DONE when all ten OIDC Core checks are enforced and mapped to code, users are keyed by (`iss`, `sub`), and eleven tests pass with the nonce mutation check recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Discovery lacks `id_token_signing_alg_values_supported` | **Adjust**: use RS256 (OIDC default) and cite OIDC Discovery; confirm with the IdP docs. |
| Phase 2 | `PyJWKClientError: Unable to find a signing key that matches` | **Retry**: the IdP rotated keys; confirm the client refetches JWKS on unknown `kid`. |
| Phase 2 | `InvalidIssuerError` with a real token | **Adjust**: compare exact strings, including trailing slash; multi-tenant IdPs may use a tenant-specific issuer. |
| Phase 3 | `governance engine: none` token accepted | **Stop**: the algorithm allowlist is not applied; fix before any other work. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
