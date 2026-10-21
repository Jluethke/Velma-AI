# Auth Node WebAuthn Passkeys

**One-line description:** Adds passkey (WebAuthn) registration and authentication to a Node.js backend with @simplewebauthn/server and @simplewebauthn/browser: server-stored single-use challenges, exact `expectedOrigin` and `expectedRPID`, credential storage with public key, counter and transports, user verification policy, and tests that a reused challenge and a wrong origin are rejected.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `auth_mechanism_decision` (object, required): Output of `auth-session-vs-token-decision`; `mfa_methods` must contain `webauthn`.
- `rp_id` (string, required): Relying party ID, the registrable domain the passkeys bind to, for example `example.com`. No scheme, no port.
- `rp_origin` (string, required): Exact origin(s) of the web app, for example `https://app.example.com`, or `http://localhost:3000` in development.

---

## Outputs

- `passkey_change` (object): Package versions, credential table schema, the four endpoints, the user verification policy and its reason, and test output.

---

## Phase 1: Check RP ID and Origin, Install

### Entry Criteria
- `webauthn` is in `auth_mechanism_decision.mfa_methods`.

### Actions
1. Validate `rp_id` against `rp_origin`: the origin's host must equal `rp_id` or end with `.` + `rp_id`. `app.example.com` with `rp_id` `example.com` is valid; `rp_id` `app.example.com` with origin `https://example.com` is invalid. Pick the broadest domain you control that all login hosts share, because credentials cannot move to a different `rp_id` later.
2. Origins must be HTTPS except `http://localhost`, which browsers treat as a secure context.
3. Install: `npm install @simplewebauthn/server` (backend) and `npm install @simplewebauthn/browser` (frontend). Record versions with `npm ls @simplewebauthn/server @simplewebauthn/browser`.
4. Open the installed version's docs (`node_modules/@simplewebauthn/server/README.md` and the type definitions `node_modules/@simplewebauthn/server/esm/**/*.d.ts`). Parameter names changed across majors (for example v10+ uses `credential: { id, publicKey, counter, transports }` in `verifyAuthenticationResponse` and returns `registrationInfo.credential`, while older majors used `authenticator` and `credentialID`/`credentialPublicKey`). Write code against the installed types only.

### Output
Validated RP configuration and installed versions.

### Quality Gate
- The host-suffix rule check for each origin is written out and passes.
- `npx tsc --noEmit` passes on a file importing `generateRegistrationOptions` from the installed package.

---

## Phase 2: Registration

### Entry Criteria
- RP configuration valid.

### Actions
1. Credential table (migration): `id` (credential ID, base64url text, unique), `user_id`, `public_key` (bytes), `counter` (bigint), `transports` (text array or JSON), `device_type` (`singleDevice` or `multiDevice`), `backed_up` (bool), `created_at`, `last_used_at`. Also a stable random `webauthn_user_id` per user (not the email, not the DB integer).
2. `POST /webauthn/register/options` (logged in): call `generateRegistrationOptions({ rpName, rpID: RP_ID, userName: user.email, userID: <webauthn_user_id bytes>, attestationType: 'none', excludeCredentials: existing.map(c => ({ id: c.id, transports: c.transports })), authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' } })`. Store `options.challenge` server-side bound to the session with a creation time. Return the options.
3. Browser: `const resp = await startRegistration({ optionsJSON })` (v11+) or `startRegistration(options)` (older); POST `resp` to the verify route.
4. `POST /webauthn/register/verify`: load and delete the stored challenge in one step (single use). Call `verifyRegistrationResponse({ response: body, expectedChallenge, expectedOrigin: RP_ORIGINS, expectedRPID: RP_ID, requireUserVerification })`. If `verified` is true, save the credential fields from `registrationInfo`.
5. User verification policy table:

| Passkey role | `userVerification` | `requireUserVerification` |
|---|---|---|
| Sole login factor (passwordless) | `'required'` | `true` |
| Second factor after a password | `'preferred'` or `'discouraged'` | `false` |

### Output
Registration endpoints and saved credentials.

### Quality Gate
- A test calling verify twice with the same response returns success then failure (challenge consumed).
- After registering in a browser, `SELECT id, counter, transports FROM webauthn_credentials` shows one row with a non-empty `public_key`.

---

## Phase 3: Authentication

### Entry Criteria
- At least one credential registered.

### Actions
1. `POST /webauthn/login/options`: `generateAuthenticationOptions({ rpID: RP_ID, userVerification, allowCredentials })`. For discoverable-credential (username-less) login, omit `allowCredentials`. Store the challenge server-side.
2. Browser: `startAuthentication({ optionsJSON })` (v11+); for autofill UI pass `useBrowserAutofill: true` and add `autocomplete="username webauthn"` to the username input.
3. `POST /webauthn/login/verify`: consume the challenge; look up the credential by `body.id`; call `verifyAuthenticationResponse({ response: body, expectedChallenge, expectedOrigin: RP_ORIGINS, expectedRPID: RP_ID, credential: { id, publicKey, counter, transports }, requireUserVerification })`.
4. If verified, update `counter = authenticationInfo.newCounter` and `last_used_at`. Counter rule: if both stored and new counters are 0, accept (synced passkeys commonly report 0). If the new counter is not greater than a non-zero stored counter, the library rejects it; log that as a possible cloned authenticator.
5. The credential's `user_id` decides who logs in; never trust a user ID sent by the client.
6. Rotate the session ID after login.

### Output
`passkey_change`.

### Quality Gate
- Test with `expectedOrigin` mismatch (submit a response captured from `http://localhost:3000` to a server configured for `https://app.example.com`) returns `verified: false` or throws.
- Test that an unknown credential ID returns 401 without revealing whether the user exists.

---

## Worked Example

Illustrative only. `rp_id` = `example.com`, `rp_origin` = `https://app.example.com`, passkey as second factor.

Phase 1: `app.example.com` ends with `.example.com`: valid. `npm ls` prints `@simplewebauthn/server@13.1.1`, `@simplewebauthn/browser@13.1.0`.

Phase 2: register in Chrome with a platform authenticator.
```
$ psql -c "select left(id,12), counter, transports, device_type from webauthn_credentials"
    left     | counter | transports           | device_type
-------------+---------+----------------------+-------------
 kT3n9Wq2b_xA|       0 | {hybrid,internal}    | multiDevice
```

Phase 3:
```
$ npx vitest run tests/webauthn.test.ts
 ✓ challenge is single use
 ✓ wrong origin rejected
 ✓ unknown credential returns 401
```

---

## Exit Criteria

DONE when registration and authentication verify against the exact RP ID and origins, challenges are server-stored and single use, credentials store public key, counter and transports, the UV policy matches the passkey's role, and the three negative tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `rp_id` is not a suffix of an origin host | **Stop**: browsers reject the ceremony; get a correct `rp_id` from the user. |
| Phase 1 | Installed version's parameter names differ from this flow | **Adjust**: follow the installed type definitions; record the names used. |
| Phase 2 | Browser throws `NotAllowedError` | **Adjust**: user cancelled or timed out, or the page is not a secure context; retry over HTTPS or localhost. |
| Phase 3 | `Unexpected authentication response origin` | **Adjust**: add the real origin to `RP_ORIGINS`; never disable the origin check. |
| Phase 3 | Counter regression error | **Return**: report the credential ID to the user as a possible clone; do not silently reset the counter. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
