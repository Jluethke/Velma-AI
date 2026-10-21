# VoiceOver Pass on iOS Safari

**One-line description:** Completes each critical user journey on an iPhone with VoiceOver in Safari using touch gestures and the Rotor, and records touch-specific failures (unreachable controls by swipe, wrong swipe order, missing names on icon buttons, gestures with no alternative, content behind modals) with Safari Web Inspector evidence.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_inventory` (object[], required): Output of `a11y-scope-inventory`.
- `critical_journeys` (string[], required): Owner's priority-ordered user tasks.

---

## Outputs

- `voiceover_ios_issues` (object[]): One row per failure: `issue_id` (VI001, ...), `sc`, `page_id`, `selector` (found through Web Inspector), `ios_version`, `device_model`, `gestures` (exact sequence), `heard`, `expected`, `blocks_task`, `source` = "voiceover-ios".

---

## Phase 1: Set Up the Device

### Entry Criteria
- A physical iPhone. The iOS Simulator in Xcode does not run VoiceOver; use the Accessibility Inspector only as a supplement, not as a substitute.

### Actions
1. Record `ios_version` (Settings, General, About) and `device_model`.
2. Set the Accessibility Shortcut: Settings, Accessibility, Accessibility Shortcut, VoiceOver. Triple-clicking the side button (or Home button) now toggles VoiceOver.
3. Turn on Web Inspector: Settings, Safari, Advanced, Web Inspector on. Connect the phone by cable to a Mac, open Safari on the Mac, Develop menu, select the device and the page. This is how you get the selector of the element VoiceOver is on.
4. To get a text record of speech, turn on Settings, Accessibility, VoiceOver, Verbosity, and use Caption Panel if present on your iOS version (Settings, Accessibility, VoiceOver, Caption Panel). If it is not present, write `heard` by pausing after each announcement and typing it word for word; note "transcribed by ear".
5. Learn the gestures:

   | Gesture | Action |
   |---|---|
   | swipe right or left with one finger | next or previous item |
   | double-tap | activate the focused item |
   | two-finger rotate | turn the Rotor (Headings, Links, Form Controls, Landmarks) |
   | swipe up or down with one finger | move by the Rotor setting, or adjust a slider or stepper |
   | two-finger swipe up | read all from top |
   | two-finger tap | pause or resume speech |
   | three-finger swipe up or down | scroll |
   | two-finger scrub (Z shape) | escape: close a dialog or go back |

### Output
A device ready with VoiceOver, Web Inspector and versions recorded.

### Quality Gate
- Triple-click toggles VoiceOver on and off.
- The Mac's Safari Develop menu lists the phone and the open page.

---

## Phase 2: Swipe-Order and Rotor Pass

### Entry Criteria
- Phase 1 complete.

### Actions
1. On each page, start at the top (touch the status bar area, then swipe right) and swipe right through the whole page. Record the order of items heard.
2. Fail conditions:

   | Observation | SC |
   |---|---|
   | a visible control is never reached by swiping | 4.1.2 or 1.3.1 (often a `div` with a click handler and no role) |
   | swipe order differs from visual order in a way that changes meaning | 1.3.2 |
   | an icon-only button is read as "button" or by its file name | 4.1.2 or 1.1.1 |
   | off-screen or collapsed content (closed menu) is read | 1.3.2; it should be hidden with `hidden`, `display: none` or `inert` |
   | a heading or landmark from the Rotor is missing | 1.3.1 |

3. Use the Rotor set to Headings and swipe down to jump through headings; repeat with Landmarks and Form Controls.

### Output
Swipe-order and structure failures.

### Quality Gate
- Every page has a recorded swipe-order list.
- Every failure has a selector confirmed in Web Inspector (Elements tab, the highlighted node).

---

## Phase 3: Journey Pass with Gestures

### Entry Criteria
- Phase 2 complete.

### Actions
1. Complete each item of `critical_journeys` with VoiceOver gestures only. Do not turn VoiceOver off to tap through a hard step; record the failure and mark the journey blocked.
2. Check touch-specific items:

   | Item | Fail when | SC |
   |---|---|---|
   | custom slider or stepper | one-finger swipe up or down does not change the value | 4.1.2 (missing `role="slider"` with `aria-valuenow`, or not a native input) |
   | swipe-only carousel or drag-only list | no button alternative exists | 2.5.1 or 2.5.7 (route detail to `a11y-pointer-help-wcag22-check`) |
   | modal dialog | swiping reaches content behind the dialog | 1.3.2 or 4.1.2 ("background not inert") |
   | on-screen keyboard | the field label is not read when the keyboard opens | 1.3.1 or 4.1.2 |
   | status message | "added", "saved" or error count is not spoken | 4.1.3 |

3. For every failure, find the element in Web Inspector and copy a selector.

### Output
`voiceover_ios_issues`.

### Quality Gate
- Every journey has a result: completed, completed with issues, or blocked.
- Every row has `gestures`, `heard`, `expected`, `selector`, `ios_version`, and `device_model`.

---

## Worked Example

Illustrative only. Journey "buy a product as a guest" on an iPhone, iOS Safari.

Phase 2: swiping right on P02 reads "Back, button", "Product image", "Blue Shirt, heading level 1", "$40", "Add to cart, button". The size options S, M, L are never reached. Web Inspector shows `<div class="size" onclick=...>S</div>`. Row VI002: `sc` 4.1.2, `gestures` "swipe right x5", `heard` (none for sizes), `blocks_task` true.

Phase 3: the product image gallery advances only by horizontal finger swipe; with VoiceOver on, a one-finger swipe moves to the next item instead. No "next image" button exists. Row VI003: `sc` 2.5.1, routed for detail to `a11y-pointer-help-wcag22-check`.

---

## Exit Criteria

DONE when every critical journey was attempted on a physical iPhone with VoiceOver, every page has a swipe-order list, and every failure has a Web Inspector selector.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Develop menu does not list the device | **Adjust**: trust the computer on the phone, enable Web Inspector, and turn on Safari, Settings, Advanced, "Show features for web developers" on the Mac. |
| Phase 2 | VoiceOver stuck inside an iframe or map | **Adjust**: record 2.1.2 equivalent behavior (cannot leave by swiping) and use the two-finger scrub to escape. |
| Phase 3 | No physical device available | **Stop**: record the iOS pass as not done in the report; do not substitute the Simulator or macOS VoiceOver results. |

**Do not:** test in the Simulator and call it an iOS VoiceOver pass; toggle VoiceOver off to get through a step and call the journey completed; guess selectors without Web Inspector.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
