# Target Size Minimum Measurement (SC 2.5.8)

**One-line description:** Measures every pointer target on every page at mobile and desktop viewports against WCAG 2.2 SC 2.5.8 Target Size (Minimum), 24 by 24 CSS pixels, with a Playwright script that applies the spacing exception's 24 px circle test exactly, then classifies remaining candidates against the inline, equivalent, user agent control and essential exceptions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_inventory` (object[], required): Output of `a11y-scope-inventory`.
- `site_url` (string, required): Base URL.
- `viewports` (object[], optional): Viewport sizes to test as `{width, height}` in CSS px. If absent, use Playwright's built-in device descriptors named by the owner (for example `devices['iPhone 13']` and `devices['Desktop Chrome']`); do not choose sizes yourself.

---

## Outputs

- `target_size_issues` (object[]): One row per failing target: `issue_id` (T001, ...), `sc` = "2.5.8", `page_id`, `viewport`, `selector`, `accessible_name`, `width`, `height` (CSS px, two decimals), `nearest_conflict` (selector of the target whose circle or box it overlaps), `exception_checked` (list of exceptions ruled out), `source` = "target-size".

---

## Phase 1: Learn the Rule Precisely

### Entry Criteria
- Inventory exists.

### Actions
1. The SC text: the size of the target for pointer inputs is at least 24 by 24 CSS pixels, except where:
   - Spacing: undersized targets (under 24 by 24) are positioned so that if a 24 CSS px diameter circle is centered on the bounding box of each, the circles do not intersect another target or the circle for another undersized target.
   - Equivalent: the function can be achieved through a different control on the same page that meets the SC.
   - Inline: the target is in a sentence or its size is otherwise constrained by the line-height of non-target text.
   - User agent control: the size is determined by the user agent and not modified by the author (an unstyled native checkbox).
   - Essential: a particular presentation is essential or legally required (for example pins on a map).
2. Size is the target's clickable area, which is normally the element's bounding box including padding. A 16 px icon inside a button with padding to 24 px passes.
3. 24 by 24 is the WCAG 2.2 AA number. 44 by 44 is the AAA SC 2.5.5 number; do not use it as the AA requirement.

### Output
Rule understood; no artifact.

### Quality Gate
- The exceptions list above is copied into the evidence notes for this run.

---

## Phase 2: Measure with Playwright

### Entry Criteria
- Node.js and `@playwright/test` installed (see `a11y-axe-playwright-scan` Phase 1).

### Actions
1. Create `a11y/target-size.spec.ts`:
   ```ts
   import { test } from '@playwright/test';
   import fs from 'node:fs';
   const rows = JSON.parse(fs.readFileSync('page_inventory.json', 'utf8'));
   for (const row of rows) test(`${row.id}`, async ({ page }, info) => {
     await page.goto(process.env.SITE_URL + row.url);
     const out = await page.evaluate(() => {
       const sel = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=checkbox],[role=radio],[role=switch],[role=tab],[role=menuitem],[role=option],[onclick],[tabindex]:not([tabindex="-1"])';
       const els = [...document.querySelectorAll(sel)].filter(e => {
         const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
         return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.pointerEvents !== 'none';
       });
       const box = (e: Element) => e.getBoundingClientRect();
       const small = els.filter(e => { const r = box(e); return r.width < 24 || r.height < 24; });
       const center = (r: DOMRect) => [r.left + r.width / 2, r.top + r.height / 2];
       const distToRect = (p: number[], r: DOMRect) => {
         const dx = Math.max(r.left - p[0], 0, p[0] - r.right);
         const dy = Math.max(r.top - p[1], 0, p[1] - r.bottom);
         return Math.hypot(dx, dy);
       };
       return small.map(e => {
         const r = box(e); const c = center(r); let conflict = null;
         for (const o of els) {
           if (o === e || o.contains(e) || e.contains(o)) continue;
           const ro = box(o);
           const oSmall = ro.width < 24 || ro.height < 24;
           const hit = oSmall ? Math.hypot(c[0] - center(ro)[0], c[1] - center(ro)[1]) < 24 : distToRect(c, ro) < 12;
           if (hit) { conflict = o.outerHTML.slice(0, 80); break; }
         }
         return { html: e.outerHTML.slice(0, 120), name: e.getAttribute('aria-label') || (e.textContent || '').trim().slice(0, 40),
                  width: +r.width.toFixed(2), height: +r.height.toFixed(2), conflict,
                  inText: !!e.closest('p,li,td,dd') && getComputedStyle(e).display === 'inline' };
       });
     });
     fs.mkdirSync('ts-out', { recursive: true });
     fs.writeFileSync(`ts-out/${row.id}-${info.project.name}.json`, JSON.stringify(out, null, 2));
   });
   ```
   The circle logic: each undersized target gets a circle of radius 12 at its center. Its circle intersects another target's box when the distance from its center to that box is under 12. Two undersized targets' circles intersect when their centers are under 24 apart.
2. Define one Playwright project per viewport in `playwright.config.ts` (`projects: [{ name: 'mobile', use: { ...devices['iPhone 13'] } }, { name: 'desktop', use: { ...devices['Desktop Chrome'] } }]`, or use the owner's `viewports`).
3. Run: `SITE_URL=<site_url> npx playwright test a11y/target-size.spec.ts --reporter=list`.
4. Cross-check with axe: axe-core's `target-size` rule is tagged `wcag22aa`. Compare its violations from `a11y-axe-playwright-scan` with this list; investigate any target axe flags that this script does not.

### Output
Candidate list per page per viewport: undersized targets with `conflict` not null.

### Quality Gate
- `ls ts-out/*.json | wc -l` equals inventory rows times viewport count.
- Every axe `target-size` violation from the axe scan is present in the candidate list or explained.

---

## Phase 3: Apply the Remaining Exceptions

### Entry Criteria
- Candidates exist.

### Actions
1. Undersized targets with `conflict` = null pass by the spacing exception; do not record them.
2. For each remaining candidate, rule out the other exceptions in order and record the result in `exception_checked`:

   | Exception | Passes when | Check |
   |---|---|---|
   | inline | it is a link inside a sentence or paragraph text (`inText` true) | read the context; a list of links in a footer is not inline |
   | user agent control | native control with no author styling of its size | DevTools Styles shows no author rule setting `width`, `height`, `padding` or `appearance` on it |
   | equivalent | another control on the same page does the same thing and is 24 by 24 or meets spacing | name that control's selector |
   | essential | the presentation is essential or legally required | owner confirms in writing; record their statement |

3. Record each candidate that no exception covers as a failure.
4. Do not fix by scaling icons visually only; the clickable area (padding or a pseudo-element hit area) must grow. Note this in the row for the fix flow.

### Output
`target_size_issues`.

### Quality Gate
- Every failing row lists all four exceptions in `exception_checked` as ruled out.
- Every row has `width` and `height` from the script output, not estimated.

---

## Worked Example

Illustrative only. P03 `/cart`, mobile project.

`ts-out/P03-mobile.json` excerpt:
```json
[{"html":"<button class=\"qty-minus\" aria-label=\"Decrease quantity\">","width":20,"height":20,
  "conflict":"<input class=\"qty-input\" value=\"1\" ...","inText":false},
 {"html":"<a href=\"/terms\">terms</a>","width":34.5,"height":17,"conflict":null,"inText":true}]
```
The terms link has no conflict, so it passes by spacing (and would also pass as inline). The minus button is 20 by 20 and its circle center is 9 px from the quantity input's box: under 12, so it intersects. It is not inline, it has author styling, there is no equivalent control, and it is not essential. Row T001 `width` 20, `height` 20, `nearest_conflict` `.qty-input`.

---

## Exit Criteria

DONE when every page has been measured at every viewport, every undersized target has been tested with the spacing circle method, and every remaining candidate has all exceptions ruled out or applied.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Many false positives from hidden off-canvas menus | **Adjust**: add a filter for elements inside `[hidden]`, `[inert]`, or `[aria-hidden=true]` ancestors and rerun. |
| Phase 2 | Clickable area is larger than the element (parent `label` is clickable) | **Adjust**: measure the `label` box for checkboxes and radios; the label is part of the target. |
| Phase 3 | Owner claims "essential" without reason | **Return**: record it as a failure until a written reason is given. |

**Do not:** use 44 by 44 as the AA requirement; measure the icon glyph instead of the clickable box; mark a footer link list as inline.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
