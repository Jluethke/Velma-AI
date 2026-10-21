# Pointer Input and Consistent Help Check

**One-line description:** Checks the pointer criteria SC 2.5.1 Pointer Gestures, 2.5.2 Pointer Cancellation, 2.5.3 Label in Name, 2.5.4 Motion Actuation and the WCAG 2.2 additions SC 2.5.7 Dragging Movements and SC 3.2.6 Consistent Help, with a source search for gesture, drag and motion handlers and a cross-page comparison of help mechanism order.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_inventory` (object[], required): Output of `a11y-scope-inventory`.
- `component_inventory` (object[], required): Output of `a11y-scope-inventory`.
- `repo_dir` (string, required): Front-end source repository.

---

## Outputs

- `pointer_help_issues` (object[]): One row per failure: `issue_id` (PH001, ...), `sc`, `page_id`, `component_id` or null, `selector`, `check`, `expected`, `actual`, `source_location`, `blocks_task`, `source` = "pointer-help".

---

## Phase 1: Find Gesture, Drag and Motion Code

### Entry Criteria
- `repo_dir` exists.

### Actions
1. Run and save each search:
   - Drag and drop: `rg -n "draggable=|onDragStart|@dragstart|\(dragstart\)|from ['\"](react-dnd|@dnd-kit/[a-z]+|react-beautiful-dnd|@hello-pangea/dnd|sortablejs|vuedraggable|@angular/cdk/drag-drop)['\"]|cdkDrag" <repo_dir>`
   - Multipoint and path gestures: `rg -n "touchstart|touchmove|pointermove|onTouchMove|onPointerMove|hammerjs|from ['\"]hammerjs['\"]|@use-gesture|pinch|swipe" <repo_dir>/src`
   - Down-event activation: `rg -n "onMouseDown|onPointerDown|onTouchStart|@mousedown|@pointerdown|\(mousedown\)|\(pointerdown\)|addEventListener\(['\"](mousedown|pointerdown|touchstart)" <repo_dir>/src`
   - Device motion: `rg -n "devicemotion|deviceorientation|DeviceMotionEvent|Accelerometer|Gyroscope" <repo_dir>/src`
2. Map each hit to a component in `component_inventory` and to the pages in its `used_on` list.

### Output
A list of components that use drag, gestures, down-events or motion.

### Quality Gate
- All four searches were run and saved; each hit is mapped to a component or marked "unused".

---

## Phase 2: Test Each Pointer Criterion

### Entry Criteria
- Component list exists.

### Actions
1. Apply each check in the browser:

   | Check | SC | Test | Fail when |
   |---|---|---|---|
   | single-pointer-alternative | 2.5.1 | for each pinch, two-finger, or path-based swipe gesture, look for buttons that do the same | the function needs a multipoint or path gesture and no single tap or click alternative exists (unless essential) |
   | down-event | 2.5.2 | press the mouse button on the control, move off it, release | the action fires on press (down event) and cannot be aborted or undone; a click handler fires on release and passes |
   | label-in-name | 2.5.3 | compare the visible label text with the accessible name in DevTools, Accessibility pane | the accessible name does not contain the visible text (visible "Search", name "Find products" fails; name "Search products" passes); best practice is that the name starts with the visible text |
   | motion-actuation | 2.5.4 | find shake or tilt features | a function triggered by device motion has no user interface alternative, or the motion response cannot be turned off |
   | dragging-alternative | 2.5.7 | for every drag operation (sortable list, kanban, slider thumb, file drop, map pan, crop handles) look for a single-pointer way without dragging: up and down buttons, a "move to" menu, click-to-position on a slider track, a file picker button | dragging is the only pointer method (unless essential); note that keyboard support alone does not satisfy 2.5.7, which is about pointer users |

2. 2.5.3 detector in the Console for buttons and links:
   ```js
   [...document.querySelectorAll('button,a[href],[role=button]')].filter(e => {
     const vis = (e.innerText || '').trim().toLowerCase(); const lab = (e.getAttribute('aria-label') || '').toLowerCase();
     return vis && lab && !lab.includes(vis);
   }).map(e => ({ visible: e.innerText.trim(), ariaLabel: e.getAttribute('aria-label') }))
   ```
   It only catches `aria-label` mismatches; check `aria-labelledby` cases in the Accessibility pane.
3. Mark `blocks_task` = true when the only way to complete a process step is a drag or gesture.

### Output
Pointer rows.

### Quality Gate
- Every drag and gesture component from Phase 1 has a recorded result for 2.5.1 or 2.5.7.
- The 2.5.3 detector output is saved for every page.

---

## Phase 3: Consistent Help (3.2.6)

### Entry Criteria
- Phase 2 done.

### Actions
1. 3.2.6 (level A) applies when a help mechanism is repeated on multiple pages in a set: human contact details (phone, email, hours), a human contact mechanism (chat, contact form), self-help (FAQ, help center link), or a fully automated contact mechanism (chatbot). It does not require help to exist.
2. On every page in the inventory, list the help mechanisms present and their position relative to other page content: for example "header: Help link after Account link", "footer: phone number, then contact form link", "floating chat button bottom right".
3. Fail when a mechanism that appears on several pages is in a different relative order on some of them (for example the help link moves from the header on most pages to the footer on checkout), unless the user changed it. Reflow at small widths does not count as a change if the relative order in the DOM stays the same.
4. Compare the DOM order rather than the pixel position: run `[...document.querySelectorAll('a,button')].filter(e => /help|contact|support|chat|faq/i.test(e.textContent + e.getAttribute('aria-label'))).map(e => e.textContent.trim())` on each page and compare the sequences.

### Output
`pointer_help_issues`.

### Quality Gate
- The help mechanism sequence is recorded for every page.
- Every 3.2.6 row names the pages that differ and the two orders seen.

---

## Worked Example

Illustrative only.

Phase 1:
```
$ rg -n "@dnd-kit" src
src/components/WishlistBoard.tsx:3:import { DndContext } from '@dnd-kit/core';
$ rg -n "onPointerDown" src
src/components/DeleteChip.tsx:12:  <span onPointerDown={() => remove(id)}>x</span>
```
Phase 2: the wishlist can be reordered only by dragging (keyboard sensor exists, but no pointer alternative). Row PH001 `sc` 2.5.7. `DeleteChip` removes the item on pointer down with no undo. Row PH002 `sc` 2.5.2.
Phase 3: help sequence is ["Help", "Contact us"] in the footer on every page except `/checkout/*`, where "Contact us" is in the header and "Help" is missing. Help missing is not a 3.2.6 failure; "Contact us" in a different relative place is. Row PH003 `sc` 3.2.6, pages P04 to P06.

---

## Exit Criteria

DONE when every drag, gesture, down-event and motion feature has a recorded pointer result, the label-in-name detector ran on every page, and help mechanism order was compared across all pages.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Drag is implemented in a third-party widget with no source | **Adjust**: test it in the browser anyway and record the vendor and version. |
| Phase 2 | Unsure whether dragging is essential | **Adjust**: dragging is essential only when the path itself is the information (freehand drawing, signature); sorting, moving and sliders are not essential. |
| Phase 3 | Different page templates have different footers by design | **Return**: record the failure; 3.2.6 compares pages within the set, and the owner decides which order to standardize. |

**Do not:** accept keyboard support as the 2.5.7 alternative; record "no help on this page" as a 3.2.6 failure; skip the abort test for 2.5.2.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
