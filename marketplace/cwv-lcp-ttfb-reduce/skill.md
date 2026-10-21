# TTFB Breakdown and Reduction

**One-line description:** Breaks time to first byte into redirect, DNS, TCP connect, TLS and server time with `curl -w` timing variables, Navigation Timing and `Server-Timing` headers, then applies the stack-specific fix (Next.js static or ISR rendering, server-side caching, redirect removal, 103 Early Hints) for the dominant part.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_urls` (string[], required): URLs whose TTFB is slow.
- `stack` (string, required): `nextjs`, `vite` or `webpack`. For `vite` and `webpack` the HTML is static or served by a separate backend; the server-side fixes apply to that backend or host.
- `lcp_subparts` (object[], required): From `cwv-lcp-subparts-breakdown`.
- `lcp_bottleneck` (string, required): From `cwv-lcp-subparts-breakdown`.

---

## Outputs

- `ttfb_findings` (object[]): Per URL: redirect count and time, DNS, connect, TLS, server wait (time from request sent to first byte), cache status headers, and the `Server-Timing` entries.
- `ttfb_patch` (object): The single change made (file, diff summary) and its before/after TTFB measurements.

---

## Phase 1: Measure the Parts

### Entry Criteria
- `lcp_bottleneck` is `ttfb`, or field TTFB is outside "good" (above 800 ms at p75 per web.dev). Otherwise **Return** with empty outputs.

### Actions
1. Run curl 5 times per URL from a machine near the users:
   ```bash
   for i in 1 2 3 4 5; do
     curl -o /dev/null -s -H 'Accept-Encoding: br, gzip' -L \
       -w 'redirects=%{num_redirects} redirect=%{time_redirect} dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\n' \
       "https://shop.example.com/p/blue-mug"
   done
   ```
   curl values are cumulative seconds from the start. Server wait = `ttfb - tls` (or `ttfb - connect` for http).
2. Read headers once: `curl -sI -L "https://shop.example.com/p/blue-mug"`. Record `server-timing`, `cache-control`, `age`, and CDN status headers (`cf-cache-status`, `x-cache`, `x-vercel-cache`, `cache-status`).
3. In the browser console after load: `performance.getEntriesByType('navigation')[0]` and record `redirectEnd - redirectStart`, `domainLookupEnd - domainLookupStart`, `connectEnd - connectStart`, `responseStart - requestStart`, and `serverTiming`.
4. Remember that a single machine's curl is not field TTFB. Field TTFB includes slow networks and distant users; use these numbers to find which part is large, not as the p75.

### Output
`ttfb_findings` per URL.

### Quality Gate
- Five curl lines per URL are saved; the median of each variable is recorded.
- Header output is saved, including the CDN status header or a note that none was present.

---

## Phase 2: Pick the Fix

### Entry Criteria
- Findings recorded.

### Actions
1. Choose by the largest part:
   | Largest part | Fix |
   |---|---|
   | `redirects` greater than 0 | Link and route to the final URL directly (http to https, apex to www, trailing slash, locale); update internal links, sitemaps and ad landing URLs |
   | DNS or connect or TLS | Serve HTML from a CDN edge close to users; enable HTTP/2 or HTTP/3 and TLS 1.3 at the host; check `curl -sI --http2` works |
   | Server wait, CDN status MISS/DYNAMIC on every request | HTML is not cached at the edge: see `cwv-cache-headers-cdn` |
   | Server wait, origin is slow | Use `Server-Timing` entries to find the slow server step (database, upstream API, render) |
2. Stack-specific server fixes:
   | `stack` | Check | Fix |
   |---|---|---|
   | `nextjs` | Run `npm run build` and read the route table: `○` static, `●` SSG, `ƒ` dynamic. A dynamic marker on a page that shows the same content to all users is the finding. | App Router: remove what forces dynamic rendering (`cookies()`, `headers()`, `searchParams` reads, `cache: 'no-store'` fetches) from that page, or set `export const revalidate = <seconds from the user>` for ISR. Pages Router: move `getServerSideProps` to `getStaticProps` with `revalidate`. |
   | `vite` / `webpack` (static SPA) | HTML is a static file; server wait should be tiny | If not tiny, the host or CDN is the problem; fix at the host, not in the app. |
   | any, with a backend | Add `Server-Timing: db;dur=<ms>, render;dur=<ms>` in the backend response to expose server steps | Fix the slowest named step (query, upstream call) |
3. If the server must stay slow (personalized HTML), add `103 Early Hints` with `Link: </assets/app.css>; rel=preload; as=style` where the host supports it (check host docs), so the browser starts fetching critical assets while waiting.
4. Make ONE change. Do not combine a redirect fix and a rendering mode change in one step.

### Output
Chosen fix with its reason.

### Quality Gate
- The chosen fix cites the largest measured part from Phase 1.

---

## Phase 3: Apply and Re-measure

### Entry Criteria
- Fix chosen.

### Actions
1. Make the change on a branch. For Next.js, rerun `npm run build` and confirm the route marker changed (for example `ƒ` to `○` or `●`).
2. Deploy to a preview or staging environment that uses the same CDN setup as production.
3. Rerun the Phase 1 curl loop. For cache-related fixes, discard the first request (cache fill) and record the next four.
4. Record before/after medians in `ttfb_patch`.

### Output
`ttfb_patch`.

### Quality Gate
- `git diff --stat` shows the files for one fix only.
- After-medians are recorded from the same machine and URL as before-medians.

---

## Worked Example

Illustrative only. Next.js App Router, `/p/blue-mug`.

Phase 1 median: `redirects=0 dns=0.012 connect=0.030 tls=0.061 ttfb=0.912`. Server wait = 0.912 - 0.061 = 0.851 s. Header `x-vercel-cache: MISS` on every request.

Phase 2: `npm run build` route table shows `ƒ /p/[slug]`. The page reads `cookies()` to show a currency symbol. Fix: move currency to a client component and set `export const revalidate = 300` (300 chosen by the user).

Phase 3: route table shows `● /p/[slug]` with revalidate. Preview curl median after warm-up: `ttfb=0.094`, header `x-vercel-cache: HIT`.

---

## Exit Criteria

DONE when TTFB parts are measured, one fix targeting the largest part is applied and deployed to a preview, and before/after medians are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `lcp_bottleneck` is not `ttfb` and field TTFB is good | **Return**: TTFB is not the problem; emit empty outputs. |
| Phase 1 | curl blocked by bot protection (403, challenge page) | **Adjust**: use Navigation Timing from a real browser session instead. |
| Phase 2 | Page must be personalized per user | **Adjust**: cache the shell and fetch personalized parts on the client, or use Early Hints. |
| Phase 3 | TTFB unchanged after deploy | **Retry**: confirm the deploy is live (build id or header) and the cache is warm before re-measuring. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
