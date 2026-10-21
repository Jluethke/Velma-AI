# NVDA Screen Reader Pass on Windows

**One-line description:** Completes each critical user journey with NVDA on Windows in Firefox and Chrome, using browse mode quick-navigation keys, focus mode, the Elements List and Speech Viewer transcripts, and records name, role, value, state, structure and announcement failures against SC 1.3.1, 2.4.4, 2.4.6, 4.1.2 and 4.1.3.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_inventory` (object[], required): Output of `a11y-scope-inventory`.
- `critical_journeys` (string[], required): The user tasks that matter most, in priority order, for example ["buy a product as a guest", "reset password"]. Supplied by the owner.
- `needs_review_items` (object[], optional): Items from `a11y-scan-merge-dedupe` routed to this flow.

---

## Outputs

- `nvda_issues` (object[]): One row per failure: `issue_id` (N001, ...), `sc`, `page_id`, `selector`, `browser` (firefox or chrome, with version), `nvda_version`, `keys_pressed`, `heard` (exact Speech Viewer text), `expected` (what a correct announcement contains: name, role, state or value), `blocks_task`, `source` = "nvda".

---

## Phase 1: Set Up NVDA for Repeatable Testing

### Entry Criteria
- A Windows 10 or 11 machine with Firefox and Chrome installed.

### Actions
1. Install the current NVDA release from `https://www.nvaccess.org/download/`. Record the version from NVDA menu, Help, About.
2. Learn the NVDA modifier: Insert in Desktop layout, or Caps Lock in Laptop layout (NVDA menu, Preferences, Settings, Keyboard). Below, "NVDA" means that key.
3. Open the Speech Viewer: NVDA+N, Tools, Speech viewer. Every utterance is now printed. Copy from it for the `heard` field; do not write announcements from memory.
4. Keep default verbosity settings. Changing punctuation or verbosity changes what is heard and makes results not comparable.
5. Know the two modes. Browse mode (default on web pages) lets single letters jump between elements. Focus mode (entered automatically on form fields, or with NVDA+Space) sends keys to the page. A low tone means focus mode on, a higher tone browse mode.

### Output
NVDA running with Speech Viewer open and the version recorded.

### Quality Gate
- Speech Viewer shows text when NVDA+Down Arrow (say all) is pressed on a test page.
- `nvda_version` and browser versions are written down.

---

## Phase 2: Structure Pass per Page

### Entry Criteria
- Phase 1 complete.

### Actions
1. On each page in Firefox, run these browse-mode commands and copy the Speech Viewer output:

   | Key | Lists | Fail when |
   |---|---|---|
   | NVDA+F7 | Elements List: links, headings, form fields, buttons, landmarks | a link or button has an empty or meaningless name ("link", "button", "click here" alone with no context); SC 2.4.4 or 4.1.2 |
   | H and Shift+H, 1 to 6 | headings by level | a visual heading is not announced as a heading (1.3.1) or heading text does not describe the section (2.4.6) |
   | D and Shift+D | landmarks | main content is not inside a `main` landmark, or two `navigation` landmarks have no distinguishing label |
   | T, then Ctrl+Alt+Arrow keys | tables | a data table has no header cells announced when moving across columns (1.3.1) |
   | F and Shift+F, E for edit fields | form fields | a field is announced without its visible label (1.3.1, 4.1.2) |
   | G | graphics | an informative image is skipped or announced by file name (1.1.1, route detail to `a11y-images-alt-text-audit`) |
   | L and I | lists and list items | a visual list is not announced as a list with an item count (1.3.1) |

2. Repeat the Elements List check in Chrome. Chrome and Firefox expose the accessibility tree differently; record the browser in each row.

### Output
Structure failures per page per browser.

### Quality Gate
- Each page has a saved Speech Viewer transcript for both browsers.
- Every row quotes `heard` text copied from Speech Viewer.

---

## Phase 3: Journey Pass with Interaction

### Entry Criteria
- Structure pass done.

### Actions
1. For each item of `critical_journeys` in order, complete the task start to finish with NVDA, using Tab, arrow keys and quick-navigation keys only. Use Firefox first, then repeat in Chrome.
2. At every control, check that NVDA speaks name, role, and state or value (SC 4.1.2):

   | Control | Must hear |
   |---|---|
   | button | name + "button"; for toggles also "pressed" or "not pressed" |
   | link | name + "link" |
   | checkbox | name + "check box" + "checked" or "not checked" |
   | disclosure or accordion trigger | name + "button" + "collapsed" or "expanded" |
   | combobox | name + "combo box" + "collapsed" or "expanded", then the active option as you arrow |
   | tab | name + "tab" + "selected" for the active tab, plus position ("2 of 4") |
   | text field | label + "edit" + "required" when required + "invalid entry" when `aria-invalid="true"` |

3. Status messages (SC 4.1.3): after actions that show a message without moving focus (added to cart, search results count, form saved, error count), NVDA must speak it without the user moving. If nothing is heard, record 4.1.3. Check the markup: the container should have `role="status"`, `role="alert"` or `aria-live`, and must exist in the DOM before the text is injected.
4. Dialogs: on open NVDA should announce the dialog role and its name. Record 4.1.2 if it announces only the first field.
5. Mark `blocks_task` = true when the journey cannot be completed, or can only be completed by guessing (for example an unlabeled "Pay" button).
6. Resolve each `needs_review_items` entry routed here and record a row only if it fails.

### Output
`nvda_issues`.

### Quality Gate
- Every item in `critical_journeys` has a recorded result per browser: completed, completed with issues, or blocked.
- Every row has `heard`, `expected`, `keys_pressed`, `browser`, and `nvda_version`.

---

## Worked Example

Illustrative only. Journey "buy a product as a guest", Firefox, NVDA.

Phase 2, NVDA+F7 on P02, Buttons view lists: `button`, `button`, `Add to cart button`. Two icon buttons have no names.

Phase 3 Speech Viewer excerpt after pressing the quantity "+" button:
```
button
```
Expected "Increase quantity button". Row N003: `sc` 4.1.2, `selector` `.qty-stepper button:nth-of-type(2)`, `heard` "button".
After "Add to cart", the visual toast "Added to cart" appears; Speech Viewer prints nothing. Row N004: `sc` 4.1.3, `blocks_task` false (the cart count still updates in the header).

---

## Exit Criteria

DONE when every critical journey has been attempted in Firefox and Chrome with NVDA, every page has structure transcripts, and every failure quotes the Speech Viewer text.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | NVDA silent in Chrome | **Adjust**: restart Chrome after NVDA is running; Chrome enables its accessibility tree when a screen reader is detected. |
| Phase 2 | Quick-navigation letters type into the page | **Adjust**: NVDA is in focus mode; press NVDA+Space to return to browse mode. |
| Phase 3 | Journey blocked by an unlabeled control | **Adjust**: record it with `blocks_task` = true, then finish the journey with the mouse only to find later failures, and note that. |
| Phase 3 | Results differ between Firefox and Chrome | **Return**: record both; the fix must work in both. |

**Do not:** write announcements from memory; use what you see on the monitor to fill in context NVDA did not speak; use Narrator or JAWS results as NVDA results.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
