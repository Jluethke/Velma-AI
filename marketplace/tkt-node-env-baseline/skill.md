# Node.js Environment Setup and Test Baseline

**One-line description:** Installs a JavaScript or TypeScript project's dependencies with the exact package manager and Node version it pins (npm, pnpm, yarn classic, yarn berry or bun), runs its test script once before any change, and records every pre-existing failure with the runner's own test ids.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_profile` (object, required): Output of `tkt-repo-orient-detect` with `stack` containing node.

---

## Outputs

- `node_baseline_report` (object): Node version, package manager and version, install command, test runner (jest, vitest, mocha, node:test, playwright), test command, counts by outcome, failing test files and names with first error line and classification, commit hash.

---

## Phase 1: Pin Node and Install

### Entry Criteria
- `repo_profile.stack` includes node.

### Actions
1. Find the required Node version, in this order: `.nvmrc`, `.node-version`, `.tool-versions` (`nodejs` line), `engines.node` in `package.json`, `node-version:` in the CI workflow. Run `node --version` and compare. If it does not match, switch with the version manager installed (`nvm use`, `fnm use`, `volta` reads `package.json` `volta` key automatically).
2. Read the `packageManager` field in `package.json` (for example `"pnpm@9.12.0"`). If present, run `corepack enable` so the pinned version is used.
3. Install with the lockfile-respecting command. Never run plain `npm install` during setup; it rewrites `package-lock.json`.

| Lockfile | Install command |
|---|---|
| `package-lock.json` | `npm ci` |
| `pnpm-lock.yaml` | `pnpm install --frozen-lockfile` |
| `yarn.lock` and `yarn --version` starts with 1 | `yarn install --frozen-lockfile` |
| `yarn.lock` and `yarn --version` is 2 or higher | `yarn install --immutable` |
| `bun.lockb` or `bun.lock` | `bun install --frozen-lockfile` |

4. In a pnpm, yarn or npm workspace, install from the repo root, not from a package folder.

### Output
Installed `node_modules` and the install command used.

### Quality Gate
- Install exits 0.
- `git status --porcelain` shows no change to the lockfile.
- `node --version` output matches the pinned version from Action 1.

---

## Phase 2: Identify the Runner and Run the Baseline

### Entry Criteria
- Dependencies installed.

### Actions
1. Read `scripts.test` in `package.json`. Identify the runner by the command it calls:

| `scripts.test` contains | Runner | Run one file | Run one test by name |
|---|---|---|---|
| `jest` | Jest | `npx jest path/to/file.test.ts` | `npx jest -t "name substring"` |
| `vitest` | Vitest | `npx vitest run path/to/file.test.ts` | `npx vitest run -t "name substring"` |
| `mocha` | Mocha | `npx mocha path/to/file.spec.js` | `npx mocha --grep "name"` |
| `node --test` | node:test | `node --test path/to/file.test.js` | `node --test --test-name-pattern="name"` |
| `playwright test` | Playwright | `npx playwright test path/to/file.spec.ts` | `npx playwright test -g "name"` |

2. Note: `vitest` without `run` starts watch mode in an interactive terminal and never exits. Always pass `run` (or set `CI=true`) for the baseline.
3. Run the CI test command. With pnpm use `pnpm test`, with yarn `yarn test`, with npm `npm test`. In a workspace, CI often runs `pnpm -r test` or `npm test --workspaces`; copy whatever CI uses.
4. Read the summary. Jest prints `Tests: 2 failed, 318 passed, 320 total`. Vitest prints `Test Files  1 failed | 41 passed (42)` and `Tests  2 failed | 318 passed (320)`. Mocha prints `318 passing` and `2 failing`.
5. Rerun each failing file alone (table above). Passes alone = `order-dependent`; fails alone = `pre-existing`.

### Output
Counts and failure list.

### Quality Gate
- Runner summary lines are copied verbatim into the report.
- The test process exited (no watch mode left running).

---

## Phase 3: Record the Baseline

### Entry Criteria
- Suite completed.

### Actions
1. Also run the typecheck once if CI does (`npx tsc --noEmit` or the `typecheck` script) and record the error count from the last line (`Found 3 errors in 2 files.`). These are pre-existing type errors.
2. Write `node_baseline_report` with commit hash from `git rev-parse --short HEAD`.

### Output
`node_baseline_report`.

### Quality Gate
- Report contains the commit hash, runner name, and the single-test command for that runner.
- Every failing test has a classification.

---

## Worked Example

Illustrative only.

```
$ cat .nvmrc
20.17.0
$ node --version
v20.17.0
$ jq -r .packageManager package.json
pnpm@9.12.0
$ corepack enable && pnpm install --frozen-lockfile
Lockfile is up to date, resolution step is skipped
Done in 6.1s
$ jq -r .scripts.test package.json
vitest run
$ pnpm test
 Test Files  1 failed | 41 passed (42)
      Tests  1 failed | 319 passed (320)
 FAIL  src/date/format.test.ts > formatInvoiceDate > uses UTC
$ npx vitest run src/date/format.test.ts
 Tests  1 failed (4)
```

`node_baseline_report`: Node 20.17.0, pnpm 9.12.0, Vitest, 320 tests, 1 pre-existing failure `src/date/format.test.ts > formatInvoiceDate > uses UTC`, commit `9f8e7d6`.

---

## Exit Criteria

DONE when dependencies install without changing the lockfile under the pinned Node version, the suite has run once to exit, and every failure is classified with the commit hash recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `npm ci` fails with lockfile out of sync | **Stop**: report it; lockfile repair is a separate change. |
| Phase 1 | Peer dependency errors (`ERESOLVE`) | **Stop**: do not add `--legacy-peer-deps` or `--force` unless CI uses that flag; report the conflict. |
| Phase 1 | Wrong Node version and no version manager | **Stop**: report required and found versions. |
| Phase 2 | Tests need env vars or services | **Adjust**: copy the `env:` and `services:` blocks from CI; record them. |
| Phase 2 | Runner hangs in watch mode | **Retry**: kill it and rerun with `CI=true` or the `run` subcommand. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
