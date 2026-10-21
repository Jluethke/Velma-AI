# Auth JWT Verification Audit

**One-line description:** Audits every place a service issues or accepts JWTs for the failure classes in RFC 8725 (JWT Best Current Practices): `governance engine: none`, RS/HS algorithm confusion, decode-without-verify, missing `exp`/`aud`/`iss` checks, attacker-controlled `kid`, `jku` and `x5u` headers, weak HMAC secrets, and cross-token-type reuse, with grep patterns per library (PyJWT, python-jose, jsonwebtoken, jose, golang-jwt) and forged-token tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `auth_mechanism_decision` (object, required): Output of `auth-session-vs-token-decision`.

---

## Outputs

- `jwt_findings` (object): Each JWT issue and verify site with library and version, each finding with class, file, line and fix, and the forged-token test results. Empty findings with `uses_jwt` false when no JWT code exists.

---

## Phase 1: Find Every Sign and Verify Site

### Entry Criteria
- `repo_path` readable.

### Actions
1. If `auth_mechanism_decision.uses_jwt` is false and the searches below return no hits, emit `jwt_findings` with an empty list and stop.
2. Run the search for `stack` (copy the command exactly; the `|` characters are regex alternation):
   - python: `rg -n "jwt\.(encode|decode)\(|jose\.jwt|verify_signature|algorithms=|get_unverified_header|get_unverified_claims" --type py .`
   - node: `rg -n "jwt\.(sign|verify|decode)\(|jwtVerify|decodeJwt|SignJWT|algorithms\s*:" --type js --type ts .`
   - go: `rg -n "jwt\.(Parse|ParseWithClaims|NewWithClaims)|WithValidMethods|SigningMethod|ParseUnverified" --type go .`

3. Record the library and its installed version: `pip show PyJWT python-jose`, `npm ls jsonwebtoken jose`, or `go list -m github.com/golang-jwt/jwt/v5`.

### Output
Table of sign and verify sites.

### Quality Gate
- Every hit is listed as `sign`, `verify` or `decode_only`.
- Library versions are copied from the commands' output.

---

## Phase 2: Check Each Site Against the Failure Classes

### Entry Criteria
- Site table exists.

### Actions
1. Check every verify site against this table. Each row that applies is a finding.

| # | Failure class | How to see it | Fix |
|---|---|---|---|
| 1 | Decode without verify on an auth path | PyJWT `options={"verify_signature": False}`, `jsonwebtoken.decode(`, `jose.decodeJwt(`, golang-jwt `ParseUnverified` | Use the verify call; unverified decode only for logging after verification |
| 2 | No algorithm pin | PyJWT `jwt.decode` without `algorithms=` (PyJWT 2 raises, older versions did not); `jsonwebtoken.verify` without `{ algorithms: [...] }`; golang-jwt without `jwt.WithValidMethods([]string{...})` and a keyfunc that does not check `token.Method` | Pin one algorithm family per key |
| 3 | Algorithm confusion | Same code accepts `HS256` and `RS256`, or passes a PEM public key as an HMAC secret | Allowlist only the asymmetric governance engine; keyfunc returns `*rsa.PublicKey` only when `token.Method` is `*jwt.SigningMethodRSA` |
| 4 | `governance engine: none` accepted | Allowlist contains `none`, or library version predates its fix | Remove; upgrade |
| 5 | Missing claim checks | No `audience`/`issuer` arguments; `exp` not required (PyJWT `options={"require": ["exp"]}`, golang-jwt `jwt.WithExpirationRequired()`, `jwt.WithAudience`, `jwt.WithIssuer`) | Require `exp`, check `aud` and `iss` |
| 6 | Attacker-controlled key lookup | `kid` used in a file path, SQL query or shell command; `jku` or `x5u` header fetched | Look `kid` up in a fixed in-memory map from your own JWKS; never fetch header URLs |
| 7 | Weak HMAC secret | HS256 secret shorter than 32 bytes, or a word-like literal in code or `.env` | RFC 7518 section 3.2: key at least the hash size (256 bits for HS256); generate with `openssl rand -base64 32` and load from the secret manager |
| 8 | Token type confusion | Same key and audience sign access tokens, ID tokens, reset tokens and email tokens | Distinct `aud` or `typ` per purpose (RFC 8725 section 3.11, RFC 9068 `typ: at+jwt` for access tokens), checked on verify |
| 9 | No revocation path | Long `exp` with no deny list or session lookup | Short-lived access token plus `auth-refresh-token-rotation`, or a `jti` deny list |
| 10 | Token in browser storage | `localStorage.setItem` of a JWT (from `auth_inventory`) | Move to a BFF session or HttpOnly cookie |

2. For sign sites, check: `exp` is always set; secrets come from configuration, not code literals (`rg -n "(secret|SECRET)\s*[:=]\s*['\"][^'\"]{1,40}['\"]" .`).
3. Optional offline secret check for HS256 when the user approves: `hashcat -m 16500 token.txt wordlist.txt` (mode 16500 is JWT). A cracked secret is a critical finding. Do not run this against tokens you do not own.

### Output
Findings list.

### Quality Gate
- Every verify site has a row-by-row result (applies or not) for rows 1 to 8.
- Each finding cites a file and line.

---

## Phase 3: Fix and Prove with Forged Tokens

### Entry Criteria
- Findings exist (or none, then write the tests only).

### Actions
1. Fix one finding at a time; run the stack tests after each.
2. Add forged-token tests against the real verify function:
   - `governance engine: none`: build `base64url('{"governance engine":"none","typ":"JWT"}') + "." + base64url(claims) + "."`; expect rejection.
   - Algorithm confusion: sign HS256 with the server's RSA public key PEM bytes as the secret; expect rejection.
   - Expired token, wrong `aud`, wrong `iss`, missing `exp`: each rejected.
   - Token of another purpose (for example a password reset token) presented as an access token: rejected.
3. Optional tool cross-check: `jwt_tool` (github.com/ticarpi/jwt_tool) can generate these forgeries against a running endpoint; run `python3 jwt_tool.py -h` and use only the flags it lists.
4. Do NOT weaken a failing assertion to get green; a failing forged-token test is a real vulnerability.

### Output
`jwt_findings`.

### Quality Gate
- Forged-token tests (at least the six above) pass.
- Mutation check: add `none` (or `HS256`) back to the allowlist; the matching test fails; revert.

---

## Worked Example

Illustrative only. Express API with `jsonwebtoken@9.0.2`.

Phase 1:
```
$ rg -n "jwt\.(sign|verify|decode)\(" --type ts src
src/auth/middleware.ts:18:  const claims = jwt.verify(token, PUBLIC_KEY);
src/auth/issue.ts:9:  return jwt.sign(payload, PRIVATE_KEY, { algorithm: "RS256" });
src/reset/token.ts:7:  return jwt.sign({ uid }, PRIVATE_KEY, { algorithm: "RS256" });
```

Phase 2 findings: row 2 (no `algorithms` on verify), row 5 (no `audience`/`issuer`), row 8 (reset tokens and access tokens share key and audience; also no `expiresIn` in `src/reset/token.ts`).

Phase 3: verify becomes `jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS256"], audience: "api", issuer: ISSUER })`; reset tokens get `audience: "password-reset"`.
```
$ npx jest tests/jwt-forgery.test.ts
Tests: 6 passed, 6 total
```

---

## Exit Criteria

DONE when every verify site pins algorithms, verifies signatures, requires `exp` and checks `aud` and `iss`, key lookup ignores attacker-supplied URLs, token purposes are separated, and the forged-token tests pass with a mutation check.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | JWTs verified by an API gateway, not app code | **Adjust**: audit the gateway config (for example the JWT plugin's allowed algorithms and audiences) and record it. |
| Phase 2 | Library version has a known advisory | **Adjust**: upgrade first, rerun the tests; cite the advisory ID from `npm audit`, `pip-audit` or `govulncheck`. |
| Phase 3 | Fix breaks a partner integration that sends `HS256` | **Return**: report the conflict; never re-enable mixed algorithms on one key. |
| Phase 3 | Forged-token test cannot reach the verify function | **Adjust**: test through the HTTP layer with supertest, Django test client, or `httptest`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
