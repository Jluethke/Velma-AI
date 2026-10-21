# Node Characterization Tests with Jest or Vitest Snapshots

**One-line description:** Pins the current behavior of the TypeScript or JavaScript code you are about to refactor with Jest or Vitest snapshot tests, freezes clocks and randomness, and proves with V8 or Istanbul branch coverage that the new tests execute every line and branch of the target.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root containing `package.json`.
- `target_paths` (string[], required): Files or exported functions to refactor, for example `["src/pricing/quote.ts#buildQuote"]`.
- `test_command` (string, required): Full suite command, for example `npx jest --ci` or `npx vitest run`.
- `baseline_commit` (string, required): SHA from `srf-baseline-green-check`.

---

## Outputs

- `characterization_tests` (object): Test file paths, snapshot file paths, the command that runs only them, and their pass count.
- `target_coverage` (object): Per target file: statement, branch, function and line percentages plus uncovered line numbers from the coverage text report.

---

## Phase 1: Choose Runner and Controls

### Entry Criteria
- `git rev-parse HEAD` equals `baseline_commit` or descends from it with no source changes.

### Actions
1. Identify the runner: open `package.json`. Use this table.

| Evidence | Runner | Snapshot update flag | Fake clock |
|---|---|---|---|
| `jest` in devDependencies or `jest.config.*` exists | Jest | `npx jest -u <path>` | `jest.useFakeTimers(); jest.setSystemTime(new Date("2024-01-01T00:00:00Z"))` |
| `vitest` in devDependencies or `vitest.config.*` exists | Vitest | `npx vitest run -u <path>` | `vi.useFakeTimers(); vi.setSystemTime(new Date("2024-01-01T00:00:00Z"))` |
| Both | Use the one `test_command` calls | | |
| Neither | Stop. Ask the user; do not install a runner in this flow. | | |

2. List each target's observable effects: return value, thrown error class and message, mutated arguments, emitted events, calls to injected collaborators.
3. Find real call shapes: `git grep -n "buildQuote(" -- "*.ts" "*.tsx" "*.js"`. Collect 3 or more argument sets.
4. Controls for non-determinism: `Math.random` with `jest.spyOn(Math, "random").mockReturnValue(0.42)` (Vitest: `vi.spyOn`); `crypto.randomUUID` the same way; `process.env` by saving and restoring in `beforeEach`/`afterEach`; `Date.now()` by the fake clock in the table.
5. Do NOT change the target source in this flow. A wrong-looking output is recorded as it is.

### Output
Runner choice, behavior inventory and controls.

### Quality Gate
- The runner is confirmed by a file you opened, not guessed.
- Every non-deterministic source has a listed control or is reported as an open question.

---

## Phase 2: Write and Record Snapshots

### Entry Criteria
- Phase 1 complete.

### Actions
1. Create `src/pricing/__characterization__/quote.characterization.test.ts` (match the project's test file glob; check `testMatch` in Jest config or `include` in Vitest config).
2. Write table-driven tests. Capture thrown errors as data so failures are pinned too:
```ts
import { buildQuote } from "../quote";

const cases: Record<string, Parameters<typeof buildQuote>> = {
  minimal: [{ sku: "A1", qty: 1 }],
  bulk: [{ sku: "A1", qty: 500 }],
  unknownSku: [{ sku: "ZZ", qty: 1 }],
};

describe("buildQuote characterization", () => {
  beforeEach(() => { jest.useFakeTimers(); jest.setSystemTime(new Date("2024-01-01T00:00:00Z")); });
  afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

  test.each(Object.keys(cases).sort())("%s", (name) => {
    let out: unknown;
    try { out = buildQuote(...cases[name]); }
    catch (e) { out = { threw: (e as Error).constructor.name, message: (e as Error).message }; }
    expect(out).toMatchSnapshot();
  });
});
```
3. Record once: Jest `npx jest -u src/pricing/__characterization__`; Vitest `npx vitest run -u src/pricing/__characterization__`. Snapshots land in `__snapshots__/quote.characterization.test.ts.snap`.
4. Open the `.snap` file and read it. Any ISO timestamp that is not `2024-01-01`, any random-looking id, or any `[Function anonymous]` that hides behavior means a control is missing: return to Phase 1 step 4.
5. Run without update. Jest: `npx jest --ci src/pricing/__characterization__` (`--ci` makes a missing snapshot fail instead of being written). Vitest: `npx vitest run src/pricing/__characterization__`. Run it twice.
6. Do NOT use `toMatchInlineSnapshot` for large objects; it rewrites the test file and makes review harder.

### Output
Characterization test file and `.snap` file.

### Quality Gate
- The no-update command exits 0 twice.
- Jest summary shows `Snapshots: N passed, N total` with no `written`, `updated` or `obsolete`.
- `git status --porcelain` after the second run shows only the new test and snapshot files as untracked, nothing modified.

---

## Phase 3: Prove Coverage and Commit

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Run with coverage scoped to the target:
   Jest: `npx jest --ci --coverage --collectCoverageFrom="src/pricing/quote.ts" src/pricing/__characterization__`
   Vitest (needs `@vitest/coverage-v8`): `npx vitest run --coverage --coverage.include=src/pricing/quote.ts src/pricing/__characterization__`
2. Read the text table: columns `% Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s`.
3. For each uncovered line inside a target function, add a case that reaches it, rerun Phase 2 steps 3 to 5 and this phase.
4. Mutation check: flip one condition in the target, run the no-update command, confirm a snapshot mismatch, then `git checkout -- src/pricing/quote.ts`.
5. Commit only test files: `git add src/pricing/__characterization__ && git commit -m "test: characterize buildQuote before refactor"`.

### Output
`characterization_tests`, `target_coverage`.

### Quality Gate
- `Uncovered Line #s` lists no line inside a target function, or each one is recorded as `unreachable_candidate`.
- The step 4 mutation produced a failing snapshot.
- `git show --stat HEAD` lists only test and `.snap` files.

---

## Worked Example

Illustrative only. Jest project, target `src/pricing/quote.ts#buildQuote`.
```
$ npx jest -u src/pricing/__characterization__
 PASS  src/pricing/__characterization__/quote.characterization.test.ts
Snapshots:   3 written, 3 total
$ npx jest --ci --coverage --collectCoverageFrom="src/pricing/quote.ts" src/pricing/__characterization__
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
quote.ts  |   88.46 |    75    |   100   |  88.46  | 41-43
```
Lines 41 to 43 apply a discount above a quantity tier. Case `tier2: [{ sku: "A1", qty: 1000 }]` added; rerun shows no uncovered lines. Flipping `qty >= 500` to `qty > 500` fails the `bulk` snapshot. Restored and committed.

---

## Exit Criteria

DONE when snapshot tests pass twice with `--ci` or no update flag, cover every target line, catch a deliberate mutation, and are committed alone.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | ESM project and `jest.spyOn` cannot replace an import | **Adjust**: use `jest.unstable_mockModule` (Jest ESM) or `vi.mock` (Vitest), checked against the runner docs. |
| Phase 2 | Snapshot written in CI mode fails with "new snapshot was not written" | **Retry**: record locally with `-u` first, then rerun with `--ci`. |
| Phase 2 | Snapshot differs between runs | **Retry**: add the missing clock, random or env control. |
| Phase 3 | Coverage provider missing | **Return**: report the missing package (`@vitest/coverage-v8`); ask before installing. |
| Phase 3 | Mutation not caught | **Retry**: add a case on the mutated boundary. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
