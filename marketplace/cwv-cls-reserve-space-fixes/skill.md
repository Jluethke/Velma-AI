# CLS Reserve-Space Fixes

**One-line description:** Fixes each classified CLS source with the matching technique: `width`/`height` attributes or CSS `aspect-ratio` for media, `min-height` reservations for embeds and ad slots, overlay placement for late banners, metric-matched fallback fonts, `transform`-only animation and skeletons sized to final content, verified per source with the same PerformanceObserver capture.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): App repository root.
- `cls_sources` (object[], required): From `cwv-cls-shift-sources`.

---

## Outputs

- `cls_patch` (object[]): Per source: the file changed, technique, before/after shift value from the capture, and test results.

---

## Phase 1: Plan One Fix per Source

### Entry Criteria
- `cls_sources` is non-empty. Otherwise **Return**.

### Actions
1. Take sources in ranked order (largest summed shift first).
2. Locate the component or template that renders the cause node: `grep -rn "<class or id of cause node>" src/ app/ components/ templates/`.
3. Pick the technique:
   | Cause class | Technique |
   |---|---|
   | `unsized-media` | Add `width` and `height` attributes with the intrinsic pixel size; keep CSS `width: 100%; height: auto;` for responsiveness. Browsers derive `aspect-ratio` from the attributes. For CSS-sized boxes, set `aspect-ratio: 16 / 9` (from the media's real dimensions). |
   | `injected-embed` | Wrap the slot in a container with `min-height` equal to the most common rendered height of that embed (measure it in the browser; for ad slots with several sizes, use the most common size from the ad server report and record it). |
   | `late-content` | Render the content in the server HTML, or reserve its space with `min-height`, or place it as an overlay (`position: fixed` or `sticky`) so it does not push content. Never insert above content the user is reading. |
   | `font-swap` | Add metric-matched fallback `@font-face` (`size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`) computed by a tool (`fontaine`, `@capsizecss/metrics`, or `next/font` which does it automatically), or use `font-display: optional`. See `cwv-font-loading-subset`. |
   | `layout-animation` | Animate `transform` and `opacity` only. Replace `top`/`left` with `transform: translate(...)`, height expand with `transform: scaleY(...)` or a `grid-template-rows` transition on a container that is out of the flow of content below. |
   | `placeholder-mismatch` | Size the skeleton from the final content's measured height per breakpoint; for lists, fix the row height. |
   | `bfcache-miss` | Route to `cwv-bfcache-eligibility`. |
4. Do not hide shifting content with `display: none` until loaded and then show it: that is still a shift.

### Output
Fix plan per source.

### Quality Gate
- Each source has one technique from the table and the file that will change.

---

## Phase 2: Apply and Test One at a Time

### Entry Criteria
- Plan exists.

### Actions
1. Apply the fix for the top source only.
2. Run checks: `npm run build` and `npm test` (and the visual regression command if the repo has one, for example Playwright `toHaveScreenshot` or Storybook visual tests). A changed snapshot must be reviewed by the user; do not run the update-snapshots command on your own.
3. Commit or stash the change before moving to the next source so each fix is measured alone.

### Output
One applied fix.

### Quality Gate
- `git diff --stat` touches only files for this source.
- Build and tests exit 0; the test count is unchanged.

---

## Phase 3: Verify per Source

### Entry Criteria
- Fix applied and built.

### Actions
1. Serve the production build. Repeat the exact reproduction path from `cwv-cls-shift-sources` Phase 2 with the console observer.
2. Confirm the moved node no longer logs a shift, or logs a smaller value. Record before/after.
3. Repeat at the mobile viewport used before.
4. Return to Phase 2 for the next source.

### Output
`cls_patch`.

### Quality Gate
- For each source, before and after shift values come from the same capture snippet and path.
- The Performance panel Layout shifts track for the full path shows no cluster attributed to fixed sources.

---

## Worked Example

Illustrative only. Sources: `injected-embed` (`iframe.promo-embed`, 0.0911), `font-swap` (h1, 0.031).

Phase 1: embed renders at 250 px tall in all observed loads; plan `min-height: 250px` on its wrapper in `src/components/Promo.tsx`. Font plan: fallback face for "Inter" computed with `fontaine`.

Phase 2 iteration 1:
```css
.promo-slot { min-height: 250px; }
```
`npm test`: 212 passed.

Phase 3: the reviews section logs no shift after the embed loads (0.0911 to 0). Iteration 2 adds the fallback face; h1 shift 0.031 to 0.002.

---

## Exit Criteria

DONE when every source in `cls_sources` has a fix from the table applied alone, build and tests pass, and the same capture shows its shift removed or reduced.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Embed height varies widely | **Adjust**: reserve the most common height, collapse gracefully when empty, and record the residual shift. |
| Phase 2 | Visual snapshot changed | **Stop**: show the diff to the user; do not update snapshots without approval. |
| Phase 3 | Shift moved to another node | **Retry**: the reserved size is wrong; measure the final rendered size again. |
| Phase 3 | Shift persists only in the field | **Return**: re-run `cwv-cls-shift-sources` with the field `loadState` path. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
