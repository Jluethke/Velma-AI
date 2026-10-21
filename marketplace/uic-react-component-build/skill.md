# React Component Build (TypeScript, Function Component)

**One-line description:** Implements one React function component in TypeScript from its contract, state ownership spec, styling decision and ARIA spec: typed props, ref forwarding matched to the installed React major, `useId` for ARIA ids, the controllable-state hook, rest-prop passthrough, and a clean `tsc` and ESLint run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Repository root.
- `component_path` (string, required): Target `.tsx` path.
- `component_contract` (object, required): Props, state, events, slots and ref tables.
- `state_ownership_spec` (object, required): Controllable vs internal decisions and patterns.
- `styling_decision` (object, required): Styling technique and ARIA-selector rules.
- `aria_spec` (object, required): Roles, states, properties and id sources.

---

## Outputs

- `react_build_report` (object): Files created, React and TypeScript versions, and the verbatim tail of `tsc --noEmit` and ESLint runs (both exit 0).

---

## Phase 1: Check Versions and Toolchain

### Entry Criteria
- `component_path` ends in `.tsx` and does not exist.

### Actions
1. Run `npm ls react react-dom typescript --depth=0` in `repo_dir`. Record the React major.
2. Pick the ref approach:

   | React major | Ref approach |
   |---|---|
   | 19 or later | Accept `ref` as an ordinary prop: `function Combobox({ ref, ...props }: Props & { ref?: React.Ref<HTMLInputElement> })`. |
   | 18 | Wrap with `forwardRef<HTMLInputElement, Props>((props, ref) => ...)` and set `Combobox.displayName = 'Combobox'`. |
   | 17 or lower | `forwardRef`; `useId` is unavailable, so take an `id` prop and derive child ids. |

3. Confirm the typecheck and lint commands from `package.json` scripts (`"typecheck"`, `"lint"`). If absent use `npx tsc --noEmit -p .` and `npx eslint <file>`.
4. Run both commands once on the untouched repo and save the baseline error count. Pre-existing errors are not yours to fix.

### Output
Version table and baseline counts.

### Quality Gate
- React major recorded from `npm ls`, not assumed.
- Baseline counts recorded as numbers.

---

## Phase 2: Write the Component

### Entry Criteria
- Versions known.

### Actions
1. Create only these files in one pass: `component_path`, the style file named in `styling_decision`, `index.ts` re-export if the repo uses barrel files (check sibling folders), and `useControllableState.ts` only if `state_ownership_spec` asks for it and none exists.
2. Props type: copy the contract's TypeScript type. Extend the native element props of the passthrough element with `Omit<React.ComponentPropsWithoutRef<'input'>, 'value' | 'defaultValue' | 'onChange'>` so your `value`/`onChange` do not collide with the native ones.
3. Ids: `const baseId = useId(); const listboxId = baseId + '-listbox';` Option ids: `baseId + '-opt-' + index` or by key. Never generate ids with `Math.random()`.
4. State: controllable state through `useControllableState(value, defaultValue, onValueChange)`; internal state through `useState`; derived values computed in render (with `useMemo` only if `uic-react-memo-profile` later proves the need).
5. ARIA: set every attribute row from `aria_spec`. Boolean ARIA states render as strings `"true"`/`"false"` when the APG requires the attribute present (for example `aria-expanded={open}` renders `"false"`, which is required for combobox). Remove `aria-activedescendant` entirely (`undefined`) when no option is active; an empty string is invalid.
6. Events: call callback props with the payload type from the contract. Wrap in the handler, not in an effect.
7. Passthrough: spread `...rest` onto the element named in the contract, then merge `className` with your own class; put your ARIA and event props AFTER the spread only when the contract says they must not be overridden.
8. Keyboard handling and focus code are written by `uic-keyboard-handler-implement` and `uic-focus-management`; here create the `onKeyDown` handler shell that switches on `event.key` and handles only the rows already in `keyboard_map` required for basic operation.

### Output
Component source files.

### Quality Gate
- `git status --porcelain` lists only the files named in Action 1.
- `grep -n "Math.random" <component_path>` prints nothing.
- Every `aria_spec` attribute appears: for each, `grep -c "aria-<name>" <component_path>` is at least 1.

---

## Phase 3: Typecheck, Lint, Smoke Render

### Entry Criteria
- Files written.

### Actions
1. Run the typecheck command. New errors above baseline: fix them in your files only, then rerun.
2. Run `npx eslint <component_dir> --max-warnings 0`. Fix every finding in your files. Do not add `eslint-disable` comments.
3. Smoke render without a full test suite: `node -e` is not enough for JSX; instead render it once in the existing dev app or Storybook if present, or wait for `uic-testing-library-react`. Record which.
4. Write `react_build_report` with the last 5 lines of each command's output.

### Output
`react_build_report`.

### Quality Gate
- Typecheck error count equals baseline (exit code 0 if baseline was 0).
- ESLint exit code 0 on the component directory.
- `grep -rn "eslint-disable" <component_dir>` prints nothing.

---

## Worked Example

Illustrative. `component_path` = `src/components/Combobox/Combobox.tsx`.

- Phase 1: `npm ls` prints `react@19.1.0`, `typescript@5.8.3`. Ref approach: ref as a prop. Baseline: `npm run typecheck` exit 0; lint exit 0.
- Phase 2: creates `Combobox.tsx`, `Combobox.module.css`, `useControllableState.ts`, `index.ts`. Input renders `role="combobox" aria-expanded={open} aria-controls={listboxId} aria-autocomplete="list" aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}`.
- Phase 3: `npx tsc --noEmit -p .` prints nothing, exit 0. `npx eslint src/components/Combobox --max-warnings 0` exit 0.

---

## Exit Criteria

DONE when only the planned files exist, every ARIA attribute from `aria_spec` is wired to its value source, and typecheck and lint are at or below baseline with no disable comments.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `npm ls` shows missing or invalid deps | **Stop**: run the repo's install command (`npm ci`, `pnpm install --frozen-lockfile`) first; never edit the lockfile by hand. |
| Phase 2 | Prop name collides with a native attribute type | **Adjust**: `Omit` it from the native props type. |
| Phase 3 | Type error in a file you did not touch | **Adjust**: leave it; compare against baseline only. |
| Phase 3 | Lint error persists after three fixes | **Return**: report the rule, file and line to the user; do not disable the rule. |

---

## Do Not

- Do not create several components in one run.
- Do not use `any` to silence type errors.
- Do not import APIs that `npm ls` shows are not installed.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
