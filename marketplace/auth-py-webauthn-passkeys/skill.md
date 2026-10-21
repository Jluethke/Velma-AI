# Auth Python WebAuthn Passkeys

**One-line description:** Adds passkey (WebAuthn) registration and authentication to a Python backend (Django, Flask or FastAPI) with the `webauthn` package (py_webauthn by Duo Labs): `generate_registration_options`, `verify_registration_response`, `generate_authentication_options`, `verify_authentication_response`, server-stored single-use challenges, exact origin and RP ID, sign count handling, and negative pytest cases.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `auth_mechanism_decision` (object, required): Output of `auth-session-vs-token-decision`; `mfa_methods` must contain `webauthn`.
- `rp_id` (string, required): Relying party ID, a registrable domain such as `example.com`.
- `rp_origin` (string, required): Exact web origin such as `https://app.example.com`, or `http://localhost:8000` in development.

---

## Outputs

- `passkey_change` (object): Package version, credential model, four endpoints, user verification policy, and pytest output.

---

## Phase 1: Validate RP Settings and Install

### Entry Criteria
- `webauthn` is in `auth_mechanism_decision.mfa_methods`.

### Actions
1. Apply the host-suffix rule: the host of `rp_origin` equals `rp_id` or ends with `.` + `rp_id`. Origins must be HTTPS except `http://localhost`.
2. Install: `pip install webauthn` and pin the version (`pip freeze | grep -i '^webauthn'`).
3. Confirm the API names in the installed version: `python -c "import webauthn, inspect; print(webauthn.__version__); print(inspect.signature(webauthn.verify_authentication_response))"`. Use the printed parameter names exactly.
4. Frontend: use `@simplewebauthn/browser` (`startRegistration`, `startAuthentication`) or the native `navigator.credentials.create/get` with base64url conversion. py_webauthn accepts the JSON produced by `@simplewebauthn/browser`.

### Output
Validated settings, installed version, confirmed signatures.

### Quality Gate
- The printed signature of `verify_authentication_response` includes `expected_challenge`, `expected_rp_id`, `expected_origin`, `credential_public_key` and `credential_current_sign_count`.

---

## Phase 2: Registration

### Entry Criteria
- Phase 1 passes.

### Actions
1. Model: `WebAuthnCredential(id: bytes unique, user_id, public_key: bytes, sign_count: int, transports: JSON, device_type: str, backed_up: bool, created_at, last_used_at)` plus a random per-user `webauthn_user_id` (bytes from `secrets.token_bytes(32)`, not the email).
2. Options endpoint:
   ```python
   from webauthn import generate_registration_options, options_to_json, verify_registration_response
   from webauthn.helpers.structs import (AuthenticatorSelectionCriteria, ResidentKeyRequirement,
       UserVerificationRequirement, PublicKeyCredentialDescriptor, AttestationConveyancePreference)

   opts = generate_registration_options(
       rp_id=RP_ID, rp_name=RP_NAME, user_id=user.webauthn_user_id, user_name=user.email,
       attestation=AttestationConveyancePreference.NONE,
       authenticator_selection=AuthenticatorSelectionCriteria(
           resident_key=ResidentKeyRequirement.PREFERRED,
           user_verification=UserVerificationRequirement.PREFERRED),
       exclude_credentials=[PublicKeyCredentialDescriptor(id=c.id) for c in user.credentials],
   )
   session["webauthn_reg_challenge"] = opts.challenge   # bytes; server-side session store
   return options_to_json(opts)
   ```
3. Verify endpoint: `challenge = session.pop("webauthn_reg_challenge", None)`; if None return 400. Then:
   `v = verify_registration_response(credential=request_body, expected_challenge=challenge, expected_origin=RP_ORIGIN, expected_rp_id=RP_ID, require_user_verification=REQUIRE_UV)`; save `v.credential_id`, `v.credential_public_key`, `v.sign_count`, `v.credential_device_type`, `v.credential_backed_up`.
4. Flask's default session is a client-side signed cookie: a popped challenge can be replayed by resending the old cookie. Store challenges server-side (database row with `used_at`, Redis key deleted on read, or Flask-Session) when using Flask's default session.
5. UV policy: passwordless login requires `UserVerificationRequirement.REQUIRED` and `require_user_verification=True`; a second factor after a password may use `PREFERRED` with `False`.

### Output
Registration endpoints.

### Quality Gate
- `pytest -k register_challenge_single_use` passes: a second verify with the same body returns 400.
- A real browser registration creates one credential row with non-empty `public_key`.

---

## Phase 3: Authentication

### Entry Criteria
- A credential exists.

### Actions
1. Options: `generate_authentication_options(rp_id=RP_ID, allow_credentials=[PublicKeyCredentialDescriptor(id=c.id) for c in creds], user_verification=UserVerificationRequirement.PREFERRED)`; for username-less login pass no `allow_credentials`. Store the challenge server-side.
2. Verify: consume the challenge; look up the credential by the decoded `rawId`; call `verify_authentication_response(credential=body, expected_challenge=challenge, expected_rp_id=RP_ID, expected_origin=RP_ORIGIN, credential_public_key=cred.public_key, credential_current_sign_count=cred.sign_count, require_user_verification=REQUIRE_UV)`.
3. Store `new_sign_count` from the result. If both stored and new counts are 0 the library accepts it (common for synced passkeys). A non-zero count that does not increase raises an exception: log it as a possible cloned authenticator and fail the login.
4. Catch `webauthn.helpers.exceptions.InvalidAuthenticationResponse` and `InvalidRegistrationResponse` and return 401 or 400 with a generic message.
5. Log in the credential's owner (from the database row), then rotate the session (Django `login()` does this; Flask see `auth-session-fixation-logout`).

### Output
`passkey_change`.

### Quality Gate
- `pytest -k "webauthn"` passes tests for: wrong origin rejected, reused challenge rejected, unknown credential 401.
- Mutation check: passing `expected_origin` from the request body instead of config makes the wrong-origin test fail; revert.

---

## Worked Example

Illustrative only. Django app, `rp_id` = `example.com`, `rp_origin` = `https://example.com`, passwordless.

Phase 1:
```
$ python -c "import webauthn; print(webauthn.__version__)"
2.5.2
```

Phase 2: UV required. Browser registration with Windows Hello creates row `sign_count=0, device_type='multi_device', backed_up=True`.

Phase 3:
```
$ pytest -q -k webauthn
....                                                     [100%]
4 passed in 0.38s
```

---

## Exit Criteria

DONE when passkey registration and login verify the exact origin and RP ID with server-stored single-use challenges, store public key and sign count, follow the UV table, and the negative tests pass with a mutation check.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Signature lacks expected parameter names | **Adjust**: follow the installed version's names; record them in `passkey_change`. |
| Phase 2 | `InvalidRegistrationResponse: Unexpected client data origin` | **Adjust**: set `RP_ORIGIN` to the exact scheme, host and port the browser shows. |
| Phase 2 | Challenge stored only in a client-side cookie | **Stop**: move it server-side before continuing. |
| Phase 3 | Sign count regression exception | **Return**: report the credential to the user; do not reset the stored count. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
