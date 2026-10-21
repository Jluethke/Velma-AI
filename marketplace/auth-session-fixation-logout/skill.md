# Auth Session Fixation and Logout

**One-line description:** Ensures the session identifier is regenerated at every privilege change (login, MFA completion, role change) and that logout, password change and idle or absolute timeouts invalidate the session on the server, with the exact calls for Django (`login()`/`cycle_key`, `logout()`), Flask (Flask-Login plus server-side Flask-Session), Express (`req.session.regenerate`/`destroy`, Passport 0.6+) and Go (`alexedwards/scs` `RenewToken`), proven by a cookie-replay test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `auth_mechanism_decision` (object, required): Output of `auth-session-vs-token-decision`.
- `session_timeout_policy` (object, required): Idle and absolute session timeouts from the user's policy, and the NIST SP 800-63B revision and AAL they follow, if any.

---

## Outputs

- `session_lifecycle_report` (object): Where the session ID is regenerated, how logout and password change invalidate sessions, timeout settings with source, and replay test results.

---

## Phase 1: Map Session Lifecycle Events

### Entry Criteria
- `auth_mechanism_decision.cookie_based` is true (else emit `applies: false`).

### Actions
1. Locate the events: login success, MFA success, privilege change (role grant, "sudo mode"), logout, password change, password reset completion, account disable.
   `rg -n -i "def (login|logout)|login_user|logout_user|req\.login|req\.logout|session\.(regenerate|destroy|cycle_key|flush|clear)|RenewToken|Destroy\(" .`
2. Identify the session store type:

| Store | Server can revoke a session? |
|---|---|
| Django database, cache or Redis backend | yes |
| Django `signed_cookies` backend | no |
| Flask default `session` (signed cookie) | no |
| Flask-Session (Redis, SQLAlchemy) | yes |
| express-session with a store (Redis, Postgres) | yes |
| cookie-session | no |
| Go `scs` with a server store | yes |
| Self-contained JWT in a cookie with no deny list | no |

3. If the store cannot revoke, record a finding: logout only deletes the browser copy; a stolen cookie stays valid until it expires.

### Output
Event map and store type.

### Quality Gate
- Every event in step 1 has a file and line, or "missing".
- Store type is named from config (for example `SESSION_ENGINE` value).

---

## Phase 2: Regenerate and Invalidate

### Entry Criteria
- Event map exists.

### Actions
1. Login and MFA success:
   - Django: `django.contrib.auth.login(request, user)` calls `request.session.cycle_key()`. After MFA in a custom flow, call `request.session.cycle_key()` yourself.
   - Flask: Flask-Login `login_user` does not rotate a server-side session ID; with Flask-Session, call `session.clear()` before `login_user`, and confirm the cookie value changes (check the Flask-Session docs for a regenerate helper in your version).
   - Express: `req.session.regenerate(err => { req.session.userId = user.id; req.session.save(cb) })`. Passport 0.6.0 and later regenerate the session inside `req.login()`; check `npm ls passport`.
   - Go `scs`: `sessionManager.RenewToken(r.Context())` before `sessionManager.Put(ctx, "userID", id)`.
2. Logout:
   - Django: `django.contrib.auth.logout(request)` (flushes).
   - Flask: `logout_user()` plus `session.clear()`; with Flask-Session the server record is removed.
   - Express: `req.session.destroy(cb)` then `res.clearCookie(name, sameOptionsAsSet)`; Passport 0.6+ `req.logout(cb)` is asynchronous and needs the callback.
   - Go `scs`: `sessionManager.Destroy(r.Context())`.
   - Logout must be POST (CSRF-protected), not GET.
3. Password change and reset: invalidate the user's other sessions. Django: `update_session_auth_hash(request, user)` keeps the current session and invalidates others because the session stores a hash of the password. Elsewhere: keep a per-user `session_version` integer, store it in the session at login, increment it on password change, and reject sessions whose stored version is lower. Also revoke refresh token families (`auth-refresh-token-rotation`).
4. Timeouts: set idle and absolute values from `session_timeout_policy` only. Django `SESSION_COOKIE_AGE` (absolute) with `SESSION_SAVE_EVERY_REQUEST = True` behaves as idle; for both, store the login time in the session and check it in middleware. Express: `cookie.maxAge` with `rolling: true` gives idle; check a stored login time for absolute. scs: `sessionManager.IdleTimeout` and `sessionManager.Lifetime`.
5. If `session_timeout_policy` is empty, report an open question; do not choose numbers.

### Output
Patched lifecycle code.

### Quality Gate
- Every event from Phase 1 now has a regenerate or invalidate call cited by file and line.
- `rg -n -i "get\(['\"]/logout|path\(['\"]logout.*GET" .` finds no GET logout route.

---

## Phase 3: Replay Tests

### Entry Criteria
- Code patched.

### Actions
1. Fixation test: GET the login page, save the pre-login session cookie value, log in, assert the post-login cookie value differs, then send a request with the pre-login value and assert it is anonymous.
2. Logout replay test: log in, save the cookie, log out, replay the saved cookie on a protected route, assert 401, 403 or a redirect to login.
   With curl: `curl -s -c jar.txt -X POST "$APP/login" ...`; `cp jar.txt saved.txt`; `curl -s -b jar.txt -X POST "$APP/logout"`; `curl -s -o /dev/null -w '%{http_code}\n' -b saved.txt "$APP/account"`.
3. Password change test: two clients log in as the same user; client A changes the password; client B's next request is rejected.
4. Run the stack test command.

### Output
`session_lifecycle_report`.

### Quality Gate
- Three tests pass.
- Mutation check: remove the regenerate call; the fixation test fails; revert.

---

## Worked Example

Illustrative only. Express with express-session and connect-redis, Passport 0.5.3.

Phase 1: store is Redis (revocable). `npm ls passport` prints `passport@0.5.3`, which does not regenerate on login.

Phase 2: upgrade to `passport@0.7.0`; `req.logout` gets a callback; logout route changed from GET to POST.

Phase 3:
```
$ curl -s -o /dev/null -w '%{http_code}\n' -b saved.txt https://staging.example.com/account
302
$ npx jest tests/session-lifecycle.test.ts
Tests: 3 passed, 3 total
```

---

## Exit Criteria

DONE when the session ID changes at login and MFA, logout and password change invalidate server-side state, timeouts come from the user's policy, and the three replay tests pass with a mutation check.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Store cannot revoke (signed cookie) | **Return**: recommend a server-side store; record the finding if the user declines. |
| Phase 2 | Upgrading Passport breaks `req.logout()` calls | **Adjust**: pass a callback to every `req.logout` call (required since 0.6.0). |
| Phase 2 | No timeout policy | **Return**: ask the user; list it as an open question. |
| Phase 3 | Replay still succeeds after logout | **Stop**: the server record is not deleted; inspect the store (for example `redis-cli --scan --pattern 'sess:*'`). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
