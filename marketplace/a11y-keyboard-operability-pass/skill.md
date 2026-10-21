# Manual Keyboard Operability Pass

**One-line description:** Walks every inventory page and every interactive component with the keyboard only, checking each control against its WAI-ARIA Authoring Practices key map, and records failures of SC 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.1.4 Character Key Shortcuts, 2.4.1 Bypass Blocks, 3.2.1 On Focus and 3.2.2 On Input.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_inventory` (object[], required): Output of `a11y-scope-inventory`.
- `component_inventory` (object[], required): Output of `a11y-scope-inventory`, with `aria_pattern` per component.

---

## Outputs

- `keyboard_issues` (object[]): One row per failure: `issue_id` (K001, ...), `sc`, `page_id`, `component_id` (or null), `selector`, `keys_pressed` (exact sequence), `expected`, `actual`, `blocks_task` (true when a mouse user can complete something a keyboard user cannot), `source` = "keyboard".

---

## Phase 1: Prepare the Browser and Focus Logger

### Entry Criteria
- `page_inventory` and `component_inventory` exist.

### Actions
1. Use desktop Chrome or Firefox. Unplug or ignore the mouse for the whole pass. Clicking once with the mouse moves the focus start point and invalidates the sequence.
2. On macOS, turn on System Settings, Keyboard, "Keyboard navigation", and in Safari turn on Settings, Advanced, "Press Tab to highlight each item on a webpage". Without these, Tab skips links and buttons on macOS and you will log false failures.
3. Paste this logger into the DevTools Console on each page so every focus move is printed:
   ```js
   document.addEventListener('focusin', e => {
     const el = e.target;
     console.log(el.tagName, el.id ? '#' + el.id : '', el.getAttribute('role') || '', (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40));
   }, true);
   ```
   Alternatively add a DevTools Live Expression (the eye icon in Console) with `document.activeElement`.
4. Open each page from a fresh load, click nothing, and press Tab once to start.

### Output
A browser ready for a keyboard-only pass with focus logging.

### Quality Gate
- The Console prints one line per Tab press on a test page with at least one link.

---

## Phase 2: Page-Level Pass

### Entry Criteria
- Phase 1 complete.

### Actions
1. For each page row, press Tab repeatedly from the top until focus returns to the browser chrome, then Shift+Tab back to the top. Save the Console log as the evidence for this page.
2. Apply these checks in order:

   | Check | SC | Fail when |
   |---|---|---|
   | First Tab stop is a "Skip to main content" link, or the page has landmarks and headings | 2.4.1 | neither a skip link nor a `main` landmark and headings exist |
   | Skip link works | 2.4.1 | pressing Enter on it does not move the next Tab stop into the main content |
   | Every element that is clickable with a mouse receives focus | 2.1.1 | a clickable element (it reacts to click, has `cursor: pointer`, or opens something) is never logged |
   | Focus can always move away | 2.1.2 | Tab and Shift+Tab stay inside an element or widget and the page gives no instruction for leaving (embedded maps, video players, rich text editors, iframes are common traps) |
   | Focusing an element does not change context | 3.2.1 | focus alone opens a new window, submits a form, or moves focus elsewhere |
   | Changing a field value does not change context without warning | 3.2.2 | choosing a `<select>` option or checking a box navigates or submits with no prior instruction |
   | Single-key shortcuts | 2.1.4 | pressing a single letter, number or punctuation key triggers an action and there is no way to turn it off, remap it, or limit it to when the component has focus |

3. To test 2.1.4, press each letter key once while focus is on the page body (not in a field). Watch for any action. Also search the front-end source folder (the folder holding the `source_file` paths from `component_inventory`): `rg -n "\.key\s*===?\s*['\"].['\"]" src`.

### Output
Page-level rows in `keyboard_issues`.

### Quality Gate
- Every page row has a saved focus log file.
- Every row in `keyboard_issues` lists the exact `keys_pressed` sequence that reproduces it from a fresh page load.

---

## Phase 3: Component Key Map Pass

### Entry Criteria
- Page-level pass done.

### Actions
1. For each component in `component_inventory`, open a page in its `used_on` list and test the APG key map for its `aria_pattern`:

   | Pattern | Keys that must work |
   |---|---|
   | native button, Button | Enter and Space activate |
   | native link, Link | Enter activates (Space scrolls the page; that is correct) |
   | Checkbox | Space toggles |
   | Radio Group | Tab enters the group once; Arrow keys move and select; Tab leaves the group |
   | Tabs | Tab reaches the active tab only; Left and Right Arrow move between tabs; Home and End go to first and last |
   | Menu Button and Menu | Enter, Space or Down Arrow opens; Arrow keys move; Escape closes and returns focus to the button |
   | Dialog (Modal) | focus moves into the dialog on open; Tab and Shift+Tab cycle inside it; Escape closes; focus returns to the element that opened it |
   | Disclosure, Accordion | Enter and Space toggle; content follows in Tab order when expanded |
   | Combobox | Down Arrow opens the list; Arrow keys move the active option; Enter selects; Escape closes |
   | Listbox | Arrow keys move; Space or selection follows focus as the pattern variant states |
   | Slider | Arrow keys change by one step; Home and End go to min and max; Page Up and Page Down if documented |
   | Carousel | a pause or stop control is reachable; slide controls are buttons |
   | Tooltip | appears on focus as well as hover; Escape dismisses it |

2. If the component is "custom" (no APG match), check that every action available by mouse is available by keyboard; that is the 2.1.1 requirement.
3. Mark `blocks_task` = true when the failing control is on a page with `process` not null, or the control is the only way to reach a function (for example the only "Add to cart").
4. Do not fix anything in this flow. Recording and fixing in one pass hides which change caused which result.

### Output
`keyboard_issues`.

### Quality Gate
- Every component in `component_inventory` has a tested or failed status recorded (count rows in the test log equal to component count).
- Every row has `sc`, `keys_pressed`, `expected`, and `actual` filled.

---

## Worked Example

Illustrative only. Component C07 `SizePicker` (`aria_pattern` = Radio Group) on P02 `/products/12`.

Phase 2 log excerpt (Console):
```
A #skip Skip to main content
A  Home
DIV  size-s S
DIV  size-m M
```
Phase 3: pressing Right Arrow on "S" does nothing; Tab moves through each size as a separate stop; Space does not select. Row:
```json
{"issue_id":"K004","sc":"2.1.1","page_id":"P02","component_id":"C07","selector":".size-picker",
 "keys_pressed":"Tab x6, Space","expected":"Space selects size S","actual":"nothing happens; only mouse click selects",
 "blocks_task":true,"source":"keyboard"}
```
`blocks_task` is true because a size must be chosen before "Add to cart" enables.

---

## Exit Criteria

DONE when every inventory page has a full Tab and Shift+Tab log and every component has been checked against its key map, with each failure recorded with a reproducible key sequence.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tab skips links on macOS | **Adjust**: turn on the two macOS and Safari settings in Phase 1 step 2 and restart the pass. |
| Phase 2 | Focus disappears (log shows `BODY` mid-page) | **Adjust**: record it as an `a11y-focus-order-visibility-check` item (lost focus) and continue from the next visible stop. |
| Phase 2 | Trapped in an iframe from a third party | **Adjust**: record 2.1.2 with the iframe `src`; press Ctrl+L or F6 to leave and continue. |
| Phase 3 | Unsure which APG pattern applies | **Return**: ask `a11y-scope-inventory` owner to set `aria_pattern`, or test as "custom". |

**Do not:** use the mouse during the pass; record an issue without the key sequence; change code in this flow.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
