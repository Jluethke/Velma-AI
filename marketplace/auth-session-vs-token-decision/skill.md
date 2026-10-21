# Auth Session vs Token Decision

**One-line description:** Inventories the existing authentication code in a repository, then picks server-side sessions, a backend-for-frontend (BFF), or bearer tokens from a fixed decision table keyed on client type, revocation needs and third-party identity providers, and records the decision as structured fields the rest of the auth chain reads.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_architecture` (object, required): Client types (server-rendered web, SPA, native mobile, CLI, machine-to-machine), the domains each client and API is served from, whether a third-party identity provider (IdP) is used, and the MFA methods product wants (`totp`, `webauthn`, or none).
- `repo_path` (string, required): Absolute path to the repository root.

---

## Outputs

- `auth_inventory` (object): Every file that creates, reads or destroys a session, cookie, JWT, password hash or OAuth token, with file path, line number and the library it uses.
- `auth_mechanism_decision` (object): Fields `mechanism` (`server_session`, `bff_session`, `bearer_token`, `client_credentials`), `external_idp` (bool), `uses_jwt` (bool), `cookie_based` (bool), `mfa_methods` (list), `revocation_requirement` (string), and `decision_rows` (the table rows that produced each choice).

---

## Phase 1: Inventory Existing Auth Code

### Entry Criteria
- `repo_path` exists and is a readable directory.
- `ripgrep` (`rg`) is installed: `rg --version` prints a version.

### Actions
1. Run each search below from `repo_path` and save the raw output. Do not filter the results by directory first; classify after the sweep.
   - Sessions and cookies: `rg -n -i "set-cookie|set_cookie|res\.cookie|express-session|SESSION_COOKIE|SessionMiddleware|cookie-session|gorilla/sessions|scs\." .`
   - JWT: `rg -n -i "jsonwebtoken|\bjose\b|PyJWT|import jwt|golang-jwt|jwt\.(sign|verify|decode|encode|Parse)" .`
   - Password hashing: `rg -n -i "argon2|bcrypt|scrypt|pbkdf2|make_password|check_password|hashpw|md5|sha1\(|sha256\(" .`
   - OAuth and OIDC: `rg -n -i "authorization_code|code_verifier|code_challenge|openid-client|authlib|go-oidc|oauth2\.Config|\.well-known/openid-configuration" .`
   - Token storage in the browser: `rg -n "localStorage\.(setItem|getItem)|sessionStorage\.(setItem|getItem)" --glob "*.{js,jsx,ts,tsx,vue,svelte}" .`
2. For every hit, record file, line, library name and one of the categories: `session`, `cookie`, `jwt`, `password_hash`, `oauth`, `browser_storage`.
3. Read the dependency manifest (`requirements.txt`, `pyproject.toml`, `package.json`, `go.mod`) and record the exact version of every auth library found. Do not guess a version you did not read.

### Output
`auth_inventory` with every hit categorized.

### Quality Gate
- Each of the five `rg` commands was run and its hit count is recorded (zero is a valid count).
- Every library named in `auth_inventory` has a version copied from a dependency manifest line.

---

## Phase 2: Apply the Decision Table

### Entry Criteria
- `auth_inventory` exists.
- `app_architecture` lists at least one client type.

### Actions
1. Evaluate each client type in `app_architecture` against this table, top row first. The first matching row wins for that client.

| # | Client and situation | Mechanism | Source |
|---|---|---|---|
| 1 | Server-rendered web app, same site as its backend | `server_session` (opaque session ID in an HttpOnly cookie) | OWASP Session Management Cheat Sheet |
| 2 | SPA on the same registrable domain as its own API, no third-party IdP | `server_session` | OWASP HTML5 Security Cheat Sheet (do not store session identifiers in localStorage) |
| 3 | SPA that must call a third-party IdP or third-party APIs | `bff_session`: the backend runs the OAuth code flow and holds tokens; the browser holds only a session cookie | IETF draft "OAuth 2.0 for Browser-Based Applications" (BFF pattern) |
| 4 | Native mobile or desktop app | `bearer_token` via authorization code + PKCE in the system browser, tokens in Keychain or Android Keystore | RFC 8252, RFC 7636 |
| 5 | CLI tool acting for a user | `bearer_token` via device authorization grant or loopback redirect with PKCE | RFC 8628, RFC 8252 section 7.3 |
| 6 | Service-to-service with no user | `client_credentials` with `private_key_jwt` or mutual TLS client auth | RFC 6749 section 4.4, RFC 7523, RFC 8705 |

2. Apply these overrides after the table:
   - If `app_architecture` says revocation must take effect on the next request (for example on logout or account disable), and the row chose `bearer_token`, then access tokens must be opaque and checked by introspection (RFC 7662), or self-contained JWTs must be paired with a server-side deny list. Record which.
   - If any client in `auth_inventory` stores a token in `localStorage` or `sessionStorage`, record it as a finding: any XSS can read it.
   - If `app_architecture` names a third-party IdP, set `external_idp` = true.
3. Set `uses_jwt` = true if any chosen mechanism issues or accepts JWTs, or if `auth_inventory` contains `jwt` hits.
4. Set `cookie_based` = true if any client got `server_session` or `bff_session`.
5. Copy `mfa_methods` from `app_architecture`. Do not add methods product did not ask for.

### Output
Per-client mechanism with the table row number that selected it.

### Quality Gate
- Every client type in `app_architecture` has exactly one mechanism and a row number from the table.
- Every override that fired is listed with its trigger.

---

## Phase 3: Record the Decision

### Entry Criteria
- Phase 2 table results exist.

### Actions
1. Write `auth_mechanism_decision` as JSON with the fields listed in Outputs.
2. For each mismatch between the decision and the current code in `auth_inventory` (for example the decision is `bff_session` but the SPA stores a JWT in `localStorage`), add a `migration_items` entry naming file and line.
3. Do not change any code in this flow. This flow decides; later flows implement.

### Output
`auth_mechanism_decision` and `auth_inventory`.

### Quality Gate
- `auth_mechanism_decision` parses as JSON: `python -c "import json,sys; json.load(open(sys.argv[1]))" decision.json` exits 0.
- `git status --porcelain` shows no modified source files (only the decision file, if saved in the repo).

---

## Worked Example

Illustrative only. Input `app_architecture`: React SPA at `app.example.com`, API at `api.example.com`, login through Okta, MFA wanted: `webauthn`.

Phase 1 command and representative output:
```
$ rg -n "localStorage\.(setItem|getItem)" --glob "*.{js,ts,tsx}" .
src/auth/tokenStore.ts:12:  localStorage.setItem("access_token", tokens.access_token);
```
`package.json` shows `"oidc-client-ts": "3.0.1"`.

Phase 2: SPA with a third-party IdP matches row 3, so `mechanism` = `bff_session`, `external_idp` = true, `cookie_based` = true, `uses_jwt` = true (Okta ID tokens are JWTs). Override fired: token in `localStorage`.

Phase 3 output (excerpt):
```json
{"mechanism": "bff_session", "external_idp": true, "uses_jwt": true, "cookie_based": true,
 "mfa_methods": ["webauthn"], "revocation_requirement": "next request",
 "decision_rows": {"spa": 3},
 "migration_items": [{"file": "src/auth/tokenStore.ts", "line": 12, "issue": "access token in localStorage"}]}
```

---

## Exit Criteria

DONE when every client has one mechanism traced to a table row, `auth_inventory` lists every auth-related hit with its library version, and no source file was modified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `rg` not installed | **Adjust**: use `git grep -n -i -E` with the same patterns; record that `git grep` was used. |
| Phase 1 | Auth library version not found in any manifest | **Return**: list the library as `version: unknown` and ask the user; do not guess. |
| Phase 2 | A client type matches no row | **Stop**: report the client type as an open question; do not invent a row. |
| Phase 2 | `app_architecture` omits revocation needs | **Return**: ask the user how fast logout and account disable must take effect. |
| Phase 3 | Decision conflicts with a hard constraint the user stated | **Return**: present both the table result and the constraint; let the user choose. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
