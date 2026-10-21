# Header, Redirect and Host Injection Fix

**One-line description:** Stops user input from splitting or forging HTTP response headers (CRLF injection), from steering redirects off-site (open redirect through `Location`), from poisoning absolute URLs through the `Host` or `X-Forwarded-Host` header (password reset link poisoning), and from adding SMTP headers in outgoing email, using each framework's own validation plus explicit allowlists, proven by CRLF and redirect payload tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `sink_map` (object, required): Output of `ival-sink-class-map`; rows with `class` = `header`.

---

## Outputs

- `header_fixes` (object): `fixed` (file, line, sub-class: `crlf`, `open_redirect`, `host`, `email_header`), `allowed_hosts_setting`, `test_file`, `test_run`.

---

## Phase 1: Classify Header Sinks

### Entry Criteria
- `sink_map` exists.

### Actions
1. Sort every `header` row into one sub-class:

| Code shape | Sub-class |
|---|---|
| user value placed in `set_header`, `setHeader`, `Header().Set`, `set_cookie` value or name | `crlf` |
| `redirect(user_value)`, `res.redirect(req.query.next)`, `http.Redirect(w, r, next, ...)` | `open_redirect` |
| `request.host`, `request.get_host()`, `req.hostname`, `req.headers.host`, `r.Host`, `X-Forwarded-Host` used to build a URL | `host` |
| user value in an email `Subject`, `To`, `From`, `Reply-To` | `email_header` |

2. Extra search for `host`: `rg -n "get_host\(|request\.host|url_root|build_absolute_uri|req\.hostname|req\.headers\.host|headers\[.host.\]|r\.Host|X-Forwarded-Host" <src>`.
3. Extra search for `email_header`: `rg -n "EmailMessage|MIMEText|send_mail|nodemailer|sendMail|net/smtp|gomail" <src>`.

### Output
Sub-classed sink list.

### Quality Gate
- Every `header` row and every extra search hit has one sub-class or is marked constant-only.

---

## Phase 2: Fix by Sub-Class

### Entry Criteria
- Sub-classed list exists.

### Actions
1. `crlf`: confirm what the framework does with `\r` or `\n` in a header value by test (Phase 3), then:
   - Node: `res.setHeader` throws `ERR_INVALID_CHAR` (`TypeError [ERR_INVALID_CHAR]: Invalid character in header content`) for CR or LF; make sure the error becomes 400, not 500 with a stack trace.
   - Python: Werkzeug and Django reject newlines in header values (Django raises `BadHeaderError`); confirm in the test for your version.
   - Go: confirm behavior in the Phase 3 test on your Go version; do not assume.
   - In all stacks, validate the value against its schema first (for example a filename for `Content-Disposition` allows a fixed character set), and encode non-ASCII filenames with RFC 6266 / RFC 5987 `filename*=UTF-8''...` percent-encoding.
2. `open_redirect`: accept only same-site relative paths. Rule, in order:
   - parse the value; reject if it has a scheme or a netloc/host;
   - reject if it starts with `//` or `/\` or contains `\` (browsers treat `/\evil.com` as `//evil.com`);
   - require it to start with a single `/`;
   - if off-site redirects are a requirement, map a key to a fixed URL from an allowlist instead of accepting a URL.
   Python helper: Django `url_has_allowed_host_and_scheme(url, allowed_hosts={request.get_host()}, require_https=True)`. Node and Go: implement the rule above with `new URL(v, "http://placeholder.invalid")` (check `.origin` equals the placeholder origin) or `url.Parse` (check `u.Scheme == "" && u.Host == ""`).
3. `host`: build absolute URLs from configuration, not from the request:
   - Django: set `ALLOWED_HOSTS` to the real hostnames (never `["*"]` in production) and keep `USE_X_FORWARDED_HOST = False` unless a trusted proxy sets it.
   - Flask: set `SERVER_NAME` or build links from a config base URL; Werkzeug `ProxyFix` only with `x_host=1` when a trusted proxy is the only client.
   - Express: `app.set("trust proxy", ...)` only to the proxy's address or hop count; build reset links from `process.env.PUBLIC_BASE_URL`.
   - Go: build links from a config base URL; never from `r.Host`.
4. `email_header`: use the library's structured API (Python `email.message.EmailMessage` with the default policy, nodemailer's message fields, Go `net/mail` address parsing) and reject CR or LF in any header field before calling it.
5. One sink per commit; run tests after each.

### Output
Fixed sinks.

### Quality Gate
- `rg -n "ALLOWED_HOSTS\s*=\s*\[\s*['\"]\*['\"]\s*\]" --type py` prints nothing (Django).
- Every `open_redirect` sink calls the one redirect-check helper (call count equals sink count).
- Password reset and email-verification link builders read a config base URL (cite the line).

---

## Phase 3: Payload Tests

### Entry Criteria
- Fixes applied.

### Actions
1. CRLF: send `name%0d%0aSet-Cookie:%20ival=1` (and the raw `\r\n` form in a JSON body) to each `crlf` sink; assert status 400 and no `Set-Cookie: ival=1` header in the response.
2. Open redirect: for each sink assert the response does not redirect off-site for:

```
https://evil.example
//evil.example
/\evil.example
\/evil.example
https:evil.example
/%2F%2Fevil.example
javascript:alert(1)
```
   Assert `/account` still redirects to `/account`.
3. Host: send a password reset request with `Host: evil.example` and with `X-Forwarded-Host: evil.example`; assert 400 (Django `DisallowedHost`) or that the generated link uses the configured base URL (capture the outgoing email with the test mail backend: Django `mail.outbox`, nodemailer `jsonTransport`, a fake SMTP in Go).
4. Email header: subject `hi\r\nBcc: victim@example.com`; assert rejection and no `Bcc` in the captured message.
5. Run, record summary. Mutation check: bypass the redirect helper, rerun, confirm failure, revert.

### Output
`header_fixes`.

### Quality Gate
- Test summary shows 0 failed.
- Mutation run fails; reverted run passes.

---

## Worked Example

Illustrative. `stack` = `python`, Django. `accounts/views.py:77` did `return redirect(request.GET["next"])`; `accounts/emails.py:12` used `request.build_absolute_uri(reset_path)`; settings had `ALLOWED_HOSTS = ["*"]`.

Phase 2: `next` checked with `url_has_allowed_host_and_scheme`; reset links built from `settings.PUBLIC_BASE_URL`; `ALLOWED_HOSTS = ["shop.example.com"]`.

Phase 3:
```
$ python manage.py test accounts.tests.test_header_injection -v 1
..........
Ran 10 tests in 0.412s
OK
```

---

## Exit Criteria

DONE when no user value can add a header line, redirects go only to same-site relative paths or allowlisted keys, absolute URLs come from configuration, email headers reject line breaks, and payload tests pass and fail under mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Behind a load balancer, `ALLOWED_HOSTS` blocks health checks that use the instance IP | **Adjust**: add the health check host explicitly, or exempt the health route in middleware; never use `"*"`. |
| Phase 2 | Product needs redirects to partner sites | **Adjust**: key-to-URL allowlist; the user sends the key. |
| Phase 3 | Framework did not reject CRLF in your version | **Adjust**: add an explicit check in the header-setting helper and keep the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
