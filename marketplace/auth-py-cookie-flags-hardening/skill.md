# Auth Python Cookie Flags Hardening

**One-line description:** Sets and verifies `Secure`, `HttpOnly`, `SameSite`, `Path` and the `__Host-` name prefix on every auth cookie in Django, Flask (including Flask-Login's remember cookie) and FastAPI/Starlette using each framework's exact setting names, fixes HTTPS detection behind a proxy, and proves the result by reading `Set-Cookie` headers with curl and `manage.py check --deploy`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `auth_mechanism_decision` (object, required): Output of `auth-session-vs-token-decision`; `cookie_based` should be true.
- `app_base_url` (string, required): HTTPS base URL of a staging instance (or `https://localhost:<port>` with a dev certificate).

---

## Outputs

- `cookie_audit` (object): Every cookie the app sets with its flags before and after, the setting names changed, and the curl evidence.

---

## Phase 1: List Cookies and Current Flags

### Entry Criteria
- The app is reachable at `app_base_url`.

### Actions
1. Trigger login and capture headers: `curl -s -k -D - -o /dev/null -c jar.txt -X POST "$APP/login" -d 'username=...&password=...' | grep -i '^set-cookie'` (use the real login form or JSON fields).
2. Also capture the first GET of a form page (CSRF cookie) and the logout response.
3. For each cookie, record: name, `Secure`, `HttpOnly`, `SameSite` value, `Path`, `Domain`, `Max-Age`/`Expires`.
4. Required target per cookie (from RFC 6265bis and the OWASP Session Management Cheat Sheet):

| Cookie | Secure | HttpOnly | SameSite | Name prefix |
|---|---|---|---|---|
| Session ID | yes | yes | `Lax` (or `Strict` if no cross-site top-level login entry is needed) | `__Host-` when no `Domain` is needed |
| Remember-me | yes | yes | `Lax` | `__Host-` |
| Refresh token (if in cookie) | yes | yes | `Strict` | path-scoped, so no `__Host-`; use `__Secure-` |
| CSRF token cookie (double submit or Django) | yes | no if JavaScript must read it, otherwise yes | `Lax` or `Strict` | `__Host-` |

   `__Host-` requires `Secure`, `Path=/` and no `Domain` attribute; browsers reject the cookie otherwise. `SameSite=None` requires `Secure`.

### Output
Cookie table before.

### Quality Gate
- Every `Set-Cookie` line from the three responses is in the table.

---

## Phase 2: Apply Framework Settings

### Entry Criteria
- Cookie table exists.

### Actions
1. Django (`settings.py`):
   ```python
   SESSION_COOKIE_SECURE = True
   SESSION_COOKIE_HTTPONLY = True          # default True
   SESSION_COOKIE_SAMESITE = "Lax"         # default "Lax"
   SESSION_COOKIE_NAME = "__Host-sessionid"
   CSRF_COOKIE_SECURE = True
   CSRF_COOKIE_SAMESITE = "Lax"
   CSRF_COOKIE_NAME = "__Host-csrftoken"
   SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")  # only if the proxy sets and strips this header
   ```
   Leave `SESSION_COOKIE_DOMAIN` and `CSRF_COOKIE_DOMAIN` as `None` and paths as `"/"` for the `__Host-` names. If JavaScript reads the CSRF cookie, keep `CSRF_COOKIE_HTTPONLY = False` (default).
2. Flask (`app.config`):
   ```python
   app.config.update(
       SESSION_COOKIE_SECURE=True, SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax",
       SESSION_COOKIE_NAME="__Host-session",
       REMEMBER_COOKIE_SECURE=True, REMEMBER_COOKIE_HTTPONLY=True, REMEMBER_COOKIE_SAMESITE="Lax",
   )
   ```
   Flask's `SESSION_COOKIE_SAMESITE` default is `None` (attribute omitted), so set it. The `REMEMBER_COOKIE_*` keys belong to Flask-Login; confirm in its docs for your version. Behind a proxy add `ProxyFix(app.wsgi_app, x_proto=1)` so Flask knows the request is HTTPS.
3. FastAPI/Starlette: `app.add_middleware(SessionMiddleware, secret_key=..., session_cookie="__Host-session", same_site="lax", https_only=True)`. For manual cookies: `response.set_cookie("__Host-sid", value, httponly=True, secure=True, samesite="lax", path="/")`. Run uvicorn with `--proxy-headers --forwarded-allow-ips=<proxy ip>`.
4. Grep for manual cookies that bypass settings: `rg -n "set_cookie\(" .` and fix each call to pass the flags explicitly.
5. Renaming the session cookie logs everyone out once. Tell the user before deploy.

### Output
Updated settings.

### Quality Gate
- Django: `python manage.py check --deploy` output contains none of `security.W012` (SESSION_COOKIE_SECURE), `security.W013` (SESSION_COOKIE_HTTPONLY) or `security.W016` (CSRF_COOKIE_SECURE).
- `rg -n "set_cookie\(" .` hits all pass `secure=True` and `httponly=True` (or are the CSRF cookie with a documented reason).

---

## Phase 3: Verify on the Wire

### Entry Criteria
- App restarted with new settings.

### Actions
1. Rerun the Phase 1 curl commands and rebuild the cookie table.
2. Confirm in a browser: DevTools > Application > Cookies shows the cookie stored (a rejected `__Host-` cookie simply does not appear; the Console or Issues tab explains why).
3. Add a test with the framework test client asserting the login response `Set-Cookie` contains `Secure`, `HttpOnly` and `SameSite=Lax` for the session cookie. Django test client uses HTTP by default; pass `secure=True` to the request.

### Output
`cookie_audit`.

### Quality Gate
- Every row of the after-table matches the Phase 1 target table.
- The cookie flag test passes and fails if `SESSION_COOKIE_SECURE` is set to `False` (mutation check).

---

## Worked Example

Illustrative only. Flask app behind nginx.

Phase 1:
```
$ curl -s -k -D - -o /dev/null -X POST https://staging.example.com/login -d 'username=a&password=b' | grep -i '^set-cookie'
Set-Cookie: session=eyJfZnJlc2gi...; HttpOnly; Path=/
Set-Cookie: remember_token=1|9f2c...; Expires=Thu, 19 Nov 2026 10:00:00 GMT; HttpOnly; Path=/
```
Missing `Secure` and `SameSite` on both.

Phase 3:
```
Set-Cookie: __Host-session=eyJfZnJlc2gi...; Secure; HttpOnly; Path=/; SameSite=Lax
Set-Cookie: remember_token=1|9f2c...; Expires=Thu, 19 Nov 2026 10:00:00 GMT; Secure; HttpOnly; Path=/; SameSite=Lax
$ pytest -q tests/test_cookie_flags.py
1 passed in 0.12s
```

---

## Exit Criteria

DONE when every auth cookie carries the target flags from the Phase 1 table, verified on the wire and by a mutation-checked test, and Django deploy checks (if Django) show no cookie warnings.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No HTTPS environment available | **Adjust**: run locally with `mkcert` certificates or a TLS-terminating proxy; `Secure` cookies are not sent over plain HTTP (except to localhost in some browsers). |
| Phase 2 | Login loop after enabling `Secure` | **Adjust**: the app thinks requests are HTTP behind the proxy; fix `SECURE_PROXY_SSL_HEADER` or `ProxyFix`. |
| Phase 2 | OAuth callback loses session with `SameSite=Strict` | **Adjust**: use `Lax` for the session cookie; `Strict` cookies are not sent on the IdP's cross-site redirect back. |
| Phase 3 | `__Host-` cookie missing in browser | **Adjust**: remove the `Domain` attribute and set `Path=/`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
