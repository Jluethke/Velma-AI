# Menu Button: APG Menu Button and Menu Conformance

**One-line description:** Builds or corrects an actions menu to the WAI-ARIA APG Menu Button and Menu patterns: a `<button>` with `aria-haspopup` and `aria-expanded`, a `role="menu"` list of `menuitem`/`menuitemcheckbox`/`menuitemradio` items with roving focus, open keys that pick first or last item, Escape and Tab close rules, type-ahead, outside-click close, and focus return, after first confirming the content is actions and not navigation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `component_path` (string, required): Menu button component source.
- `aria_spec` (object, required): Must name the Menu Button pattern.
- `keyboard_map` (object, required): Menu button and menu keyboard rows.

---

## Outputs

- `menu_conformance` (object): Checklist of APG Menu Button and Menu requirements with pass/fail and evidence (attribute snapshots, `document.activeElement` after each key, accessibility tree values).

---

## Phase 1: Actions or Navigation

### Entry Criteria
- `aria_spec.pattern` is Menu Button.

### Actions
1. Classify each item:

   | Item does | Correct pattern |
   |---|---|
   | Runs a command in the app (Rename, Duplicate, Delete) | `menuitem` |
   | Toggles an on/off option | `menuitemcheckbox` with `aria-checked` |
   | Picks one of a group | `menuitemradio` with `aria-checked`, items grouped by `role="group"` |
   | Goes to another page or URL | Not a menu. Use the APG Disclosure pattern with a list of links. |

2. If every item navigates, stop and return to `uic-aria-pattern-select` with "Disclosure".
3. If items mix actions and links, keep the menu and make link items `role="menuitem"` on an `<a href>` only if the contract requires it; record the decision.

### Output
Item classification.

### Quality Gate
- Every item has exactly one role from the table.
- No item classified as navigation remains in a `role="menu"` unless the decision is recorded.

---

## Phase 2: Markup, Keys and Dismissal

### Entry Criteria
- Classification done.

### Actions
1. Markup:
   ```html
   <button type="button" id="mb" aria-haspopup="menu" aria-expanded="false" aria-controls="mb-menu">Actions</button>
   <ul role="menu" id="mb-menu" aria-labelledby="mb" hidden>
     <li role="menuitem" tabindex="-1">Rename</li>
     <li role="menuitem" tabindex="-1">Duplicate</li>
     <li role="menuitem" tabindex="-1" aria-disabled="true">Delete</li>
   </ul>
   ```
   `aria-haspopup="menu"` and `aria-haspopup="true"` are equivalent in WAI-ARIA 1.2. `aria-expanded` is `"true"` only while open.
2. Open keys on the button (APG): Enter, Space and ArrowDown open and focus the first item; ArrowUp opens and focuses the last item. Enter and Space arrive as native button `click`; distinguish keyboard opening by tracking the last key in `keydown`, or always focus the first item on click-open (record choice).
3. Keys inside the menu (roving focus, every item `tabindex="-1"`, focused one receives `.focus()`): ArrowDown next item, ArrowUp previous (wrap is optional in APG; record choice), Home first, End last, Enter activates and closes, Space activates checkbox/radio items (and closes or stays open per contract), Escape closes and focuses the button, Tab closes the menu and lets focus move on naturally (do not `preventDefault`).
4. Type-ahead: printable character moves to the next item starting with that character. Reuse the buffer approach from `uic-keyboard-handler-implement`.
5. Pointer dismissal: a `pointerdown` listener on `document` while open closes the menu when the target is outside both button and menu; remove the listener on close and unmount.
6. Disabled items stay focusable with `aria-disabled="true"` (APG allows this so users can discover them) and do nothing on activation.
7. Positioning: if you use a positioning library (Floating UI is common), read its docs for cleanup (`autoUpdate` returns a cleanup function); call it on close.

### Output
Menu button implementation.

### Quality Gate
- `aria-expanded` toggles between `"true"` and `"false"` and is never removed.
- Escape from any item results in `document.activeElement` = the button.
- Count of `addEventListener('pointerdown'` equals count of `removeEventListener('pointerdown'`.

---

## Phase 3: Verify

### Entry Criteria
- Implementation compiles.

### Actions
1. With a live expression on `document.activeElement`, perform: focus button, ArrowDown (first item), End (last item), type `r` (Rename), Escape (button), ArrowUp (last item), Tab (menu closed, focus on next page element).
2. Click outside while open: menu closes, focus stays where clicked.
3. Accessibility pane on the button: Role `button`, `Has popup: menu`, `Expanded` matches; on the menu: Role `menu`, Name equals button text.
4. Fill `menu_conformance`.

### Output
`menu_conformance`.

### Quality Gate
- Each step in Action 1 has an observed activeElement value.
- Accessibility pane values recorded.

---

## Worked Example

Illustrative. Svelte `RowActions.svelte` with Rename, Duplicate, Delete.

- Phase 1: all three are app commands, `menuitem`.
- Phase 2: button `aria-expanded={open}`; `onkeydown` on the button records `lastOpenKey`; ArrowUp sets `focusIndex = items.length - 1` then `await tick(); itemEls[focusIndex].focus()`.
- Phase 3: Escape from "Duplicate" puts focus on `button#row-12-actions`; Tab from "Rename" closes the menu and focuses the next row's checkbox.

---

## Exit Criteria

DONE when content is confirmed as actions, roles and attributes match APG, open, navigation, type-ahead, Escape, Tab and outside-click behaviors are observed, and focus returns to the button on Escape and activation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | All items are links | **Return**: send to `uic-aria-pattern-select` for Disclosure. |
| Phase 2 | Menu reopens immediately after Escape | **Adjust**: the button's keydown also handled Escape or the click fired; stop propagation from the menu handler. |
| Phase 3 | Screen reader announces "clickable" instead of menu item | **Adjust**: `role="menuitem"` missing on the focused element. |
| Phase 3 | Focus lost to `body` after activation | **Adjust**: focus the button after the menu closes, unless the action navigates. |

---

## Do Not

- Do not put `role="menu"` on site navigation.
- Do not put `tabindex="0"` on every menu item.
- Do not open the menu on hover only.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
