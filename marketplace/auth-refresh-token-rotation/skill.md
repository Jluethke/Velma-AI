# Auth Refresh Token Rotation with Reuse Detection

**One-line description:** Implements opaque refresh tokens that rotate on every use and revoke the whole token family when a used token is presented again (RFC 9700 section 4.14.2), with a SQL schema storing only SHA-256 token hashes, a single atomic `UPDATE ... RETURNING` consume step that is safe under concurrent requests, and tests for rotation, reuse and expiry.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `auth_mechanism_decision` (object, required): Output of `auth-session-vs-token-decision`.
- `jwt_findings` (object, required): Output of `auth-jwt-verification-audit`; tells whether access tokens are JWTs and their lifetime.

---

## Outputs

- `refresh_rotation_design` (object): Table DDL, token format and entropy, lifetimes with their source, the consume SQL, the reuse response, the refresh endpoint location, and test output.

---

## Phase 1: Decide Whether Rotation Applies

### Entry Criteria
- `auth_mechanism_decision` exists.

### Actions
1. Apply:

| Situation | Rule |
|---|---|
| `mechanism` = `server_session` with no refresh tokens | Not applicable; emit design with `applies: false`. |
| Public client (SPA without BFF, native app) holding refresh tokens | Rotation with reuse detection is required, or sender-constrained tokens (DPoP RFC 9449, mTLS RFC 8705), per RFC 9700 section 4.14.2. |
| BFF or confidential client | Rotation is still recommended; the client authenticates to the token endpoint. |
| Using a third-party IdP's refresh tokens | Enable the IdP's rotation setting (for example "Refresh Token Rotation" in the IdP admin console) instead of building your own; record the setting name from the IdP docs. Skip to Phase 3 tests. |

2. Lifetimes: absolute lifetime of the family and idle lifetime of each token are user inputs or the organization's policy. Do not invent them. Access token lifetime is read from `jwt_findings`.

### Output
Applicability and lifetimes with source.

### Quality Gate
- One table row is selected and recorded.
- Every lifetime has a named source (user, policy document, or IdP default with link).

---

## Phase 2: Schema and Token Format

### Entry Criteria
- Rotation applies and is self-built.

### Actions
1. Token: 32 random bytes from a CSPRNG, base64url encoded (`secrets.token_urlsafe(32)`, `crypto.randomBytes(32).toString("base64url")`, Go `crypto/rand` + `base64.RawURLEncoding`). 256 bits satisfies RFC 6749 section 10.10 (guess probability must be at most 2^-128 and should be at most 2^-160).
2. Store only `sha256(token)` hex. A fast hash is fine for high-entropy random tokens; Argon2 is for low-entropy passwords.
3. PostgreSQL DDL (in a migration):
   ```sql
   CREATE TABLE refresh_tokens (
     id          bigserial PRIMARY KEY,
     token_hash  char(64) NOT NULL UNIQUE,
     family_id   uuid NOT NULL,
     user_id     bigint NOT NULL REFERENCES users(id),
     parent_id   bigint REFERENCES refresh_tokens(id),
     issued_at   timestamptz NOT NULL DEFAULT now(),
     expires_at  timestamptz NOT NULL,
     family_expires_at timestamptz NOT NULL,
     used_at     timestamptz,
     revoked_at  timestamptz
   );
   CREATE INDEX ON refresh_tokens (family_id);
   ```
4. Never log the raw token; log the row `id` or the first 8 hex characters of the hash.

### Output
Migration applied.

### Quality Gate
- `\d refresh_tokens` in `psql` shows `token_hash` unique and no column holding the raw token.

---

## Phase 3: Refresh Endpoint

### Entry Criteria
- Table exists (or IdP rotation enabled).

### Actions
1. Consume atomically (one statement, no read-then-write):
   ```sql
   UPDATE refresh_tokens SET used_at = now()
   WHERE token_hash = $1 AND used_at IS NULL AND revoked_at IS NULL
     AND expires_at > now() AND family_expires_at > now()
   RETURNING id, family_id, user_id, family_expires_at;
   ```
2. If one row returns: in the same transaction insert the child token (same `family_id`, `parent_id` = returned `id`, `family_expires_at` copied, new `expires_at`), issue a new access token, return both.
3. If zero rows return, look the hash up without filters:
   - Not found: 401.
   - Found with `used_at` set or `revoked_at` set: reuse detected. Run `UPDATE refresh_tokens SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL;`, log a security event with `user_id` and `family_id`, return 401.
   - Found and expired: 401.
4. Concurrent legitimate refreshes (two browser tabs) will trigger reuse detection. If that is a problem, the options are a short grace period that returns the already-issued child, or a single-flight refresh in the client. The grace length is an open question for the user; do not pick one.
5. Logout and password change: revoke all families for the user (`UPDATE ... WHERE user_id = $1 AND revoked_at IS NULL`).
6. Deliver refresh tokens to browsers only in an `HttpOnly; Secure; SameSite=Strict` cookie scoped with `Path=/auth/refresh`, or keep them server-side in a BFF.

### Output
Refresh endpoint.

### Quality Gate
- `rg -n -i "select .*from refresh_tokens" .` hits only the step 3 lookup that runs after a zero-row consume; no hit is followed by an `UPDATE` of the same row (the consume is the single `UPDATE ... RETURNING`).
- A request with a valid token returns a new refresh token different from the one sent.

---

## Phase 4: Tests

### Entry Criteria
- Endpoint exists.

### Actions
1. Write tests against a real test database (not a mock):
   - rotation: refresh with T1 returns T2; T1 no longer works;
   - reuse: refresh with T1, then T1 again: 401, and T2 now also returns 401 (family revoked);
   - expiry: a token with `expires_at` in the past returns 401;
   - concurrency: fire two refreshes with the same token in parallel (two threads or `Promise.all`); exactly one succeeds.
   - logout revokes: after logout, the latest token returns 401.
2. Run the stack test command.

### Output
`refresh_rotation_design`.

### Quality Gate
- All five tests pass.
- Mutation check: remove `AND used_at IS NULL` from the consume SQL; the concurrency or reuse test fails; revert.

---

## Worked Example

Illustrative only. Go API with Postgres, native mobile client (public), lifetimes from the user's policy: 30 days family, 14 days idle.

Phase 1: public client row; rotation required.

Phase 4:
```
$ go test ./internal/refresh/... -count=1 -v
--- PASS: TestRotation (0.03s)
--- PASS: TestReuseRevokesFamily (0.04s)
--- PASS: TestExpired (0.01s)
--- PASS: TestConcurrentSingleWinner (0.05s)
--- PASS: TestLogoutRevokes (0.02s)
ok   example.com/api/internal/refresh  0.21s
```

---

## Exit Criteria

DONE when refresh tokens are random, stored hashed, rotated on each use by one atomic statement, reuse revokes the family, logout revokes all families, and the five tests plus the mutation check pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No lifetime policy | **Return**: ask the user; record as an open question. |
| Phase 2 | Database is not PostgreSQL | **Adjust**: MySQL lacks `RETURNING` on `UPDATE`; use `UPDATE ... WHERE ... AND used_at IS NULL` then check affected rows = 1 inside the transaction, then select. |
| Phase 3 | Users report random logouts after rollout | **Return**: likely concurrent refresh; present the grace or single-flight options from Phase 3 step 4. |
| Phase 4 | Concurrency test flaky | **Retry**: make both requests wait on a barrier before sending; never delete the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
