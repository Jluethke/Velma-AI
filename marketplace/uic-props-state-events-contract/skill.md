# Component Props, State and Events Contract

**One-line description:** Writes the public API contract for one UI component before any code exists: every prop with type, default and required flag, every piece of state with its owner, every event or callback with its payload, every slot or child region, the ref surface, and the file path the component will live at, expressed in the idiom of the chosen stack (React, Vue 3 or Svelte 5).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `component_name` (string, required): PascalCase component name, for example `Combobox` or `SettingsDialog`.
- `component_requirements` (string, required): Plain-language description of what the component must do, who uses it, and any design spec link.
- `stack` (string, required): One of `react`, `vue`, `svelte`. Decides the naming idiom for events, two-way binding and children.

---

## Outputs

- `component_contract` (object): Markdown contract file (`<ComponentName>.contract.md` beside the planned source) holding the props table, state table, events table, slots table, ref surface, passthrough rule, and a TypeScript type that mirrors the props table.
- `component_path` (string): Repository-relative path of the component's entry source file, chosen from the repo's existing convention.

---

## Phase 1: Collect Requirements and Repo Convention

### Entry Criteria
- `component_name`, `component_requirements` and `stack` are present.
- `stack` is exactly one of `react`, `vue`, `svelte`. Any other value: stop.

### Actions
1. List the existing component folder layout: run `git ls-files | grep -Ei '\.(tsx|jsx|vue|svelte)$' | head -50` from the repo root.
2. Pick `component_path` with this table (first match wins):

   | Repo shows | `component_path` |
   |---|---|
   | `src/components/<Name>/<Name>.tsx` (folder per component) | `src/components/<ComponentName>/<ComponentName>.<ext>` |
   | `src/components/<Name>.tsx` (flat files) | `src/components/<ComponentName>.<ext>` |
   | `packages/<pkg>/src/...` (monorepo) | same shape inside the package that owns UI primitives |
   | No components yet | `src/components/<ComponentName>/<ComponentName>.<ext>` |

   `<ext>` is `tsx` for React, `vue` for Vue, `svelte` for Svelte. Use `.jsx` only if the repo has no `tsconfig.json`.
3. Confirm `component_path` does not already exist: `test -e <component_path> && echo EXISTS`. If it prints `EXISTS`, stop and ask whether to extend the existing component instead.
4. From `component_requirements`, write a bullet list of user-visible behaviors, one behavior per bullet, each starting with a verb ("Opens a listbox when the user types", "Closes on Escape").

### Output
`component_path` and a numbered behavior list.

### Quality Gate
- `test -e <component_path>` returns nonzero (path is free).
- Every behavior bullet starts with a verb and names one observable effect.

---

## Phase 2: Write the Props, State and Events Tables

### Entry Criteria
- Behavior list exists.

### Actions
1. Props table columns: `name | type | required | default | description`. One row per prop. Types use TypeScript syntax.
2. State table columns: `state | type | owner (internal or controllable) | initial`. For every row marked controllable, the props table must contain the matching pair from this table:

   | Stack | Controlled value prop | Initial-value prop | Change notification |
   |---|---|---|---|
   | react | `value` (or `open`, `selectedKey`) | `defaultValue` (or `defaultOpen`) | `onValueChange(next)` / `onOpenChange(next)` callback prop |
   | vue | `modelValue` (or named model `open`) | default of `defineModel()` | emits `update:modelValue` / `update:open` |
   | svelte | `value = $bindable(...)` | same prop's default | callback prop `onvaluechange(next)` in addition to `bind:` |

3. Events table columns: `event | payload type | fires when | cancelable`. Naming rules:
   - React: camelCase callback props starting with `on` (`onSelect`, `onOpenChange`).
   - Vue: kebab-case or camelCase emits declared in `defineEmits`; two-way binding uses `update:<prop>`.
   - Svelte 5: lowercase callback props (`onselect`), not `createEventDispatcher` (deprecated in Svelte 5).
4. Slots or children table: React `children` or render props; Vue named slots with their slot props; Svelte 5 snippets (`children`, named snippet props) rendered with `{@render ...}`.
5. Ref surface: list exactly which DOM element the forwarded ref points to (React), which methods `defineExpose` exposes (Vue), or which functions are exported from the component (Svelte). Default: the root focusable element and no imperative methods.
6. Passthrough rule: name the single element that receives unknown props (`...rest`, `$attrs`, `...rest` from `$props()`) and `className`/`class`.
7. Write the TypeScript props type that mirrors the props table exactly (same names, same optional flags).

### Output
Draft `component_contract` tables and type.

### Quality Gate
- Every controllable state row has all three cells of its stack row in the props or events table.
- `grep -c '^|' <ComponentName>.contract.md` is at least the number of props plus states plus events plus header rows (tables are filled, not empty).
- The TypeScript type compiles alone: paste it in a scratch `.ts` file outside the repo and run `npx tsc --noEmit --strict <file>`; exit code 0.

---

## Phase 3: Cross-Check Behaviors Against the Contract

### Entry Criteria
- Draft tables exist.

### Actions
1. For each behavior bullet from Phase 1, write which prop, state, event or slot implements it. A behavior with no row means the contract is missing something: add the row.
2. For each prop, state and event row, name the behavior it serves. A row with no behavior is speculative: delete it.
3. Record open questions (for example "Should `Escape` clear the input when the listbox is already closed?") in an `Open questions` section; do not guess an answer.
4. Save the contract file next to the planned source path.

### Output
`component_contract`, `component_path`.

### Quality Gate
- Behavior-to-row map has zero unmapped behaviors and zero unmapped rows.
- The contract file exists at `dirname(component_path)/<ComponentName>.contract.md`.

---

## Worked Example

Illustrative. Input: `component_name` = `Combobox`, `stack` = `react`, `component_requirements` = "Searchable country picker; parent form must read and reset the selected country."

- Phase 1: `git ls-files` shows `src/components/Button/Button.tsx`, so `component_path` = `src/components/Combobox/Combobox.tsx`. `test -e` returns 1. Behaviors: "Filters options as the user types", "Selects an option on Enter", "Closes the listbox on Escape".
- Phase 2: props rows include `value | string \| null | no | (none) | selected key, controlled`, `defaultValue | string \| null | no | null`, `onValueChange | (next: string \| null) => void | no`, `options | {key: string; label: string}[] | yes`, `label | string | yes`. State rows: `selectedKey | controllable`, `inputText | internal`, `open | internal`, `activeIndex | internal`.
- Phase 3: "Selects an option on Enter" maps to `selectedKey` + `onValueChange`. Open question: "Is free text allowed when no option matches?"

---

## Exit Criteria

DONE when the contract file exists, every behavior maps to a contract row and back, `component_path` is free, and the props type compiles with `tsc --strict`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `stack` not one of the three values | **Stop**: ask the user which stack; do not guess from file extensions in a mixed repo. |
| Phase 1 | `component_path` already exists | **Stop**: ask whether to extend the existing component; never overwrite it. |
| Phase 2 | Requirements do not say whether the parent needs the value | **Adjust**: mark the state controllable (the pair costs little) and log it under Open questions. |
| Phase 2 | `tsc` reports an error in the props type | **Retry**: fix the type and rerun until exit code 0. |
| Phase 3 | Behavior cannot be mapped to any row | **Adjust**: add the missing prop, state, event or slot, then rerun the map. |

---

## Do Not

- Do not write component code in this flow; the contract comes first.
- Do not invent props "for flexibility" that no behavior needs.
- Do not name React callbacks without the `on` prefix or Vue two-way events without `update:`.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
