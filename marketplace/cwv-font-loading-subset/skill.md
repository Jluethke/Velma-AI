# Font Loading and Subsetting

**One-line description:** Self-hosts web fonts as subset WOFF2 files built with `pyftsubset` (fontTools), preloads only the faces used above the fold with `crossorigin`, sets `font-display`, and adds metric-matched fallback `@font-face` rules (`size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`) computed by a metrics tool, for Vite, webpack or static sites.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): App repository root.
- `lab_report` (object, required): From `cwv-lab-lighthouse-run`; holds the font display audit and the LCP element.

---

## Outputs

- `font_patch` (object): Fonts subset (file names, unicode ranges, bytes before/after), the `@font-face` and preload markup, the fallback metric values and the tool that computed them, and the verification results.

---

## Phase 1: Inventory Fonts

### Entry Criteria
- The site loads at least one web font.

### Actions
1. In DevTools Network, filter "Font", reload with cache disabled. Record each font URL, transferred bytes, and its start time relative to the HTML.
2. Find how each is loaded: `grep -rnE "fonts.googleapis.com|@font-face|@import url|typekit|font-display" src/ public/ index.html`.
3. Read the font display audit id listed in `lab_report` (`font-display` or `font-display-insight`) for faces without a `font-display` value.
4. Find which faces are used above the fold: in DevTools Elements, select the LCP text or heading, open Computed, and read "Rendered Fonts" at the bottom. Those faces are preload candidates; others are not.
5. Classify the problem:
   | Observation | Problem |
   |---|---|
   | Font CSS from `fonts.googleapis.com` blocks render; files from `fonts.gstatic.com` need a new connection | Third-party font hosting |
   | Font file starts late (after CSS parsed) | Font not preloaded |
   | Text invisible until font loads | Missing `font-display` (browser default block period) |
   | Visible text reflow when font swaps | Fallback metrics differ (CLS source) |
   | Font file large (full glyph set) | Not subset |

### Output
Font inventory with problems.

### Quality Gate
- Every font request is listed with bytes and a problem class (or "none").

---

## Phase 2: Subset and Self-host

### Entry Criteria
- Font files are licensed for self-hosting (check the font license; Google Fonts families are under OFL or Apache).

### Actions
1. Install: `pip install fonttools brotli` (brotli is needed for `--flavor=woff2`).
2. Get the source TTF/OTF (from the foundry or the family's repository). Do not subset an already-subset WOFF2 from a CDN if a full source exists.
3. Subset to the scripts the site uses. Example for Latin:
   ```bash
   pyftsubset Inter-Regular.ttf \
     --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" \
     --layout-features='*' --flavor=woff2 --output-file=Inter-Regular-latin.woff2
   ```
   That range is the "latin" range Google Fonts serves; replace it with the ranges your content needs (check page languages). Run `pyftsubset --help` for other options.
4. Check bytes: `ls -l *.woff2`.
5. Confirm needed characters survive: open a page with real content and check no tofu boxes appear; for multilingual sites, add `unicode-range` per subset file in `@font-face` so browsers fetch only needed files.

### Output
Subset WOFF2 files.

### Quality Gate
- Each subset file is smaller than the original download, with bytes recorded.
- A content page renders with no missing glyph boxes (screenshot recorded).

---

## Phase 3: Wire Loading and Fallback Metrics

### Entry Criteria
- Subset files placed in the static directory.

### Actions
1. Declare faces in the main CSS:
   ```css
   @font-face { font-family: "Inter"; src: url("/fonts/Inter-Regular-latin.woff2") format("woff2");
                font-weight: 400; font-style: normal; font-display: swap; unicode-range: U+0000-00FF, ...; }
   ```
2. Choose `font-display`:
   | Priority | Value |
   |---|---|
   | Brand font must always appear | `swap` |
   | Layout stability first; font may be skipped on slow first visit | `optional` |
3. Preload only the faces from Phase 1 step 4 (usually one or two): `<link rel="preload" href="/fonts/Inter-Regular-latin.woff2" as="font" type="font/woff2" crossorigin>` in `<head>`. The `crossorigin` attribute is required even for same-origin fonts; without it the preload is fetched twice.
4. Compute fallback metrics with a tool, do not guess percentages. Options: the `fontaine` package, or `@capsizecss/metrics` values. Then add:
   ```css
   @font-face { font-family: "Inter Fallback"; src: local("Arial");
                size-adjust: <computed>%; ascent-override: <computed>%; descent-override: <computed>%; line-gap-override: <computed>%; }
   body { font-family: "Inter", "Inter Fallback", sans-serif; }
   ```
5. Remove the old Google Fonts `<link>` / `@import` and any `preconnect` to `fonts.gstatic.com` that is now unused.
6. Build: `npm run build`.

### Output
`font_patch`.

### Quality Gate
- `grep -rn "fonts.googleapis.com" src/ public/ index.html` returns nothing.
- Every preload `<link>` has `as="font"`, `type="font/woff2"` and `crossorigin` (grep the built `index.html`).
- In the Network panel each font file is requested once.

---

## Worked Example

Illustrative only. Vite site using Google Fonts Inter 400/700 via `<link>`.

Phase 1: CSS from `fonts.googleapis.com` is render-blocking; two WOFF2 files from `fonts.gstatic.com` start at 1.1 s; text reflows on swap. Rendered Fonts for the h1: "Inter Bold".

Phase 2:
```text
$ ls -l *.woff2
24180 Inter-Regular-latin.woff2
24912 Inter-Bold-latin.woff2
```
Phase 3: two `@font-face` rules with `font-display: swap`; one preload for `Inter-Bold-latin.woff2` (the h1 face); fallback face computed with `fontaine` against Arial. Network shows each font once, starting at 0.3 s. The layout shift on swap no longer appears in the Performance panel Layout shifts track.

---

## Exit Criteria

DONE when fonts are self-hosted subset WOFF2 files with `font-display` set, only above-the-fold faces are preloaded with `crossorigin`, tool-computed fallback metrics are in place, and the Network panel shows single requests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No web fonts in use | **Return**: emit an empty patch. |
| Phase 2 | License forbids self-hosting | **Stop**: keep the provider; add `display=swap` to the provider URL and `preconnect` with `crossorigin`. |
| Phase 2 | `--flavor=woff2` error about brotli | **Adjust**: `pip install brotli` and rerun. |
| Phase 3 | Font fetched twice | **Adjust**: add `crossorigin` to the preload and make the URL identical to the `@font-face` `src`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
