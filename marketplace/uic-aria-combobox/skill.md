# Combobox: governance engine ARIA 1.2 Combobox Conformance

**One-line description:** Builds or corrects an editable combobox with a listbox popup to the WAI-ARIA 1.2 Combobox pattern (`role="combobox"` on the input itself, not the ARIA 1.0 wrapper), with `aria-expanded`, `aria-controls`, `aria-autocomplete`, `aria-activedescendant`, option `aria-selected`, the governance engine keyboard rows, and a polite result-count status, verified in the accessibility tree.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `component_path` (string, required): Combobox component source.
- `aria_spec` (object, required): Must name the Combobox pattern.
- `keyboard_map` (object, required): Combobox keyboard rows.

---

## Outputs

- `combobox_conformance` (object): Checklist of governance engine Combobox requirements with pass/fail and evidence (attribute values observed per state, keypress results, accessibility tree values).

---

## Phase 1: Structure and Autocomplete Mode

### Entry Criteria
- `aria_spec.pattern` is Combobox.

### Actions
1. Pick `aria-autocomplete`:

   | Behavior | Value |
   |---|---|
   | Popup shows options filtered by typed text | `list` |
   | Popup filters and the input also shows the completed text inline (selected suffix) | `both` |
   | Popup options do not depend on typed text | `none` |
   | Inline completion only, no popup | `inline` (and no listbox) |

2. Required structure (ARIA 1.2):
   ```html
   <label for="cb-input">Country</label>
   <input id="cb-input" type="text" role="combobox" aria-expanded="false"
          aria-controls="cb-listbox" aria-autocomplete="list" autocomplete="off">
   <ul id="cb-listbox" role="listbox" aria-label="Countries" hidden>
     <li id="cb-opt-de" role="option" aria-selected="false">Germany</li>
   </ul>
   ```
3. If the existing component uses the ARIA 1.0 shape (`role="combobox"` on a wrapper `div` containing the input, or `aria-owns`), migrate to the 1.2 shape.
4. Set `autocomplete="off"` on the input so browser autofill does not cover the listbox.

### Output
Structure decision.

### Quality Gate
- In rendered DOM, the element with `role="combobox"` is the `<input>`: check with `document.querySelector('[role=combobox]').tagName` returning `INPUT`.
- `aria-controls` value equals the listbox `id`.

---

## Phase 2: State Wiring and Keys

### Entry Criteria
- Structure fixed.

### Actions
1. `aria-expanded` is `"true"` exactly when the listbox is visible, `"false"` otherwise; never removed.
2. Visual focus within the listbox: set the input's `aria-activedescendant` to the active option id; set `aria-selected="true"` on that option and `"false"` on the others (governance engine uses `aria-selected` for the visually focused option in a single-select combobox). Remove `aria-activedescendant` when no option is active or the listbox is closed.
3. Implement keyboard rows from `keyboard_map` (governance engine, editable combobox with listbox popup):
   - ArrowDown: open if closed and move visual focus to the first (or next) option.
   - ArrowUp: open if closed and move to the last (or previous) option.
   - Alt+ArrowDown: open without moving visual focus (optional row).
   - Enter: accept the active option, close, keep DOM focus on input.
   - Escape: close if open; if already closed, optionally clear the input (governance engine optional).
   - Typing: filter and keep DOM focus on input; Home/End/ArrowLeft/ArrowRight edit text natively.
4. Pointer: `mousedown` on an option must call `event.preventDefault()` so the input does not blur before the click selects; then select on `click`.
5. Status: add a visually hidden `<div role="status">` that announces the result count after filtering settles ("5 results available"). Do not announce on every keystroke without a settle delay; the delay value is a design decision, not an governance engine number: expose it as a constant and list it as an open question.
6. Scroll the active option into view: `optionEl.scrollIntoView({ block: 'nearest' })`.

### Output
Wired combobox.

### Quality Gate
- For each state (closed, open no active, open with active) the attribute snapshot matches: closed `aria-expanded="false"` and no `aria-activedescendant`; open with active `aria-activedescendant` equals an existing option `id` with `aria-selected="true"`.
- Exactly one option has `aria-selected="true"` while one is active.

---

## Phase 3: Verify

### Entry Criteria
- Wiring done.

### Actions
1. Chrome DevTools Accessibility pane on the input: Role `combobox`, Name `Country`, `Expanded` toggles with state, `Active descendant` shows the option name.
2. Screen reader spot check (NVDA with Firefox or Chrome on Windows, VoiceOver with Safari on macOS): typing announces results via the status; ArrowDown announces the option name and position ("Germany, 2 of 5").
3. Press every keyboard row and record result.
4. Blur behavior: Tab out of the input closes the listbox and keeps the typed or accepted value per the contract.
5. Fill `combobox_conformance`.

### Output
`combobox_conformance`.

### Quality Gate
- Accessibility pane values recorded for closed and open states.
- Every keyboard row has an observed result.

---

## Worked Example

Illustrative. React `Combobox.tsx`.

- Phase 1: filter-as-you-type, `aria-autocomplete="list"`; old version had `role="combobox"` on a `div`, migrated.
- Phase 2: typing `ge` shows Georgia, Germany; ArrowDown sets `aria-activedescendant=":r1:-opt-ge"` (Georgia) with `aria-selected="true"`; Enter fills "Georgia", `aria-expanded="false"`.
- Phase 3: NVDA reads "Country, combo box, collapsed, edit"; after ArrowDown "Georgia, 1 of 2". All 6 key rows pass.

---

## Exit Criteria

DONE when the input carries `role="combobox"` with correct expanded, controls, autocomplete and active descendant values in every state, keys match the map, and accessibility tree and screen reader checks are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Requirement is a plain fixed list with no typing | **Return**: suggest native `<select>` or the Select-Only Combobox governance engine example; report to `uic-aria-pattern-select`. |
| Phase 2 | Clicking an option closes the list without selecting | **Adjust**: add `preventDefault()` on option `mousedown`. |
| Phase 3 | Screen reader silent on ArrowDown | **Adjust**: `aria-activedescendant` points to a missing id or the option lacks `role="option"`. |
| Phase 3 | Status announces twice | **Adjust**: only one live region; remove duplicates. |

---

## Do Not

- Do not move DOM focus to options.
- Do not use `aria-owns` for the 1.2 pattern.
- Do not put interactive elements (buttons, links) inside `role="option"`.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
