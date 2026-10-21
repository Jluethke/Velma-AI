# React Re-render Profiling and Memoization

**One-line description:** Measures one React component's renders with the React DevTools Profiler and the `<Profiler onRender>` API during a scripted interaction, identifies why each wasted render happened, applies only the matching fix (`React.memo`, `useMemo`, `useCallback`, state colocation, or nothing when React Compiler is active), and keeps a change only if the re-measured numbers improve.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `component_path` (string, required): The React component file.
- `repo_dir` (string, required): Repository root.
- `effect_cleanup_report` (object, required): From `uic-react-effect-cleanup`; derived-state effects are already removed, so the baseline measures the final effect structure.

---

## Outputs

- `render_profile_report` (object): Interaction script, render counts and `actualDuration` before and after each change, the "why did this render" reason per wasted render, changes kept, and changes reverted.

---

## Phase 1: Check for React Compiler and Script the Interaction

### Entry Criteria
- Component builds and renders.
- `effect_cleanup_report` shows its unmount tests passing.

### Actions
1. Check whether React Compiler is active: `npm ls babel-plugin-react-compiler --depth=0` and `grep -rn "react-compiler\|reactCompiler" vite.config.* next.config.* babel.config.* 2>/dev/null`. If it is active, the compiler memoizes components and values automatically: record "compiler active", skip Phase 3 manual memoization, and only report measurements.
2. Write the interaction script as numbered user steps, for example "type `ger` into the combobox, press ArrowDown twice, press Enter". The same script is used before and after.
3. Install React Developer Tools for the browser if absent. In its Profiler settings (gear icon), enable "Record why each component rendered while profiling".

### Output
Interaction script and compiler status.

### Quality Gate
- Compiler status recorded with the command output that proves it.
- Interaction script has numbered steps a second person could repeat.

---

## Phase 2: Measure Baseline

### Entry Criteria
- Script ready.

### Actions
1. Run the dev server. Open DevTools > Profiler, click record, perform the script, stop.
2. Read the commit bar chart (top right): each bar is one commit. For each commit, select it and read the Flamegraph: gray components did not render; colored ones did; hover shows "Why did this render?" (for example "Props changed: onSelect", "The parent component rendered", "Hook 2 changed").
3. Switch to Ranked view to list the slowest components in the commit.
4. For numbers that a second run can compare, wrap the component temporarily:
   ```tsx
   <Profiler id="Combobox" onRender={(id, phase, actualDuration, baseDuration) => console.log(id, phase, actualDuration.toFixed(2), baseDuration.toFixed(2))}>
   ```
   Run the script three times and record each run's render count and summed `actualDuration`. Development builds are slower than production; compare runs only against runs in the same mode.
5. Mark a render as wasted when its reason is "The parent component rendered" or a prop changed only by identity (a new function or object with the same content) and the component output is unchanged.

### Output
Baseline table: run, render count, summed actualDuration, wasted renders with reasons.

### Quality Gate
- Three baseline runs recorded.
- Every wasted render lists the exact "why" text from DevTools.

---

## Phase 3: Apply the Matching Fix and Re-measure

### Entry Criteria
- Baseline has at least one wasted render, and compiler is not active.

### Actions
1. Pick the fix by reason, one change at a time:

   | Why text | Fix |
   |---|---|
   | "The parent component rendered" and props are unchanged | Wrap the child export: `export default memo(Child)`. |
   | "Props changed: onX" where `onX` is an inline arrow in the parent | `useCallback` in the parent with correct deps, and `memo` on the child (either alone does nothing). |
   | "Props changed: options" where `options` is built inline | `useMemo` in the parent, or hoist the constant out of the component. |
   | Expensive computation runs on every render (seen in Ranked view as self time) | `useMemo(() => compute(a, b), [a, b])`. |
   | State used by one subtree lives high in the tree | Move the state down into that subtree (colocation). |
   | Context value object recreated every render | `useMemo` the provider value. |
   | "Hook N changed" for a value that truly changed | Not wasted; leave it. |

2. After each change, rerun the Profiler wrapper three times. Keep the change only if render count or summed `actualDuration` dropped in all three runs compared with baseline; otherwise revert it with `git checkout -- <file>`.
3. Remove the temporary `<Profiler>` wrapper.
4. Run lint and tests (`npx eslint <dir> --max-warnings 0`, `npx vitest run <dir>`).

### Output
`render_profile_report`.

### Quality Gate
- Each kept change has three after-runs showing fewer renders or lower duration than baseline.
- `grep -n "<Profiler" <component_path>` prints nothing.
- ESLint and tests exit 0.

---

## Worked Example

Illustrative. Script: type `ger`, ArrowDown twice, Enter in a `Combobox` inside `CheckoutForm`.

- Phase 1: `npm ls babel-plugin-react-compiler` prints `(empty)`; compiler not active.
- Phase 2: baseline runs: 41, 41, 41 renders of `Option`; why: "The parent component rendered". Summed `actualDuration` 18.4, 17.9, 18.8 ms (development build).
- Phase 3: `memo(Option)` alone: still 41 (prop `onPick` is inline). Add `useCallback` for `onPick` in `Combobox`: 9, 9, 9 renders; 5.1, 4.8, 5.3 ms. Kept. Wrapper removed; tests pass.

---

## Exit Criteria

DONE when baseline and after measurements exist for the same script, every kept memoization has measured improvement in three runs, unproven changes are reverted, and the temporary profiler code is removed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | React Compiler active | **Return**: report measurements only; manual memoization adds noise the compiler already handles. |
| Phase 2 | "Why did this render" missing | **Adjust**: enable the Profiler setting, then re-record. |
| Phase 2 | No wasted renders | **Return**: report "no change needed" with the baseline table. |
| Phase 3 | Improvement in only some runs | **Adjust**: treat as noise; revert the change. |

---

## Do Not

- Do not wrap every component and value in `memo`/`useMemo`/`useCallback` without a measured reason.
- Do not compare a development measurement against a production one.
- Do not leave `console.log` profiling output in the component.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
