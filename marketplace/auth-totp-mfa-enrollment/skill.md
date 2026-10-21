# Auth TOTP MFA Enrollment and Verification

**One-line description:** Implements RFC 6238 TOTP second factor with pyotp (Python), otplib (Node) or pquerna/otp (Go): encrypted secret storage, QR provisioning URI, confirm-before-enable enrollment, a one-step drift window, replay rejection by storing the last accepted time step, hashed single-use recovery codes, and a test that a code cannot be used twice.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `auth_mechanism_decision` (object, required): Output of `auth-session-vs-token-decision`; `mfa_methods` must contain `totp`.

---

## Outputs

- `totp_mfa_change` (object): Library and version, schema changes, enrollment and verify endpoints, secret encryption method, replay protection location, recovery code scheme, and test output.

---

## Phase 1: Schema and Library

### Entry Criteria
- `auth_mechanism_decision.mfa_methods` contains `totp`.

### Actions
1. Install the library for `stack`:

| `stack` | Package | Generate secret | Provisioning URI | Verify |
|---|---|---|---|---|
| python | `pip install pyotp` | `pyotp.random_base32()` | `pyotp.TOTP(s).provisioning_uri(name=email, issuer_name=ISSUER)` | `pyotp.TOTP(s).verify(code, valid_window=1)` |
| node | `npm install otplib` | read the installed otplib README: the API differs between v12 (`authenticator.generateSecret()`) and later majors | `authenticator.keyuri(user, issuer, secret)` in v12 | `authenticator.check(code, secret)` in v12 |
| go | `go get github.com/pquerna/otp` | `totp.Generate(totp.GenerateOpts{Issuer: ISSUER, AccountName: email})` returns a key with `.Secret()` and `.URL()` | `key.URL()` | `totp.ValidateCustom(code, secret, time.Now(), totp.ValidateOpts{Period: 30, Skew: 1, Digits: otp.DigitsSix, Algorithm: otp.AlgorithmSHA1})` |

   Verify the exact function names against the installed version's README before writing code. Do not invent methods.
2. Parameters: period 30 seconds, 6 digits, SHA-1. These are the RFC 6238 defaults and the values common authenticator apps support; many apps ignore other algorithms and digit counts in the URI.
3. Add columns (migration file, not a manual ALTER): `totp_secret_encrypted` (bytes), `totp_enabled` (bool, default false), `totp_last_step` (bigint, nullable), and a `recovery_codes` table (`user_id`, `code_hash`, `used_at`).
4. Encrypt the secret at rest with the app's existing encryption facility (for example Fernet from `cryptography` in Python, AES-256-GCM via `crypto.createCipheriv('aes-256-gcm', ...)` in Node, `crypto/cipher` GCM in Go) with the key from the secret manager. TOTP secrets cannot be hashed because the server must recompute codes.

### Output
Installed library and migration.

### Quality Gate
- The migration applies cleanly on an empty database (`alembic upgrade head`, `python manage.py migrate`, `npx prisma migrate dev`, or the project's tool) and the new columns appear in the schema dump.
- No column stores the secret in plaintext: `rg -n "totp_secret[^_]" .` shows no plain column.

---

## Phase 2: Enrollment

### Entry Criteria
- Migration applied.

### Actions
1. `POST /mfa/totp/setup` (authenticated, recent login required): generate a secret, store it encrypted with `totp_enabled = false`, return the provisioning URI and a QR image of it (Python `qrcode`, Node `qrcode`, Go `github.com/skip2/go-qrcode`). The URI form is `otpauth://totp/ISSUER:email?secret=BASE32&issuer=ISSUER`.
2. `POST /mfa/totp/confirm` with a code: verify it; only on success set `totp_enabled = true`, record `totp_last_step`, and generate recovery codes.
3. Recovery codes: generate a user-chosen count (ask the user; none is fixed by a standard) of random codes from a CSPRNG (`secrets.token_hex`, `crypto.randomBytes`, `crypto/rand`), show them once, store only a hash. Hash with the same Argon2id module as passwords, or SHA-256 if each code carries at least 128 bits of entropy.
4. Never return the secret again after setup. Re-enrollment creates a new secret.

### Output
Setup and confirm endpoints.

### Quality Gate
- A user with `totp_enabled = false` is not asked for TOTP at login (enrollment is not active until confirmed): checked by a test.
- The setup response body contains `otpauth://totp/` and no later endpoint returns the secret: `rg -n "totp_secret" ` shows reads only in verify and setup code.

---

## Phase 3: Verify at Login with Replay Protection

### Entry Criteria
- Enrollment works.

### Actions
1. After the password step succeeds for a user with `totp_enabled = true`, issue only a short-lived "MFA pending" state (session flag or signed token with purpose `mfa_pending`). It must not grant access to any other route.
2. `POST /mfa/totp/verify`: compute the matched time step. Python: loop `for offset in (-1, 0, 1)` and compare `hmac.compare_digest(totp.at(now, offset), code)` to find which step matched (pyotp's `verify` returns only bool); step = `int(now // 30) + offset`. Node and Go: compute the step the same way using the library's generate-at-time function.
3. Reject if `step <= totp_last_step` (RFC 6238 section 5.2: the verifier must not accept the second attempt of the same OTP after a successful validation). Otherwise update `totp_last_step = step` in the same transaction with a conditional update: `UPDATE users SET totp_last_step = :step WHERE id = :id AND (totp_last_step IS NULL OR totp_last_step < :step)` and treat 0 rows updated as replay.
4. Rate limit this endpoint with the stack rate-limiting flow.
5. Recovery code login: hash the submitted code, find an unused match, set `used_at` with a conditional update (`WHERE used_at IS NULL`).
6. Rotate the session ID after MFA completes (see `auth-session-fixation-logout`).

### Output
Verify endpoint.

### Quality Gate
- Test `test_totp_replay_rejected`: freeze time, submit a valid code (200), submit the same code again (401).
- Test `test_mfa_pending_cannot_access_api`: with only the password step done, `GET` a protected route returns 401 or 403.
- Test `test_recovery_code_single_use`: second use returns 401.

---

## Worked Example

Illustrative only. Python Flask, `stack` = python.

Phase 1: `pip install pyotp qrcode` and `pip freeze | grep pyotp` prints `pyotp==2.9.0`. Alembic migration `a1b2_add_totp.py` adds three columns and `recovery_codes`.

Phase 2:
```
$ curl -s -b cookies.txt -X POST http://localhost:5000/mfa/totp/setup | jq -r .uri
otpauth://totp/Acme:alice%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=Acme
```

Phase 3:
```
$ pytest -q tests/test_totp.py
...                                                     [100%]
3 passed in 0.44s
```
Mutation check: removing the `step <= totp_last_step` check makes `test_totp_replay_rejected` fail.

---

## Exit Criteria

DONE when TOTP is enabled only after a confirmed code, secrets are encrypted at rest, a code cannot be accepted twice, the MFA-pending state grants nothing else, recovery codes are hashed and single use, and the three tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `totp` not in `mfa_methods` | **Stop**: skip this flow; product did not ask for TOTP. |
| Phase 1 | No encryption key management exists | **Return**: ask the user where keys live; do not hardcode a key. |
| Phase 2 | Users' codes fail right after scanning | **Adjust**: check server clock with `timedatectl` (Linux) and enable NTP; do not widen the window beyond one step without the user's approval. |
| Phase 3 | Replay test passes even without the check | **Stop**: the test does not freeze time correctly; fix the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
