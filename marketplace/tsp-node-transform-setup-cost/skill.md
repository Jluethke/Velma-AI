# Jest and Vitest Transform and Setup Cost

**One-line description:** Measures the per-file overhead of a Jest or Vitest suite (TypeScript transform, test environment such as jsdom, setup files, module graph size) and lists specific config changes, such as `@swc/jest` in place of `ts-jest` or a `node` environment for non-DOM files, with the evidence for each.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `test_command` (string, required): Baseline Jest or Vitest command.
- `node_duration_report` (object, required): From `tsp-node-durations-report`; per-file overhead and signals.

---

## Outputs

- `node_setup_cost` (object): Cold versus warm cache times, transformer in use, environment per file, setup files and their cost, module count for the heaviest files, and a list of candidate config changes each with its measured or measurable effect.

---

## Phase 1: Cold Versus Warm Cache

### Entry Criteria
- `node_duration_report` exists.

### Actions
1. Jest: find the cache path with `npx jest --showConfig | grep cacheDirectory`. Run cold: `npx jest --no-cache` and record wall time with `time`. Run warm twice: `time npx jest`; record the second.
2. Vitest: Vitest caches transforms through Vite under `node_modules/.vite`. Cold run: delete `node_modules/.vite/vitest` only if it exists (`ls node_modules/.vite`), then `time npx vitest run`; warm: run again.
3. A large cold-minus-warm gap means CI without a persisted cache pays transform cost on every run. Record it for `tsp-ci-test-tool-cache`.
4. Do NOT delete `node_modules` or lockfiles.

### Output
Cold and warm wall times.

### Quality Gate
- Two `real` values recorded for each of cold and warm, copied from `time` output.

---

## Phase 2: Transform and Environment

### Entry Criteria
- Phase 1 complete.

### Actions
1. Record the transformer. Jest: the `transform` key in `--showConfig` output (`ts-jest`, `babel-jest`, `@swc/jest`, `esbuild-jest`). Vitest uses esbuild through Vite by default.
2. Record the environment per file. Jest: global `testEnvironment` plus any docblock `@jest-environment` at the top of files (`grep -rln "@jest-environment" src`). Vitest: `environment` in config plus `// @vitest-environment` comments and `environmentMatchGlobs` if present.
3. Find files that run under `jsdom` or `happy-dom` but never touch the DOM: files with no `render(`, `document.`, `window.`, `screen.`, `@testing-library/react|vue|svelte` import. These are candidates for `node` environment through a per-file docblock (`/** @jest-environment node */` or `// @vitest-environment node`). jsdom setup is paid per file.
4. For `ts-jest`, check type-checking: if `isolatedModules` is not set (or diagnostics are on), every file is type-checked during transform. The candidate change is `@swc/jest` or ts-jest's transpile-only mode; check the ts-jest docs for the exact option name in your installed version (`npm ls ts-jest`). Type checking then moves to a separate `tsc --noEmit` CI step so no check is lost.
5. Measure one candidate on one heavy file before recording it: run that file alone with the current config (`npx jest <file>`) and with an override config passed by `--config <scratch config outside src>`, three times each, record wall times.

### Output
Transformer, environment map, measured candidates.

### Quality Gate
- Each candidate shows three before and three after wall times for the same file.
- Each "node environment" candidate lists the grep that returned no DOM usage.

---

## Phase 3: Setup Files and Module Graph

### Entry Criteria
- Phase 2 complete.

### Actions
1. List setup files. Jest config keys: `setupFiles`, `setupFilesAfterEnv`, `globalSetup`. Vitest config keys: `setupFiles`, `globalSetup`. `setupFiles` and `setupFilesAfterEnv` run once per test file; `globalSetup` runs once per run. Do not invent other key names; check the runner's configuration docs.
2. Time a setup file: create an empty test file outside `src` in a scratch folder, run it alone, and record wall time; compare with the same empty file run with setup files removed by an override config. The difference is the per-file setup cost; multiply by the file count.
3. Record heap per heavy file with Jest `npx jest <file> --logHeapUsage` (prints `(NNN MB heap size)` per file). Heap grows with the number of modules the file imports, so a heavy file with high heap and a short test body points at its import graph.
4. Barrel imports (`import { x } from '../index'` that re-export a whole package) pull large graphs. Record barrel imports found in heavy files: `grep -n "from '\.\./index'\|from '\./index'\|from '@/'" <file>`.
5. Delete every scratch file; confirm `git status --porcelain` is clean.

### Output
`node_setup_cost`.

### Quality Gate
- Setup cost per file is a measured difference of two recorded wall times.
- `git status --porcelain` prints nothing.

---

## Worked Example

Illustrative. Jest 29.7, `ts-jest`, `testEnvironment: jsdom`, 188 files.

- Phase 1: `--no-cache` run `real 3m02s`; warm run `real 1m41s`.
- Phase 2: 121 of 188 files have no DOM usage by grep. `src/api/client.test.ts` alone: jsdom `4.9s, 5.0s, 4.8s`; with `/** @jest-environment node */` through a scratch config `3.1s, 3.0s, 3.2s`. Swapping `ts-jest` for `@swc/jest` on the same file: `1.4s, 1.5s, 1.4s`.
- Phase 3: `setupFilesAfterEnv` loads `src/test/setup.ts`, which imports the full i18n bundle; an empty test costs `0.9s` with it and `0.2s` without, about 132 s across 188 files of serial work.

---

## Exit Criteria

DONE when `node_setup_cost` records cold and warm times, transformer and environment facts, setup file cost, and each candidate config change with measured before and after times.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `--no-cache` run fails but warm run passes | **Return**: report a stale-cache dependency as a defect; do not keep relying on the cache. |
| Phase 2 | A file marked node-environment candidate fails under `node` | **Adjust**: remove it from the candidate list; it uses a DOM global indirectly. |
| Phase 2 | `@swc/jest` not installed | **Adjust**: measure in a scratch copy of the repo after `npm i -D @swc/jest @swc/core`; do not commit the dependency in this flow. |
| Phase 3 | Override config cannot drop a setup file because tests depend on it | **Adjust**: record setup cost as unmeasured and the reason. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
