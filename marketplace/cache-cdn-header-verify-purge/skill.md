# CDN Cache Verify and Purge

**One-line description:** Confirms that the CDN (Cloudflare, Amazon CloudFront or Fastly) actually stores and serves the routes the header policy marks as shared-cacheable by reading each provider's cache status header and `Age` across repeated curl requests, fixes the provider settings that override origin headers, and sets up targeted purge by URL or surrogate key.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `header_policy` (object[], required): Routes and headers from `cache-http-cache-control-policy`.
- `public_url` (string, required): Base URL served through the CDN, for example `https://www.example.com`.
- `cdn_provider` (string, required): `cloudflare`, `cloudfront` or `fastly`.

---

## Outputs

- `cdn_report` (object[]): Per route: cache status on first and second request, `Age` values, provider settings changed, purge method and the command that was tested, and the time from purge to a fresh copy.

---

## Phase 1: Read Cache Status

### Entry Criteria
- `header_policy` lists at least one route with `public` and `s-maxage` or `max-age`.

### Actions
1. For each shared-cacheable route, run the same request twice, a few seconds apart:
   `curl -sS -o /dev/null -D - "<public_url><path>" | grep -iE "^(cache-control|age|cf-cache-status|x-cache|x-served-by|via|etag):"`
2. Read the status header for your provider:

   | Provider | Header | Values |
   |---|---|---|
   | Cloudflare | `cf-cache-status` | `HIT`, `MISS`, `EXPIRED`, `REVALIDATED`, `STALE`, `UPDATING`, `BYPASS`, `DYNAMIC` (not eligible for cache) |
   | CloudFront | `x-cache` | `Hit from cloudfront`, `Miss from cloudfront`, `RefreshHit from cloudfront` |
   | Fastly | `x-cache` | `HIT`, `MISS` (one value per cache node in the path, comma separated) |

3. `Age` (seconds since the CDN stored it) must increase between the two requests on a HIT. An `Age` that stays 0 means the response is not being stored.
4. Different edge locations hold separate copies; a MISS on the second request can be a different edge. Repeat a few times; a route that never shows HIT has a configuration problem.

### Output
Status and `Age` per route per request.

### Quality Gate
- Every route has two or more recorded curl outputs with the status header and `Age`.

---

## Phase 2: Fix Provider Settings

### Entry Criteria
- At least one route never shows HIT, or shows HIT when the policy says it must not.

### Actions
1. Check the provider rules that override origin headers:
   - Cloudflare: by default it caches only certain static file extensions; HTML and JSON API responses show `DYNAMIC` until a Cache Rule marks them eligible for cache. In the Cache Rule, choose to respect origin cache-control headers for edge TTL. Cloudflare also bypasses cache when the origin sends `Set-Cookie` for some plans and settings; check the Cloudflare docs for "Default cache behavior".
   - CloudFront: the cache behavior's cache policy sets Minimum, Default and Maximum TTL; origin `s-maxage`/`max-age` are honored only within that range. Headers, cookies and query strings included in the cache key (cache policy) multiply cache entries; include only what the policy's `Vary` needs. Read the policy with `aws cloudfront get-cache-policy --id <id>`.
   - Fastly: VCL or the UI may set TTLs; Fastly honors `Surrogate-Control` over `Cache-Control` for its own caching, and strips `Surrogate-Control` before sending to the browser.
2. Change one setting at a time and rerun Phase 1 for the affected route.
3. Confirm per-user routes are not cached: request with two different session cookies and check the bodies differ and the status is not HIT for the second user's first request.

### Output
Settings changed with before and after status.

### Quality Gate
- Every shared-cacheable route shows HIT with increasing `Age` after fixes.
- Every per-user route never shows HIT across two different users.

---

## Phase 3: Targeted Purge

### Entry Criteria
- Routes cache correctly.

### Actions
1. Choose purge granularity:

   | Need | Method |
   |---|---|
   | Purge one URL | Cloudflare API `POST /client/v4/zones/<zone_id>/purge_cache` with `{"files":["<url>"]}`; CloudFront `aws cloudfront create-invalidation --distribution-id <id> --paths "/products/42"`; Fastly `curl -X PURGE "<url>"` (if enabled) or the purge API |
   | Purge every page that shows one entity | Tag responses: Fastly `Surrogate-Key: product-42`, then `POST /service/<service_id>/purge/product-42`; Cloudflare `Cache-Tag: product-42`, then purge by `tags` (check your plan supports it) |
   | Purge everything | Avoid in production; every route misses at once and the origin takes full load |

2. Wire the purge call into the same after-commit hook that invalidates the application cache (from `cache-invalidation-strategy-select`), or into the event consumer.
3. Test: request a route (HIT), change the entity, wait for the hook, request again. Record the time from the change to the first response with the new content. CloudFront invalidations take time to complete; check status with `aws cloudfront get-invalidation --distribution-id <id> --id <inv id>`.
4. CloudFront charges for invalidation paths beyond a free monthly allowance; check current pricing before purging per write.

### Output
`cdn_report`.

### Quality Gate
- A purge test shows old content before and new content after, with the elapsed time recorded.
- The purge credential is read from an environment variable or secret store, not committed (`git grep -n "<token prefix>"` finds nothing).

---

## Worked Example

Illustrative. Cloudflare, `/products/42` policy `public, max-age=0, s-maxage=300`.

Phase 1: two requests show `cf-cache-status: DYNAMIC`, no `age`.

Phase 2: added a Cache Rule for `/products/*` marking it eligible and respecting origin headers. Rerun: first `MISS`, second `HIT` with `age: 4`, third `HIT` with `age: 11`.

Phase 3: responses carry `Cache-Tag: product-42`; the after-commit hook purges tag `product-42`. Edit price, next request shows `MISS` and the new price 1.8 s after the commit.

---

## Exit Criteria

DONE when every shared-cacheable route shows HIT with growing `Age`, no per-user route is shared, and a targeted purge is wired and timed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No status header at all | **Adjust**: the request may not pass through the CDN (DNS points to origin); check with `dig` and the `server` or `via` header. |
| Phase 2 | HIT on a per-user route | **Stop**: purge it now and fix the rule; this leaks user data. |
| Phase 3 | Purge returns success but old content persists | **Retry**: check the purged URL matches the cache key exactly (scheme, host, query string). |
| Phase 3 | Tag purge not available on the plan | **Adjust**: purge by URL list built from the row-to-keys mapping. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
