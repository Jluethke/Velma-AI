# HTTP Cache-Control Policy

**One-line description:** Writes the `Cache-Control`, `Vary` and related response headers for every cacheable route from a decision table grounded in RFC 9111 (HTTP Caching), RFC 5861 (stale-while-revalidate, stale-if-error) and RFC 8246 (immutable), then applies and verifies them with curl.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cache_plan` (object[], required): Rows with location `cdn` or `http-private` from `cache-location-decide`.
- `ttl_table` (object[], required): TTLs from `cache-ttl-from-change-rate`.
- `repo_path` (string, required): Path to the application or web server configuration.

---

## Outputs

- `header_policy` (object[]): One row per route or asset class: exact `Cache-Control` value, `Vary` value, whether an `ETag` or `Last-Modified` validator is required, the decision row used, and the curl output that shows it served.

---

## Phase 1: Inventory Routes

### Entry Criteria
- `cache_plan` has at least one `cdn` or `http-private` row.

### Actions
1. List every GET route and static asset class. For each, record: does the response depend on cookies, the `Authorization` header, `Accept-Language`, or `Accept-Encoding`? Does it set a cookie? Is the file name content-hashed (for example `app.3f9a1c.js`)?
2. Read the current headers: `curl -sS -o /dev/null -D - https://staging.example.com/products/42`. Save them.

### Output
Route inventory with current headers.

### Quality Gate
- Every route has its current headers saved from curl output.

---

## Phase 2: Apply the Decision Table

### Entry Criteria
- Inventory complete.

### Actions
1. Take the FIRST matching row:

   | Row | Route class | Cache-Control | Validator |
   |---|---|---|---|
   | 1 | Contains secrets or data that must never be stored (tokens, account numbers) | `no-store` | none |
   | 2 | Per-user (cookie or Authorization dependent) | `private, no-cache` or `private, max-age=<ttl>` if the user tolerates the TTL | ETag |
   | 3 | Content-hashed static asset | `public, max-age=31536000, immutable` | optional |
   | 4 | Public HTML document or public API response | `public, max-age=<browser ttl>, s-maxage=<shared ttl>` (browser TTL can be 0) | ETag or Last-Modified |
   | 5 | Public, and serving a slightly old copy during refresh or origin errors is acceptable | add `stale-while-revalidate=<s>` and/or `stale-if-error=<s>` to row 4 | as row 4 |

   Sources: 31536000 seconds is one year, the upper limit HTTP/1.1 (RFC 2616 section 14.21) set for Expires and the common convention for hashed assets. `immutable` is RFC 8246. The stale directives are RFC 5861. `<ttl>` values come from `ttl_table`; stale windows are user inputs.

2. Meaning traps to avoid:
   - `no-cache` does NOT mean "do not cache". It means "store, but revalidate before every use". "Do not store" is `no-store`.
   - `max-age` applies to all caches; `s-maxage` overrides it for shared caches (CDN, proxies) only.
   - `private` forbids shared caches; the browser may still store it.
   - Per RFC 9111, a response with `Set-Cookie` can still be stored by a shared cache unless directives prevent it. Any route that sets a cookie must be `private` or `no-store`.
3. `Vary`: list only request headers that change the body. `Vary: Accept-Encoding` when the server compresses. Do not add `Vary: Cookie` or `Vary: User-Agent` to public routes; every distinct value becomes a separate cache entry and the hit ratio collapses. Remove the dependency instead.
4. Mark rows 2, 4 and 5 as needing a validator; `cache-http-etag-conditional-get` adds it.

### Output
Draft `header_policy`.

### Quality Gate
- Every route has exactly one row number.
- No route that sets a cookie or reads `Authorization` has `public` in its policy.

---

## Phase 3: Apply and Verify

### Entry Criteria
- Draft policy exists.

### Actions
1. Set headers in ONE place per layer. Choose the layer the repo already uses:
   - nginx: `add_header Cache-Control "public, max-age=31536000, immutable" always;` inside the `location` for hashed assets. `add_header` in a nested block replaces all inherited `add_header` lines, so repeat any security headers there.
   - Express: `express.static(dir, { immutable: true, maxAge: '1y' })` for assets; `res.set('Cache-Control', '...')` per route.
   - Django: `@cache_control(public=True, max_age=..., s_maxage=...)` or `@never_cache` from `django.views.decorators.cache`; `patch_vary_headers` for Vary.
   - Spring: `ResponseEntity.ok().cacheControl(CacheControl.maxAge(Duration.ofSeconds(...)).cachePublic())`.
   - Go: `w.Header().Set("Cache-Control", "...")` before `WriteHeader`.
2. Verify each route with `curl -sS -o /dev/null -D - <url>` and compare the header line with the policy text exactly.
3. Verify a per-user route through a logged-in session: `curl -sS -o /dev/null -D - -H "Cookie: session=<test session>" <url>`, and confirm `private` is present.
4. Record each curl output in `header_policy`.

### Output
`header_policy`.

### Quality Gate
- For every route, the served `Cache-Control` line equals the policy text (diff or exact string compare).
- `curl -sS -D - <hashed asset url> -o /dev/null | grep -i cache-control` shows `immutable` for every hashed asset class.

---

## Worked Example

Illustrative. Routes: `/assets/app.3f9a1c.js`, `/products/42` (public JSON), `/account` (per-user), `/api/token` (secret). Product TTL 300 s, browser TTL 0 (user choice), stale-while-revalidate 60 s (user input).

Phase 2: assets row 3; products row 5: `public, max-age=0, s-maxage=300, stale-while-revalidate=60`, ETag; account row 2: `private, no-cache`, ETag; token row 1: `no-store`.

Phase 3: `curl -sS -o /dev/null -D - https://staging.example.com/products/42` shows `cache-control: public, max-age=0, s-maxage=300, stale-while-revalidate=60` and `vary: Accept-Encoding`.

---

## Exit Criteria

DONE when every cacheable route serves exactly the policy's headers, verified by curl, with no public caching of per-user or cookie-setting responses.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cannot tell whether a route varies by user | **Adjust**: treat it as row 2 until proven public. |
| Phase 3 | Served header differs from config | **Adjust**: another layer (framework middleware, CDN rule) overrides it; find and remove the duplicate so one layer owns the header. |
| Phase 3 | Two `Cache-Control` headers in one response | **Stop**: caches combine or pick unpredictably; remove one source. |
| Phase 3 | Public route needs `Vary: Cookie` | **Return**: the route is not truly public; move it to row 2 or strip the cookie dependency. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
