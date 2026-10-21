# Auth Python Login Rate Limiting

**One-line description:** Adds per-IP and per-account throttling to Python login, MFA and password-reset endpoints with Flask-Limiter (Flask), django-ratelimit or django-axes (Django), or slowapi (FastAPI) on a shared Redis store, with correct client-IP extraction behind a proxy, limits taken from the user's policy, and a curl loop that proves 429 responses.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `login_handler_findings` (object, required): Output of `auth-login-enumeration-timing-defense`; gives the handler locations.
- `rate_limit_policy` (object, required): The user's limits per endpoint and key (for example per IP and per account), the window, and whether lockout is temporary. Numbers must come from the user or their security policy.
- `app_base_url` (string, required): Base URL of a local or staging instance.

---

## Outputs

- `rate_limit_config` (object): Library and version, storage URI, key functions, the exact limit strings per endpoint with their policy source, proxy settings, and the curl evidence showing the first 429.

---

## Phase 1: Validate the Policy and Pick the Library

### Entry Criteria
- `rate_limit_policy` gives at least one numeric limit for the login endpoint.

### Actions
1. Check the policy against NIST SP 800-63B rate limiting (section 5.2.2 in revision 3): a verifier must limit consecutive failed attempts on a single account to no more than 100. If the per-account failure limit in the policy is above 100, return it to the user as non-conforming. Record the revision you checked.
2. Pick the library by framework:

| Framework (from imports) | Library | Install |
|---|---|---|
| Flask | Flask-Limiter | `pip install "Flask-Limiter[redis]"` |
| Django, need per-view limits | django-ratelimit | `pip install django-ratelimit` |
| Django, need failed-login lockout per account | django-axes | `pip install django-axes` |
| FastAPI or Starlette | slowapi | `pip install slowapi` |

3. Storage: every worker process and every instance must share counters. If more than one process serves requests (gunicorn `-w` above 1, several pods), use Redis (`redis://...`). In-memory storage is only for a single-process local run.

### Output
Library choice and storage URI.

### Quality Gate
- Every policy number is copied from `rate_limit_policy` with its source named.
- The storage choice states the worker count it was based on (read from the gunicorn or uvicorn command line).

---

## Phase 2: Get the Real Client IP

### Entry Criteria
- Library chosen.

### Actions
1. Find out how many trusted proxies sit in front of the app (load balancer, ingress). Ask the user if the deployment files do not say.
2. Configure the framework to read exactly that many hops of `X-Forwarded-For`:
   - Flask: `from werkzeug.middleware.proxy_fix import ProxyFix`; `app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)` with `x_for` equal to the number of trusted proxies. Then Flask-Limiter's `get_remote_address` reads the corrected `request.remote_addr`.
   - Django: django-ratelimit `key='ip'` uses `REMOTE_ADDR`; behind a proxy set `RATELIMIT_IP_META_KEY` per the django-ratelimit docs. django-axes: configure the `AXES_IPWARE_*` or client IP settings for your installed version (names changed between major versions; read the installed version's docs).
   - FastAPI/uvicorn: run uvicorn with `--proxy-headers --forwarded-allow-ips="<proxy ip>"`; slowapi's `get_remote_address` then reads the client IP.
3. Do NOT trust the left-most `X-Forwarded-For` value without a proxy count; any client can send that header and rotate it to escape the per-IP limit.

### Output
Proxy configuration.

### Quality Gate
- The configured hop count equals the trusted proxy count named in a deployment file or a user answer, recorded with its source.
- A temporary log line printing the limiter key, hit once through the real proxy in staging, shows your own client IP and not the proxy's IP. Remove the log line afterward.

---

## Phase 3: Apply Limits

### Entry Criteria
- Proxy configuration done.

### Actions
1. Flask-Limiter:
   ```python
   from flask_limiter import Limiter
   from flask_limiter.util import get_remote_address
   limiter = Limiter(get_remote_address, app=app, storage_uri=os.environ["RATELIMIT_STORAGE_URI"])

   def account_key():
       return "acct:" + (request.get_json(silent=True) or {}).get("username", "").strip().lower()

   @app.post("/login")
   @limiter.limit(POLICY_LOGIN_PER_IP)                       # e.g. "20 per minute" from the policy
   @limiter.limit(POLICY_LOGIN_PER_ACCOUNT, key_func=account_key)
   def login(): ...
   ```
2. django-ratelimit: `@ratelimit(key="ip", rate=POLICY_LOGIN_PER_IP, method="POST", block=True)` and `@ratelimit(key="post:username", rate=POLICY_LOGIN_PER_ACCOUNT, method="POST", block=True)`; map the raised `Ratelimited` exception to HTTP 429 in a middleware or view handler (by default it becomes 403).
3. django-axes: add `"axes"` to `INSTALLED_APPS`, `"axes.middleware.AxesMiddleware"` to `MIDDLEWARE` (last), `"axes.backends.AxesStandaloneBackend"` first in `AUTHENTICATION_BACKENDS`, set `AXES_FAILURE_LIMIT` and `AXES_COOLOFF_TIME` from the policy, then `python manage.py migrate`. Check the installed version's docs for the backend class name.
4. slowapi: `limiter = Limiter(key_func=get_remote_address, storage_uri=...)`, `app.state.limiter = limiter`, `app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)`, decorate with `@limiter.limit(POLICY_LOGIN_PER_IP)`; the endpoint must accept a `request: Request` parameter.
5. Apply the same pattern to the MFA verify endpoint and the password reset request endpoint. A 6-digit TOTP has 10^6 values, so an unthrottled MFA endpoint is brute-forceable.
6. Normalize the account key (trim, lowercase) so `Alice@x.com` and `alice@x.com` share one counter.
7. The 429 response must use the same generic body for known and unknown accounts, so the limiter does not reintroduce enumeration.

### Output
Decorated endpoints.

### Quality Gate
- `rg -n "limiter\.limit|@ratelimit|axes" .` lists login, MFA verify and reset request endpoints.
- `python -c "import flask_limiter, sys; print(flask_limiter.__version__)"` (or the chosen library) prints the version recorded in `rate_limit_config`.

---

## Phase 4: Prove It Fires

### Entry Criteria
- App restarted with limits.

### Actions
1. Send N+1 requests where N is the policy's per-account limit, and print status codes:
   `for i in $(seq $((N+1))); do curl -s -o /dev/null -w '%{http_code} ' -X POST "$APP/login" -H 'Content-Type: application/json' -d '{"username":"realuser@example.com","password":"wrong"}'; done; echo`
2. Expect the last code to be `429`. Read the `Retry-After` header on that response with `curl -s -D - -o /dev/null ...`.
3. Repeat with a different username from the same IP to show the per-IP counter separately (if the policy has one).
4. Write a test (pytest with the framework test client) asserting the (N+1)th attempt gets 429, using a test config with in-memory storage.

### Output
`rate_limit_config` with evidence.

### Quality Gate
- The printed status sequence shows `429` exactly at position N+1.
- The test passes, and fails when the decorator is removed (mutation check).

---

## Worked Example

Illustrative only. Flask app, policy from the user: login 5 failures per account per 15 minutes, 50 per IP per hour; gunicorn `-w 4`.

Phase 1: 5 is below the NIST 100 cap; Flask-Limiter with `redis://redis:6379/0` because 4 workers.

Phase 4:
```
$ for i in $(seq 6); do curl -s -o /dev/null -w '%{http_code} ' -X POST http://localhost:5000/login -H 'Content-Type: application/json' -d '{"username":"alice@example.com","password":"x"}'; done; echo
401 401 401 401 401 429
$ curl -s -D - -o /dev/null -X POST http://localhost:5000/login -d '{}' -H 'Content-Type: application/json' | grep -i retry-after
Retry-After: 897
```

---

## Exit Criteria

DONE when login, MFA verify and reset request endpoints are limited per IP and per normalized account with shared storage, the client IP is read through the configured proxy count, and the 429 evidence and test are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Policy has no numbers | **Return**: ask the user for limits; do not invent them. |
| Phase 1 | Per-account limit above the NIST cap | **Return**: report non-conformance and ask for a corrected limit. |
| Phase 2 | Proxy count unknown | **Return**: ask; a wrong count either trusts spoofed headers or limits the proxy IP for everyone. |
| Phase 4 | No 429 after N+1 requests | **Retry**: check the storage URI is shared and the decorator order; confirm with the limiter's debug log. |
| Phase 4 | Every user gets 429 at once | **Adjust**: the key is the proxy IP; fix Phase 2. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
