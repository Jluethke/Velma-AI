# Strict Content Security Policy Rollout

**One-line description:** Deploys a nonce-based strict Content Security Policy (`script-src 'nonce-...' 'strict-dynamic'`, `object-src 'none'`, `base-uri 'none'`) as a second XSS defense, first in `Content-Security-Policy-Report-Only` mode with violation reports, then enforced, with a fresh nonce per response from a cryptographic random source and checks with `curl` and Google's CSP Evaluator.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `app_base_url` (string, required): URL of a running non-production instance, for example `https://staging.example.com`.
- `csp_report_endpoint` (string, optional): URL that receives violation reports. If absent, Phase 2 adds a minimal receiving route in the app.

---

## Outputs

- `csp_policy` (object): `policy` (exact header value), `mode` (`report-only` or `enforced`), `inline_scripts_converted` (file list), `violations_seen` (grouped by directive and blocked URI), `curl_check` (header line captured).

---

## Phase 1: Inventory Inline Code and Third-Party Scripts

### Entry Criteria
- `curl -sI <app_base_url>` returns a status line.

### Actions
1. Capture the current header: `curl -sI <app_base_url> | grep -i "content-security-policy"`. Record it (often empty).
2. Find inline code that a nonce policy blocks:
   - inline event handlers: `rg -n " on(click|load|error|submit|change|input|mouseover)=" -g "*.{html,jinja,j2,tmpl,gohtml,ejs,hbs,jsx,tsx,vue}"`
   - `javascript:` URLs: `rg -n "href=[\"']javascript:" -g "*.{html,jinja,j2,tmpl,gohtml,ejs,hbs}"`
   - inline `<script>` blocks: `rg -n "<script(?![^>]*\bsrc=)" --pcre2 -g "*.{html,jinja,j2,tmpl,gohtml,ejs,hbs}"`
   - `eval`, `new Function`, `setTimeout("string")`: `rg -n "eval\(|new Function\(|setTimeout\(\s*['\"]" --type js --type ts`
3. Decision per finding:

| Finding | Action |
|---|---|
| Inline `<script>` block | add `nonce="{{ csp_nonce }}"` (template variable set in Phase 2) |
| Inline event handler or `javascript:` URL | move to an external script with `addEventListener`; nonces do not apply to attributes |
| `eval` / `new Function` in your code | rewrite; do not add `'unsafe-eval'` |
| `eval` inside a third-party library | record it; the owner decides whether to replace the library or accept `'unsafe-eval'` (record as open question) |
| Third-party `<script src>` tags in your HTML | add the nonce; `'strict-dynamic'` then trusts scripts that script loads |

### Output
Inline code list with the action per item.

### Quality Gate
- Every search in step 2 was run with its hit count recorded.
- Every hit has an action from the table.

---

## Phase 2: Emit the Policy in Report-Only Mode

### Entry Criteria
- Inline handlers converted (rerun of the step 2 handler search prints nothing).

### Actions
1. Start from the strict policy recommended by the CSP Level 3 specification's `strict-dynamic` guidance and Google's strict CSP guidance (web.dev "Mitigate cross-site scripting with a strict CSP"):

```
script-src 'nonce-{NONCE}' 'strict-dynamic' https: 'unsafe-inline'; object-src 'none'; base-uri 'none'; report-uri {REPORT_URL}
```
   `https:` and `'unsafe-inline'` are ignored by browsers that support nonces and `'strict-dynamic'`; they exist only as fallbacks for old browsers. Do not remove the nonce thinking `'unsafe-inline'` covers it.
2. Generate the nonce per response from a cryptographic random source and base64-encode it. The CSP3 specification says the nonce should be at least 128 bits:

| `stack` | Nonce code |
|---|---|
| python | `secrets.token_urlsafe(16)` (16 bytes = 128 bits) in a `before_request` hook (Flask) or middleware (Django: `django-csp` package supports nonces; check its docs for the version's setting names) |
| node | `crypto.randomBytes(16).toString("base64")` in middleware, stored in `res.locals.cspNonce`; with `helmet`, pass `scriptSrc: [(req, res) => \`'nonce-${res.locals.cspNonce}'\`, "'strict-dynamic'"]` |
| go | `b := make([]byte, 16); rand.Read(b)` from `crypto/rand`, `base64.StdEncoding.EncodeToString(b)`, pass into the template data |

3. Send it as `Content-Security-Policy-Report-Only` first. Never reuse one nonce across responses; never cache HTML pages that carry a nonce in a shared cache.
4. Reports: if `csp_report_endpoint` is absent, add `POST /csp-report` accepting `application/csp-report` and `application/reports+json`, log `violated-directive` (or `effectiveDirective`) and `blocked-uri` (`blockedURL`) only, with a size cap. Apply `ival-rejected-input-logging` rules; report bodies are attacker-controllable.
5. Verify: `curl -sI <app_base_url> | grep -i content-security-policy-report-only` shows the policy with a nonce; run it twice and confirm the nonce differs.
6. Paste the policy into https://csp-evaluator.withgoogle.com and record any finding marked high severity.

### Output
Report-only policy deployed to the non-production instance.

### Quality Gate
- Two `curl -sI` runs show two different nonce values.
- CSP Evaluator shows no high-severity finding, or each one is listed as an open question.

---

## Phase 3: Read Violations and Enforce

### Entry Criteria
- Report-only policy has been live on the non-production instance while the full test suite or a manual pass of every page ran.

### Actions
1. Group violation reports by `violated-directive` and `blocked-uri`. Decision per group:

| Group | Action |
|---|---|
| `blocked-uri` = `inline` from your page | a missed inline script or handler; fix it per Phase 1 |
| `blocked-uri` = `eval` | find the caller; rewrite or record as open question |
| Browser extension schemes (`chrome-extension`, `moz-extension`) | ignore; not your code |
| A script your page loads without a nonce | add the nonce at the tag |

2. When a full pass produces only ignorable groups, rename the header to `Content-Security-Policy`. Keep `report-uri` on.
3. Add `frame-ancestors 'none'` (or the allowed origins) if the app should not be framed; this directive does not work in a `<meta>` CSP, only in the header.
4. Add a test that requests a page and asserts the `Content-Security-Policy` header contains `'nonce-`, `'strict-dynamic'`, `object-src 'none'`, `base-uri 'none'`.

### Output
`csp_policy`.

### Quality Gate
- `curl -sI <app_base_url> | grep -i "^content-security-policy:"` prints the enforced header.
- The header test passes; with the middleware disabled it fails.

---

## Worked Example

Illustrative. Express app, `app_base_url` = `https://staging.shop.test`.

Phase 1: 3 inline `onclick` handlers in `views/cart.ejs`, 2 inline `<script>` blocks, 0 `eval`. Handlers moved to `public/cart.js`.

Phase 2:
```
$ curl -sI https://staging.shop.test | grep -i content-security
content-security-policy-report-only: script-src 'nonce-q8Vt0bZ5wqk1rM3yQf9s6A==' 'strict-dynamic' https: 'unsafe-inline'; object-src 'none'; base-uri 'none'; report-uri /csp-report
```
Phase 3: reports show one `inline` block from `views/admin.ejs:22` (missed script, nonce added) and 40 `chrome-extension` reports (ignored). Header switched to enforced.

---

## Exit Criteria

DONE when the app sends an enforced nonce-based strict CSP with a per-response 128-bit nonce, inline handlers are gone, violation groups are resolved or recorded, and a header test guards it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Pages are static HTML served from a CDN (no server rendering) | **Adjust**: use hash-based CSP (`'sha256-...'` per inline script) instead of nonces; nonces need a server per response. |
| Phase 2 | Framework injects its own inline scripts (for example Next.js) | **Adjust**: follow the framework's documented nonce support (Next.js reads the nonce from the request header set in middleware); check its docs. |
| Phase 3 | Violations keep appearing from your own code after fixes | **Retry** Phase 1 searches with the template extensions the project actually uses. |
| Phase 3 | Owner wants enforcement before a clean pass | **Return**: list the unresolved groups and the pages that will break. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
