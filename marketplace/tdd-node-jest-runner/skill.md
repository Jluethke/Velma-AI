# TDD Jest Runner Setup

**One-line description:** Installs and configures Jest for a JavaScript or TypeScript project (CommonJS, ESM or ts-jest), proves it passes and fails a canary, and records the single-test, bail and watch commands used during red-green-refactor.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Root folder holding `package.json`.

---

## Outputs

- `runner_config` (object): `config_file`, `module_system` (cjs, esm, ts-jest, babel-ts), `suite_command`, `single_test_command` (template), `watch_command`, `jest_version`.
- `smoke_result` (object): Exit code and the `Tests:` summary line for the canary pass run and fail run.

---

## Phase 1: Install and Pick the Transform

### Entry Criteria
- `project_dir/package.json` exists. `node --version` prints a version.

### Actions
1. Install: `npm install --save-dev jest` (use `pnpm add -D jest` or `yarn add -D jest` if a `pnpm-lock.yaml` or `yarn.lock` exists; never mix lock files).
2. Pick the module setup from this table by reading `package.json` and the source files:

| Situation | Setup |
|---|---|
| Plain JS, `require()` | Nothing extra. |
| TypeScript source | `npm install --save-dev ts-jest @types/jest typescript`, then `npx ts-jest config:init` (writes `jest.config.js` with `preset: 'ts-jest'`). |
| TypeScript, project already uses Babel | `npm install --save-dev babel-jest @babel/core @babel/preset-env @babel/preset-typescript` and add both presets to `babel.config.js`. Babel strips types and does NOT type-check. |
| Native ESM (`"type": "module"`) | Run Jest as `node --experimental-vm-modules node_modules/jest/bin/jest.js`; inside tests import `jest` from `@jest/globals` for `jest.fn`. Check the Jest ECMAScript Modules docs for the installed version. |

3. Add to `package.json` scripts: `"test": "jest"` (or the ESM form above).
4. If no config file exists and the table did not create one, run `npx jest --init` and accept `node` as the test environment unless the code touches the DOM (then `jsdom`, which needs `npm install --save-dev jest-environment-jsdom` since Jest 28).

### Output
Jest installed with a transform matching the source.

### Quality Gate
- `npx jest --version` prints a version.
- `npx jest --showConfig` runs without error and its `testMatch` or `testRegex` matches where tests will live.

---

## Phase 2: Canary Pass and Fail

### Entry Criteria
- Jest runs.

### Actions
1. Create `src/canary.test.js` (or `.ts`):

```js
test('canary: runner executes tests', () => {
  expect(1 + 1).toBe(2);
});
```

2. Run `npx jest src/canary.test.js`. Expect `Tests: 1 passed, 1 total` and exit code 0.
3. Change `toBe(2)` to `toBe(3)`. Run again. Expect `Expected: 3`, `Received: 2`, `Tests: 1 failed, 1 total`, exit code 1.
4. Delete the canary file. Record both runs in `smoke_result`.

### Output
`smoke_result`.

### Quality Gate
- Pass run exit 0 with `1 passed`; fail run exit 1 with `1 failed`.
- The canary file no longer exists.

---

## Phase 3: Selection and Watch

### Entry Criteria
- Canary proved pass and fail.

### Actions
1. Record:

| Purpose | Command |
|---|---|
| Full suite | `npx jest` |
| CI run (no watch, no snapshot writes) | `npx jest --ci` |
| One file | `npx jest src/user.test.ts` |
| One test by name (regex on describe + test text) | `npx jest src/user.test.ts -t "rejects 21 characters"` |
| Stop after first failing suite | `npx jest --bail` |
| Run in one process (debug order or shared state problems) | `npx jest --runInBand` |
| Watch changed files | `npx jest --watch` (needs a git or hg repository) |
| Watch everything | `npx jest --watchAll` |

2. In watch mode, press `f` to rerun only failed tests, `p` to filter by file name, `t` to filter by test name, `a` to run all, `q` to quit, `w` to show the key list.
3. Inside a test file, `test.only` and `describe.only` narrow the run. Remove every `.only` before committing; search with `grep -rn "\.only(" src`.
4. Never pass `--passWithNoTests` during TDD; it turns a wrong path into a green run.

### Output
`runner_config`.

### Quality Gate
- `grep -rn "\.only(" src` returns nothing.
- `npx jest --watch` starts (or the reason it cannot, such as no git repository, is recorded and `--watchAll` is used).

---

## Worked Example

Illustrative only. TypeScript project, no Babel.

Phase 1: `npm install --save-dev jest ts-jest @types/jest typescript` and `npx ts-jest config:init`.

Phase 2 fail run:

```
 FAIL  src/canary.test.ts
  x canary: runner executes tests (3 ms)
    Expected: 3
    Received: 2
Tests:       1 failed, 1 total
```

Phase 3: `runner_config.single_test_command` = `npx jest {file} -t "{name}"`, `watch_command` = `npx jest --watch`.

---

## Exit Criteria

DONE when Jest runs with the right transform, the canary was seen passing and failing, the canary is removed, and the commands are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `SyntaxError: Cannot use import statement outside a module` | **Adjust**: pick the ESM row or add ts-jest/Babel per the table. |
| Phase 1 | `jest-environment-jsdom cannot be found` | **Adjust**: install `jest-environment-jsdom` as a dev dependency. |
| Phase 2 | `No tests found, exiting with code 1` | **Retry**: compare the file path with `testMatch` from `npx jest --showConfig`. |
| Phase 3 | `--watch is not supported without git/hg` | **Adjust**: use `--watchAll`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
