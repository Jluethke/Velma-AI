# React Render Cost for INP

**One-line description:** Finds the React components that re-render during a slow interaction with the React DevTools Profiler ("Record why each component rendered"), then cuts render cost with `startTransition`, `useDeferredValue`, `memo`, stable props, context splitting and list virtualization, measured in a production profiling build.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): React or Next.js repository root.
- `ui_library` (string, optional): `react` to run this flow. Any other value means **Return**.
- `inp_interaction_profile` (object[], required): From `cwv-inp-interaction-profile`.

---

## Outputs

- `react_inp_patch` (object): Components changed, technique per component, commit durations before/after from the Profiler, and interaction phases before/after from the Performance panel.

---

## Phase 1: Profile Renders

### Entry Criteria
- `ui_library` == `react`.
- React DevTools browser extension installed.

### Actions
1. Read versions: `node -p "require('react/package.json').version"`. Note whether the React Compiler is enabled (`grep -rn "babel-plugin-react-compiler\|reactCompiler" package.json next.config.* vite.config.* babel.config.* 2>/dev/null`). With the compiler on, manual `memo`/`useMemo` is often redundant; focus on state placement and transitions.
2. Use a production build with profiling enabled. Development React is much slower and misleads.
   | Stack | Profiling build |
   |---|---|
   | Next.js | `next build --profile` then `next start` (check `npx next build --help` for the flag in your version) |
   | Vite / webpack | Alias `react-dom/client` to `react-dom/profiling` in the bundler config for a profiling build only (check the React docs for your major's profiling entry) |
3. React DevTools Profiler tab: open settings (gear), enable "Record why each component rendered while profiling".
4. Click Record, perform the interaction from `inp_interaction_profile`, stop.
5. For the commit(s) during the interaction, open the Ranked chart. Record the top components by render time and the "Why did this render?" reason for each (props changed: which props; hooks changed; parent rendered; context changed).

### Output
Ranked component list with render reasons.

### Quality Gate
- Profiler data comes from a profiling production build (record the build command used).
- Each of the top components has a recorded render reason.

---

## Phase 2: Fix by Render Reason

### Entry Criteria
- Ranked list exists.

### Actions
1. Choose the technique from the render reason:
   | Reason / pattern | Technique |
   |---|---|
   | Typing or clicking updates state that drives an expensive list or chart | Keep the input state urgent; wrap the expensive update in `startTransition(() => setFilter(v))`, or render the expensive child from `useDeferredValue(value)` |
   | "Parent rendered" with unchanged props | Wrap the child in `memo`; then make its props stable (`useCallback` for handlers, `useMemo` for objects/arrays) because new object identities defeat `memo` |
   | "Context changed" for many consumers that use only part of the value | Split the context into smaller providers, or memoize the provider `value` |
   | Long list (hundreds or thousands of rows) renders on each interaction | Virtualize with a maintained library such as `react-window` or `@tanstack/react-virtual`; read the installed version's README for its component names, which changed across majors |
   | State lives high in the tree but only a leaf uses it | Move the state down into the leaf component |
2. Change ONE component (and its direct props source) per iteration.
3. Do not wrap everything in `memo`. Apply it only to components in the ranked list with "parent rendered" as the reason.
4. Run tests: `npm test`. Keep the test count unchanged; never delete a failing test.

### Output
Patched component.

### Quality Gate
- `git diff --stat` shows one component plus at most its parent.
- `npm test` exits 0 with the same test count.

---

## Phase 3: Measure

### Entry Criteria
- Patch built in the profiling build.

### Actions
1. Re-record the same interaction in the Profiler. Compare the commit duration and confirm the patched component either no longer renders or renders faster.
2. In a normal production build, re-run `cwv-inp-interaction-profile` Phase 2 under the same CPU throttling and record the phases.
3. For `startTransition` changes, confirm in the Performance panel that the urgent update paints first and the transition work runs afterward.

### Output
`react_inp_patch`.

### Quality Gate
- Before/after commit durations and before/after interaction phases are recorded under identical conditions.

---

## Worked Example

Illustrative only. React 18, no compiler. Interaction: typing in a product filter box.

Phase 1 Ranked chart for one keystroke commit (38 ms):
```text
ProductGrid   31.2 ms  why: props changed (items)
ProductCard x240  each ~0.1 ms  why: parent rendered
FilterInput    0.4 ms  why: hooks changed
```
Phase 2: in `Catalog.tsx`, keep `setQuery` urgent and derive `const deferredQuery = useDeferredValue(query)`; `ProductGrid` filters by `deferredQuery`. Wrap `ProductCard` in `memo` and pass a `useCallback` handler.

Phase 3: keystroke commit for the urgent update 1.1 ms; grid update moves to a later non-blocking commit. Interaction duration at 4x slowdown 284 ms to 96 ms.

---

## Exit Criteria

DONE when the components that dominate render time during the interaction are fixed by their recorded render reason, tests pass unchanged, and both Profiler and Performance panel measurements are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ui_library` is not `react` | **Return**: emit an empty patch. |
| Phase 1 | Profiler says profiling not supported | **Adjust**: the build is not a profiling build; follow the Phase 1 step 2 table. |
| Phase 2 | `memo` has no effect | **Adjust**: a prop identity changes each render; stabilize it, then re-profile. |
| Phase 3 | Interaction still slow, renders now cheap | **Return**: the cost is outside React rendering; go back to `cwv-inp-yield-long-tasks`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
