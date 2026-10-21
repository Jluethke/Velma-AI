# React Rules of Hooks Lint and Fix

**One-line description:** Installs or confirms `eslint-plugin-react-hooks`, runs `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` on one component directory, and fixes each finding with the matching fix from a fixed decision table, never by suppressing the rule or deleting dependencies.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Repository root.
- `component_path` (string, required): The component file; the lint scope is its directory.
- `react_build_report` (object, required): From `uic-react-component-build`; must show typecheck at baseline and ESLint exit 0 before hooks findings are triaged.

---

## Outputs

- `hooks_lint_report` (object): Plugin version, findings before and after (rule, file, line, message), the fix applied to each, and the final ESLint exit code.

---

## Phase 1: Confirm the Plugin and Run It

### Entry Criteria
- `component_path` exists.
- `react_build_report` records typecheck at baseline.

### Actions
1. `npm ls eslint eslint-plugin-react-hooks --depth=0`. If the plugin is missing, stop and ask before installing (`npm i -D eslint-plugin-react-hooks`).
2. Check the ESLint config file (`eslint.config.js`/`.mjs` flat config, or `.eslintrc.*` legacy) for the plugin. Open the plugin README matching your installed version for the exact config export name; the export name changed across major versions. Do not guess it.
3. Confirm the two rules are active on your file: `npx eslint --print-config <component_path> | grep react-hooks`. Expect `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` with a severity of 1 or 2 (or "warn"/"error").
4. Run `npx eslint <component_dir> --format stylish`. Copy every `react-hooks/*` line into the findings table.

### Output
Findings table (before).

### Quality Gate
- `--print-config` output shows both rules enabled.
- Findings table lists rule, line and message for every `react-hooks/` line in the output.

---

## Phase 2: Fix Each Finding

### Entry Criteria
- Findings table exists.

### Actions
1. Fix one finding at a time, rerun ESLint on the file after each fix.
2. `rules-of-hooks` fixes:

   | Message contains | Fix |
   |---|---|
   | "called conditionally" | Move the hook above the condition; put the condition inside the hook body or inside the effect. |
   | "called in a loop" | Extract the loop body into a child component that calls the hook once. |
   | "called after an early return" | Move all hooks above the first `return`. |
   | "is called in function ... that is neither a React function component nor a custom React Hook" | Rename the function to start with `use` if it is a hook, or move the call into a component. |

3. `exhaustive-deps` fixes, first matching row:

   | Situation | Fix |
   |---|---|
   | Missing dependency is a prop or state value | Add it to the array. |
   | Missing dependency is a function defined in the component and used only in this effect | Move the function inside the effect. |
   | Function is used by several hooks | Wrap it in `useCallback` with its own correct deps. |
   | Dependency is an object/array literal recreated every render | Move it outside the component if constant, or `useMemo` it, or depend on its primitive fields. |
   | Effect sets state from previous state | Use the updater form `setX(prev => ...)` and drop `x` from deps. |
   | Effect needs the latest value of a callback prop without re-running | Store it in a ref updated in an effect (`latestRef.current = onChange`), or use `useEffectEvent` if your React version exports it (check `node -e "console.log(typeof require('react').useEffectEvent)"` prints `function`). |
   | "has an unnecessary dependency" (outer-scope value) | Remove it; it never changes. |
   | Effect only derives data for rendering | Delete the effect and compute the value during render. |

4. After adding dependencies, re-read the effect: if it now runs more often than the behavior needs, the effect is doing too much; split it by concern.

### Output
Fixed source.

### Quality Gate
- ESLint on the file prints zero `react-hooks/` lines.
- `grep -n "eslint-disable" <component_path>` prints nothing.
- `git diff --stat` shows only files in the component directory.

---

## Phase 3: Prove Behavior Did Not Change

### Entry Criteria
- Lint clean.

### Actions
1. Run the component's existing tests (`npx vitest run <component_dir>` or `npx jest <component_dir>`). If none exist yet, record "no tests yet; covered by uic-testing-library-react" and list the effects whose deps changed so the tests target them.
2. Record ESLint exit code and test summary line in `hooks_lint_report`.

### Output
`hooks_lint_report`.

### Quality Gate
- ESLint exit code 0 for the component directory.
- Test summary shows 0 failed, or the "no tests yet" note lists every changed effect.

---

## Worked Example

Illustrative. `npx eslint src/components/Combobox` prints:
```
Combobox.tsx
  41:6  warning  React Hook useEffect has a missing dependency: 'onOpenChange'. Either include it or remove the dependency array  react-hooks/exhaustive-deps
```
- Phase 2: row "latest value of a callback prop" applies; React 19.2 is installed and `typeof useEffectEvent` prints `function`, so `const emitOpen = useEffectEvent(onOpenChange)` is declared at the component top level, `emitOpen(open)` is called inside the effect, and `emitOpen` stays out of the dependency array.
- Phase 3: `npx vitest run src/components/Combobox` prints `Tests 12 passed (12)`; ESLint exit 0.

---

## Exit Criteria

DONE when both hooks rules are active and report zero findings in the component directory, no disable comments exist, and tests still pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Plugin not installed | **Stop**: ask before adding a dev dependency. |
| Phase 1 | Rules not in `--print-config` | **Adjust**: add the plugin's recommended config from its README for the installed version. |
| Phase 2 | Adding a dep causes an infinite render loop | **Adjust**: the dep is unstable; apply the object/function rows, not removal. |
| Phase 3 | Tests fail after a fix | **Retry**: revert that one fix with `git checkout -p`, reapply with the next table row. |

---

## Do Not

- Do not add `// eslint-disable-next-line react-hooks/exhaustive-deps`.
- Do not remove a dependency to stop a loop; fix why it changes.
- Do not wrap every function in `useCallback`; only those the table names.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
