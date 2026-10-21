# TDD Vitest Runner Setup

**One-line description:** Installs and configures Vitest (alone or inside an existing Vite config), proves it passes and fails a canary, and records the run-once, single-test, related-files and watch commands, including how Vitest decides between watch and run mode.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Root folder holding `package.json`.

---

## Outputs

- `runner_config` (object): `config_file`, `environment` (node, jsdom or happy-dom), `globals` (true/false), `suite_command`, `single_test_command` (template), `watch_command`, `vitest_version`.
- `smoke_result` (object): Exit code and the `Tests` summary line for the canary pass run and fail run.

---

## Phase 1: Install and Configure

### Entry Criteria
- `project_dir/package.json` exists.

### Actions
1. Install: `npm install --save-dev vitest` (use the project's package manager).
2. Choose the config file:

| Situation | Config |
|---|---|
| Project already has `vite.config.ts` | Add a `test: {}` block to it; add `/// <reference types="vitest/config" />` at the top so the key type-checks. |
| No Vite config | Create `vitest.config.ts` with `import { defineConfig } from 'vitest/config'` and `export default defineConfig({ test: {} })`. |
| Both files exist | Vitest uses `vitest.config.ts` and ignores `vite.config.ts` for tests. Put test settings in `vitest.config.ts`. |

3. Set `test.environment`: `'node'` (default) for server code; `'jsdom'` for DOM code (`npm install --save-dev jsdom`); `'happy-dom'` only if the project already uses it.
4. Leave `test.globals` at its default `false`. Tests then `import { describe, it, expect, vi } from 'vitest'`. If you set `globals: true` for TypeScript, add `"types": ["vitest/globals"]` to `tsconfig.json`.
5. Add scripts to `package.json`: `"test": "vitest"`, `"test:run": "vitest run"`.

### Output
Vitest installed with one config file holding the `test` block.

### Quality Gate
- `npx vitest --version` prints a version.
- Exactly one of `vitest.config.*` or `vite.config.*` contains the `test` block (search: `grep -l "test:" vite*.config.*`).

---

## Phase 2: Canary Pass and Fail

### Entry Criteria
- Vitest installed.

### Actions
1. Create `src/canary.test.ts`:

```ts
import { expect, it } from 'vitest';

it('canary: runner executes tests', () => {
  expect(1 + 1).toBe(2);
});
```

2. Run `npx vitest run src/canary.test.ts`. Expect `Tests  1 passed (1)` and exit code 0.
3. Change `toBe(2)` to `toBe(3)`. Run again. Expect `AssertionError: expected 2 to be 3`, `Tests  1 failed (1)`, exit code 1.
4. Delete the canary. Record both runs in `smoke_result`.

### Output
`smoke_result`.

### Quality Gate
- Pass run exit 0; fail run exit 1 with `expected 2 to be 3`.
- The canary file no longer exists.

---

## Phase 3: Modes and Selection

### Entry Criteria
- Canary proved pass and fail.

### Actions
1. Know the mode rule: bare `vitest` starts watch mode in an interactive terminal and runs once when `process.env.CI` is set or stdin is not a TTY. An agent or script must always use `vitest run` so it does not hang.
2. Record:

| Purpose | Command |
|---|---|
| Full suite once | `npx vitest run` |
| One file | `npx vitest run src/user.test.ts` |
| One test by name (regex on full name) | `npx vitest run src/user.test.ts -t "rejects 21 characters"` |
| Tests that import the changed source | `npx vitest related src/user.ts --run` |
| Stop after N failures | `npx vitest run --bail 1` |
| Watch (human at keyboard) | `npx vitest` |

3. Watch keys: `a` rerun all, `f` rerun failed, `p` filter by file name, `t` filter by test name, `u` update snapshots, `q` quit, `h` help. Vitest watch reruns only tests whose import graph includes the changed file.
4. Remove every `.only` and `.skip` added during work before committing: `grep -rnE "\.(only|skip)\(" src`.

### Output
`runner_config`.

### Quality Gate
- `npx vitest run` returns an exit code (it does not stay open).
- `grep -rnE "\.(only|skip)\(" src` lists no lines added in this session.

---

## Worked Example

Illustrative only. Vite + React project with `vite.config.ts`.

Phase 1: add `test: { environment: 'jsdom' }` to `vite.config.ts`, `npm install --save-dev vitest jsdom`.

Phase 2 fail run:

```
 FAIL  src/canary.test.ts > canary: runner executes tests
AssertionError: expected 2 to be 3 // Object.is equality
 Test Files  1 failed (1)
      Tests  1 failed (1)
```

Phase 3: `suite_command` = `npx vitest run`, `single_test_command` = `npx vitest run {file} -t "{name}"`, `watch_command` = `npx vitest`.

---

## Exit Criteria

DONE when Vitest is configured in one file, a canary was seen passing and failing, it is removed, and the run-once and watch commands are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ReferenceError: describe is not defined` | **Adjust**: import from `vitest` in the test, or set `globals: true` plus the tsconfig types entry. |
| Phase 1 | `document is not defined` | **Adjust**: set `test.environment` to `jsdom` and install `jsdom`. |
| Phase 2 | `No test files found` | **Retry**: check the name matches `include` (default `**/*.{test,spec}.?(c\|m)[jt]s?(x)`) and is not under `exclude`. |
| Phase 3 | Command hangs waiting for input | **Stop**: kill it and rerun with `vitest run`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
