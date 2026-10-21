# VoiceOver Pass on macOS Safari

**One-line description:** Completes each critical user journey with VoiceOver on macOS in Safari, using the VO modifier, the Rotor, interaction with groups and the Caption Panel transcript, and records name, role, state, structure and live-region failures that differ from or add to the NVDA results.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_inventory` (object[], required): Output of `a11y-scope-inventory`.
- `critical_journeys` (string[], required): Owner's priority-ordered user tasks.

---

## Outputs

- `voiceover_macos_issues` (object[]): One row per failure: `issue_id` (VM001, ...), `sc`, `page_id`, `selector`, `macos_version`, `safari_version`, `keys_pressed`, `heard` (copied from the Caption Panel), `expected`, `blocks_task`, `source` = "voiceover-macos".

---

## Phase 1: Set Up VoiceOver

### Entry Criteria
- A Mac with Safari. VoiceOver is developed and tested with Safari; Chrome and Firefox results on macOS are not a substitute.

### Actions
1. Record versions: Apple menu, About This Mac, for macOS; Safari, About Safari.
2. Turn on keyboard access: System Settings, Keyboard, "Keyboard navigation" on; Safari, Settings, Advanced, "Press Tab to highlight each item on a webpage" on.
3. Start VoiceOver with Command+F5. "VO" below means Control+Option held together (or Caps Lock if set as the VO modifier in VoiceOver Utility).
4. Turn on the Caption Panel so speech is shown as text: VoiceOver Utility (VO+F8), Visuals, "Show caption panel". Copy the `heard` text from it.
5. Keep default verbosity.

### Output
VoiceOver running in Safari with captions on.

### Quality Gate
- The Caption Panel shows text when VO+A (read from here) is pressed on a test page.
- `macos_version` and `safari_version` are recorded.

---

## Phase 2: Rotor Structure Pass

### Entry Criteria
- Phase 1 complete.

### Actions
1. On each page, open the Rotor with VO+U. Use Left and Right Arrow to switch lists, Up and Down Arrow to move inside a list, Escape to close.
2. Check each Rotor list:

   | Rotor list | Fail when |
   |---|---|
   | Headings | a visual heading is missing or its level differs from the visual hierarchy in a way that misleads (1.3.1) |
   | Landmarks | no main landmark; unlabeled duplicate navigation landmarks |
   | Links | names are empty, repeated with different destinations, or meaningless without context (2.4.4) |
   | Form Controls | a control appears without its visible label (1.3.1, 4.1.2) |
   | Tables | a data table is missing, or a layout table appears as a data table |

3. Use VO+Command+H to jump between headings and VO+Right Arrow to read item by item through the main content. Record any visible content VoiceOver skips, and any hidden content it reads (for example off-screen menus that should be hidden with `hidden`, `display: none`, or `inert`).
4. Safari removes list semantics from `<ul>` and `<ol>` styled with `list-style: none` unless `role="list"` is present. Record this as a 1.3.1 item only if the list structure carries meaning (for example a step list or a set of filters), and note it as a Safari-specific behavior.

### Output
Rotor structure failures.

### Quality Gate
- Each page has a saved Caption Panel transcript for each Rotor list checked.
- Every row quotes the `heard` text.

---

## Phase 3: Journey Pass

### Entry Criteria
- Rotor pass done.

### Actions
1. Complete each item of `critical_journeys` in order with VoiceOver and the keyboard only. Navigate with VO+Right and VO+Left Arrow, activate with VO+Space, and use Tab for form fields.
2. Groups: some containers (tables, toolbars, some custom widgets) require VO+Shift+Down Arrow to interact and VO+Shift+Up Arrow to stop. If a widget cannot be entered or exited this way, record 2.1.1 with the selector.
3. At each control check name, role and state are spoken (4.1.2): toggle buttons say "selected" or "not selected" (VoiceOver wording for `aria-pressed`), expanded controls say "expanded" or "collapsed", checkboxes say "checked" or "unchecked", required fields say "required", invalid fields say "invalid data".
4. Live regions (4.1.3): after each action that shows a message without moving focus, check the Caption Panel for the message. VoiceOver in Safari is known to miss updates to live regions that are inserted together with their content; if nothing is heard, inspect whether the live region existed in the DOM before the update and record that detail.
5. Dialogs: on open, VoiceOver should announce the dialog name and "web dialog". Focus must not be able to reach content behind a modal with VO+Right Arrow; if it can, record 1.3.2 or 4.1.2 with "background not inert".
6. Compare with `nvda_issues` if available: record only failures that are new or that behave differently in VoiceOver, and reference the NVDA issue id when it is the same root cause.

### Output
`voiceover_macos_issues`.

### Quality Gate
- Every item in `critical_journeys` has a result: completed, completed with issues, or blocked.
- Every row has `heard`, `expected`, `keys_pressed`, and both version fields.

---

## Worked Example

Illustrative only. Journey "reset password", macOS Safari.

Phase 2, VO+U Landmarks list shows "banner", "navigation", "navigation", "content information", no "main". Row VM001: `sc` 1.3.1, `selector` `body`, `heard` "navigation landmark, navigation landmark", `expected` a main landmark and labeled navigation landmarks.

Phase 3: after submitting the email, a "Check your inbox" message appears in a `div` added with its text at the same time as `aria-live="polite"`. Caption Panel shows only "Send reset link, button". Row VM002: `sc` 4.1.3, note "live region created together with content".

---

## Exit Criteria

DONE when every critical journey has been attempted with VoiceOver in Safari, every page has Rotor transcripts, and every failure quotes the Caption Panel.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Command+F5 does nothing | **Adjust**: enable VoiceOver in System Settings, Accessibility, VoiceOver, or press the Touch ID button three times while holding Command. |
| Phase 2 | Rotor lists are empty | **Retry**: reload the page after VoiceOver is running; then **Adjust** by checking the page is not inside an iframe that VoiceOver has not entered. |
| Phase 3 | VO+Space does not activate a custom control | **Adjust**: record 4.1.2 or 2.1.1 with the element's role; do not work around it with a mouse click and call it pass. |

**Do not:** test VoiceOver with Chrome and report it as Safari; write announcements from memory; skip the Caption Panel.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
