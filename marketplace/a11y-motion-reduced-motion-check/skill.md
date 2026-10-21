# Motion, Flashing and Reduced Motion Check

**One-line description:** Finds every animation, auto-playing carousel, video, parallax and flashing element, checks SC 2.2.2 Pause, Stop, Hide, SC 2.3.1 Three Flashes or Below Threshold and SC 1.4.2 Audio Control, and verifies the site honors the `prefers-reduced-motion: reduce` media feature (technique C39, supporting AAA SC 2.3.3) with emulation in DevTools and Playwright.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_inventory` (object[], required): Output of `a11y-scope-inventory`.
- `repo_dir` (string, required): Front-end source repository.
- `site_url` (string, required): Base URL for the Playwright reduced-motion run.

---

## Outputs

- `motion_issues` (object[]): One row per failure: `issue_id` (MO001, ...), `sc` (2.2.2, 2.3.1, 1.4.2, or 2.3.3 for reduced-motion gaps), `level` (A or AAA), `page_id`, `selector`, `motion_type` (carousel, marquee, video, animated-gif, parallax, css-animation, js-animation, flashing, audio), `auto_starts` (bool), `duration_seconds` (measured), `has_pause_control` (bool), `honors_reduced_motion` (bool), `source_location`, `source` = "motion".

---

## Phase 1: Inventory Motion in Source and on Screen

### Entry Criteria
- Inventory and `repo_dir` exist.

### Actions
1. Static searches (save each output):
   - CSS animations and transitions: `rg -n "@keyframes|animation\s*:|animation-name\s*:" <repo_dir> --glob "*.{css,scss,less,vue,tsx,jsx}"`
   - Reduced-motion handling present: `rg -n "prefers-reduced-motion" <repo_dir>`
   - JS animation libraries: `rg -n "from ['\"](framer-motion|motion|gsap|lottie-web|lottie-react|swiper|slick-carousel|keen-slider|embla-carousel|aos)['\"]" <repo_dir>/src`
   - Autoplay media: `rg -n "autoplay|autoPlay" <repo_dir>`
2. On each page, watch without touching anything and list each moving, blinking, scrolling or auto-updating element. Time each with a stopwatch until it stops by itself or passes five seconds (the SC 2.2.2 limit); record the measured time or "continuous".
3. Also open DevTools, More tools, Animations panel, and reload: it lists running CSS animations and transitions with durations and iteration counts. `iteration-count: infinite` means it never stops by itself.

### Output
A motion list per page with measured durations.

### Quality Gate
- Every page has an entry (possibly "no motion observed") and every motion item has a measured time or "continuous".
- All four static searches were run and saved.

---

## Phase 2: Check WCAG A Criteria

### Entry Criteria
- Motion list exists.

### Actions
1. Pause, Stop, Hide (2.2.2, level A):

   | Content | Fail when |
   |---|---|
   | moving, blinking or scrolling content that starts automatically, lasts more than five seconds, and is shown in parallel with other content | there is no mechanism to pause, stop or hide it (a pause button counts; hover-to-pause alone does not help keyboard and touch users, so check that the control is a focusable button) |
   | auto-updating content (tickers, live scores, rotating news) that starts automatically and is shown with other content | no way to pause, stop, hide, or control the update frequency |

   Exception: motion that is essential to the activity, and loading spinners and progress indicators shown while nothing else can be done.
2. Three Flashes (2.3.1, level A): any content that flashes more than three times in any one-second period fails unless it is below the general flash and red flash thresholds defined in the WCAG 2.2 glossary. Do not estimate thresholds by eye. For video or animation that flashes, run it through PEAT (Photosensitive Epilepsy Analysis Tool, Trace Research and Development Center) or another tool that implements the WCAG flash definitions, and record the tool's verdict. If no tool is available, record the item as "flashes observed, not analyzed" and block release of that content until analyzed.
3. Audio Control (1.4.2, level A): audio that plays automatically for more than three seconds needs a pause or stop control, or a volume control independent of the system volume. Check videos with autoplay and sound.
4. Record `has_pause_control` by finding the control with Tab and activating it with Enter or Space; a control that works only with the mouse does not count.

### Output
A-level rows.

### Quality Gate
- Every motion item over five seconds has `has_pause_control` recorded from a keyboard test.
- Every flashing item has a tool verdict or the "not analyzed" status.

---

## Phase 3: Verify Reduced Motion Support

### Entry Criteria
- Phase 2 done.

### Actions
1. Emulate the user setting:
   - Chrome DevTools: Command Menu (Ctrl+Shift+P or Command+Shift+P), type "Rendering", open the Rendering panel, set "Emulate CSS media feature prefers-reduced-motion" to `reduce`.
   - Operating system: Windows, Settings, Accessibility, Visual effects, "Animation effects" off; macOS, System Settings, Accessibility, Display, "Reduce motion" on; iOS, Settings, Accessibility, Motion, "Reduce Motion" on.
2. Automate the comparison with Playwright:
   ```ts
   import { test } from '@playwright/test';
   test('reduced motion', async ({ page }) => {
     await page.emulateMedia({ reducedMotion: 'reduce' });
     await page.goto(process.env.SITE_URL + '/');
     const running = await page.evaluate(() =>
       document.getAnimations().filter(a => a.playState === 'running').map(a => ({
         target: (a.effect as KeyframeEffect)?.target?.outerHTML.slice(0, 80),
         name: (a as CSSAnimation).animationName ?? 'web-animation'
       })));
     console.log(JSON.stringify(running, null, 2));
   });
   ```
   Run it with and without the `emulateMedia` line: `npx playwright test reduced-motion.spec.ts --reporter=list`. `document.getAnimations()` lists CSS animations, CSS transitions and Web Animations API animations; it does not list `requestAnimationFrame` loops, canvas, video or GIF motion, which you check by eye.
3. Record `honors_reduced_motion` = false for any non-essential animation (parallax, auto-advancing carousel, large slide or zoom transitions, scroll-triggered animations) still running under `reduce`. Record as `sc` 2.3.3 with `level` AAA unless the owner's target includes it. Reduced-motion support is AAA, not AA; report it in its own section so it is never counted against AA conformance.
4. JS libraries need explicit handling: for example Framer Motion's `MotionConfig reducedMotion="user"` or `useReducedMotion()`, GSAP with `gsap.matchMedia()`, Swiper and other carousels with `autoplay` disabled when `window.matchMedia('(prefers-reduced-motion: reduce)').matches`. Name the library found in Phase 1 in the row; check the library's own docs for the exact option before writing a fix.

### Output
`motion_issues`.

### Quality Gate
- The Playwright run output (running animations with and without `reduce`) is saved for at least the home page and every page with motion.
- Every reduced-motion row has `level` = AAA unless the owner's scope says otherwise.

---

## Worked Example

Illustrative only. P01 home page has a hero carousel using Swiper.

Phase 1: `rg` finds `import { Autoplay } from 'swiper/modules'` in `src/components/Hero.tsx` and no `prefers-reduced-motion` anywhere. Stopwatch: slides advance continuously, never stop.
Phase 2: the only pause is on mouse hover; Tab reaches the slide dots but no pause button. Row MO001 `sc` 2.2.2, `level` A, `auto_starts` true, `duration_seconds` "continuous", `has_pause_control` false.
Phase 3 Playwright output with `reduce`:
```
[ { "target": "<div class=\"swiper-wrapper\" ...", "name": "web-animation" },
  { "target": "<section class=\"hero parallax\" ...", "name": "parallax-drift" } ]
```
Row MO002 `sc` 2.3.3, `level` AAA, `honors_reduced_motion` false.

---

## Exit Criteria

DONE when every page's motion is inventoried with measured durations, every A-level motion criterion is checked with keyboard-tested controls, flashing content has a tool verdict, and reduced-motion behavior is measured with emulation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Motion starts only after scrolling | **Adjust**: scroll each page slowly to the bottom and observe again; scroll-triggered motion is in scope. |
| Phase 2 | No flash analysis tool available | **Stop**: mark the content "not analyzed" and do not mark 2.3.1 as Supports in the report. |
| Phase 3 | `document.getAnimations` is undefined | **Adjust**: update the browser; Playwright's bundled Chromium supports it. |

**Do not:** judge flash thresholds by eye; count hover-to-pause as a pause mechanism; report reduced-motion gaps as AA failures.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
