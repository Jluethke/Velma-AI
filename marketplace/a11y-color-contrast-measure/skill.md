# Color Contrast Measurement

**One-line description:** Measures text contrast (SC 1.4.3) and non-text contrast for UI component boundaries, states and meaningful graphics (SC 1.4.11) with the WCAG relative luminance formula, resolving every case axe-core marks "incomplete" (text over images, gradients, pseudo-elements, transparency), plus SC 1.4.1 Use of Color for links in text.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_inventory` (object[], required): Output of `a11y-scope-inventory`.
- `needs_review_items` (object[], optional): Items from `a11y-scan-merge-dedupe` with `route_to` = `a11y-color-contrast-measure`.

---

## Outputs

- `contrast_issues` (object[]): One row per failing element: `issue_id` (C001, ...), `sc` (1.4.3, 1.4.11 or 1.4.1), `page_id`, `selector`, `foreground` (hex), `background` (hex, the worst-case pixel for images and gradients), `ratio` (two decimals, not rounded up), `required` (4.5, 3 or 3), `text_size_class` (normal or large, for 1.4.3), `state` (default, hover, focus, disabled, selected), `measured_with`, `source` = "contrast".

---

## Phase 1: Learn the Rule and the Formula

### Entry Criteria
- Inventory exists.

### Actions
1. Use these thresholds; they are the WCAG 2.2 AA values:

   | Content | SC | Minimum ratio |
   |---|---|---|
   | normal text | 1.4.3 | 4.5:1 |
   | large text: at least 18 point (24 CSS px), or at least 14 point bold (about 18.66 CSS px) | 1.4.3 | 3:1 |
   | visual boundaries of UI components needed to identify them (input borders when there is no fill, checkbox outlines), and state indicators (selected tab underline, focus indicator, toggle on/off) | 1.4.11 | 3:1 against adjacent colors |
   | parts of graphics needed to understand them (chart lines, icon-only buttons' glyphs) | 1.4.11 | 3:1 against adjacent colors |

2. Exempt, do not record: text or components that are disabled (inactive), pure decoration, logotypes (text in a logo), text in an image that is incidental, and components whose look is set by the browser and not modified by the author.
3. The formula (WCAG 2.2 definition of relative luminance): for each sRGB channel c in 0 to 1, linear = c / 12.92 if c <= 0.04045, else ((c + 0.055) / 1.055) ^ 2.4. L = 0.2126 R + 0.7152 G + 0.0722 B. Ratio = (L_lighter + 0.05) / (L_darker + 0.05).
4. Never round up. 4.49:1 fails 4.5:1. Report two decimals truncated.
5. Semi-transparent colors: compute the composited color first. For foreground alpha a over background B: result = a * F + (1 - a) * B per channel. Measure the composited color, not the CSS value.

### Output
Thresholds and formula ready.

### Quality Gate
- A self-check computes `#767676` on `#ffffff` as 4.54:1 and `#949494` on `#ffffff` as 3.03:1 with the formula (any small script or the Chrome color picker).

---

## Phase 2: Measure Text Contrast

### Entry Criteria
- Phase 1 self-check passed.

### Actions
1. For confirmed axe `color-contrast` violations, axe already gives the colors and ratio in `failureSummary`; copy them.
2. For every `needs_review_items` contrast entry (axe `incomplete`), measure by hand:

   | Case | How to measure |
   |---|---|
   | solid background behind a pseudo-element or overlapping element | Chrome DevTools: select the text element, Styles pane, click the color swatch of `color`; the picker shows "Contrast ratio" against the background it detects. Check the background it used is the one you see. |
   | text over a gradient | sample the gradient color directly behind the lightest (for dark text) or darkest (for light text) part of the text with an eyedropper; measure that pair |
   | text over a photo or video | screenshot at 100% zoom, sample the pixel behind the text that gives the lowest ratio; also test with the image not loaded (DevTools, Network, block request) because the fallback background color must also pass |
   | text with opacity or `rgba` | composite first (Phase 1 step 5) |

3. Use a desktop eyedropper tool such as the TPGi CCA desktop app, or the Chrome color picker, and record the tool in `measured_with`.
4. Determine large text from computed styles: DevTools, Computed, `font-size` and `font-weight`. Bold means `font-weight` 700 or more. Do not judge size by eye.
5. Measure every state: hover, focus, visited links, selected, and error text. Use DevTools Styles pane ":hov" to force `:hover` and `:focus`.

### Output
Text contrast rows.

### Quality Gate
- Every `needs_review_items` contrast entry is resolved as pass or fail with both hex values recorded.
- Every 1.4.3 row records the computed `font-size` and `font-weight` that set `text_size_class`.

---

## Phase 3: Measure Non-Text Contrast and Use of Color

### Entry Criteria
- Text pass done.

### Actions
1. For each form control, measure its boundary color against the page background. If the input has a background fill that contrasts 3:1 with the page, the border does not need to. If neither the border nor the fill reaches 3:1 and there is no other visual cue, record 1.4.11.
2. For icon-only buttons and meaningful icons, measure the glyph color against its background.
3. For state indicators (selected tab, checked checkbox, toggle on), measure the indicator against adjacent colors; a change shown only by a shade with less than 3:1 difference from the unselected state fails 1.4.11.
4. Charts: measure each data line or segment against the background and against adjacent segments when color is the only separator.
5. Use of Color (1.4.1): for links inside a paragraph that are distinguished only by color (no underline), the link color must have 3:1 against the surrounding text color and the link must show a non-color cue (underline, outline) on hover and focus; this is W3C technique G183. axe rule `link-in-text-block` checks this; verify its incomplete items here. Also record any form error or required field shown only by red color.

### Output
`contrast_issues`.

### Quality Gate
- Every row has `foreground`, `background`, `ratio`, `required`, and `state`.
- No row has a `ratio` greater than or equal to its `required` value (those are passes and must not be recorded).

---

## Worked Example

Illustrative only. P05 `/checkout/shipping`.

Phase 2: axe reported `#continue` button text `#ffffff` on `#1a73e8` as incomplete because of a gradient. Sampling the lightest part of the gradient gives `#5a9cf0`.
```
$ python -c "..."   # formula from Phase 1
#ffffff on #5a9cf0 = 2.81:1   (font-size 16px, weight 600: normal text, needs 4.5:1)
```
Row C006: `sc` 1.4.3, `ratio` 2.81, `required` 4.5, `measured_with` "Chrome color picker + formula".

Phase 3: text inputs have a 1px `#e5e7eb` border on white, no fill. Ratio 1.24:1. Row C007: `sc` 1.4.11, `required` 3.

---

## Exit Criteria

DONE when every contrast violation and every routed incomplete item has measured colors and a ratio, all states were checked, and all non-text components and in-text links were measured.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | DevTools picker shows no contrast ratio | **Adjust**: it cannot find a solid background; use the eyedropper method on a screenshot. |
| Phase 2 | Dark mode or theme switch exists | **Adjust**: repeat the pass in each theme the site offers; record `state` with the theme name. |
| Phase 3 | Unsure if a border is "needed to identify" the component | **Adjust**: hide the border in DevTools; if the control's location and type are no longer identifiable from fill, text, or shape, the border is needed. |

**Do not:** round 4.48 to 4.5; measure the CSS color when opacity or blending applies; record disabled controls; trust a color named in a design file without measuring the rendered page.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
