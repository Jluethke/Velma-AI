# Focus Order and Visible Focus Check

**One-line description:** Checks SC 2.4.3 Focus Order, 2.4.7 Focus Visible and 2.4.11 Focus Not Obscured (Minimum) on every page state, finds the CSS and markup causes (`outline: none`, positive `tabindex`, sticky headers, CSS reordering, focus lost after DOM changes), and measures focus indicator contrast against SC 1.4.11.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_inventory` (object[], required): Output of `a11y-scope-inventory`.
- `keyboard_issues` (object[], optional): Output of `a11y-keyboard-operability-pass`; its focus logs are reused and lost-focus notes are confirmed here.
- `repo_dir` (string, required): Front-end source repository path.

---

## Outputs

- `focus_issues` (object[]): One row per failure: `issue_id` (F001, ...), `sc` (2.4.3, 2.4.7, 2.4.11 or 1.4.11), `page_id`, `selector`, `cause` (one of: outline-removed, positive-tabindex, css-reorder, obscured-by-sticky, obscured-by-overlay, focus-lost, focus-not-moved, low-indicator-contrast), `source_location` (file and line when found), `evidence` (screenshot path), `blocks_task`, `source` = "focus".

---

## Phase 1: Static Search for Known Causes

### Entry Criteria
- `repo_dir` exists.

### Actions
1. Run each search and keep the output as evidence:
   - Outline removed: `rg -n "outline\s*:\s*(none|0)\b" <repo_dir> --glob "*.{css,scss,less,vue,tsx,jsx,ts,js,html}"`
   - Positive tabindex: `rg -n "tabindex=\"[1-9]|tabIndex=\{[1-9]" <repo_dir>`
   - CSS visual reordering: `rg -n "order\s*:\s*-?[1-9]|flex-direction\s*:\s*(row|column)-reverse|grid-auto-flow\s*:\s*dense" <repo_dir>`
   - Sticky or fixed overlays: `rg -n "position\s*:\s*(sticky|fixed)" <repo_dir>`

2. For each `outline: none` hit, open the rule and check whether the same selector, or a `:focus-visible` rule for it, sets a replacement indicator (another `outline`, a `box-shadow`, a `border` change). If no replacement exists, it is a candidate 2.4.7 failure. Confirm in the browser in Phase 2 before recording.
3. Any positive `tabindex` is a candidate 2.4.3 failure because it pulls elements ahead of the DOM order. Confirm in Phase 2.

### Output
A candidate list with file and line for each.

### Quality Gate
- All four searches were run and their output saved (empty output is saved as "no matches").

---

## Phase 2: In-Browser Order and Visibility

### Entry Criteria
- Candidate list exists.

### Actions
1. For each page state, Tab through the page (reuse the focus log from `keyboard_issues` if it exists for that page) and take a screenshot of each focus stop, or record the screen.
2. Focus Order (2.4.3): fail when the sequence of logged stops does not follow the visual reading order in a way that changes meaning or operation, for example focus jumps from the header to the footer and back, or a dialog's controls come after the page footer.
3. Focus Visible (2.4.7): fail when any stop has no visible change on screen. To compare, run in the Console on the focused element: `getComputedStyle(document.activeElement).outlineStyle` and `.boxShadow`; `none` and `none` with no other visible change confirms it.
4. Focus Not Obscured (Minimum) (2.4.11): fail when the focused element is entirely hidden by author content (sticky header, sticky footer, cookie banner, chat widget). Partly hidden passes 2.4.11 (fully visible is the AAA SC 2.4.12). Test by Tabbing down a long page with the sticky header visible and with the cookie banner open.
5. Focus management after changes:

   | Event | Expected focus | Fail cause |
   |---|---|---|
   | Modal opens | inside the modal | focus-not-moved |
   | Modal closes | the element that opened it | focus-lost |
   | Item deleted from a list | next item, previous item, or list heading | focus-lost |
   | SPA route change | the new page's `h1` or main region, or a skip link at top | focus-not-moved |
   | Inline error after submit | first invalid field or the error summary | focus-not-moved |

   `document.activeElement === document.body` after the event confirms focus-lost.

### Output
Confirmed order and visibility failures.

### Quality Gate
- Every confirmed failure has a screenshot path or a Console output line as `evidence`.
- Every candidate from Phase 1 is either confirmed or marked "not reproduced" with the page and step tested.

---

## Phase 3: Measure Focus Indicator Contrast

### Entry Criteria
- Phase 2 complete.

### Actions
1. For each distinct focus style (count unique `outline` and `box-shadow` values across stops), measure the contrast of the indicator color against the adjacent background with the method in `a11y-color-contrast-measure` (relative luminance ratio).
2. Understanding SC 1.4.11 lists focus indicators as visual information required to identify a component state, so the indicator needs 3:1 against adjacent colors. Fail when the ratio is below 3:1. Do not round: 2.99:1 fails.
3. Note SC 2.4.13 Focus Appearance is level AAA in WCAG 2.2. Do not record it as an AA failure; mention it only if the owner asked for AAA.
4. Write the remediation hint per cause:

   | Cause | Technique to apply |
   |---|---|
   | outline-removed | restore with `:focus-visible { outline: 2px solid <color>; outline-offset: 2px; }` choosing a color that passes 3:1 (width and offset are a style choice, not a WCAG number) |
   | positive-tabindex | remove it; change DOM order instead |
   | css-reorder | change DOM order to match visual order |
   | obscured-by-sticky | `html { scroll-padding-top: <header height>; }` (W3C technique C43) |
   | obscured-by-overlay | make the banner non-modal and not covering focused content, or move focus into it first |
   | focus-lost, focus-not-moved | move focus in code with `element.focus()`; target needs `tabindex="-1"` if it is not focusable |

### Output
`focus_issues`.

### Quality Gate
- Every 1.4.11 row records both colors as hex and the computed ratio to two decimals.
- Every row has a `cause` from the fixed list.

---

## Worked Example

Illustrative only.

Phase 1:
```
$ rg -n "outline\s*:\s*(none|0)\b" src --glob "*.css"
src/styles/reset.css:14:  *:focus { outline: none; }
$ rg -n "position\s*:\s*(sticky|fixed)" src
src/components/Header.module.css:3:  position: sticky;
```
Phase 2: no `:focus-visible` replacement exists; focused links show no change (`outlineStyle` = `none`, `boxShadow` = `none`). Tabbing on P03 `/cart` scrolls the "Remove" button under the 72px sticky header, fully hidden.
Rows: F001 `sc` 2.4.7 `cause` outline-removed `source_location` `src/styles/reset.css:14`; F002 `sc` 2.4.11 `cause` obscured-by-sticky.
Phase 3: after the owner's design token `#7aa7ff` is proposed for the outline on white `#ffffff`, the computed ratio is 2.39:1, below 3:1; the token is rejected before any fix is written.

---

## Exit Criteria

DONE when every page state has a checked focus sequence, every static candidate is confirmed or cleared, and every distinct focus style has a measured contrast ratio.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Styles come from a CSS-in-JS runtime and `rg` finds nothing | **Adjust**: inspect the focused element in DevTools Styles pane and record the generated rule source. |
| Phase 2 | Cannot tell if hidden is "entirely" or "partly" | **Adjust**: scroll by keyboard only; if any pixel of the element's border box is visible, record partly (pass for 2.4.11). |
| Phase 3 | Indicator sits on a gradient or image | **Adjust**: measure against the lightest and darkest adjacent pixel; record the lower ratio. |

**Do not:** count `:focus` styles that only appear on mouse click; record 2.4.13 as AA; fix the CSS globally in this flow.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
