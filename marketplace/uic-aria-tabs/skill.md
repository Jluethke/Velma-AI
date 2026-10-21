# Tabs: governance engine Tabs Pattern Conformance

**One-line description:** Builds or corrects a tab set to the WAI-ARIA governance engine Tabs pattern: `tablist`/`tab`/`tabpanel` roles, `aria-selected`, `aria-controls` and `aria-labelledby` id pairs, roving tabindex with one tab stop, automatic versus manual activation chosen by panel load latency, Home/End, vertical orientation, and a focusable panel when it has no focusable content.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `component_path` (string, required): Tabs component source.
- `aria_spec` (object, required): Must name the Tabs pattern.
- `keyboard_map` (object, required): Tabs keyboard rows.

---

## Outputs

- `tabs_conformance` (object): Checklist of governance engine Tabs requirements with pass/fail and evidence (DOM attribute snapshot, focus observations, keypress results).

---

## Phase 1: Activation Mode and Orientation

### Entry Criteria
- `aria_spec.pattern` is Tabs.

### Actions
1. Choose activation (governance engine guidance: automatic when panels display without noticeable latency):

   | Panel content | Activation |
   |---|---|
   | Already in the DOM or rendered synchronously | Automatic: arrow keys move focus and select. |
   | Fetched over the network or heavy to render | Manual: arrow keys move focus; Enter or Space selects. |

2. Orientation: horizontal by default. If tabs stack vertically, set `aria-orientation="vertical"` on the tablist and use ArrowUp/ArrowDown instead of ArrowLeft/ArrowRight.
3. Decide whether inactive panels stay mounted (keep state, use `hidden`) or unmount (save memory). Record the choice; both are valid.

### Output
Mode and orientation decisions.

### Quality Gate
- Activation mode cites the table row and how panel content loads.
- If vertical, `aria-orientation="vertical"` appears in the markup.

---

## Phase 2: Markup and Keys

### Entry Criteria
- Decisions recorded.

### Actions
1. Markup:
   ```html
   <div role="tablist" aria-label="Account settings">
     <button type="button" role="tab" id="t-profile" aria-selected="true" aria-controls="p-profile" tabindex="0">Profile</button>
     <button type="button" role="tab" id="t-billing" aria-selected="false" aria-controls="p-billing" tabindex="-1">Billing</button>
   </div>
   <div role="tabpanel" id="p-profile" aria-labelledby="t-profile" tabindex="0">...</div>
   <div role="tabpanel" id="p-billing" aria-labelledby="t-billing" tabindex="0" hidden>...</div>
   ```
2. Tablist name: `aria-label` or `aria-labelledby` pointing at a visible heading.
3. Panel `tabindex="0"` only when the panel has no focusable content as its first element (governance engine note); otherwise omit it.
4. Keys (horizontal): ArrowRight next tab, ArrowLeft previous tab, wrapping at the ends; Home first tab; End last tab. In manual mode, Enter and Space activate the focused tab (the native `<button>` click covers this; do not add a keydown handler for them). Delete only if tabs are closable and the contract says so.
5. Roving tabindex: the selected tab has `tabindex="0"`; in manual mode the focused-but-unselected tab gets `tabindex="0"` only while focused, and on leaving the tablist the selected tab must again be the tab stop.
6. Disabled tabs: governance engine allows focusing disabled tabs with `aria-disabled="true"`; pick one rule (skip or focus) and record it.

### Output
Tabs implementation.

### Quality Gate
- Each tab's `aria-controls` equals its panel's `id`, and each panel's `aria-labelledby` equals its tab's `id`.
- Exactly one tab has `aria-selected="true"` and exactly one tab has `tabindex="0"` when focus is outside the tablist.
- Inactive panels are `hidden` or unmounted.

---

## Phase 3: Verify

### Entry Criteria
- Implementation compiles.

### Actions
1. From the element before the tablist, press Tab: focus lands on the selected tab. Press Tab again: focus lands on the panel (or its first focusable element), not on the next tab.
2. Press ArrowRight from the last tab: focus wraps to the first tab. In automatic mode the first panel becomes visible; in manual mode it does not until Enter.
3. DevTools Accessibility pane on a tab: Role `tab`, `Selected` true/false matches, Name equals tab text; on panel: Role `tabpanel`, Name equals tab text.
4. Screen reader check: NVDA reads "Billing, tab, 2 of 3, selected" (wording varies by reader).
5. Fill `tabs_conformance`.

### Output
`tabs_conformance`.

### Quality Gate
- Steps 1 to 3 recorded with observed values.
- Tab count from before-tablist to after-panel is two presses (or one plus the panel's focusables).

---

## Worked Example

Illustrative. Vue `AppTabs.vue`, three panels rendered synchronously.

- Phase 1: automatic activation; horizontal; panels kept mounted with `hidden` to preserve form input.
- Phase 2: `:aria-selected="t.key === active"`, `:tabindex="t.key === active ? 0 : -1"`, panel `:hidden="t.key !== active"`.
- Phase 3: Tab lands on "Profile"; ArrowLeft wraps to "Notifications" and shows its panel; Accessibility pane shows Selected true on "Notifications".

---

## Exit Criteria

DONE when ids pair up, one tab stop exists, arrow, Home and End keys work per the chosen activation mode, and the accessibility tree shows correct roles, names and selection.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tabs used for site navigation between pages | **Return**: links with `aria-current="page"` are the correct pattern; report to `uic-aria-pattern-select`. |
| Phase 2 | Two tabs report `tabindex="0"` | **Adjust**: derive tabindex from a single state value. |
| Phase 3 | Tab key walks through every tab | **Adjust**: inactive tabs are missing `tabindex="-1"`. |
| Phase 3 | Panel name empty | **Adjust**: fix `aria-labelledby` id. |

---

## Do Not

- Do not use `<a href="#...">` as tabs inside a tablist.
- Do not set `aria-selected` on panels.
- Do not use `display: none` on the tablist at narrow widths without providing another way to switch panels.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
