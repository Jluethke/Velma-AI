# CLS Shift Source Identification

**One-line description:** Identifies the DOM nodes and causes behind the largest CLS session window using RUM `largestShiftTarget` attribution, a `LayoutShift` PerformanceObserver snippet that prints `sources` with previous and current rects, and the DevTools Performance panel Layout shifts track, then classifies each source into a fixed cause class.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_urls` (string[], required): URLs where CLS fails.
- `diagnosis_plan` (object, required): From `cwv-field-lab-reconcile`. This flow runs only for CLS entries.
- `rum_p75_report` (object[], required): From `cwv-rum-p75-analysis`; holds `largestShiftTarget` offenders and `loadState`.

---

## Outputs

- `cls_sources` (object[]): Per source: selector, shift value contribution, when it happens (during load, after load, on scroll, after route change), the moved node and the node that caused the move, and a cause class.

---

## Phase 1: Start From Field Attribution

### Entry Criteria
- `diagnosis_plan` has a CLS entry. Otherwise **Return** with empty outputs.

### Actions
1. From `rum_p75_report` offenders, list the top `largestShiftTarget` selectors with counts, plus `largestShiftTime` and `loadState` if sent.
2. Note timing: `loadState` = `complete` or a large `largestShiftTime` means the shift happens after load. A Lighthouse navigation run will not see it; you must reproduce the user action (scroll, click "load more", wait for an ad).
3. Remember the CLS definition (web.dev): layout shift scores are grouped into session windows (a window ends after a 1 s gap or at 5 s length) and CLS is the largest window. Shifts within 500 ms after a discrete user input (`hadRecentInput` true) are excluded.

### Output
Field shift targets with timing.

### Quality Gate
- Each target lists its count from RUM, or the output states RUM had no CLS attribution.

---

## Phase 2: Reproduce and Capture Sources

### Entry Criteria
- Targets listed (or none from RUM).

### Actions
1. Paste this into the Console on a fresh load of the URL (it replays earlier entries with `buffered: true`) and then perform the user path (scroll to bottom slowly, wait, open menus):
   ```js
   new PerformanceObserver((list) => {
     for (const e of list.getEntries()) {
       if (e.hadRecentInput) continue;
       for (const s of e.sources || []) {
         console.log(e.startTime.toFixed(0), e.value.toFixed(4), s.node, JSON.stringify(s.previousRect), JSON.stringify(s.currentRect));
       }
     }
   }).observe({ type: 'layout-shift', buffered: true });
   ```
   Click each logged node to reveal it in Elements.
2. DevTools Performance panel: Record and reload, then perform the same path. Open the Layout shifts track. Each shift cluster shows its score; select a shift to see the moved elements, and check the insights sidebar for listed culprits (unsized images, web fonts, injected iframes).
3. For each moved node, find the cause node: usually an element above it that grew, appeared, or changed size. Compare `previousRect.y` and `currentRect.y` with the height of the element that appeared.
4. Test a mobile viewport too (Device Toolbar): many shifts happen only at narrow widths.

### Output
Captured shift list with moved node, cause node and timing.

### Quality Gate
- Each source has a logged `previousRect`/`currentRect` pair or a Layout shifts track screenshot reference.
- Every RUM target from Phase 1 is either reproduced or marked "not reproduced" with the steps tried.

---

## Phase 3: Classify Causes

### Entry Criteria
- Captured list exists.

### Actions
1. Assign one cause class per source:
   | Evidence | Cause class |
   |---|---|
   | `<img>`, `<video>` or `<iframe>` without `width`/`height` or CSS `aspect-ratio` grows when loaded | `unsized-media` |
   | Ad slot, embed (social post, map, video player) or consent banner inserted or resized | `injected-embed` |
   | Content inserted above existing content after a fetch (banner, "recommended for you", cookie notice in flow) | `late-content` |
   | Text block changes height when the web font swaps in | `font-swap` |
   | Element animated with `top`, `left`, `margin`, `height` or `width` | `layout-animation` |
   | Skeleton or placeholder height differs from the final content | `placeholder-mismatch` |
   | Shift on back/forward navigation or the page reloaded on back | `bfcache-miss` (route to `cwv-bfcache-eligibility`) |
2. Sum shift values per class to rank them.

### Output
`cls_sources`.

### Quality Gate
- Every source has exactly one cause class from the table.
- Classes are ranked by summed shift value from the captured data.

---

## Worked Example

Illustrative only. RUM: `largestShiftTarget` = `main>section.reviews` in 64 percent of poor CLS beacons, `loadState` = `complete`.

Phase 2 console after scrolling to reviews:
```text
4812 0.0911 <section class="reviews"> {"y":1880,"height":900,...} {"y":2130,"height":900,...}
```
Elements shows an `<iframe class="promo-embed">` above reviews that loads at 4.6 s with height 250 px and no reserved space; the 250 px matches the y change 1880 to 2130. A second shift (0.031) comes from the h1 when the web font swaps.

Phase 3: `injected-embed` (0.0911), `font-swap` (0.031).

---

## Exit Criteria

DONE when the field's top shift targets are reproduced or marked not reproduced, every captured source has a moved node, a cause node, timing and one cause class, and classes are ranked.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No CLS entry in the plan | **Return**: emit empty outputs. |
| Phase 2 | Shift not reproducible | **Adjust**: try mobile viewport, slow network throttling, logged-in state, and the consent banner path; then mark "not reproduced". |
| Phase 2 | `sources` empty | **Adjust**: the shifted node was removed from the DOM; use the Performance panel Layout shifts track instead. |
| Phase 3 | Cause fits no class | **Adjust**: record it as `other` with the evidence; do not force a class. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
