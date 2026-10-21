# Reflow, Zoom, Text Spacing and Hover Content Check

**One-line description:** Tests every page at a 320 CSS px wide viewport for SC 1.4.10 Reflow, at 200% text zoom for SC 1.4.4 Resize Text, with the SC 1.4.12 Text Spacing override stylesheet, for SC 1.4.13 Content on Hover or Focus, and for SC 1.3.4 Orientation, using Playwright measurements of horizontal overflow and clipped text.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_inventory` (object[], required): Output of `a11y-scope-inventory`.
- `site_url` (string, required): Base URL.

---

## Outputs

- `reflow_issues` (object[]): One row per failure: `issue_id` (R001, ...), `sc` (1.4.10, 1.4.4, 1.4.12, 1.4.13, 1.3.4), `page_id`, `selector`, `condition` (320px, zoom-200, text-spacing, hover, focus, orientation), `symptom` (horizontal-scroll, clipped-text, overlap, content-lost, not-dismissible, not-hoverable, not-persistent, orientation-locked), `measurement` (for example `scrollWidth 412 > clientWidth 320`), `screenshot`, `source` = "reflow".

---

## Phase 1: Reflow at 320 CSS Pixels (1.4.10)

### Entry Criteria
- Playwright installed.

### Actions
1. 1.4.10 requires content to be presented without loss of information or function and without scrolling in two dimensions at a width equal to 320 CSS px (for vertically scrolling content). 320 CSS px is what a 1280 px wide window shows at 400% zoom.
2. Create `a11y/reflow.spec.ts`:
   ```ts
   import { test } from '@playwright/test';
   import fs from 'node:fs';
   const rows = JSON.parse(fs.readFileSync('page_inventory.json', 'utf8'));
   test.use({ viewport: { width: 320, height: 256 } });
   for (const row of rows) test(row.id, async ({ page }) => {
     await page.goto(process.env.SITE_URL + row.url);
     const r = await page.evaluate(() => {
       const d = document.documentElement;
       const wide = [...document.querySelectorAll('body *')].filter(e => {
         const b = e.getBoundingClientRect(); return b.right > d.clientWidth + 1 && b.width > 0;
       }).slice(0, 20).map(e => e.tagName + (e.id ? '#' + e.id : '') + '.' + String(e.className).split(' ')[0]);
       return { scrollWidth: d.scrollWidth, clientWidth: d.clientWidth, wide };
     });
     fs.mkdirSync('reflow-out', { recursive: true });
     await page.screenshot({ path: `reflow-out/${row.id}.png`, fullPage: true });
     fs.writeFileSync(`reflow-out/${row.id}.json`, JSON.stringify(r));
   });
   ```
   The height 256 is the value Understanding SC 1.4.10 gives for horizontally scrolling content (1024 px at 400%); it only affects the first screen, and this check is about width. The `+ 1` allows for subpixel rounding only.
3. Run: `SITE_URL=<site_url> npx playwright test a11y/reflow.spec.ts`.
4. Fail when `scrollWidth > clientWidth` and the overflowing element is not an exception. Exceptions (content that needs two-dimensional layout): data tables, maps, diagrams, video, games, toolbars that must keep their layout, and code blocks. A table that scrolls horizontally inside its own container passes if the rest of the page does not.
5. Look at each screenshot for content lost: text cut off, buttons hidden behind other elements, a navigation menu with no way to open it.

### Output
Reflow rows with measurements and screenshots.

### Quality Gate
- `reflow-out/` has one JSON and one PNG per inventory row.
- Every 1.4.10 row quotes `scrollWidth` and `clientWidth`.

---

## Phase 2: Text Resize and Text Spacing (1.4.4, 1.4.12)

### Entry Criteria
- Phase 1 done.

### Actions
1. Resize Text: in desktop Chrome at a normal window size, set Settings, Appearance, Font size to "Very large", or use browser zoom 200% (Ctrl and + until 200%). Fail when text is clipped, overlaps, or a function is lost. Text in `px` that does not grow with the font size setting is not itself a failure if browser zoom to 200% works; record it as a note.
2. Text Spacing: inject the override stylesheet with the values from the SC 1.4.12 text (line height 1.5 times font size, paragraph spacing 2 times font size, letter spacing 0.12 times, word spacing 0.16 times):
   ```js
   const s = document.createElement('style');
   s.textContent = `* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }`;
   document.head.appendChild(s);
   ```
   Run it in the Console or with `page.addStyleTag({ content: ... })` in Playwright.
3. Fail 1.4.12 when any text is cut off, overlaps other text, or disappears. A fast detector: run
   ```js
   [...document.querySelectorAll('body *')].filter(e => (e.scrollHeight > e.clientHeight + 1 && ['hidden','clip'].includes(getComputedStyle(e).overflowY)) || (e.scrollWidth > e.clientWidth + 1 && ['hidden','clip'].includes(getComputedStyle(e).overflowX))).map(e => e.tagName + '.' + String(e.className).split(' ')[0])
   ```
   This lists elements whose content is larger than their box and hidden by overflow. Confirm each on screen.
4. Common causes to note in the row: fixed `height` on buttons, cards and badges; `overflow: hidden` with `white-space: nowrap`; `line-clamp` without a way to read the rest.

### Output
Resize and spacing rows.

### Quality Gate
- Every page has a 200% zoom screenshot and a text-spacing screenshot saved.
- Every 1.4.12 row names the clipped element found by the detector or by eye.

---

## Phase 3: Hover and Focus Content, and Orientation (1.4.13, 1.3.4)

### Entry Criteria
- Phase 2 done.

### Actions
1. For each tooltip, popover, and hover menu, test the three 1.4.13 conditions:

   | Condition | Test | Fail symptom |
   |---|---|---|
   | dismissible | show it by hover or focus, then press Escape without moving the pointer or focus | not-dismissible |
   | hoverable | show it by hover, then move the pointer onto the new content | not-hoverable (it disappears) |
   | persistent | show it and wait without moving | not-persistent (it disappears on a timer) |

   Exception: the browser's native `title` tooltip is controlled by the user agent and is exempt.
2. Orientation (1.3.4): on a phone or with Playwright emulation of a landscape viewport, check that content works in both portrait and landscape. Search for a lock: `rg -n "screen\.orientation\.lock|orientation:\s*(portrait|landscape)" src` and the web app manifest `"orientation"` key. Fail when content is restricted to one orientation and that orientation is not essential.

### Output
`reflow_issues`.

### Quality Gate
- Every hover or focus component has all three conditions recorded.
- Portrait and landscape results are recorded for at least every page with a process step.

---

## Worked Example

Illustrative only. P04 `/checkout/shipping` at 320 px.

```
$ jq . reflow-out/P04.json
{"scrollWidth":412,"clientWidth":320,"wide":["DIV.stepper","OL.stepper-list"]}
```
Screenshot shows the checkout step indicator forcing horizontal scroll. Row R001 `sc` 1.4.10, `symptom` horizontal-scroll, `measurement` "scrollWidth 412 > clientWidth 320", selector `.stepper`.
Phase 2 text spacing: the "Continue" button has `height: 40px` and its label wraps and is cut off. Detector output `["BUTTON.btn-primary"]`. Row R002 `sc` 1.4.12, `symptom` clipped-text.
Phase 3: the CVV info tooltip disappears when the pointer moves to it. Row R003 `sc` 1.4.13, `symptom` not-hoverable.

---

## Exit Criteria

DONE when every page was measured at 320 CSS px, at 200% zoom, with the text spacing override, every hover or focus component passed the three 1.4.13 tests or is recorded, and orientation was checked.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Overflow is caused by a 1 px rounding of a full-width element | **Adjust**: the script already allows 1 px; confirm on screen that no content is hidden before recording. |
| Phase 2 | The override stylesheet does not apply inside shadow DOM | **Adjust**: inject the same style into each shadow root with `el.shadowRoot.appendChild(style.cloneNode(true))`. |
| Phase 3 | Tooltip is a native `title` attribute | **Adjust**: exempt under 1.4.13; check instead that the information is not available only in the tooltip (1.1.1 or 3.3.2). |

**Do not:** test reflow by narrowing a desktop window that has a minimum width set by the browser; record data tables as reflow failures; skip the persistence test.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
