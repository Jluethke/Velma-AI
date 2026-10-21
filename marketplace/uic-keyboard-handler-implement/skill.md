# Keyboard Handler Implementation from a Keyboard Map

**One-line description:** Turns the component's keyboard map into one `keydown` handler per focus context that switches on `KeyboardEvent.key`, skips IME composition and unhandled modifier chords, calls `preventDefault()` only for handled keys, flips horizontal arrows for right-to-left when the pattern requires it, adds type-ahead where the pattern lists it, and does not duplicate native button activation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `component_path` (string, required): Component source file.
- `keyboard_map` (object, required): Rows of key, focus context, action, required/optional from `uic-aria-pattern-select`.
- `stack` (string, required): `react`, `vue` or `svelte`; decides handler binding syntax.

---

## Outputs

- `keyboard_handler_report` (object): Handler per focus context, the key-to-action table as implemented, keys deliberately left to the browser, and the lint/typecheck result.

---

## Phase 1: Group the Map by Focus Context

### Entry Criteria
- `keyboard_map` has at least one row.

### Actions
1. Group rows by "focus context" (the element that has DOM focus when the key is pressed): for example `input (closed)`, `input (open)`, `tab`, `menuitem`.
2. For each group decide where the handler binds:

   | Focus method from the map | Handler binds to |
   |---|---|
   | `aria-activedescendant` | The element that keeps DOM focus (combobox input, listbox container). |
   | roving tabindex | The container (tablist, menu) using event delegation, reading `event.target`. |
   | native element | No handler; record "native". |

3. Remove rows for keys a native element already handles: Enter and Space on `<button>` fire `click`; Escape on `<dialog>` opened with `showModal()` fires `cancel`; Tab moves focus natively. Implementing these again causes double activation.

### Output
Grouped table with binding target.

### Quality Gate
- Every map row lands in exactly one group or is marked native.
- No group handles Enter/Space for a native `<button>`.

---

## Phase 2: Write the Handlers

### Entry Criteria
- Grouped table ready.

### Actions
1. One handler function per group. Skeleton (TypeScript, same logic in all stacks):
   ```ts
   function onInputKeyDown(event: KeyboardEvent) {
     if (event.isComposing) return;              // IME composition in progress (CJK input)
     if (event.ctrlKey || event.metaKey) return; // leave browser and OS shortcuts alone
     switch (event.key) {
       case 'ArrowDown':
         if (event.altKey) { openWithoutMove(); } else { openAndMove(1); }
         break;
       case 'ArrowUp': openAndMove(-1); break;
       case 'Enter': if (!isOpen()) return; commitActive(); break;
       case 'Escape': if (!isOpen()) return; close(); break;
       default: return;                          // unhandled: let the browser act
     }
     event.preventDefault();                     // only reached for handled keys
   }
   ```
2. Bind per stack: React `onKeyDown={onInputKeyDown}` (React passes a `React.KeyboardEvent`; read `event.nativeEvent.isComposing` for composition); Vue `@keydown="onInputKeyDown"`; Svelte `onkeydown={onInputKeyDown}`.
3. Return early without `preventDefault()` when a key is in the map but does nothing in the current state (Enter with the listbox closed must still submit the form).
4. Wrapping: implement wrap-around (last to first) only if the map row says so; APG lists wrapping as optional for several patterns.
5. Right-to-left: for horizontal widgets (tabs, horizontal toolbar, menubar) read direction with `getComputedStyle(container).direction === 'rtl'` and swap the meaning of ArrowLeft and ArrowRight when the APG pattern notes call for it; read the pattern page's note before swapping.
6. Type-ahead (Menu, Listbox, Tree when the map includes it): keep a buffer string and a timer; on a printable single-character `event.key` (length 1, no Ctrl/Meta/Alt), append it, move to the next item whose label starts with the buffer (case-insensitive), and clear the buffer after a pause. The pause length is not set by APG: make it a constant named `TYPEAHEAD_RESET_MS` and list it as an open question for the design owner.
7. Never read `event.keyCode` or `event.which`; both are deprecated.

### Output
Handler code in the component.

### Quality Gate
- `grep -nE "keyCode|\.which" <component_path>` prints nothing.
- `grep -n "isComposing" <component_path>` finds a check in every handler on a text input.
- Every handled `case` path reaches `preventDefault()`; every `default` path returns before it.

---

## Phase 3: Verify Against the Map

### Entry Criteria
- Handlers written.

### Actions
1. Run typecheck and lint for the stack (`npx tsc --noEmit -p .`, `npx vue-tsc --noEmit`, or `npx svelte-check`) plus ESLint. Fix findings in your file only.
2. Manually check each map row in the browser: focus the context element, press the key, observe the action. Record pass/fail per row.
3. Check page scrolling: press ArrowDown and Space inside the widget; the page must not scroll for handled keys.
4. Write `keyboard_handler_report`; failing rows go back to Phase 2.

### Output
`keyboard_handler_report`.

### Quality Gate
- Every non-native map row has a manual pass result.
- Typecheck and lint exit 0.

---

## Worked Example

Illustrative. React combobox; map rows for `input (closed)`: ArrowDown, Alt+ArrowDown, ArrowUp; `input (open)`: ArrowDown, ArrowUp, Enter, Escape, Home, End.

- Phase 1: one group bound to the `<input>` (activedescendant); Home/End move the text caret per APG for an editable combobox, so they are left native.
- Phase 2: handler as in the skeleton with `event.nativeEvent.isComposing`.
- Phase 3: pressing Enter with the listbox closed submits the form (no `preventDefault`), pressing ArrowDown does not scroll the page; all 7 rows pass; `npx tsc --noEmit -p .` exit 0.

---

## Exit Criteria

DONE when every non-native keyboard map row is implemented in a handler bound to the right element, composition and modifier guards exist, `preventDefault` runs only for handled keys, and every row passes a manual press test.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Map row has no focus context | **Return**: send back to `uic-aria-pattern-select`. |
| Phase 2 | Enter triggers action twice on a button | **Adjust**: remove Enter/Space from the keydown handler; rely on `click`. |
| Phase 3 | Page scrolls on ArrowDown | **Adjust**: the handled path is missing `preventDefault()`. |
| Phase 3 | Japanese IME commits a candidate and the listbox selects an option | **Adjust**: the composition guard is missing or reads the wrong event object. |

---

## Do Not

- Do not attach keyboard handlers to `document` for widget-local keys.
- Do not call `preventDefault()` at the top of the handler for every key; it breaks Tab and typing.
- Do not invent shortcuts that are not in the keyboard map.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
