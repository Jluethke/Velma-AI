# Focus Management: Roving Tabindex, Active Descendant, Restore

**One-line description:** Implements and verifies where focus goes for one component: roving tabindex or `aria-activedescendant` per the ARIA spec, initial focus on open, focus return to the trigger on close, focus rescue when the focused element is removed, background `inert` for modal layers, visible `:focus-visible` styling, and a single tab stop per composite widget.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `component_path` (string, required): Component source file.
- `aria_spec` (object, required): Pattern and element roles.
- `keyboard_map` (object, required): Includes the focus-movement method per context.
- `stack` (string, required): `react`, `vue` or `svelte`.

---

## Outputs

- `focus_report` (object): Focus method per composite, the focus transitions table (event, from, to) as implemented, `document.activeElement` observations per transition, and the WCAG success criteria checked.

---

## Phase 1: Write the Focus Transitions Table

### Entry Criteria
- `keyboard_map` names a focus method for every composite.

### Actions
1. List every event that moves focus: open, close by Escape, close by selection, close by outside click, item removal, tab switch, arrow movement.
2. For each, write `event | focus before | focus after` using these rules:

   | Event | Focus after |
   |---|---|
   | Modal dialog opens | First focusable element inside, or the element the governance engine Dialog notes allow (a heading or static element with `tabindex="-1"` when content is long) |
   | Modal dialog closes | The element that opened it, unless the workflow removes it; then the next logical element |
   | Menu opens from button by Enter, Space or ArrowDown | First menu item |
   | Menu opens by ArrowUp | Last menu item |
   | Menu closes by Escape | The menu button |
   | Menu item activated | Menu closes; focus to the menu button (or wherever the action navigates) |
   | Combobox arrow movement | DOM focus stays on the input; `aria-activedescendant` changes |
   | Tab arrow movement | Next tab gets DOM focus (roving) |
   | Focused element removed (row deleted) | Next sibling, else previous, else container |
   | Outside click closes a non-modal popup | Focus stays where the user clicked |

### Output
Focus transitions table.

### Quality Gate
- Every event in the keyboard map that opens, closes or removes something has a row.
- No row has "focus after" = `body`.

---

## Phase 2: Implement

### Entry Criteria
- Table complete.

### Actions
1. Roving tabindex: exactly one item has `tabindex="0"` (the active one), all others `tabindex="-1"`. On movement, update the index in state, then call `.focus()` on the new item after render: React in an effect or `flushSync` callback keyed on the index, Vue after `await nextTick()`, Svelte after `await tick()`.
2. `aria-activedescendant`: DOM focus stays on the owner; set the attribute to the active item's id; scroll the item into view yourself with `item.scrollIntoView({ block: 'nearest' })` because the browser does not scroll for it.
3. Restore: store the trigger before opening (`const returnTo = document.activeElement as HTMLElement | null`) and call `returnTo?.focus()` after close, after the closing render. Native `<dialog>` closing restores focus in current browsers, but verify in every target browser and keep the explicit restore if any fails.
4. Modal background: with `<dialog>.showModal()` the browser makes the rest of the page inert. For a custom `role="dialog" aria-modal="true"` layer, set the `inert` attribute on the sibling app root while open and remove it on close; check `inert` support for your browser targets on MDN.
5. Focus trap: only for custom modals. Prefer `inert` over a hand-written Tab-cycling trap; if you must cycle, compute tabbables at keydown time, not at open time.
6. `:focus-visible` style exists for every focusable part (see `styling_decision`); never `outline: none` alone.
7. Never use positive `tabindex` values; they break document order (WCAG 2.2 SC 2.4.3 Focus Order).

### Output
Focus code.

### Quality Gate
- `grep -nE 'tabindex="?[1-9]|tabIndex=\{[1-9]' <component_path>` prints nothing.
- In roving widgets, rendered markup has exactly one `tabindex="0"` per composite (check in DevTools Elements or a test query).
- Every "close" path calls the restore.

---

## Phase 3: Verify in the Browser

### Entry Criteria
- Code compiled.

### Actions
1. In Chrome DevTools Console click the eye icon "Create live expression" and enter `document.activeElement`. Perform each table row and record the live value after the event.
2. Press Tab from before the widget: focus must enter the composite once and the next Tab must leave it (one tab stop). WCAG 2.2 SC 2.1.2 No Keyboard Trap applies to non-modal widgets.
3. Check that the focused element is not hidden under sticky headers or overlays (WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum), Level AA).
4. Repeat steps 1 and 2 in Firefox and Safari if they are browser targets.
5. Record results in `focus_report`.

### Output
`focus_report`.

### Quality Gate
- Every transition row has an observed `document.activeElement` value matching "focus after".
- Tab enters and leaves each composite with one press each.

---

## Worked Example

Illustrative. Vue tabs, roving tabindex, 3 tabs.

- Phase 1: rows "ArrowRight on tab 1 -> tab 2", "End -> tab 3", "tab panel content removed -> n/a".
- Phase 2: `async function moveTo(i) { active.value = tabs[i].key; await nextTick(); tabRefs.value?.[i]?.focus(); }`; markup `:tabindex="t.key === active ? 0 : -1"`.
- Phase 3: live expression shows `button#v-0-tab-billing` after ArrowRight from `#v-0-tab-profile`; Tab from the tablist lands on the panel (`tabindex="0"` because it has no focusable content); one more Tab leaves.

---

## Exit Criteria

DONE when every focus transition is implemented and observed in the browser, composites have one tab stop, no positive tabindex exists, and close paths restore focus.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `.focus()` called before the element exists | **Adjust**: move it after `nextTick`/`tick`/commit. |
| Phase 3 | Focus lands on `body` after close | **Adjust**: the trigger was unmounted or restore ran before render; restore after the closing render or pick the next logical element. |
| Phase 3 | Screen reader does not announce active option | **Adjust**: the `aria-activedescendant` id does not match an element id in the DOM; compare them in DevTools. |
| Phase 3 | Behavior differs across browsers | **Return**: report browser, version and transition. |

---

## Do Not

- Do not move DOM focus into a combobox listbox.
- Do not trap focus in non-modal popups.
- Do not call `focus()` on page load for components the user has not opened.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
