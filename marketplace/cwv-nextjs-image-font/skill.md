# Next.js Image and Font Configuration

**One-line description:** Configures `next/image` and `next/font` in a Next.js app so the LCP image is prioritized, correctly sized with `sizes`, served as AVIF or WebP from `images.formats`, and web fonts are self-hosted with `display` set and size-adjusted fallback metrics, using prop names verified against the installed Next.js version.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Next.js repository root.
- `lab_lcp_element` (object, required): From `cwv-lab-lighthouse-run`.
- `lcp_bottleneck` (string, required): From `cwv-lcp-subparts-breakdown`.

---

## Outputs

- `nextjs_media_patch` (object): Files changed (`next.config.*`, the LCP component, the layout that loads fonts), the props used and why, and before/after LCP sub-parts.

---

## Phase 1: Inventory the Installed APIs

### Entry Criteria
- `package.json` lists `next`.

### Actions
1. Read the version: `node -p "require('next/package.json').version"`.
2. Read the real `next/image` props from the installed types instead of memory: `grep -nE "priority|preload|fetchPriority|sizes|loading|placeholder|quality" node_modules/next/dist/shared/lib/get-img-props.d.ts`. Recent majors changed the priority prop (older versions use `priority`; newer ones may add `preload` and mark `priority` deprecated). Use what the types declare; the deprecation note appears as a JSDoc `@deprecated` line in that file.
3. Find the LCP component: `grep -rn "<Image" app/ src/ components/ 2>/dev/null | grep -i "<part of the LCP selector or src>"`.
4. Find font loading: `grep -rn "next/font\|fonts.googleapis.com\|@font-face" app/ src/ pages/ styles/ 2>/dev/null`.

### Output
Version, available props, LCP component path, font loading sites.

### Quality Gate
- Every prop name used later appears in the grep output from step 2.

---

## Phase 2: Fix the LCP Image

### Entry Criteria
- `lcp_bottleneck` is `resource_load_delay` or `resource_load_duration`. If it is `element_render_delay`, skip to Phase 3. If it is `ttfb`, **Return**.

### Actions
1. For `resource_load_delay`, on the LCP `<Image>` only:
   - Add the priority prop the installed version declares (`priority` or `preload`). It disables lazy loading and adds a preload for that image.
   - Remove any explicit `loading="lazy"` on it.
2. For `resource_load_duration` (bytes too large), on the same `<Image>`:
   - With `fill` or responsive layouts, set `sizes` to the rendered width, for example `sizes="(max-width: 768px) 100vw, 50vw"`. Without `sizes`, a `fill` image is generated for the full viewport width set and downloads a larger candidate than needed.
   - In `next.config.js` (or `.mjs`/`.ts`) add `images: { formats: ['image/avif', 'image/webp'] }`. The default serves WebP only.
   - Do not lower `quality` below the project's current value without the user's approval; quality is a visual call, not a performance default. If the installed version requires allowed values in `images.qualities`, check its docs before changing `quality`.
3. If the image is remote, confirm its host is in `images.remotePatterns`; otherwise `next/image` errors.
4. If the image source is a CSS background in a CSS module, replace it with `<Image fill>` inside a positioned container with `style={{ objectFit: 'cover' }}`.
5. Change ONE component and `next.config.*`. Do not add the priority prop to every `<Image>`.

### Output
Patched LCP component and config.

### Quality Gate
- `npm run build` exits 0.
- Rendered HTML contains a preload for the LCP image: `curl -s http://localhost:3000/<path> | grep -c 'rel="preload" as="image"'` returns at least 1 after `npm run start`.

---

## Phase 3: Fix Font Loading

### Entry Criteria
- Phase 2 done or skipped.

### Actions
1. Replace any `<link href="https://fonts.googleapis.com/...">` in `app/layout.tsx`, `pages/_document.tsx` or CSS `@import` with `next/font`:
   ```tsx
   import { Inter } from 'next/font/google';
   const inter = Inter({ subsets: ['latin'], display: 'swap' });
   // <html className={inter.className}> in app/layout.tsx
   ```
   For self-hosted files use `next/font/local` with `src: './fonts/Brand.woff2'`.
2. `next/font` self-hosts the files, preloads them by default, and generates a size-adjusted fallback (`adjustFontFallback`, on by default). Do not set `adjustFontFallback: false`.
3. `display`: use `swap` when the brand font must always show; use `optional` when layout stability matters more than the font appearing on a slow first load. Record the choice.
4. Load each font once, in the root layout. Calling the font function in many files creates duplicate instances.

### Output
Patched font loading.

### Quality Gate
- `grep -rn "fonts.googleapis.com" app/ pages/ src/ styles/` returns no results.
- `npm run build` exits 0 and the built HTML has `<link rel="preload" ... as="font"` entries.

---

## Phase 4: Verify

### Entry Criteria
- Build succeeds.

### Actions
1. `npm run build && npm run start`, then repeat the `cwv-lcp-subparts-breakdown` Phase 2 trace.
2. In Network, confirm the LCP request goes to `/_next/image?url=...&w=<width>` with `content-type: image/avif` (or webp in browsers without AVIF) and High priority.
3. Record before/after sub-parts in `nextjs_media_patch`.

### Output
`nextjs_media_patch`.

### Quality Gate
- The LCP request shows High priority and the expected `content-type`.
- The `w=` value is at most the next candidate width above the rendered width times device pixel ratio.

---

## Worked Example

Illustrative only. Next.js 15 App Router; types declare `priority`.

Phase 1: `get-img-props.d.ts` lists `priority?: boolean;` and `sizes?: string;`. LCP component `app/p/[slug]/Gallery.tsx` uses `<Image fill src={...} loading="lazy">` with no `sizes`.

Phase 2 (`lcp_bottleneck` = `resource_load_delay`): remove `loading="lazy"`, add `priority`, add `sizes="(max-width: 768px) 100vw, 50vw"`; `next.config.mjs` gains `images: { formats: ['image/avif', 'image/webp'] }`.

Phase 3: `app/layout.tsx` had a Google Fonts `<link>`; replaced with `Inter({ subsets: ['latin'], display: 'swap' })`.

Phase 4: LCP request `/_next/image?url=%2Fimg%2Fgallery-1.jpg&w=828&q=75`, `content-type: image/avif`, priority High. Resource load delay 1490 ms to 210 ms in the lab trace.

---

## Exit Criteria

DONE when the LCP `<Image>` uses the version's priority prop and correct `sizes`, AVIF is enabled, fonts load through `next/font` once, and a trace confirms the change.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Prop not in installed types | **Adjust**: use the prop the types declare; do not add an unknown prop. |
| Phase 2 | Build error "hostname not configured" | **Adjust**: add the host to `images.remotePatterns`. |
| Phase 2 | Static export (`output: 'export'`) with default loader | **Stop**: the default optimizer does not run in static export; configure a custom loader or pre-encode images with `cwv-image-encode-responsive`. |
| Phase 4 | Image still lazy | **Retry**: confirm the edited component is the one rendering the LCP element (check the selector). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
