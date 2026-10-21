# Node.js Unhandled Rejection and Floating Promise Sweep

**One-line description:** Makes every unhandled promise rejection fatal and traceable with `--unhandled-rejections=strict` and `--trace-warnings`, finds floating promises, async callbacks passed to `forEach` and async Promise executors with type-aware typescript-eslint rules, and maps each to the line that drops the promise.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the project root (holding `package.json`).
- `stress_command` (string, required): From `race-stress-harness`; a Jest, Vitest, Mocha or `node --test` command.

---

## Outputs

- `node_rejection_findings` (object[]): One row per finding: `location` (file:line), `pattern` (from the pattern table), `evidence` (runtime error text or lint line), `rule` (lint rule id, when found by lint), `fix_direction`.

---

## Phase 1: Make Rejections Loud at Runtime

### Entry Criteria
- `node --version` prints a version.

### Actions
1. Record the Node version. Since Node 15 the default `--unhandled-rejections` mode is `throw`: an unhandled rejection is raised as an uncaught exception unless an `unhandledRejection` handler exists. Check `node --help | grep unhandled-rejections` for the modes on your version (`throw`, `strict`, `warn`, `none`, `warn-with-error-code`).
2. Run the harness with strict mode and warning traces:
   `NODE_OPTIONS="--unhandled-rejections=strict --trace-warnings" <stress_command> > /tmp/node_rej.txt 2>&1`
   `strict` raises the rejection as an uncaught exception even if an `unhandledRejection` handler is registered, so a handler that only logs cannot hide it.
3. Check for existing global handlers that hide failures: `rg -n "process\.on\(['\"](unhandledRejection|uncaughtException)" "<repo_path>" --glob '!node_modules'`. A handler that logs and continues turns a crash into silent data loss; record it as a finding.
4. For Jest, also run once with `--detectOpenHandles`; it reports handles (timers, sockets) still open after the tests, a sign of a promise chain nobody awaited. Jest prints `Jest did not exit one second after the test run has completed` when this happens without the flag.

### Output
Saved runtime output and the handler list.

### Quality Gate
- The saved command line contains `--unhandled-rejections=strict`.
- `/tmp/node_rej.txt` contains the test runner's summary line.

---

## Phase 2: Lint for Dropped Promises

### Entry Criteria
- The project has ESLint or can add it as a dev dependency.

### Actions
1. For TypeScript projects, enable these real typescript-eslint rules (type-aware; they need `parserOptions.projectService: true` or `parserOptions.project` in the ESLint config):
   - `@typescript-eslint/no-floating-promises`: a promise-valued statement neither awaited, returned, nor given `.catch` or `.then` with a rejection handler.
   - `@typescript-eslint/no-misused-promises`: a promise passed where a void callback is expected (for example `array.forEach(async x => ...)`, `if (promise)`, event handlers).
   - `@typescript-eslint/await-thenable`: `await` on a non-promise, usually a sign the author thought a sync API was async.
   - `@typescript-eslint/return-await` (check its options in the docs): returning a promise from inside `try` skips the local `catch`.
2. For plain JavaScript, use core ESLint rules: `no-async-promise-executor`, `no-promise-executor-return`, `require-await`, `no-await-in-loop` (performance, not correctness, record separately), and `eslint-plugin-promise` rules `promise/catch-or-return` and `promise/no-return-wrap` if the plugin is installed.
3. Run lint with only these rules over the source, not over `node_modules`: `npx eslint "src/**/*.{ts,tsx,js,mjs,cjs}" --rule '{"@typescript-eslint/no-floating-promises":"error"}' -f unix > /tmp/eslint_promises.txt` (repeat or combine `--rule` for each rule; check `npx eslint --help` for `--rule` syntax on your ESLint version, as flat config changes some flags).
4. Do not add `// eslint-disable` comments or `void promise` to silence a finding unless the call is deliberately fire-and-forget AND has its own `.catch`; record each such case.

### Output
Saved lint output.

### Quality Gate
- `/tmp/eslint_promises.txt` exists; if ESLint could not load type information, the run printed an error that is recorded instead.
- The rule list used is written down.

---

## Phase 3: Map to Lines and Patterns

### Entry Criteria
- Runtime and lint outputs saved.

### Actions
1. Read runtime failures. Node prints the rejection reason's stack; with `--trace-warnings` warnings include a stack. Record the first in-repo frame. An error with code `ERR_UNHANDLED_REJECTION` means the rejection reason was not an `Error`; find who rejected with a plain value.
2. Classify each finding:

| Pattern | Example | Fix direction |
|---|---|---|
| Floating promise | `saveAudit(evt);` in an async handler | `await saveAudit(evt);` or attach `.catch(err => log(err))` deliberately |
| Async callback in `forEach` / `map` without awaiting | `items.forEach(async i => await save(i));` then code assumes all saved | `for (const i of items) await save(i);` or `await Promise.all(items.map(save))` |
| Async Promise executor | `new Promise(async (resolve, reject) => {...})` | Remove the wrapper; make the function `async` and `await` inside |
| Late handler | Promise created, `.catch` attached after an `await` | Attach handling where the promise is created, or await it in order; Node emits `PromiseRejectionHandledWarning` for this |
| Swallowing global handler | `process.on('unhandledRejection', console.error)` | Remove or make it exit with non-zero code after logging |
| Event emitter with async listener | `emitter.on('data', async d => ...)` rejecting | Wrap the body in try/catch, or use `captureRejections` (check the `events` docs for your Node version) |

3. Deduplicate runtime and lint findings for the same line.

### Output
`node_rejection_findings`.

### Quality Gate
- Every row has an in-repo file:line and an `evidence` line copied from `/tmp/node_rej.txt` or `/tmp/eslint_promises.txt`.
- Every row names one table pattern.

---

## Worked Example

Illustrative only.

Phase 1: `NODE_OPTIONS="--unhandled-rejections=strict --trace-warnings" npx jest test/orders.stress.test.ts` fails with:
```
Error: insert into audit failed: connection terminated
    at AuditRepo.save (src/audit/repo.ts:22:11)
    at OrderService.place (src/orders/service.ts:48:5)
```
Line 48 of `service.ts`: `this.audit.save(order);` with no `await`.

Phase 2: `@typescript-eslint/no-floating-promises` reports `src/orders/service.ts:48:5: Promises must be awaited, end with a call to .catch, ...` and `@typescript-eslint/no-misused-promises` reports `src/orders/batch.ts:15:19` on `orders.forEach(async o => ...)`.

Phase 3: two rows: floating promise at `service.ts:48`; async callback in forEach at `batch.ts:15`.

---

## Exit Criteria

DONE when the harness ran with strict rejection mode, the promise lint rules ran over the source, and every finding is a row with a location, evidence and pattern.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Node older than 15 | **Adjust**: the default is warn; `--unhandled-rejections=strict` still works on Node 12 and later per the CLI docs; record the version. |
| Phase 2 | Type-aware rules fail with `parserOptions.project` errors | **Adjust**: add `projectService: true` (typescript-eslint v8) or point `project` at the `tsconfig.json`; do not drop the rule. |
| Phase 2 | JavaScript project without TypeScript | **Adjust**: use the core and `eslint-plugin-promise` rules; record that floating-promise detection is weaker without types. |
| Phase 3 | Stack shows only `node:internal` frames | **Retry**: rerun with `--async-stack-traces` (on by default in modern Node) and `Error.stackTraceLimit = Infinity` set in a test setup file. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
