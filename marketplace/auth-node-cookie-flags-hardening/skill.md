# Auth Node Cookie Flags Hardening

**One-line description:** Sets and verifies `Secure`, `HttpOnly`, `SameSite`, `Path` and the `__Host-` prefix on every auth cookie in Express (express-session, cookie-session, `res.cookie`), Fastify (`@fastify/cookie`, `@fastify/session`) and Next.js (`cookies().set`), including `trust proxy` so `Secure` cookies are issued behind TLS-terminating proxies, proven with curl `Set-Cookie` output and a supertest assertion.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `auth_mechanism_decision` (object, required): Output of `auth-session-vs-token-decision`; `cookie_based` should be true.
- `app_base_url` (string, required): HTTPS base URL of a staging instance.

---

## Outputs

- `cookie_audit` (object): Every cookie set with flags before and after, the option names changed, the `trust proxy` value, and curl and test evidence.

---

## Phase 1: List Cookies and Flags

### Entry Criteria
- App reachable at `app_base_url`.

### Actions
1. Find cookie writers: `rg -n "express-session|cookie-session|res\.cookie\(|reply\.setCookie\(|cookies\(\)\.set\(|@fastify/(cookie|session|secure-session)" --glob "*.{js,ts,mjs,cjs}" .`
2. Capture headers after login, on a form page, and after logout: `curl -s -D - -o /dev/null -X POST "$APP/login" -H 'Content-Type: application/json' -d '{"username":"...","password":"..."}' | grep -i '^set-cookie'`.
3. Fill the cookie table (name, Secure, HttpOnly, SameSite, Path, Domain, Max-Age) and compare with the target:

| Cookie | Secure | HttpOnly | SameSite | Name |
|---|---|---|---|---|
| Session | yes | yes | `lax` (`strict` if no cross-site login redirect is needed) | `__Host-sid` |
| Refresh token | yes | yes | `strict` | `__Secure-rt` with `path: "/auth/refresh"` |
| CSRF (double submit) | yes | per library docs | `lax` or `strict` | `__Host-` prefix |

   express-session's default name is `connect.sid` and default cookie is `{ path: '/', httpOnly: true, secure: false, maxAge: null }`, so `secure` must be set.

### Output
Before table.

### Quality Gate
- Every `Set-Cookie` header from the three responses is in the table.

---

## Phase 2: Apply Options

### Entry Criteria
- Before table exists.

### Actions
1. Express with express-session:
   ```ts
   app.set("trust proxy", 1); // hop count from the deployment, not `true`
   app.use(session({
     name: "__Host-sid",
     secret: process.env.SESSION_SECRET!,
     resave: false,
     saveUninitialized: false,
     store,                          // connect-redis, connect-pg-simple, etc.; never MemoryStore in production
     cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
   }));
   ```
   Without `trust proxy` (or the session option `proxy: true`), express-session will not send a `secure` cookie when TLS ends at the proxy, because `req.secure` is false.
2. Manual cookies: `res.cookie("__Secure-rt", token, { httpOnly: true, secure: true, sameSite: "strict", path: "/auth/refresh", maxAge: REFRESH_MS })`. `res.clearCookie` must pass the same `path` and name, or the browser keeps the cookie.
3. cookie-session: `cookieSession({ name: "__Host-session", keys: [...], secure: true, httpOnly: true, sameSite: "lax" })`. It stores data client-side; it cannot revoke on logout (see `auth-session-fixation-logout`).
4. Fastify: `reply.setCookie(name, value, { httpOnly: true, secure: true, sameSite: "lax", path: "/" })`; for `@fastify/session` put the same keys under `cookie: {...}` and `cookieName`. Read the installed plugin README for option names.
5. Next.js App Router: `(await cookies()).set({ name: "__Host-sid", value, httpOnly: true, secure: true, sameSite: "lax", path: "/" })` (in Next 15 `cookies()` is async; in 14 it is sync; check your version).
6. Edit one file at a time and rerun the app's tests after each.

### Output
Updated cookie options.

### Quality Gate
- `rg -n "secure:\s*false|sameSite:\s*['\"]none['\"]" --glob "*.{js,ts}" .` has no hits on auth cookies (or each has a recorded reason; `none` must also have `secure: true`).
- `rg -n "MemoryStore|saveUninitialized:\s*true" .` has no hits in production config.

---

## Phase 3: Verify

### Entry Criteria
- App restarted.

### Actions
1. Rerun the Phase 1 curl commands and build the after table.
2. supertest assertion:
   ```ts
   const res = await request(app).post("/login").set("X-Forwarded-Proto", "https").send(creds);
   const c = res.headers["set-cookie"].find((s: string) => s.startsWith("__Host-sid="));
   expect(c).toMatch(/; Secure/); expect(c).toMatch(/; HttpOnly/); expect(c).toMatch(/; SameSite=Lax/i);
   ```
   The `X-Forwarded-Proto` header makes `req.secure` true when `trust proxy` is set; without it express-session withholds the cookie in tests.
3. Browser check: DevTools > Application > Cookies shows each cookie; rejected `__Host-` cookies show a warning in the Issues tab.

### Output
`cookie_audit`.

### Quality Gate
- After table matches the target for every cookie.
- The supertest test passes and fails when `secure: true` is changed to `false` (mutation check).

---

## Worked Example

Illustrative only. Express behind an AWS ALB.

Phase 1:
```
$ curl -s -D - -o /dev/null -X POST https://staging.example.com/login -H 'Content-Type: application/json' -d '{"username":"a","password":"b"}' | grep -i '^set-cookie'
Set-Cookie: connect.sid=s%3AqZ...; Path=/; HttpOnly
```

Phase 2: `app.set("trust proxy", 1)`, name `__Host-sid`, `secure: true`, `sameSite: "lax"`.

Phase 3:
```
Set-Cookie: __Host-sid=s%3AqZ...; Path=/; HttpOnly; Secure; SameSite=Lax
$ npx jest tests/cookie-flags.test.ts
PASS tests/cookie-flags.test.ts
```

---

## Exit Criteria

DONE when every auth cookie set by the Node app carries the target flags, `trust proxy` equals the real hop count, and wire evidence plus a mutation-checked test are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cookies set by a gateway or CDN, not the app | **Adjust**: audit that layer's config and record it in `cookie_audit`. |
| Phase 2 | Session cookie disappears after enabling `secure` | **Adjust**: set `trust proxy` (or `proxy: true`); confirm the proxy sends `X-Forwarded-Proto: https`. |
| Phase 2 | Cross-site embedded app needs cookies | **Return**: `SameSite=None; Secure` widens CSRF exposure; get explicit user approval and pair with `auth-csrf-defense-verification`. |
| Phase 3 | Logout leaves cookie in browser | **Adjust**: `clearCookie` must use the same name, path and domain options as when set. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
