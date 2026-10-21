# Auth CSRF Defense Verification

**One-line description:** Picks and verifies the CSRF defense for cookie-authenticated apps per the OWASP CSRF Prevention Cheat Sheet (synchronizer token, signed double-submit cookie, Fetch Metadata `Sec-Fetch-Site` filtering, Origin checks, SameSite as defense in depth) with framework-specific setup for Django `CsrfViewMiddleware`, Flask-WTF `CSRFProtect`, Express `csrf-csrf` (since `csurf` is deprecated) and Go `http.CrossOriginProtection` or `gorilla/csrf`, then attacks every state-changing route with curl.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `auth_mechanism_decision` (object, required): Output of `auth-session-vs-token-decision`.
- `app_base_url` (string, required): Base URL of a local or staging instance.

---

## Outputs

- `csrf_defense_report` (object): Applicability, chosen defense and table row, every state-changing route with its protection status, exempted routes with reasons, and curl attack results.

---

## Phase 1: Applicability and Route List

### Entry Criteria
- `auth_mechanism_decision` exists.

### Actions
1. Applicability:
   - If `cookie_based` is false and every API call carries `Authorization: Bearer` set by JavaScript (never a cookie), CSRF does not apply to those routes; record that and check only routes that read cookies.
   - If any route authenticates via a cookie (session, remember-me, BFF), CSRF applies.
2. List every state-changing route (POST, PUT, PATCH, DELETE), plus any GET that changes state (a bug by itself; record it):
   - Django: `python manage.py show_urls` (needs `django-extensions`), then read each view's allowed methods.
   - Flask: `flask routes`.
   - Express: `rg -n "\.(post|put|patch|delete)\(" --glob "*.{js,ts}" .`
   - Go: `rg -n "HandleFunc\(|Handle\(|\.(Post|Put|Patch|Delete)\(" --type go .`; Go 1.22+ patterns like `"POST /items"` also appear in `HandleFunc`.
3. Find existing exemptions: `rg -n "csrf_exempt|WTF_CSRF_ENABLED|csrf\.exempt|ignoreMethods|csrf.Exempt" .`

### Output
Route list and exemptions.

### Quality Gate
- Each route has method, path and handler file.
- Every exemption has a recorded reason or is marked for removal.

---

## Phase 2: Choose and Configure the Defense

### Entry Criteria
- CSRF applies.

### Actions
1. Choose by stack (first match):

| # | Stack and app type | Defense |
|---|---|---|
| 1 | Django | Built-in `django.middleware.csrf.CsrfViewMiddleware` (synchronizer-style token, plus Origin/Referer checks on HTTPS). Templates use `{% csrf_token %}`; AJAX sends header `X-CSRFToken`. Set `CSRF_TRUSTED_ORIGINS` with full scheme, for example `["https://app.example.com"]` (Django 4.0+ requires the scheme). |
| 2 | Flask | Flask-WTF: `CSRFProtect(app)`; forms include `{{ csrf_token() }}`; AJAX sends `X-CSRFToken`. |
| 3 | FastAPI with cookie auth | Fetch Metadata plus Origin check middleware (row 6 logic), or a maintained CSRF middleware the user approves; read its README. |
| 4 | Express | `csrf-csrf` (`doubleCsrf({ getSecret, getSessionIdentifier, cookieName: "__Host-psifi.x-csrf-token", cookieOptions: { sameSite: "lax", secure: true } })`); option names vary by major version, so read the installed README. Do NOT install `csurf`; it was deprecated by its maintainers. |
| 5 | Go 1.25 or later | `cop := http.NewCrossOriginProtection()`; `cop.AddTrustedOrigin("https://app.example.com")` if needed; wrap with `cop.Handler(mux)`. Confirm with `go doc net/http.CrossOriginProtection`. |
| 6 | Go before 1.25 | `github.com/gorilla/csrf`: `csrf.Protect(authKey, csrf.Secure(true), csrf.SameSite(csrf.SameSiteLaxMode))(mux)`; templates use `csrf.TemplateField(r)`. |

2. Defense in depth for every row: session cookie `SameSite=Lax` (from the cookie flow), and reject requests where `Sec-Fetch-Site` is `cross-site` on state-changing methods unless the route is an intended cross-site endpoint.
3. Never protect only with "check the `Content-Type` is JSON"; HTML forms cannot send JSON, but this breaks if the server also parses `text/plain` or form bodies.
4. Remove exemptions that have no recorded reason. Webhooks from third parties are a valid exemption if they authenticate by signature instead of cookie.

### Output
Configured defense.

### Quality Gate
- `rg -n "csurf" package.json` has no hits (Node).
- The middleware or handler wrapper appears once in the app setup file, cited by file and line.

---

## Phase 3: Attack Every Route

### Entry Criteria
- Defense configured; a logged-in cookie jar exists: log in with `curl -c jar.txt ...`.

### Actions
1. For each state-changing route, send three forged requests with the valid session cookie:
   ```
   # a) no token
   curl -s -o /dev/null -w '%{http_code}\n' -b jar.txt -X POST "$APP/account/email" -d 'email=attacker@example.net'
   # b) foreign Origin
   curl -s -o /dev/null -w '%{http_code}\n' -b jar.txt -H 'Origin: https://evil.example' -X POST "$APP/account/email" -d 'email=attacker@example.net'
   # c) Fetch Metadata cross-site
   curl -s -o /dev/null -w '%{http_code}\n' -b jar.txt -H 'Sec-Fetch-Site: cross-site' -X POST "$APP/account/email" -d 'email=attacker@example.net'
   ```
   Expected: `403` (Django and Flask-WTF return 400 or 403; record what you see) for each, and the state unchanged (read it back).
2. Send one legitimate request with the token (from the form page or cookie) and the same-site Origin; expect success.
3. Turn these into automated tests with the framework client.
4. Do NOT mark a route as passing based only on the status code; read the resource back to confirm nothing changed.

### Output
`csrf_defense_report`.

### Quality Gate
- Every route shows rejection for (a); routes covered by Origin or Fetch Metadata logic also reject (b) and (c).
- The automated test fails when the middleware is removed (mutation check).

---

## Worked Example

Illustrative only. Express app with session cookie, `stack` = node.

Phase 1: `rg` finds 14 POST/PUT/DELETE routes; one `GET /logout` (state change via GET, recorded; changed to POST).

Phase 2: row 4, `csrf-csrf` installed; `npm ls csrf-csrf` prints `csrf-csrf@3.1.0`.

Phase 3:
```
no token:          403
foreign Origin:    403
cross-site fetch:  403
legit with token:  200
$ npx jest tests/csrf.test.ts
Tests: 15 passed, 15 total
```

---

## Exit Criteria

DONE when every cookie-authenticated state-changing route rejects forged requests (missing token, foreign Origin, cross-site Fetch Metadata) with the resource unchanged, exemptions are justified, and the tests are mutation-checked.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No way to list routes automatically | **Adjust**: grep handler registrations and read the router files; record that the list is grep-based. |
| Phase 2 | Django `CSRF verification failed. Origin checking failed` on legit requests | **Adjust**: add the exact origin with scheme to `CSRF_TRUSTED_ORIGINS`. |
| Phase 2 | Go version below 1.25 and gorilla/csrf not allowed | **Return**: ask the user which defense to adopt; do not hand-roll token crypto. |
| Phase 3 | A forged request succeeds | **Stop**: fix that route before testing others; record it as a finding. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
