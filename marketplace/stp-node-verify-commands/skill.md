# Find the Node and TypeScript Verify Commands the Repo Already Uses

**One-line description:** Identifies the package manager from the lockfile, the test runner (vitest, jest, mocha or `node --test`) and the typecheck and lint scripts from `package.json` and CI, and writes non-watch commands at four speeds: check one file, run one test, check touched files, run the full suite.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root (or the workspace package directory).
- `goal_check` (object, required): From `stp-goal-to-runnable-check`.

---

## Outputs

- `node_verify_commands` (object): `{ "package_manager": str, "compile_one": str, "test_one": str, "check_touched": [str], "full_suite": str, "collect_count": str, "sources": [str] }`.

---

## Phase 1: Identify the Package Manager

### Entry Criteria
- `repo_path` contains `package.json`.

### Actions
1. Read `package.json` and note the `packageManager` field (for example `"pnpm@9.1.0"`) if present. It wins over lockfile detection.
2. Otherwise pick from the lockfile:

| Lockfile | `package_manager` | Run a script | Run a package binary |
|---|---|---|---|
| `package-lock.json` | npm | `npm run <script> -- <args>` | `npx <bin>` |
| `pnpm-lock.yaml` | pnpm | `pnpm run <script> <args>` | `pnpm exec <bin>` |
| `yarn.lock` | yarn | `yarn <script> <args>` | `yarn <bin>` |
| `bun.lockb` or `bun.lock` | bun | `bun run <script> <args>` | `bunx <bin>` |

3. With npm, arguments after `--` go to the script; `npm test src/a.test.ts` without `--` can drop or misroute the argument. Always write `npm test -- <args>`.
4. Check `node_modules/` exists. If it does not, the dependencies are not installed. That is a stop trigger; do not run `npm install` unasked, because it can rewrite the lockfile.
5. Run `node --version` and record it. Compare with `engines.node` in `package.json` and `.nvmrc` / `.node-version` if present.

### Output
`package_manager` and Node version.

### Quality Gate
- `node --version` exits 0.
- `node_modules/.bin/` exists.

---

## Phase 2: Read Scripts and CI

### Entry Criteria
- `package_manager` known.

### Actions
1. Print the scripts: `node -p "JSON.stringify(require('./package.json').scripts, null, 2)"`. Copy `test`, `test:*`, `lint`, `typecheck`, `type-check`, `tsc`, `build` into `sources`.
2. Read `.github/workflows/*.yml` `run:` lines and copy the install and test commands into `sources` with `file:line`.
3. Find the test runner from `devDependencies` and config files:

| Evidence | Runner |
|---|---|
| `vitest` in devDependencies or `vitest.config.*` / `test:` block in `vite.config.*` | vitest |
| `jest` in devDependencies or `jest.config.*` or `"jest"` key in package.json | jest |
| `mocha` in devDependencies or `.mocharc.*` | mocha |
| script uses `node --test` | Node built-in test runner |

4. Note whether the repo is TypeScript (`tsconfig.json` exists) and whether tests run through `ts-jest`, `@swc/jest`, `babel-jest` or vitest's built-in transform. A runner transform strips types without checking them, so a green test run does NOT prove the types are correct.

### Output
`sources`, runner, TypeScript yes/no.

### Quality Gate
- The runner named appears in `devDependencies` or in a `node --test` script.

---

## Phase 3: Write the Four-Speed Command Set

### Entry Criteria
- Runner known.

### Actions
1. `compile_one`:
   - TypeScript: `npx tsc --noEmit -p tsconfig.json`. `tsc` cannot check one file while honoring `tsconfig.json`; passing a file name makes it ignore the config. So this checks the project. If the repo has a `typecheck` script, use it instead.
   - JavaScript: `node --check <file>` (syntax only; CommonJS and ESM both parse).
2. `test_one`, always in non-watch form:
   - vitest: `npx vitest run <file> -t "<test name>"`. Plain `vitest` starts watch mode in an interactive terminal and never exits.
   - jest: `npx jest <file> -t "<test name>"`. Do not add `--watch`. Do not add `--passWithNoTests`; it turns a wrong selector into a green run.
   - mocha: `npx mocha <file> --grep "<test name>"`.
   - node test runner: `node --test --test-name-pattern="<test name>" <file>`.
3. `check_touched`: `npx eslint <file>` if ESLint is configured (`eslint.config.*` or `.eslintrc*`), and `npx prettier --check <file>` only if CI runs Prettier.
4. `full_suite`: the CI test command from `sources` (for example `npm test`, `pnpm -r test`).
5. `collect_count`: vitest `npx vitest list` (prints one line per test); jest `npx jest --listTests` (prints test files, not tests; record that it counts files); node test runner: count `# tests N` in the TAP summary of `full_suite`.
6. Set `CI=true` in the environment for test commands (`CI=true npx jest ...`; PowerShell `$env:CI="true"`). Jest and vitest read it and disable interactive mode.

### Output
`node_verify_commands`.

### Quality Gate
- `test_one` contains `run` for vitest, contains no `--watch`, and contains no `--passWithNoTests`.
- Running `test_one` with the goal's file exits (does not hang) and prints a pass or fail summary line.

---

## Worked Example

Illustrative only.

Repo `/work/shopfmt`: `pnpm-lock.yaml`, `tsconfig.json`, `vitest` in devDependencies, scripts `{"test":"vitest run","typecheck":"tsc --noEmit","lint":"eslint ."}`, CI line `run: pnpm typecheck && pnpm test`.

- Phase 1: `package_manager` = pnpm, `node --version` prints `v20.15.0`.
- Phase 2: runner vitest, TypeScript yes.
- Phase 3:
```
compile_one:   pnpm typecheck
test_one:      pnpm exec vitest run <file> -t "<name>"
check_touched: pnpm exec eslint <file>
full_suite:    pnpm test
collect_count: pnpm exec vitest list
$ pnpm exec vitest run src/price.test.ts -t "formats zero"
 FAIL  src/price.test.ts > formatPrice > formats zero
 AssertionError: expected '' to be '$0.00'
 Test Files  1 failed (1)
      Tests  1 failed | 3 skipped (4)
```
The command exited (exit code 1) and printed a summary, so the form is valid.

---

## Exit Criteria

DONE when `node_verify_commands` holds non-watch commands for the detected manager and runner, and `test_one` runs to completion.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `node_modules/` | **Stop**: report the install command from CI (`npm ci`, `pnpm install --frozen-lockfile`); do not run it unasked. |
| Phase 1 | Two lockfiles present | **Adjust**: use the one matching `packageManager` or the CI install step; record the conflict. |
| Phase 2 | Monorepo (`workspaces` or `pnpm-workspace.yaml`) | **Adjust**: run commands in the package that owns the goal file, or use `pnpm --filter <name>` / `npm -w <name>`. |
| Phase 3 | `test_one` hangs | **Retry**: confirm `run` (vitest) and no `--watch`; set `CI=true`. |
| Phase 3 | `tsc` reports errors that exist before any edit | **Return**: hand them to `stp-baseline-capture` as pre-existing; do not fix them. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
