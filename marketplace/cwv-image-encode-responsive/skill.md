# Image Encoding and Responsive Markup

**One-line description:** Cuts LCP resource load duration by re-encoding oversized images to AVIF and WebP with `avifenc` and `cwebp`, generating width variants with ImageMagick, and serving them through `<picture>`, `srcset`, `sizes` and explicit `width`/`height`, with every byte saving measured.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): App repository root (Vite, webpack or static HTML).
- `lab_lcp_element` (object, required): From `cwv-lab-lighthouse-run`; names the LCP image URL.
- `image_quality` (integer, optional): Encoder quality chosen by the user. When empty, use each encoder's documented default (read it from `--help`) and record that.

---

## Outputs

- `image_patch` (object): Generated files, the markup change, and the build verification.
- `image_bytes_report` (object[]): Per image: original format, dimensions and bytes; each variant's format, width and bytes; rendered width on mobile and desktop.

---

## Phase 1: Measure What Is Served

### Entry Criteria
- The LCP element is an image (`lab_lcp_element` has a resource URL). Text LCP: **Return**.

### Actions
1. Download the served file and measure: `curl -s -o lcp.orig "<LCP URL>" && ls -l lcp.orig && magick identify lcp.orig` (ImageMagick 7; on ImageMagick 6 use `identify`).
2. Find the rendered size: in DevTools Elements, hover the `<img>`; the tooltip shows "rendered size" and "intrinsic size". Record both at a phone viewport (Device Toolbar) and desktop.
3. Compute the largest width needed: rendered CSS width times device pixel ratio (DevTools Device Toolbar shows DPR). An intrinsic width far above this is wasted bytes.
4. Check the content type: `curl -sI "<LCP URL>" | grep -i content-type`.
5. Find the source asset in the repo: `grep -rln "<file name>" src/ public/ index.html`.

### Output
Rows in `image_bytes_report` for the original.

### Quality Gate
- Original bytes, intrinsic size and rendered size (phone and desktop) are recorded from tool output.

---

## Phase 2: Encode Variants

### Entry Criteria
- Source asset located. Use the highest-quality original available (not the already-compressed served file) when the repo has one.

### Actions
1. Confirm tools and read their options: `cwebp -h`, `avifenc --help`, `magick -version`. Use only flags those print.
2. Pick widths: the widths needed by the rendered sizes from Phase 1 (for example the phone width times DPR, the desktop width times DPR), plus one smaller. Do not exceed the source's intrinsic width (no upscaling).
3. Resize: `magick source.jpg -resize 800x -strip hero-800.png` for each width (`-strip` removes metadata such as EXIF).
4. Encode each width:
   ```bash
   cwebp -q <image_quality or default> hero-800.png -o hero-800.webp
   avifenc -q <image_quality or default> hero-800.png hero-800.avif
   ```
   Older `avifenc` releases lack `-q` and use `--min`/`--max` quantizer flags; follow your `--help`.
5. Compare bytes: `ls -l hero-*`. Record each in `image_bytes_report`.
6. Open the original and the AVIF side by side at 100 percent zoom. If the user sees artifacts on faces, text or gradients, raise quality and re-encode. Do not decide visual acceptability for the user; record that they approved it.

### Output
Variant files and their byte counts.

### Quality Gate
- Every variant is smaller in bytes than the served original at the same or larger width; any variant that is not is discarded and recorded.
- The user's visual approval (or rejection and new quality) is recorded.

---

## Phase 3: Serve With Responsive Markup

### Entry Criteria
- Approved variants exist.

### Actions
1. Place variants where the bundler serves static files (`public/` for Vite, the configured static dir for webpack). Hashing or not decides caching; see `cwv-cache-headers-cdn`.
2. Replace the LCP `<img>` with:
   ```html
   <picture>
     <source type="image/avif" srcset="/img/hero-480.avif 480w, /img/hero-800.avif 800w, /img/hero-1200.avif 1200w" sizes="(max-width: 768px) 100vw, 50vw">
     <source type="image/webp" srcset="/img/hero-480.webp 480w, /img/hero-800.webp 800w, /img/hero-1200.webp 1200w" sizes="(max-width: 768px) 100vw, 50vw">
     <img src="/img/hero-800.jpg" width="1200" height="800" alt="..." fetchpriority="high">
   </picture>
   ```
   `sizes` must describe the real rendered width from Phase 1, not `100vw` everywhere. `width`/`height` set the intrinsic aspect ratio and prevent layout shift.
3. Keep `fetchpriority="high"` and no `loading="lazy"` on the LCP image. If `cwv-lcp-priority-hints` added a preload, update its `imagesrcset`/`imagesizes` to these exact variants, and include `type` only if every listed file has that type.
4. Edit one component or template. Build: `npm run build`.

### Output
Patched markup.

### Quality Gate
- `npm run build` exits 0.
- In DevTools Network at a phone viewport, the LCP request is an `.avif` with width at or near the computed need, and its transferred size is recorded.

---

## Worked Example

Illustrative only. Vite site; LCP image `/img/hero.jpg`.

Phase 1: served 1,412,330 bytes, intrinsic 2400x1600; rendered 390 CSS px wide on a phone at DPR 3 (needs about 1170 px), 640 px on desktop at DPR 1.

Phase 2 (quality left at encoder defaults, recorded from `--help`):
```text
$ ls -l hero-*
 41822 hero-480.avif   61210 hero-480.webp
 98114 hero-800.avif  141902 hero-800.webp
171550 hero-1200.avif 246318 hero-1200.webp
```
User approved AVIF at default quality.

Phase 3: `<picture>` markup with widths 480/800/1200 and `sizes="(max-width: 768px) 100vw, 640px"`. Phone request: `hero-1200.avif`, 171,550 bytes, down from 1,412,330.

---

## Exit Criteria

DONE when the LCP image is served as AVIF/WebP variants at widths matching its rendered size, with accurate `sizes`, explicit dimensions, user-approved quality, and measured byte savings.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | LCP is text or a video | **Return**: images are not the LCP; emit empty outputs. |
| Phase 2 | `avifenc` or `cwebp` not installed | **Adjust**: install libavif / libwebp tools from the OS package manager; do not use an abandoned web tool. |
| Phase 2 | User rejects visual quality | **Retry**: raise quality one step and re-encode. |
| Phase 3 | Browser picks a too-large candidate | **Adjust**: `sizes` is wrong; re-measure rendered width per breakpoint. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
