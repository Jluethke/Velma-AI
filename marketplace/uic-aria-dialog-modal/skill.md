# Modal Dialog: governance engine Dialog Pattern Conformance

**One-line description:** Builds or corrects a modal dialog to the WAI-ARIA governance engine Dialog (Modal) pattern, preferring the native `<dialog>` element opened with `showModal()`, and verifies naming, initial focus, Tab containment, Escape handling through the `cancel` event, background inertness, scroll lock and focus return, row by row.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `component_path` (string, required): Dialog component source.
- `aria_spec` (object, required): Must name the Dialog (Modal) pattern.
- `keyboard_map` (object, required): Dialog keyboard rows.

---

## Outputs

- `dialog_conformance` (object): Checklist of governance engine Dialog requirements with pass/fail and the evidence (DOM snapshot, `document.activeElement` value or test name) for each.

---

## Phase 1: Choose Native or Custom

### Entry Criteria
- `aria_spec.pattern` is Dialog (Modal).

### Actions
1. Use native `<dialog>` unless one of these is true: the browser target list includes a browser without `HTMLDialogElement.showModal` (check MDN compatibility for your targets), or the design requires a non-modal overlay that is still announced as modal (contradiction; raise it).
2. Native structure:
   ```html
   <dialog aria-labelledby="dlg-title" aria-describedby="dlg-desc">
     <h2 id="dlg-title">Delete project</h2>
     <p id="dlg-desc">This removes 14 files.</p>
     <button type="button" autofocus>Cancel</button>
     <button type="button">Delete</button>
   </dialog>
   ```
   Open with `dialogEl.showModal()`, not `show()` and not the `open` attribute (both give a non-modal dialog without top layer or inert background).
3. Custom structure (only if native is ruled out): `<div role="dialog" aria-modal="true" aria-labelledby=...>` rendered in a portal at the end of `body`, with `inert` on the app root while open.

### Output
Native or custom decision with reason.

### Quality Gate
- Decision cites the rule that applied.
- Open code calls `showModal()` (native) or sets `inert` on the background (custom): `grep -nE "showModal\(|inert" <component_path>` has a hit.

---

## Phase 2: Implement the Requirements

### Entry Criteria
- Structure chosen.

### Actions
1. Accessible name: `aria-labelledby` pointing at the visible title. Use `aria-label` only if there is no visible title.
2. Initial focus (governance engine): first focusable element by default; for destructive confirmations put it on the least destructive action (Cancel); for long content, a static element at the top with `tabindex="-1"`. Native: the `autofocus` attribute on that element inside the dialog sets it.
3. Escape: native dialogs fire a `cancel` event then `close`. Listen to `close` to sync your `open` state (the dialog may close without your code calling `close()`). Call `event.preventDefault()` in `cancel` only when the dialog must not close (unsaved form) and show why.
4. Tab containment: native modal dialogs make the outside page inert, so Tab cannot reach it. Custom dialogs rely on `inert` on the background.
5. Scroll lock: set `document.documentElement.style.overflow = 'hidden'` on open and restore the previous value on close (or use the CSS `html:has(dialog[open]:modal) { overflow: hidden; }` if your browser targets support `:has` and `:modal`).
6. Backdrop: style with `dialog::backdrop`. Close on backdrop click only if the design asks; detect it by `event.target === dialogEl` on click.
7. Focus return: store `document.activeElement` before `showModal()`; on `close`, focus it if it is still connected (`el.isConnected`).
8. Controlled `open` prop: when the prop changes to true call `showModal()`; to false call `close()`; guard with `dialogEl.open` to avoid `InvalidStateError` from calling `showModal()` on an already open dialog.

### Output
Dialog implementation.

### Quality Gate
- Every action above maps to a line in the component (record line numbers).
- `grep -n 'show()' <component_path>` prints nothing (non-modal API not used).

---

## Phase 3: Verify

### Entry Criteria
- Implementation compiles.

### Actions
1. In the browser with a live expression on `document.activeElement`:
   - Open from the trigger: activeElement is the initial focus element.
   - Press Tab repeatedly: focus cycles inside the dialog and the browser chrome; never reaches page content behind.
   - Press Escape: dialog closes, activeElement is the trigger, your `open` state is false.
   - Reopen, close via the Cancel button: same result.
2. In DevTools Accessibility pane, select the dialog: Role `dialog`, Name equals the title text, and page content outside shows as inert or hidden from the tree.
3. Unit tests in jsdom: jsdom has historically not implemented `showModal()`; if a test throws `showModal is not a function`, run dialog tests in a real browser (Vitest browser mode or Playwright) instead of stubbing the method, because a stub cannot prove inertness or focus.
4. Fill `dialog_conformance` with each check and evidence.

### Output
`dialog_conformance`.

### Quality Gate
- All checks in step 1 and 2 recorded with observed values.
- No check is marked pass without an observed value.

---

## Worked Example

Illustrative. Svelte `ConfirmDelete.svelte`, native dialog.

- Phase 1: browser targets are current evergreen browsers; native chosen.
- Phase 2: `$effect(() => { if (open && !dlg.open) { returnTo = document.activeElement as HTMLElement; dlg.showModal(); } else if (!open && dlg.open) dlg.close(); });` and `onclose={() => { open = false; if (returnTo?.isConnected) returnTo.focus(); }}`. Cancel button has `autofocus`.
- Phase 3: activeElement after open: `button` "Cancel"; after Escape: `button#delete-project`; Accessibility pane: Role dialog, Name "Delete project".

---

## Exit Criteria

DONE when the dialog opens modally with a name, puts initial focus per governance engine, contains Tab, closes on Escape with state synced, locks scroll, returns focus, and every check has an observed value.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `InvalidStateError` on open | **Adjust**: guard `showModal()` with `!dialogEl.open`. |
| Phase 3 | Escape closes dialog but app state still says open | **Adjust**: sync state in the `close` event handler. |
| Phase 3 | jsdom lacks `showModal` | **Adjust**: move the test to a real browser runner; do not stub. |
| Phase 3 | Name missing in Accessibility pane | **Adjust**: the `aria-labelledby` id does not match the title id. |

---

## Do Not

- Do not use `role="dialog"` on a native `<dialog>`; it is implicit.
- Do not open a modal with the `open` attribute.
- Do not autofocus the destructive button.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
