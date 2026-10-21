# Node.js Failing Regression Test with Jest, Vitest or node:test

**One-line description:** Converts the minimal repro into one failing test in whichever runner the repo already uses (Jest, Vitest, Mocha or the built-in `node:test`), with correct handling of async rejections, fake timers and time zone, and confirms the red run with a single-test command.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `minimal_repro` (object, required): Output of `repro-ddmin-minimize`.
- `minimal_input` (object, required): Output of `repro-ddmin-minimize`.
- `repo_path` (string, required): Absolute path to the local clone.

---

## Outputs

- `node_regression_test` (object): Test file path, test name, full source, the single-test run command, and the red run output. Empty when `stack` is not node.

---

## Phase 1: Identify the Runner

### Entry Criteria
- `node --version` prints a version matching `env_snapshot`.

### Actions
1. Read `package.json` `scripts.test` and `devDependencies`. Identify the runner with this table:

| Evidence | Runner | Single-test command |
|---|---|---|
| `jest` in devDependencies or `jest.config.*` | Jest | `npx jest <file> -t "<test name>"` |
| `vitest` in devDependencies or `vitest.config.*` | Vitest | `npx vitest run <file> -t "<test name>"` |
| `mocha` in devDependencies or `.mocharc.*` | Mocha | `npx mocha <file> --grep "<test name>"` |
| `node --test` in scripts, no third-party runner | node:test | `node --test --test-name-pattern="<test name>" <file>` (Node 18.17+ / 20+; confirm with `node --help`) |

2. Note ESM versus CommonJS: `"type": "module"` in `package.json`, or `.mjs` / `.cts` extensions. Match the import style of neighboring test files exactly.
3. Note TypeScript: if tests are `.test.ts`, check how they run (`ts-jest`, `babel-jest`, Vitest native, `tsx`). Copy that.
4. Find the neighboring test file: `git grep -ln "<imported module name>" -- "*.test.*" "*.spec.*" "__tests__"`.

### Output
Runner, module style, target file.

### Quality Gate
- The single-test command for the chosen runner runs an existing test in that file and prints a pass.

---

## Phase 2: Write the Test

### Entry Criteria
- Runner identified.

### Actions
1. Name the test with the behavior: `it("parses listen host without port as default port", ...)`.
2. Build the input inline when short; write files under `os.tmpdir()` with `fs.mkdtempSync(path.join(os.tmpdir(), "repro-"))` and remove them in `afterEach`.
3. Assertions by bug kind:

| Bug kind | Jest / Vitest | node:test (`import assert from "node:assert/strict"`) |
|---|---|---|
| Wrong value | `expect(result).toEqual(expected)` | `assert.deepStrictEqual(result, expected)` |
| Async function rejects wrongly | `await expect(fn()).resolves.toEqual(expected)` | `assert.deepStrictEqual(await fn(), expected)` |
| Should throw specific error | `expect(() => fn()).toThrow(/exact message/)`; async: `await expect(fn()).rejects.toThrow(/msg/)` | `assert.throws(() => fn(), /msg/)`; async: `await assert.rejects(fn(), /msg/)` |
| Time-dependent | `vi.useFakeTimers(); vi.setSystemTime(new Date("2024-03-10T09:59:59Z"))` or `jest.useFakeTimers().setSystemTime(...)` | `mock.timers.enable({ apis: ["Date"], now: ... })` (Node 20.4+; check the docs for your version) |

4. Always `await` or `return` the promise. A missing `await` makes the test finish before the rejection and pass falsely; this is the most common Node test mistake.
5. Time zone: Jest and Vitest read `process.env.TZ` at worker start. Setting it inside the test is too late for some engines' cached zone. Set it on the command line: `TZ=America/Los_Angeles npx jest <file>`, and record that in the run command, or use the repo's existing `globalSetup` if it sets `TZ`.
6. Do not use `it.skip`, `it.todo`, or `it.failing` (Jest) for the new test; the chain needs a plain red test.
7. Edit only the test file (and a fixture file if needed).

### Output
Test source.

### Quality Gate
- `git diff --stat` shows only test and fixture files.
- Every async call in the test is awaited or returned (read each line that calls an async function).

---

## Phase 3: Confirm the Red Run

### Entry Criteria
- Test written.

### Actions
1. Run the single-test command from Phase 1 (with `TZ=` prefix if needed). Add `--no-cache` for Jest the first time to avoid stale transforms.
2. Read the output: Jest/Vitest print `Tests: 1 failed` (Jest) or `Tests  1 failed` (Vitest); node:test prints `# fail 1`. Under the test name, the error must match `error_signature`, or the diff must show the wrong actual value.
3. Also confirm no other tests were matched: Jest prints `Tests: 1 failed, N skipped`; if more than one ran, tighten `-t`.
4. If the failure is `Cannot find module`, `SyntaxError: Cannot use import statement outside a module`, or `ReferenceError` from the test file itself, the test is broken, not red. Fix the import style.

### Output
`node_regression_test` with red output.

### Quality Gate
- The run output reports exactly one failed test and its message matches the reported signature.
- No `Cannot find module` or `SyntaxError` appears in the output.

---

## Worked Example

Illustrative only. Vitest, ESM, TypeScript.

```ts
it("defaults port when listen has host only", () => {
  const cfg = loadConfig({ services: [{ listen: { host: "::" } }] });
  expect(cfg.services[0].listen.port).toBe(8080);
});
```

`npx vitest run src/config/load.test.ts -t "defaults port"` prints `TypeError: Cannot read properties of undefined (reading 'port')` at `src/config/load.ts:42:31`, then `Tests  1 failed | 11 skipped`. The 8080 default is from the project's documented config reference, not invented. Red confirmed.

---

## Exit Criteria

DONE when one test in the repo's own runner fails with the reported signature and only test files changed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Two runners present (for example Jest for unit, Playwright for e2e) | **Adjust**: use the unit runner unless the bug only shows in a browser. |
| Phase 2 | Code under test reads `Date.now()` at module load | **Adjust**: enable fake timers before importing the module (dynamic `await import()` after `setSystemTime`). |
| Phase 3 | Test passes on unfixed code | **Stop**: check for a missing `await`; then compare inputs with `minimal_input`. |
| Phase 3 | Weak model wraps the call in `try/catch` and asserts nothing | **Stop**: remove the try/catch; a swallowed error is a green lie. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
