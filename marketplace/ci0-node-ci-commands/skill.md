# Node.js CI Install, Lint and Test Commands

**One-line description:** Writes the exact frozen-lockfile install, lint, type-check, build and test commands for a Node.js project using npm, pnpm, Yarn or Bun, including a JUnit XML reporter for Jest, Vitest, Mocha or Playwright.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository checkout.
- `stack_profile` (object, required): From `ci0-detect-stack`; `stack` must be `node`.

---

## Outputs

- `node_ci_commands` (object): `{setup[], install[], lint[], typecheck[], build[], test[], junit_path, notes[]}`.

---

## Phase 1: Frozen Install

### Entry Criteria
- `stack_profile.stack` is `node` and a lockfile is recorded.

### Actions
1. Pick the install command from `stack_profile.package_manager`:

| Manager | Setup | Install (fails if lockfile and package.json disagree) |
|---|---|---|
| npm | none | `npm ci` |
| pnpm | `corepack enable` (uses `packageManager` field) or `pnpm/action-setup` | `pnpm install --frozen-lockfile` |
| yarn-classic | `corepack enable` | `yarn install --frozen-lockfile` |
| yarn-berry | `corepack enable` | `yarn install --immutable` |
| bun | `oven-sh/setup-bun` action | `bun install --frozen-lockfile` |

2. If `stack_profile.lockfile` is "none", **stop** this phase: CI without a lockfile is not reproducible. Report it to the user.
3. Run the install from a clean state: `rm -rf node_modules && <install command>`. Record the exit code.
4. Do not replace `npm ci` with `npm install` when `npm ci` fails. `npm install` rewrites the lockfile and hides the drift; report the drift instead.

### Output
`setup[]` and `install[]`.

### Quality Gate
- The install exited 0 after `rm -rf node_modules`.
- `git status --porcelain` after the install prints nothing (the lockfile was not modified).

---

## Phase 2: Lint, Type-Check and Build

### Entry Criteria
- Frozen install succeeded.

### Actions
1. Print the scripts: `node -e "console.log(Object.keys(require('./package.json').scripts||{}).join('\n'))"`.
2. Use the project's own scripts when they exist, in this order: `lint`, `typecheck` (or `type-check`, `tsc`), `build`. Run them as `<pm> run <script>` (`npm run lint`, `pnpm run lint`, `yarn lint`, `bun run lint`).
3. If no `typecheck` script exists but `tsconfig.json` does, use `npx tsc --noEmit` (or `pnpm exec tsc --noEmit`, `yarn tsc --noEmit`).
4. Do not add a linter the project does not configure. If `lint` is missing, record "no lint script" in `notes[]`.
5. Run each command and record exit codes. Pre-existing failures on main go into `notes[]` and are listed as non-blocking until the user decides.

### Output
`lint[]`, `typecheck[]`, `build[]`.

### Quality Gate
- Every command maps to a script name printed by step 1, or to `tsc --noEmit` with a `tsconfig.json` present.
- Each command has its exit code recorded.

---

## Phase 3: Test Command With JUnit XML

### Entry Criteria
- Build recorded.

### Actions
1. Identify the runner from the `test` script and add the JUnit reporter for it:

| Runner | CI test command | JUnit file |
|---|---|---|
| Jest | `<pm> exec jest --ci --reporters=default --reporters=jest-junit` with env `JEST_JUNIT_OUTPUT_DIR=reports` (requires `jest-junit` in devDependencies) | `reports/junit.xml` |
| Vitest | `<pm> exec vitest run --reporter=default --reporter=junit --outputFile.junit=reports/junit.xml` | `reports/junit.xml` |
| Mocha | `<pm> exec mocha --reporter mocha-junit-reporter --reporter-options mochaFile=reports/junit.xml` (requires `mocha-junit-reporter`) | `reports/junit.xml` |
| Playwright | `<pm> exec playwright test --reporter=junit` with env `PLAYWRIGHT_JUNIT_OUTPUT_NAME=reports/e2e-junit.xml` | `reports/e2e-junit.xml` |
| node --test | `node --test --test-reporter=junit --test-reporter-destination=reports/junit.xml` (Node 20 and later; confirm with `node --help | grep test-reporter`) | `reports/junit.xml` |

2. Vitest must use `vitest run`, not bare `vitest`: bare `vitest` starts watch mode when not in CI and can hang.
3. If the reporter package is not in `package.json`, list the missing devDependency in `notes[]`. Do not install it silently; adding a dependency changes the lockfile and needs the user's approval.
4. Check reporter flags against the installed version with `<pm> exec jest --help`, `<pm> exec vitest --help`, before writing them.
5. Run the test command. Confirm the JUnit file exists: `grep -c '<testcase' reports/junit.xml`.
6. Do not add `--passWithNoTests` to get a green run.

### Output
`node_ci_commands`.

### Quality Gate
- `grep -c '<testcase' <junit file>` prints a number greater than 0.
- The command contains no watch flag and no `--passWithNoTests` that the project script did not already have.

---

## Worked Example

Illustrative only. `stack_profile = {package_manager: "pnpm", lockfile: "pnpm-lock.yaml", test_runner: "vitest"}`, `packageManager: "pnpm@9.12.0"`.

Phase 1: `corepack enable && pnpm install --frozen-lockfile` exits 0; `git status --porcelain` prints nothing.
Phase 2: scripts are `build lint test typecheck`. `pnpm run lint` exits 0, `pnpm run typecheck` exits 0, `pnpm run build` exits 0.
Phase 3: `pnpm exec vitest run --reporter=default --reporter=junit --outputFile.junit=reports/junit.xml` prints `Test Files 38 passed (38)  Tests 412 passed (412)`; `grep -c '<testcase' reports/junit.xml` prints `412`.

Result: `install: ["pnpm install --frozen-lockfile"]`, `test: ["pnpm exec vitest run --reporter=default --reporter=junit --outputFile.junit=reports/junit.xml"]`, `junit_path: "reports/junit.xml"`.

---

## Exit Criteria

DONE when the frozen install, every script command and the test command have run once with exit codes recorded, and the JUnit file has at least one test case.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `npm ci` reports package.json and lockfile out of sync | **Return**: the user must run the install locally and commit the lockfile; never switch to `npm install`. |
| Phase 1 | Corepack fails to fetch the pinned manager | **Retry**: once; then **Return** with the exact error and the `packageManager` value. |
| Phase 2 | `tsc --noEmit` fails on main | **Adjust**: record as pre-existing, non-blocking until the user decides. |
| Phase 3 | Reporter package missing | **Return**: list the devDependency to add; do not edit `package.json` yourself. |
| Phase 3 | Test run hangs | **Stop**: check for watch mode or open handles (`jest --detectOpenHandles`); report. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
