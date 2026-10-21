# React Major Upgrade (18 To 19)

**One-line description:** Upgrades React following the official React 19 Upgrade Guide: land 18.3 first to surface warnings, run the `react/19/migration-recipe` codemod and `types-react-codemod`, move `react`, `react-dom` and their types in lockstep, then fix what the codemods do not cover (defaultProps on function components, propTypes, legacy context, test renderer).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `package_manager`, `build_command`, `test_command`, `work_dir`.
- `upgrade_plan` (object[], required): From `dup-upgrade-order-plan`. The React lockstep group item and its `blocked_by` items (testing-library, React-dependent UI libraries).
- `codemod_log` (object[], required): From `dup-codemod-run`. Confirms earlier library migrations landed.
- `framework_target_version` (string, required): For example `19` or an exact `19.1.1`.

---

## Outputs

- `framework_upgrade_log` (object): `from`, `to`, `steps` (18.3, codemods, 19 bump, manual fixes, each with commit and test result), `peer_blockers`, `removed_api_hits`, `final_test_result`. Also written to `<work_dir>/framework-react.json`.

---

## Phase 1: Land React 18.3 And Read Its Warnings

### Entry Criteria
- `upgrade_scope.framework == "react"`; current React is 18.x (`npm ls react --depth=0`).

### Actions
1. React 18.3 is 18.2 plus warnings for APIs removed in 19. Bump the lockstep group to it: `npm install react@18.3 react-dom@18.3`. Run frozen install, build, tests. Commit `deps: react 18.3 (deprecation warnings)`.
2. Collect warnings from the test log and a dev-server smoke run: `grep -nE 'Warning: .*(will be removed|deprecated|no longer supported|defaultProps|propTypes|findDOMNode|string ref|contextTypes)' <test log>`.
3. Confirm the new JSX transform is on (required by 19): `tsconfig.json` `compilerOptions.jsx` is `react-jsx` or `react-jsxdev`, or Babel uses `@babel/preset-react` with `runtime: "automatic"`. If it is `react` (classic), switch first in its own commit; the 19 upgrade guide lists the new transform as required.
4. Peer check for every React-dependent library: `npm view <lib>@latest peerDependencies --json` must allow `^19`. Record those that do not as `peer_blockers`.

### Output
18.3 commit, warning list, peer blockers.

### Quality Gate
- `npm ls react react-dom --depth=0` shows 18.3.x and tests equal the baseline.
- `peer_blockers` is empty or each entry has a user decision recorded.

---

## Phase 2: Codemods And The Lockstep Bump

### Entry Criteria
- `peer_blockers` resolved; tree clean.

### Actions
1. Bump the group together (they must never differ in major): `npm install --save-exact react@^19 react-dom@^19` (drop `--save-exact` if the repo uses ranges) and `npm install --save-dev @types/react@^19 @types/react-dom@^19` for TypeScript projects. Do not use `--legacy-peer-deps` or `--force`; an `ERESOLVE` names a library still pinned to 18; return to Phase 1 step 4.
2. Run the official codemod recipe: `npx codemod@latest react/19/migration-recipe`. It covers `ReactDOM.render` to `createRoot`, `hydrate` to `hydrateRoot`, string refs to callback refs, `act` import from `react-dom/test-utils` to `react`, and `React.PropTypes` usage removal among others (read the recipe description printed by the tool to confirm which transforms ran).
3. TypeScript: `npx types-react-codemod@latest preset-19 ./src`. Fixes `useRef()` now requiring an argument, `ReactElement` props defaulting to `unknown`, removed global `JSX` namespace (use `React.JSX`), and other type changes.
4. Format the changed files, then commit as one automated commit: `refactor: react 19 codemods`.

### Output
Bump and codemod commit.

### Quality Gate
- `npm ls react react-dom @types/react @types/react-dom --depth=0` shows all at 19.
- `npx tsc --noEmit` exit code recorded (failures are expected input for Phase 3, not ignored).

---

## Phase 3: Manual Removals And Proof

### Entry Criteria
- Codemod commit exists.

### Actions
1. Grep for APIs removed in 19 that need hand fixes; fix one category per commit:

| Grep | Replacement |
|---|---|
| `git grep -nE '\.defaultProps\s*=' -- '*.jsx' '*.tsx' '*.js' '*.ts'` on function components | ES6 default parameters in the function signature (class components keep `defaultProps`) |
| `git grep -nE '\.propTypes\s*='` | propTypes checks are removed in 19 (silently ignored); move to TypeScript types or delete only after the user agrees |
| `git grep -nE 'contextTypes\|childContextTypes\|getChildContext'` | `React.createContext` with `contextType` or `useContext` |
| `git grep -n 'findDOMNode'` | a DOM ref |
| `git grep -nE 'react-test-renderer'` | deprecated in 19; move to `@testing-library/react` with the user's agreement |
| `git grep -n 'unmountComponentAtNode'` | `root.unmount()` |
| `git grep -n 'createFactory'` | JSX |

2. Error-handling behavior changed: render errors caught by error boundaries are no longer re-thrown; `createRoot` accepts `onUncaughtError` and `onCaughtError`. If tests spied on `console.error` for render errors, they may change; treat such failures as behavior changes for the user, do not edit the assertions yourself.
3. Run `npx tsc --noEmit` (TS projects), `build_command`, and the full tests. Test failures must equal the baseline.
4. Write `<work_dir>/framework-react.json`.

### Output
`framework_upgrade_log`.

### Quality Gate
- Every grep in the table prints nothing, or each remaining hit is a class component (`defaultProps`) or listed with a user decision.
- `tsc --noEmit` exits 0 and test failures equal the baseline.

---

## Worked Example

Illustrative only. Vite + TypeScript app on React 18.2.0 with `@testing-library/react` 16 (already landed).

- Phase 1: `npm install react@18.3 react-dom@18.3`; tests print `Warning: Avatar: Support for defaultProps will be removed from function components in a future major release.` `tsconfig.json` has `"jsx": "react-jsx"`. `react-select@latest` peers `^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0`: fine.
- Phase 2: `npm install react@^19 react-dom@^19` and types; `npx codemod@latest react/19/migration-recipe` converts `ReactDOM.render` in `src/main.tsx`; `types-react-codemod preset-19` rewrites 6 `useRef<HTMLDivElement>()` to `useRef<HTMLDivElement>(null)`. `tsc --noEmit` reports 2 errors in `Avatar.tsx`.
- Phase 3: `Avatar.defaultProps` moved into default parameters; `tsc` passes; `npm test` equals baseline. Final `19.1.1`.

---

## Exit Criteria

DONE when react, react-dom and their types are on the target major together, codemods and manual removals are committed separately, types compile, and tests equal the baseline.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Classic JSX runtime in use | **Adjust**: switch to the automatic runtime in its own commit first. |
| Phase 2 | `ERESOLVE` from a library pinned to React 18 | **Return**: add it to `peer_blockers`; never pass `--legacy-peer-deps`. |
| Phase 2 | Codemod CLI prompts are not answerable in a non-interactive run | **Adjust**: check `npx codemod@latest --help` for non-interactive flags; otherwise ask the user to run it and paste the output. |
| Phase 3 | Snapshot tests change | **Stop**: show the snapshot diff; do not run `jest -u` without approval. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
