# Back/Forward Cache Eligibility

**One-line description:** Tests each page for back/forward cache (bfcache) eligibility with the DevTools Application panel test and the `notRestoredReasons` API, maps each blocking reason to a code change (remove `unload` listeners, drop `Cache-Control: no-store` on public HTML, close connections on `pagehide`), and verifies restores, because a bfcache restore gives near-instant LCP and no load-time CLS on back and forward navigations.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_urls` (string[], required): Pages to test.
- `repo_dir` (string, required): App repository root, for fixes.

---

## Outputs

- `bfcache_blockers` (object[]): Per URL: the reasons reported by DevTools and by `notRestoredReasons`, each marked actionable (page code), actionable (server headers), or browser support (not fixable by the site).
- `bfcache_patch` (object): Files changed per blocker and the re-test result.

---

## Phase 1: Test Eligibility

### Entry Criteria
- Pages reachable in Chrome.

### Actions
1. Open the URL. DevTools > Application > Background services > Back/forward cache. Click "Test back/forward cache". DevTools navigates away and back and lists the result: restored, or reasons grouped as "Actionable", "Pending support" and "Not actionable".
2. Copy every reason string exactly.
3. Field check: after a real back navigation to the page, run in the Console:
   ```js
   const nav = performance.getEntriesByType('navigation')[0];
   console.log(nav.type, JSON.stringify(nav.notRestoredReasons, null, 2));
   ```
   `notRestoredReasons` is null when the page was restored or the API is unsupported; when present it lists `reasons` for the page and for each iframe in `children`. To collect this in RUM, add it to the TTFB or navigation beacon from `cwv-rum-web-vitals-setup`.
4. If the Lighthouse report from `cwv-lab-lighthouse-run` has a `bf-cache` audit, copy its failure reasons too.

### Output
Raw reasons per URL.

### Quality Gate
- Each URL has a DevTools test result recorded verbatim.

---

## Phase 2: Map Reasons to Fixes

### Entry Criteria
- Reasons recorded. If every page is restored, **Return** with empty outputs.

### Actions
1. Map each reason:
   | Reason (as shown) | Owner | Fix |
   |---|---|---|
   | Unload handler listener present (`UnloadHandler` / "unload-listener") | page code | Replace `unload` listeners with `pagehide`. Find them: `grep -rn "addEventListener('unload'\|addEventListener(\"unload\"\|onunload" src/`. Third-party scripts can add them too; check the listed script in the DevTools frame details. |
   | `MainResourceHasCacheControlNoStore` | server headers | Remove `no-store` from public HTML responses; use `no-cache` or `private, no-cache` instead. Keep `no-store` only for pages that truly must not be stored (account details) and accept the miss. |
   | WebSocket / WebRTC / open IndexedDB transaction / BroadcastChannel with active handler | page code | Close or pause on `pagehide` and reopen on `pageshow` when `event.persisted` is true. |
   | `beforeunload` listener present | page code | Add `beforeunload` only while there are unsaved changes, and remove it after saving. |
   | Page opened with `window.opener` reference | page code | Use `rel="noopener"` on links that open new windows. |
   | Reasons in "Pending support" or "Not actionable" | browser | Record only; no site change. |
2. Do not listen for `unload` anywhere in new code. Chrome is phasing out `unload` events.
3. Where state must refresh on restore (cart count, auth state), add a `pageshow` listener that checks `event.persisted` and refreshes data, instead of disabling bfcache.

### Output
`bfcache_blockers` with owners and fixes.

### Quality Gate
- Every reason maps to one table row or is recorded as browser-owned.

---

## Phase 3: Apply and Re-test

### Entry Criteria
- At least one actionable blocker.

### Actions
1. Fix one blocker at a time. For header changes, edit the server or host config (see `cwv-cache-headers-cdn`), not the app code.
2. Run `npm run build` and `npm test`.
3. Re-run the DevTools test. The fixed reason must disappear.
4. Test the restore path by hand: navigate away and press Back; the page should appear instantly with state intact, and `performance.getEntriesByType('navigation')[0].notRestoredReasons` should not list the fixed reason. `web-vitals` reports metrics for restores with `navigationType` = `back-forward-cache`.

### Output
`bfcache_patch`.

### Quality Gate
- The DevTools test no longer lists any fixed reason.
- Build and tests exit 0 with unchanged test counts.

---

## Worked Example

Illustrative only. URL `/p/blue-mug`.

Phase 1 DevTools result: Actionable: "The page has an unload handler in the main frame." and "Pages whose main resource has cache-control:no-store cannot enter back/forward cache."

Phase 2: grep finds `window.addEventListener('unload', flushAnalytics)` in `src/analytics.ts:22`; nginx sends `Cache-Control: no-store` on all HTML.

Phase 3 iteration 1: change to `addEventListener('pagehide', flushAnalytics)`; tests pass; the unload reason disappears. Iteration 2: nginx HTML header `no-cache`; re-test result "Successfully served from back/forward cache."

---

## Exit Criteria

DONE when every page has a recorded eligibility test, every actionable reason is fixed and re-tested, and browser-owned reasons are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Test button not shown | **Adjust**: update Chrome; the panel location can move between versions, so use the Command Menu and search "back/forward cache". |
| Phase 2 | Unload listener comes from a third-party script | **Adjust**: update or configure that vendor's script; if impossible, record it as an external blocker. |
| Phase 3 | Stale data after restore | **Adjust**: refresh on `pageshow` with `event.persisted`; do not re-add `no-store`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
