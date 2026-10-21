# Controlled vs Uncontrolled State Decision

**One-line description:** Decides, for each piece of component state, whether it is internal, controlled, or controllable (works both ways), and specifies the exact implementation pattern per stack: a `useControllableState` hook in React, `defineModel` in Vue 3.4+, and `$bindable` plus a callback prop in Svelte 5, including the mode-switch warning and the tests that prove both modes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `component_contract` (object, required): Contract file from `uic-props-state-events-contract` with its state table.
- `stack` (string, required): `react`, `vue` or `svelte`.

---

## Outputs

- `state_ownership_spec` (object): Per-state decision (internal, controlled-only, controllable), the code pattern to use for each, the mode-switch rule, and the list of tests that prove both modes.

---

## Phase 1: Classify Each State

### Entry Criteria
- `component_contract` contains a state table.

### Actions
1. For each state row, answer these questions in order and stop at the first "yes":

   | Question | If yes |
   |---|---|
   | Must the parent read or reset this state (form value, open flag a parent closes, selected tab synced to the URL)? | controllable |
   | Is the state derivable from props during render (filtered list from `options` + `inputText`)? | not state: compute it, delete the row |
   | Is the state transient interaction detail (hover, highlighted option, pointer-down flag)? | internal |
   | None of the above | internal, and add to Open questions |

2. Use controlled-only (no default prop) only when the component cannot work without the parent owning the value (rare; for example a component that renders a value it cannot edit).
3. Record the decision table in `state_ownership_spec`.

### Output
Classified state list.

### Quality Gate
- Every state row from the contract has exactly one classification.
- Every row deleted as "derivable" names the props it derives from.

---

## Phase 2: Specify the Pattern for the Stack

### Entry Criteria
- Classified list exists.

### Actions
1. If `stack` == `react`, specify this hook for each controllable state (write it once in the component folder as `useControllableState.ts` unless the repo already has one; search first with `grep -rn "useControllableState\|useControlled" src`):

   ```ts
   export function useControllableState<T>(
     value: T | undefined, defaultValue: T, onChange?: (next: T) => void,
   ) {
     const isControlled = value !== undefined;
     const wasControlled = useRef(isControlled);
     if (process.env.NODE_ENV !== 'production' && wasControlled.current !== isControlled) {
       console.error('Component switched between controlled and uncontrolled mode. Pick one for its lifetime.');
     }
     const [internal, setInternal] = useState(defaultValue);
     const current = isControlled ? (value as T) : internal;
     const setValue = useCallback((next: T) => {
       if (!isControlled) setInternal(next);
       onChange?.(next);
     }, [isControlled, onChange]);
     return [current, setValue] as const;
   }
   ```
   Rule: `undefined` means "uncontrolled"; use `null` for "controlled, nothing selected".
2. If `stack` == `vue`, specify `const model = defineModel<T>({ default: ... })` (Vue 3.4+; check `npm ls vue`). When the parent omits `v-model`, `defineModel` keeps a local value, so one declaration covers both modes. For a second model use a named model: `const open = defineModel<boolean>('open', { default: false })`, bound by the parent as `v-model:open`. For Vue below 3.4, specify the `modelValue` prop plus `emit('update:modelValue', next)` plus a local `ref` that tracks the prop through `watch`.
3. If `stack` == `svelte`, specify `let { value = $bindable(initial), onvaluechange } = $props();` and that every internal write is `value = next; onvaluechange?.(next);`. Parents use either `bind:value` or `value` + `onvaluechange`.
4. For internal state write the plain primitive: React `useState`, Vue `ref`, Svelte `$state`.

### Output
Pattern per state.

### Quality Gate
- Every controllable state names its pattern and file.
- For React, `grep -n "useControllableState" <spec>` lists every controllable state.
- For Vue, `npm ls vue` output version is recorded next to the `defineModel` decision.

---

## Phase 3: Define the Proof Tests

### Entry Criteria
- Patterns specified.

### Actions
1. For each controllable state, list four tests the testing flow must write:
   - Uncontrolled: render with default only, interact, assert the UI changed and the callback or emit fired with the new value.
   - Controlled, parent accepts: render with value plus a handler that updates parent state, interact, assert UI changed.
   - Controlled, parent rejects: render with a fixed value and a handler that does nothing, interact, assert the UI did NOT change and the handler fired once.
   - Mode switch (React only): rerender from `value={undefined}` to `value="x"`, assert `console.error` was called (spy with `vi.spyOn(console, 'error')`).
2. Write these as named test cases in `state_ownership_spec` so the stack's testing flow copies the names.

### Output
`state_ownership_spec`.

### Quality Gate
- Count of listed tests equals 3 times controllable states (plus 1 each for React).
- Each test names the exact assertion (callback called with value X, element attribute Y).

---

## Worked Example

Illustrative. `stack` = `react`, contract states: `selectedKey` (parent must reset it), `inputText`, `open`, `activeIndex`, `filteredOptions`.

- Phase 1: `selectedKey` controllable; `filteredOptions` derivable from `options` + `inputText`, deleted; `open`, `activeIndex`, `inputText` internal.
- Phase 2: `const [selectedKey, setSelectedKey] = useControllableState(props.value, props.defaultValue ?? null, props.onValueChange);`
- Phase 3: test "controlled reject: selection stays when parent ignores onValueChange" asserts the input still shows the original label after clicking another option and `onValueChange` was called once with `"de"`.

---

## Exit Criteria

DONE when every state is classified, every controllable state has its stack pattern, and the proof tests are listed by name with assertions.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Contract has no state table | **Return**: send back to `uic-props-state-events-contract`. |
| Phase 2 | Vue version below 3.4 | **Adjust**: use the prop plus `update:modelValue` pattern; note the version. |
| Phase 2 | Repo already has a controllable-state helper | **Adjust**: reuse it; do not add a second helper. |
| Phase 3 | A controllable state cannot be tested in controlled-reject mode | **Stop**: the design is wrong; it is not really controlled. Reclassify it. |

---

## Do Not

- Do not copy props into state in a `useEffect` to "sync" them; that creates two sources of truth and an extra render.
- Do not use `undefined` to mean "no selection" in controlled mode.
- Do not mutate a Vue prop directly; `vue/no-mutating-props` flags it.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
