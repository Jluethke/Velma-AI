# Cache Headers and CDN Audit

**One-line description:** Audits `Cache-Control`, `ETag`, `Vary`, `Content-Encoding` and CDN cache status headers for HTML, hashed static assets, unhashed assets and images with `curl -sI`, classifies each response against a fixed rule table, and writes corrected header rules for the hosting platform (Cloudflare, CloudFront, Fastly, Vercel, Netlify, nginx).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `site_url` (string, required): Origin of the site.
- `page_urls` (string[], required): Pages to audit; the flow also audits the assets they load.
- `cdn_provider` (string, optional): One of `cloudflare`, `cloudfront`, `fastly`, `vercel`, `netlify`, `nginx`, `other`. When empty, detect it from response headers in Phase 1.

---

## Outputs

- `cache_header_audit` (object[]): One row per audited URL: resource class, status, `cache-control`, `etag`/`last-modified`, `vary`, `content-encoding`, CDN status on first and second request, and the rule verdict.
- `cache_header_patch` (object): The config file and rules written for the provider, and the re-audit result.

---

## Phase 1: Collect Headers

### Entry Criteria
- `page_urls` reachable.

### Actions
1. List the assets each page loads: open DevTools Network, reload with "Disable cache" checked, right-click the request list, "Copy all URLs" (or "Save all as HAR" and extract URLs with `jq -r '.log.entries[].request.url' page.har`).
2. Classify each URL:
   | Class | How to recognize |
   |---|---|
   | `html` | The page document |
   | `hashed` | File name contains a content hash, for example `index-9c2e1a.js`, `main.4f1a2b.css`, `/_next/static/` |
   | `unhashed` | Static file with a stable name, for example `/logo.png`, `/favicon.ico`, `/sw.js` |
   | `image-dynamic` | Image served by an optimizer endpoint, for example `/_next/image?url=...` |
   | `api` | XHR/fetch responses |
3. Request each URL twice and save headers:
   ```bash
   curl -sI -H 'Accept-Encoding: br, gzip' "$URL" > h1.txt; curl -sI -H 'Accept-Encoding: br, gzip' "$URL" > h2.txt
   grep -iE '^(cache-control|etag|last-modified|vary|content-encoding|age|cf-cache-status|x-cache|x-vercel-cache|cache-status|x-served-by):' h1.txt h2.txt
   ```
4. Detect the CDN if `cdn_provider` is empty: `cf-cache-status` or `cf-ray` = Cloudflare; `x-cache: ... cloudfront` or `x-amz-cf-id` = CloudFront; `x-served-by` with `cache-` and `x-cache` = Fastly; `x-vercel-cache` = Vercel; `x-nf-request-id` or `cache-status: "Netlify ..."` = Netlify.

### Output
Raw header table.

### Quality Gate
- Every URL has two saved header captures and a class.

---

## Phase 2: Apply the Rule Table

### Entry Criteria
- Header table exists.

### Actions
1. Judge each row:
   | Class | Expected | Defect when |
   |---|---|---|
   | `hashed` | `Cache-Control: public, max-age=31536000, immutable` (one year, the value web.dev recommends for versioned URLs) | `max-age` short, `no-cache`, missing, or no CDN HIT on second request |
   | `unhashed` | Revalidation: `Cache-Control: no-cache` with an `ETag` or `Last-Modified`, or a short `max-age` set by the user | Has `immutable` or a long `max-age` (users would keep stale files after deploy) |
   | `html` | `no-cache` (always revalidate) for personalized HTML; for shared HTML, browser `max-age=0` plus CDN `s-maxage=<user value>` and optionally `stale-while-revalidate=<user value>` (RFC 5861) | `no-store` on public pages (also blocks bfcache in some browsers), or CDN status always MISS/DYNAMIC/BYPASS on shared HTML |
   | all text (`html`, js, css, json, svg) | `Content-Encoding: br` or `gzip` (or `zstd`) | No `content-encoding` header |
   | compressed responses | `Vary: Accept-Encoding` | `Vary: *`, or `Vary: User-Agent` / `Cookie` on assets (fragments the CDN cache) |
2. Do not invent `s-maxage` or `stale-while-revalidate` numbers. Ask the user for content freshness requirements and record their values.
3. Note CDN defaults: Cloudflare does not cache HTML by default (`cf-cache-status: DYNAMIC`) until a Cache Rule makes it eligible. CloudFront uses the cache policy attached to the behavior. Vercel caches responses that send `s-maxage`.

### Output
`cache_header_audit` with verdicts.

### Quality Gate
- Each row has a verdict that cites one row of the rule table.

---

## Phase 3: Write Rules and Re-audit

### Entry Criteria
- At least one defect exists. Otherwise **Return** with an empty patch.

### Actions
1. Write the fix where headers are set for the provider:
   | Provider | Where |
   |---|---|
   | `nginx` | `location ~* \.(?:js|css|woff2)$ { add_header Cache-Control "public, max-age=31536000, immutable"; }` scoped to the hashed asset directory; `gzip on;` or the brotli module for compression |
   | `vercel` | `vercel.json` `headers` array with `source` patterns; Next.js sets `/_next/static` headers itself, so do not override those |
   | `netlify` | `_headers` file or `[[headers]]` in `netlify.toml` |
   | `cloudflare` | Cache Rules in the dashboard or Terraform `cloudflare_ruleset` with phase `http_request_cache_settings`; origin headers still control browser caching |
   | `cloudfront` | Cache policy and response headers policy on the behavior for the path pattern |
   | `fastly` | VCL or service config; check the Fastly docs for the current method |
2. Scope `immutable` to hashed paths only. A broad pattern such as `/*.js` that also matches `sw.js` breaks service worker updates.
3. Deploy to a preview, purge the CDN cache for the audited paths, and rerun Phase 1 step 3.

### Output
`cache_header_patch`.

### Quality Gate
- Re-audit shows every former defect row now matching its expected rule.
- Second request on hashed assets shows a CDN HIT header value.

---

## Worked Example

Illustrative only. Vite SPA on nginx behind Cloudflare.

Phase 1:
```text
$ grep -iE '^(cache-control|content-encoding|cf-cache-status):' h2.txt
cache-control: max-age=3600
cf-cache-status: HIT
```
for `/assets/index-9c2e1a.js` (hashed). `/index.html` returns `cache-control: no-store`, `cf-cache-status: DYNAMIC`. `/logo.svg` has no `content-encoding`.

Phase 2 verdicts: hashed asset max-age short (defect); HTML `no-store` on a public page (defect); svg uncompressed (defect).

Phase 3: nginx `location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }`, `location = /index.html { add_header Cache-Control "no-cache"; }`, `gzip_types image/svg+xml;`. Re-audit: all three rows pass.

---

## Exit Criteria

DONE when every audited response has a verdict from the rule table, defects are fixed in the provider's config scoped to the right paths, and a post-purge re-audit passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | CDN status header absent | **Adjust**: compare `age` across two requests; a growing `age` means a shared cache served it. |
| Phase 2 | User cannot state HTML freshness needs | **Adjust**: use `no-cache` on HTML (always correct, revalidates) and list freshness as an open question. |
| Phase 3 | Re-audit unchanged | **Retry**: purge the CDN and confirm the deploy; check a later rule is not overriding the new one. |
| Phase 3 | Assets 404 after deploy with old HTML cached | **Stop**: HTML was cached too long; set HTML to `no-cache` and purge. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
