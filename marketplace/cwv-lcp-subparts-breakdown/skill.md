# LCP Sub-parts Breakdown

**One-line description:** Splits LCP into its four sub-parts (time to first byte, resource load delay, resource load duration, element render delay) from RUM attribution, the DevTools Performance panel and a console PerformanceObserver snippet, and names the dominant sub-part that selects the fix flow.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_urls` (string[], required): URLs to diagnose.
- `diagnosis_plan` (object, required): From `cwv-field-lab-reconcile`. This flow runs only for entries whose workflow is `cwv-lcp-subparts-breakdown`.
- `lab_lcp_element` (object, required): From `cwv-lab-lighthouse-run`.
- `rum_p75_report` (object[], required): From `cwv-rum-p75-analysis`; holds field sub-part p75s when available.

---

## Outputs

- `lcp_subparts` (object[]): Per (template, device): the four sub-part values from field p75 and from a lab trace, the LCP element, its resource URL, and whether the element is an image, a background image, a video poster or text.
- `lcp_bottleneck` (string): One of `ttfb`, `resource_load_delay`, `resource_load_duration`, `element_render_delay`, chosen by the Phase 3 rule.

---

## Phase 1: Read Field Sub-parts

### Entry Criteria
- `diagnosis_plan` has at least one LCP entry. If it has none, **Return** with empty outputs.

### Actions
1. For each LCP plan entry, read the sub-part p75s from `rum_p75_report`: `ttfb`, `resourceLoadDelay`, `resourceLoadDuration`, `elementRenderDelay`.
2. If RUM lacks them, use the CrUX LCP sub-part keys saved by `cwv-field-crux-baseline` if present (keys starting with `largest_contentful_paint_image_`). These cover image LCPs only.
3. Record the source of each value. If neither source exists, mark field sub-parts "unavailable" and rely on Phase 2.

### Output
Field sub-parts per plan entry.

### Quality Gate
- Every value names its source (`rum_p75_report` field or CrUX key).

---

## Phase 2: Measure Sub-parts in a Lab Trace

### Entry Criteria
- Phase 1 complete (values or "unavailable").

### Actions
1. Open the URL in Chrome with a clean profile (Incognito, extensions off). In DevTools Network, check "Disable cache".
2. DevTools Performance panel: set CPU throttling to 4x slowdown and network throttling to a 4G-class preset (the panel lists the options; use what it shows). Click "Record and reload".
3. In the trace, open the LCP insight (the Insights sidebar shows "LCP by phase" / "LCP breakdown" in current Chrome versions). Copy the four phase values and the element.
4. Cross-check with this snippet. Reload the page without DevTools recording, wait for load, then paste it into the Console; `buffered: true` replays the LCP entries already recorded. Do not click or scroll first: user input stops LCP reporting.
   ```js
   new PerformanceObserver((list) => {
     const lcp = list.getEntries().at(-1);
     const nav = performance.getEntriesByType('navigation')[0];
     const res = performance.getEntriesByType('resource').find((r) => r.name === lcp.url);
     const ttfb = nav.responseStart;
     const reqStart = res ? (res.requestStart || res.startTime) : 0;
     const loadDelay = res ? Math.max(0, reqStart - ttfb) : 0;
     const loadDur = res ? Math.max(0, res.responseEnd - reqStart) : 0;
     const renderDelay = Math.max(0, lcp.startTime - (res ? res.responseEnd : ttfb));
     console.table({ element: lcp.element?.outerHTML.slice(0, 120), url: lcp.url, lcp: lcp.startTime, ttfb, loadDelay, loadDur, renderDelay });
   }).observe({ type: 'largest-contentful-paint', buffered: true });
   ```
   `requestStart` reads 0 for cross-origin resources without a `Timing-Allow-Origin` header; the snippet then falls back to `startTime`. Note this in the output when it happens.
5. Classify the LCP element: `<img>`, `<image>` inside SVG, `<video>` poster, CSS `background-image`, or a text block. For text, resource delay and duration are zero.

### Output
Lab sub-parts and element type.

### Quality Gate
- The four lab values sum to the lab LCP within rounding (check: ttfb + loadDelay + loadDur + renderDelay vs `lcp`).
- The element selector matches `lab_lcp_element`, or the mismatch is recorded.

---

## Phase 3: Name the Bottleneck

### Entry Criteria
- Field or lab sub-parts exist.

### Actions
1. Prefer field values; use lab values only when field is "unavailable".
2. Pick `lcp_bottleneck` as the sub-part with the largest value. Then apply these overrides in order:
   | Condition | `lcp_bottleneck` |
   |---|---|
   | Element is text (no resource) and render delay is largest | `element_render_delay` (look at fonts and render-blocking CSS/JS) |
   | Element is a CSS background image, or the image `<img>` is created by JavaScript | `resource_load_delay` even if another part is slightly larger, because discovery is the root cause |
   | TTFB alone exceeds the "good" TTFB threshold of 800 ms (web.dev) | `ttfb` |
3. Map to the fix flow and record it:
   | `lcp_bottleneck` | Next flow |
   |---|---|
   | `ttfb` | `cwv-lcp-ttfb-reduce`, then `cwv-cache-headers-cdn` |
   | `resource_load_delay` | `cwv-lcp-priority-hints` (or `cwv-nextjs-image-font` for Next.js) |
   | `resource_load_duration` | `cwv-image-encode-responsive` (or `cwv-nextjs-image-font` for Next.js) |
   | `element_render_delay` | `cwv-render-blocking-resources`, then `cwv-font-loading-subset` |
4. Do not pick a fix because it is easy. Pick it because its sub-part is the bottleneck.

### Output
`lcp_subparts`, `lcp_bottleneck`.

### Quality Gate
- `lcp_bottleneck` equals the largest sub-part, or one override row is cited.

---

## Worked Example

Illustrative only. Plan entry: LCP product/mobile.

Phase 1 (RUM p75): ttfb 610, resourceLoadDelay 1490, resourceLoadDuration 420, elementRenderDelay 230.

Phase 2 console output:
```text
| element | <img class="hero" src="/img/gallery-1-1200.jpg" loading="lazy"> |
| lcp     | 3412 |
| ttfb    | 588  |
| loadDelay | 1702 |
| loadDur | 812 |
| renderDelay | 310 |
```
Sum 588 + 1702 + 812 + 310 = 3412. Element is an `<img>` with `loading="lazy"`.

Phase 3: largest field part is resource load delay; `lcp_bottleneck` = `resource_load_delay`; next flow `cwv-lcp-priority-hints`.

---

## Exit Criteria

DONE when each LCP plan entry has sourced sub-parts, an element type, and a bottleneck chosen by the stated rule with its next flow.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No LCP entries in `diagnosis_plan` | **Return**: emit empty outputs; LCP is not failing. |
| Phase 2 | LCP element changes between reloads | **Adjust**: record each candidate; fix the one that appears in RUM `lcpTarget` most often. |
| Phase 2 | Sub-parts do not sum to LCP | **Retry**: the resource match failed; match by `lcp.url` exactly including query string. |
| Phase 3 | Field and lab bottlenecks differ | **Adjust**: use field; record the lab view as secondary. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
