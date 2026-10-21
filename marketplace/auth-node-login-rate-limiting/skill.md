# Auth Node Login Rate Limiting

**One-line description:** Adds per-IP and per-account throttling to Express login, MFA and password-reset routes with express-rate-limit backed by rate-limit-redis, sets Express `trust proxy` to the real hop count, keys account limits on the normalized username, and proves the 429 with a curl loop and a supertest test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `login_handler_findings` (object, required): Output of `auth-login-enumeration-timing-defense`; gives the route locations.
- `rate_limit_policy` (object, required): The user's limits per route and key, windows, and lockout behavior. Numbers come from the user or their security policy.
- `app_base_url` (string, required): Base URL of a local or staging instance.

---

## Outputs

- `rate_limit_config` (object): Package versions, Redis URL source, limiter definitions per route with policy source, `trust proxy` value with its source, and curl and test evidence.

---

## Phase 1: Validate Policy and Install

### Entry Criteria
- The app uses Express: `npm ls express` prints a version. For Fastify use `@fastify/rate-limit` and read its README; the steps below are Express-specific.

### Actions
1. Check the per-account failure limit against NIST SP 800-63B (revision 3, section 5.2.2: no more than 100 consecutive failed attempts per account). Record the revision.
2. Install: `npm install express-rate-limit rate-limit-redis redis`. Record versions with `npm ls express-rate-limit rate-limit-redis redis`.
3. Read the installed express-rate-limit major version. In v7 the option for the request count is `limit` (older versions used `max`) and `standardHeaders` accepts `'draft-6'`, `'draft-7'` or later drafts; confirm in `node_modules/express-rate-limit/readme.md` (or the package's docs for your version) before writing options.

### Output
Installed packages and confirmed option names.

### Quality Gate
- `npm ls` shows one version of each package.
- Option names used in Phase 3 are copied from the installed version's documentation.

---

## Phase 2: Configure Trust Proxy

### Entry Criteria
- Packages installed.

### Actions
1. Count trusted proxies in front of the app (load balancer, ingress, CDN) from deployment files or by asking the user.
2. Set `app.set('trust proxy', <hop count>)` before any limiter is registered. Do NOT set `trust proxy` to `true`: then `req.ip` is the left-most `X-Forwarded-For` value, which the client controls.
3. express-rate-limit v7 logs validation errors such as `ERR_ERL_PERMISSIVE_TRUST_PROXY` or `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` at startup or first request; read the console output and fix any that appear.

### Output
`trust proxy` setting with its source.

### Quality Gate
- `rg -n "trust proxy" src` shows one numeric value.
- App logs show no `ERR_ERL_` validation messages after one login request.

---

## Phase 3: Define and Mount Limiters

### Entry Criteria
- Proxy configured; Redis reachable: `redis-cli -u "$REDIS_URL" ping` prints `PONG`.

### Actions
1. Create `src/security/rateLimit.ts`:
   ```ts
   import { rateLimit } from "express-rate-limit";
   import { RedisStore } from "rate-limit-redis";
   import { createClient } from "redis";

   const client = createClient({ url: process.env.REDIS_URL });
   await client.connect();
   const store = (prefix: string) =>
     new RedisStore({ prefix, sendCommand: (...args: string[]) => client.sendCommand(args) });

   const generic = { error: "Too many attempts. Try again later." };

   export const loginPerIp = rateLimit({
     windowMs: POLICY.login.ip.windowMs, limit: POLICY.login.ip.limit,
     standardHeaders: "draft-7", legacyHeaders: false, store: store("rl:login:ip:"), message: generic,
   });

   export const loginPerAccount = rateLimit({
     windowMs: POLICY.login.account.windowMs, limit: POLICY.login.account.limit,
     standardHeaders: "draft-7", legacyHeaders: false, store: store("rl:login:acct:"), message: generic,
     keyGenerator: (req) => String(req.body?.username ?? "").trim().toLowerCase(),
     skipSuccessfulRequests: true,
   });
   ```
   `POLICY` is loaded from config that holds the user's numbers. Each limiter needs its own `store` instance and prefix; sharing one store between limiters double counts.
2. Mount in order after the JSON body parser (the account key reads `req.body`): `router.post("/login", express.json(), loginPerIp, loginPerAccount, loginHandler)`.
3. Repeat for the MFA verify route and the password reset request route with their own policy numbers and prefixes.
4. `skipSuccessfulRequests: true` counts only failed responses (status 400 or above by default) on the account limiter, matching a "consecutive failures" policy. Leave it off on the per-IP limiter unless the policy says otherwise.
5. Do NOT use the default in-memory store when more than one Node process or pod serves traffic (PM2 cluster, several replicas).

### Output
Mounted limiters.

### Quality Gate
- `rg -n "loginPerIp|loginPerAccount" src` shows both on the login route, and equivalents on MFA verify and reset.
- `npx tsc --noEmit` exits 0 (TypeScript projects).

---

## Phase 4: Prove It Fires

### Entry Criteria
- App restarted.

### Actions
1. With N = policy per-account limit:
   `for i in $(seq $((N+1))); do curl -s -o /dev/null -w '%{http_code} ' -X POST "$APP/login" -H 'Content-Type: application/json' -d '{"username":"Alice@Example.com","password":"wrong"}'; done; echo`
2. Expect `429` at position N+1. Read headers: `curl -s -D - -o /dev/null -X POST "$APP/login" -H 'Content-Type: application/json' -d '{"username":"alice@example.com","password":"wrong"}' | grep -i -E "^ratelimit|^retry-after"`. The lowercase username must also be blocked (normalization check).
3. Inspect Redis keys: `redis-cli -u "$REDIS_URL" --scan --pattern 'rl:login:*'`.
4. Write a supertest test that sends N+1 failed logins and expects the last status to be 429, using an in-memory store in the test config.

### Output
`rate_limit_config`.

### Quality Gate
- Status sequence shows 429 exactly at N+1, and the differently cased username is also blocked.
- The test passes and fails when `loginPerAccount` is removed from the route (mutation check).

---

## Worked Example

Illustrative only. Policy: per account 10 failures per 15 minutes; per IP 100 per 15 minutes; one ALB in front.

Phase 2: `app.set('trust proxy', 1)`.

Phase 4:
```
$ for i in $(seq 11); do curl -s -o /dev/null -w '%{http_code} ' -X POST http://localhost:3000/login -H 'Content-Type: application/json' -d '{"username":"Alice@Example.com","password":"x"}'; done; echo
401 401 401 401 401 401 401 401 401 401 429
$ redis-cli --scan --pattern 'rl:login:*'
rl:login:acct:alice@example.com
rl:login:ip:::ffff:127.0.0.1
$ npx jest tests/rate-limit.test.ts
PASS tests/rate-limit.test.ts
```

---

## Exit Criteria

DONE when login, MFA verify and reset routes have per-IP and per-normalized-account limiters on a shared Redis store, `trust proxy` equals the real hop count, and 429 evidence plus a mutation-checked test are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Policy has no numbers | **Return**: ask the user; do not invent limits. |
| Phase 2 | Hop count unknown | **Return**: ask the user; record the answer. |
| Phase 3 | `keyGenerator` sees `undefined` body | **Adjust**: mount `express.json()` before the limiter. |
| Phase 4 | 429 never appears | **Retry**: check `skipSuccessfulRequests` versus the handler's failure status code and that Redis keys are being written. |
| Phase 4 | All users blocked together | **Adjust**: `req.ip` is the proxy IP; fix `trust proxy`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
