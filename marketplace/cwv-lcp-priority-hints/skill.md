# LCP Discovery and Priority Hints

**One-line description:** Removes LCP resource load delay in a Vite, webpack or plain HTML app by making the LCP image discoverable in the initial HTML, removing `loading="lazy"` from it, adding `fetchpriority="high"`, and using `<link rel="preload" as="image">` with `imagesrcset` and `imagesizes` for CSS backgrounds and JS-rendered images.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): App repository root.
- `lab_lcp_element` (object, required): LCP selector, snippet and resource URL from `cwv-lab-lighthouse-run`.
- `lcp_bottleneck` (string, required): From `cwv-lcp-subparts-breakdown`. This flow acts only when it is `resource_load_delay`.

---

## Outputs

- `lcp_priority_patch` (object): The file changed, the discovery case fixed, the markup before and after, and the before/after resource load delay from a lab trace.

---

## Phase 1: Classify the Discovery Problem

### Entry Criteria
- `lcp_bottleneck` == `resource_load_delay`. Otherwise **Return** with an empty patch.

### Actions
1. Fetch the raw HTML the server sends (before JavaScript): `curl -s https://shop.example.com/p/blue-mug > raw.html`.
2. Search for the LCP resource file name from `lab_lcp_element`: `grep -n "gallery-1" raw.html`.
3. Classify:
   | Finding | Case |
   |---|---|
   | Found as `<img ... src=` or `srcset=` with `loading="lazy"` | A: lazy-loaded LCP image |
   | Found as `<img>` without `fetchpriority` | B: discoverable, low priority |
   | Not in HTML; appears in a CSS file as `background-image: url(...)` | C: CSS background |
   | Not in HTML or CSS; rendered by a JS component (React, Vue, carousel library) | D: client-rendered image |
   | Found, but inside `<noscript>` or behind `data-src` (lazy library) | E: lazy library |
4. Find the source file that produces the element: `grep -rn "gallery" src/ --include=*.tsx --include=*.jsx --include=*.vue --include=*.html | head`.

### Output
Case letter and source file.

### Quality Gate
- The case is chosen from the grep evidence in `raw.html`, saved with the output.

---

## Phase 2: Apply the Fix for the Case

### Entry Criteria
- Case chosen.

### Actions
1. Edit ONLY the source file that renders the LCP element, plus `index.html` for preload cases.
2. Apply:
   | Case | Change |
   |---|---|
   | A | Remove `loading="lazy"` from the LCP image only; add `fetchpriority="high"`. Keep `loading="lazy"` on below-the-fold images. |
   | B | Add `fetchpriority="high"` to the LCP `<img>`. |
   | C | Prefer replacing the background with an `<img>` (with `object-fit: cover`). If the design must stay a background, add to `<head>`: `<link rel="preload" as="image" href="/img/hero-1200.avif" imagesrcset="/img/hero-800.avif 800w, /img/hero-1200.avif 1200w" imagesizes="100vw" fetchpriority="high">` matching the CSS image exactly. |
   | D | Server-render or prerender the image if the stack allows; otherwise add the same `<link rel="preload" as="image" ...>` to `index.html` for the known first image (for a carousel, the first slide only). |
   | E | Render the first image with a real `src`/`srcset` instead of `data-src`; exclude it from the lazy library (most libraries skip images without their class). |
3. Use `fetchpriority="high"` on ONE element per page. Marking several images high removes the benefit.
4. A preload `href`/`imagesrcset` must match what the page later requests byte for byte (same URL, same format). A mismatched preload downloads the image twice; DevTools Console warns "preloaded using link preload but not used within a few seconds".
5. Do not add `decoding="async"` or `decoding="sync"` as an LCP fix; it does not change discovery.

### Output
Patched source.

### Quality Gate
- `grep -c 'fetchpriority="high"'` on the rendered HTML (`curl -s ... | grep -c`) returns 1 for the page after build.
- `git diff --stat` lists only the LCP component and, for cases C and D, `index.html`.

---

## Phase 3: Verify in a Trace

### Entry Criteria
- Patch builds (`npm run build` exits 0).

### Actions
1. Serve the production build (`npx vite preview` or the repo's server) or deploy a preview.
2. Repeat the `cwv-lcp-subparts-breakdown` Phase 2 trace with the same throttling.
3. In DevTools Network, enable the Priority column (right-click column header > Priority). The LCP image must show `High` priority and an early start in the waterfall.
4. Check the Console has no "preloaded but not used" warning.
5. Record before/after resource load delay.

### Output
`lcp_priority_patch`.

### Quality Gate
- Network Priority column shows `High` for the LCP request.
- After resource load delay is lower than before under the same throttling, or the flow returns the result as unchanged.

---

## Worked Example

Illustrative only. Vite + React product page.

Phase 1: `grep -n "gallery-1" raw.html` returns nothing; the image comes from `src/components/Gallery.tsx`: case D.

Phase 2: `index.html` head gains
```html
<link rel="preload" as="image" href="/img/gallery-1-1200.avif"
      imagesrcset="/img/gallery-1-800.avif 800w, /img/gallery-1-1200.avif 1200w"
      imagesizes="(max-width: 768px) 100vw, 50vw" fetchpriority="high">
```
and `Gallery.tsx` first `<img>` gets `fetchpriority="high"` with the same `srcset`/`sizes`, while the other slides keep `loading="lazy"`. (This example uses one shared preload because every product uses the same first-slide path pattern; per-product URLs need server rendering.)

Phase 3: Priority column `High`; resource load delay 1702 ms to 240 ms under 4x CPU and the same network preset.

---

## Exit Criteria

DONE when the LCP image is discoverable from the initial HTML or a matching preload, carries the only `fetchpriority="high"` on the page, is not lazy-loaded, and a trace shows the delay change.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `lcp_bottleneck` is another sub-part | **Return**: emit an empty patch. |
| Phase 2 | LCP image URL differs per page and HTML is client-rendered | **Adjust**: server-render the page or accept case D as partial; record it. |
| Phase 3 | Image downloaded twice | **Adjust**: make the preload URL and format match the `<img>` exactly. |
| Phase 3 | No improvement | **Retry**: confirm the build served contains the change (`curl` the HTML); then re-check the case classification. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
