# Render-Blocking CSS and JavaScript

**One-line description:** Removes render-blocking CSS and JavaScript found by the Lighthouse render-blocking audit and the DevTools Coverage panel using `defer`, `async`, `type="module"`, inlined critical CSS (Beasties), deferred non-critical stylesheets and the stack's own script loader (`next/script` strategies, Vite and webpack entry handling), one resource at a time.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): App repository root.
- `stack` (string, required): `nextjs`, `vite` or `webpack`.
- `lab_report` (object, required): From `cwv-lab-lighthouse-run`; holds the render-blocking audit rows.
- `lcp_bottleneck` (string, required): From `cwv-lcp-subparts-breakdown`. This flow acts when it is `element_render_delay`, or when the chain's diagnosis plan routed a failing FCP here.

---

## Outputs

- `render_blocking_patch` (object): Each resource changed, the technique applied, files edited, and before/after FCP and element render delay from the lab.

---

## Phase 1: List Blocking Resources

### Entry Criteria
- `lcp_bottleneck` == `element_render_delay` or FCP is failing. Otherwise **Return**.

### Actions
1. Copy rows from the render-blocking audit in `lab_report` (`render-blocking-resources` or `render-blocking-insight`): URL and time.
2. Inspect the served `<head>`: `curl -s <url> | sed -n '/<head/,/<\/head>/p'`. A resource blocks render when it is:
   - `<link rel="stylesheet">` without a non-matching `media` attribute,
   - `<script src>` without `async`, `defer` or `type="module"`,
   - CSS `@import` inside a stylesheet (serial fetch).
3. DevTools Coverage (Command Menu Ctrl+Shift+P or Cmd+Shift+P, "Show Coverage", reload): record unused bytes per CSS/JS file at first render.
4. Classify each:
   | Resource | Class |
   |---|---|
   | First-party app CSS needed above the fold | `critical-css` |
   | CSS for other routes or below the fold (high unused share) | `noncritical-css` |
   | First-party script that does not need to run before first paint | `defer-js` |
   | Third-party tag (analytics, chat, A/B test, consent) | `third-party` |
   | A/B testing or anti-flicker snippet that hides the page | `anti-flicker` |

### Output
Classified list.

### Quality Gate
- Every audit row appears in the list with a class.

---

## Phase 2: Apply the Technique per Class

### Entry Criteria
- List exists.

### Actions
1. Handle one resource per change, then rebuild and re-run Phase 3 before the next.
2. Techniques by class and stack:
   | Class | `vite` | `webpack` | `nextjs` |
   |---|---|---|---|
   | `defer-js` | Vite emits `type="module"` (deferred by default); move hand-written `<script src>` in `index.html` to module imports or add `defer` | Set `scriptLoading: 'defer'` in `HtmlWebpackPlugin` options (check your plugin version's README) | Use `next/script` with `strategy="afterInteractive"` (default) or `"lazyOnload"`; never `beforeInteractive` unless the script must run before hydration |
   | `third-party` | Add `async` or load after `load` event | same | `next/script` `strategy="lazyOnload"` |
   | `noncritical-css` | Split by route with dynamic `import()` of the component that imports the CSS; Vite code-splits CSS per chunk (`build.cssCodeSplit`, default true) | `mini-css-extract-plugin` with route-level dynamic imports | CSS Modules per component are already route-split; move global imports out of `app/layout.tsx` when only one route uses them |
   | `critical-css` | Inline above-the-fold CSS with Beasties (the maintained fork of the archived Critters) via its Vite integration, or keep the file if it is small; read the Beasties README for options | `beasties-webpack-plugin` | Next.js App Router inlines nothing by default; keep CSS small and route-scoped. Check the installed version's docs for an `optimizeCss` experimental option before using it |
   | `anti-flicker` | Remove, or cap with the vendor's documented timeout | same | same |
3. Replace CSS `@import url(...)` of other stylesheets with `<link>` tags or bundler imports.
4. Deferred stylesheet pattern for small non-critical CSS that must stay a separate file: `<link rel="stylesheet" href="/x.css" media="print" onload="this.media='all'">` with a `<noscript>` copy. Do not use this for CSS that styles above-the-fold content: it causes a flash of unstyled content and layout shift.
5. Never mark a script `async` if later inline scripts depend on it being loaded in order; use `defer` (preserves order) instead.

### Output
One applied technique per iteration.

### Quality Gate
- `npm run build` exits 0 after each change.
- The page works: run the project's end-to-end or smoke tests (`npm test` or the documented e2e command); a failing test means revert this change.

---

## Phase 3: Verify

### Entry Criteria
- At least one change applied and built.

### Actions
1. Re-run `cwv-lab-lighthouse-run` for the URL (5 runs, median).
2. Confirm the changed URL is gone from the render-blocking audit.
3. Visually check the first frames (Performance panel screenshots or a WebPageTest filmstrip) for a flash of unstyled content.
4. Record before/after FCP and element render delay.

### Output
`render_blocking_patch`.

### Quality Gate
- The changed resource no longer appears in the render-blocking audit rows of the new median run.
- Tests pass and no unstyled flash appears in the first frames.

---

## Worked Example

Illustrative only. Vite app.

Phase 1: audit rows `/assets/index-9c2e.css` (380 ms) and `https://cdn.example-chat.com/widget.js` (290 ms). Coverage: `index-9c2e.css` 71 percent unused at first render. Classes: `critical-css` with a `noncritical-css` share; `third-party`.

Phase 2 iteration 1: `index.html` changes `<script src="https://cdn.example-chat.com/widget.js">` to `<script src="..." async>`. Build and smoke tests pass.

Phase 3: widget.js gone from render-blocking rows; FCP median 2140 ms to 1830 ms. Iteration 2 moves the account-page styles into the lazy-loaded account route chunk.

---

## Exit Criteria

DONE when each listed render-blocking resource is removed from the audit or kept with a recorded reason, tests pass after each change, and before/after FCP is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Bottleneck is not render delay and FCP passes | **Return**: emit an empty patch. |
| Phase 2 | Script order dependency breaks after `async` | **Adjust**: use `defer` instead. |
| Phase 2 | Flash of unstyled content | **Adjust**: the CSS was critical; inline it or keep it blocking. |
| Phase 3 | Tests fail | **Stop**: revert the last change; do not edit or skip the failing test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
