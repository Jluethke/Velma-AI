# Jest Test Isolation Fix

**One-line description:** Removes state shared between Jest tests by fixing the leak at its source with the right mock-reset config key (`clearMocks`, `resetMocks`, `restoreMocks`), `jest.resetModules` or `jest.isolateModules` for module state, env and DOM restore in `afterEach`, and `JEST_WORKER_ID`-scoped databases, ports and files for cross-worker collisions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_cause_evidence` (object, required): Polluter and mechanism from `node_order_report`, or worker-collision evidence.
- `flake_class` (string, required): `shared_state`, `test_order` or `parallel_collision`.
- `baseline_command` (string, required): Reproduction command.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `node_isolation_fix_diff` (string): Unified diff with a note per hunk.

---

## Phase 1: Read The Current Isolation Config

### Entry Criteria
- `flake_class` matches. Otherwise return an empty diff.

### Actions
1. Print the effective config: `npx jest --showConfig > flk-config.json`. Read `clearMocks`, `resetMocks`, `restoreMocks`, `resetModules`, `testEnvironment`, `setupFiles`, `setupFilesAfterEnv`, `globalSetup`, `globalTeardown`, `maxWorkers`.
2. Know what each key does:

| Key | Before each test it... |
|---|---|
| `clearMocks: true` | Clears `mock.calls`, `mock.instances`, `mock.results`; keeps implementations |
| `resetMocks: true` | Also removes mock implementations and return values (mocks return `undefined`) |
| `restoreMocks: true` | Restores originals of `jest.spyOn` spies (and, from Jest 30, behavior changed further; check the docs for your version) |
| `resetModules: true` | Gives each test a fresh module registry, so module-level state is re-created on `require` |

3. Name the leaked state from `root_cause_evidence.mechanism_hint`, or for `parallel_collision`, the shared external resource (fixed port, database, file path, Redis key).
4. Delete `flk-config.json` after reading.

### Output
Current config facts and the leaked state.

### Quality Gate
- The four mock and module keys are recorded with their effective values from `--showConfig`.

---

## Phase 2: Fix At The Source

### Entry Criteria
- Leaked state named.

### Actions
1. Apply one row, rerun `baseline_command` once, then continue:

| Leaked state | Fix |
|---|---|
| `jest.spyOn` not restored | Prefer `mockRestore()` in the polluter's `afterEach`; set `restoreMocks: true` in config only if the suite already passes with it on (run the whole suite once to check) |
| `mockReturnValue` set in one test, relied on in another | Set it in `beforeEach` of the tests that need it; do not rely on leftover implementations |
| Module-level `let` or cache in product module | `jest.isolateModules(() => { mod = require('./mod') })` in the tests that need a fresh copy, or add a reset export in product code |
| `process.env.X =` | Save `const saved = { ...process.env }` in `beforeEach`, restore `process.env = saved` in `afterEach` |
| DOM leftovers (jsdom) | Testing Library's `cleanup` runs automatically when `afterEach` is a global; if `injectGlobals` is false, call `cleanup()` in `afterEach`; reset `document.body.innerHTML = ''` for manual DOM |
| Fake timers left on | `afterEach(() => jest.useRealTimers())` in the file that enabled them |
| Shared database across worker processes | Database or schema name with `process.env.JEST_WORKER_ID` (values `1`, `2`, ...) created in `globalSetup` or per file |
| Fixed port | Listen on port 0 and read `server.address().port` |
| Fixed temp file | `fs.mkdtempSync(path.join(os.tmpdir(), 'x-'))` per test, removed in `afterEach` |

2. Do NOT set `--runInBand` or `maxWorkers: 1` in CI to hide a cross-worker collision. Do NOT flip `resetMocks: true` globally without running the whole suite: it removes implementations other tests set in `jest.mock` factories and can break unrelated files.
3. Do NOT move tests between files to dodge the polluter.

### Output
Edited tests, setup files or config.

### Quality Gate
- `baseline_command` passes once.
- If a config key changed, the whole suite passes once: `npx jest --ci`.

---

## Phase 3: Randomize And Diff

### Entry Criteria
- Fix applied.

### Actions
1. Run the affected file under several new seeds: `npx jest <file> --ci --randomize --seed=<n>` for three seeds not used before (Jest 29.2+).
2. For collisions, run the CI selection with the CI worker count: `npx jest --ci --maxWorkers=<CI value>`.
3. `git -C <repo_path> diff > flk-node-iso.diff`; copy into `node_isolation_fix_diff`; delete it.

### Output
`node_isolation_fix_diff`.

### Quality Gate
- Each seed run reports zero failed tests, seeds recorded.
- `git diff --stat` lists only files tied to the leaked state.

---

## Worked Example

Illustrative. Polluter `Cart caches totals` calls `jest.spyOn(pricing, 'discountFor').mockReturnValue(0.1)`; `restoreMocks` is false.

- Phase 1: `--showConfig` shows `clearMocks: false`, `resetMocks: false`, `restoreMocks: false`, `resetModules: false`.
- Phase 2: polluter now keeps the spy in a `const` and calls `spy.mockRestore()` in `afterEach`. Two-test run passes.
- Phase 3: seeds 501, 502, 503 each print `Tests: 12 passed, 12 total`. Diff: 1 file, 4 insertions, 1 deletion.

---

## Exit Criteria

DONE when the leaked state is reset at its source, three new seeds and the CI worker count pass, and the diff touches only related files.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `flake_class` not matched | **Return**: empty diff. |
| Phase 2 | Global config change breaks other files | **Adjust**: revert the config key and fix in the polluter file only. |
| Phase 2 | ESM project where `jest.isolateModules` does not apply | **Adjust**: use `jest.isolateModulesAsync` or `jest.unstable_mockModule` per the Jest ESM docs for your version. |
| Phase 3 | A new seed fails | **Return**: to `flk-node-jest-order-detect` with that seed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
