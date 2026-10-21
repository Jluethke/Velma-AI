# WAI-ARIA Pattern Selection and Keyboard Map

**One-line description:** Maps the component to exactly one WAI-ARIA Authoring Practices Guide (APG) pattern, or to native HTML when a native element does the job, and writes the role/state/property table and the full keyboard map that the build, focus and test flows implement verbatim.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `component_contract` (object, required): Contract with behaviors, props and state.
- `widget_pattern` (string, required): User's stated widget kind: `dialog`, `combobox`, `tabs`, `menu-button`, or `none` (let this flow choose).

---

## Outputs

- `aria_spec` (object): The chosen APG pattern name and URL, the native-element decision, and a table of element / role / required ARIA states and properties / who updates them.
- `keyboard_map` (object): Table of key / context (which element has focus) / action / required or optional per APG.

---

## Phase 1: Native First, Then Pattern

### Entry Criteria
- `component_contract` has a behavior list.

### Actions
1. Apply the first matching native rule. ARIA rule 1 (W3C "Using ARIA"): use a native element when one has the needed semantics.

   | Behavior | Native element |
   |---|---|
   | Triggers an action | `<button type="button">` |
   | Navigates to a URL | `<a href>` |
   | Pick one of a short fixed list, no filtering, no rich option content | `<select>` |
   | Show/hide a region | `<details>`/`<summary>` or a `<button aria-expanded>` (APG Disclosure) |
   | Modal dialog | `<dialog>` opened with `showModal()` (still use the APG Dialog keyboard map) |
   | Text entry with suggestions, no custom option rendering | `<input list>` + `<datalist>` |

2. If a native element covers every behavior, set `aria_spec.pattern` = `native:<element>` and skip to Phase 3.
3. Otherwise map with this table (APG pattern names as published at https://www.w3.org/WAI/ARIA/apg/patterns/):

   | Behavior shape | APG pattern |
   |---|---|
   | Overlay that blocks the page until dismissed | Dialog (Modal) |
   | Text input plus popup list of suggestions | Combobox |
   | Set of panels, one visible, switched by a row of labels | Tabs |
   | Button that opens a list of actions or commands | Menu Button (with Menu) |
   | List where user picks one or many, always visible | Listbox |
   | Group of buttons with arrow-key movement | Toolbar |
   | Hover/focus hint text | Tooltip |
   | Site navigation links in a dropdown | Disclosure (NOT Menu) |

4. If `widget_pattern` is not `none` and disagrees with the table, record both and use the table's answer only if the user's choice breaks a behavior; otherwise keep the user's.

### Output
Pattern name and URL.

### Quality Gate
- `aria_spec.pattern` is either `native:<element>` or an exact APG pattern name with its APG URL.
- If the pattern is Menu, no behavior navigates to a URL (that would be Disclosure).

---

## Phase 2: Role, State and Property Table

### Entry Criteria
- Pattern chosen and not native-only.

### Actions
1. Open the APG pattern page section "WAI-ARIA Roles, States, and Properties" and copy every bullet into a table: `element | role | attribute | value source (prop/state name) | required/optional`.
2. Fill "value source" from the contract state table (for example `aria-expanded` comes from state `open`; `aria-activedescendant` comes from `activeIndex` via the option id).
3. Every `aria-controls`, `aria-labelledby`, `aria-describedby` and `aria-activedescendant` needs a stable id. Specify the id source: React `useId()`, Vue `useId()` (3.5+), Svelte `$props.id()` (Svelte 5.20+) or a prop. Check the version before choosing; never use `Math.random()` (breaks server rendering hydration).
4. Name the accessible name source for each labelled element: visible `<label>`, `aria-labelledby` to visible text, or `aria-label` only when no visible text exists.

### Output
`aria_spec` table.

### Quality Gate
- Row count equals or exceeds the APG section's bullet count for the pattern.
- Every row's value source is a contract state, a prop, or a constant.
- Every id reference names its id source.

---

## Phase 3: Keyboard Map

### Entry Criteria
- `aria_spec` exists.

### Actions
1. Copy the APG pattern page "Keyboard Interaction" section into `keyboard_map` rows: `key | focus context | action | APG required/optional`.
2. Use `KeyboardEvent.key` values exactly: `ArrowDown`, `ArrowUp`, `ArrowLeft`, `ArrowRight`, `Home`, `End`, `Enter`, `" "` (Space), `Escape`, `Tab`, `PageUp`, `PageDown`. Write modifier chords as `Alt+ArrowDown`.
3. For each optional row, decide include or exclude and record why from a behavior bullet.
4. Add the focus-movement decision column: `roving tabindex` or `aria-activedescendant` (Combobox always uses `aria-activedescendant` because DOM focus stays in the input; Tabs, Menu, Toolbar use roving tabindex by APG default).
5. For a native element, record the browser-provided keys and mark them "native, do not reimplement".

### Output
`aria_spec`, `keyboard_map`.

### Quality Gate
- Every APG "required" key appears in `keyboard_map`.
- Each row's key string is a valid `KeyboardEvent.key` value from the list above.
- Each optional row has an include/exclude reason.

---

## Worked Example

Illustrative. Contract: "Searchable country picker"; `widget_pattern` = `combobox`.

- Phase 1: `<input list>` + `<datalist>` cannot render flags or enforce a value from the list; pattern = Combobox, https://www.w3.org/WAI/ARIA/apg/patterns/combobox/.
- Phase 2 rows: `input | combobox | aria-expanded | state open | required`; `input | combobox | aria-controls | listbox id from useId() | required`; `input | combobox | aria-activedescendant | id of option[activeIndex] or removed when none | required when an option is visually focused`; `ul | listbox | (role only) | | required`; `li | option | aria-selected | true on activeIndex | required`.
- Phase 3 rows: `ArrowDown | input, closed | open listbox, highlight first option | required`; `Escape | input, open | close listbox | required`; `Alt+ArrowDown | input, closed | open without moving highlight | optional, included`.

---

## Exit Criteria

DONE when the pattern is fixed with its APG URL, every APG role/state/property is mapped to a value source, and every required key is in the keyboard map with a focus-movement method.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Behaviors span two patterns (menu that also filters) | **Adjust**: split into two components or pick Combobox; record the decision as an open question. |
| Phase 2 | APG page unreachable | **Retry**: use the APG copy in the `w3c/aria-practices` GitHub repo; do not write ARIA from memory. |
| Phase 2 | Framework version lacks `useId` | **Adjust**: accept an `id` prop and derive child ids from it. |
| Phase 3 | User wants a key binding that conflicts with APG | **Stop**: ask; APG keys are what screen reader users expect. |

---

## Do Not

- Do not add `role="menu"` to site navigation.
- Do not add ARIA to a native element that already carries the semantics (`<button role="button">`).
- Do not invent ARIA attributes; every attribute must exist in WAI-ARIA 1.2.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
