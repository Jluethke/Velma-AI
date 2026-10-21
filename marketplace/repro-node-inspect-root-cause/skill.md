# Node.js Root Cause with node --inspect

**One-line description:** Runs the red test under the V8 inspector (`node --inspect-brk` with Chrome DevTools or VS Code, or the terminal `node inspect` client), with source maps for TypeScript and in-band test execution, and uses breakpoints, pause-on-exceptions and the async call stack to find the line where state first goes wrong.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `regression_test` (object, required): Output of `repro-red-test-gate`.
- `repo_path` (string, required): Absolute path to the local clone.

---

## Outputs

- `node_debug_trace` (object): Inspector transcript or copied call stack and scope values, the origin line, and the one-sentence defect statement. Empty when `stack` is not node.

---

## Phase 1: Start the Test Under the Inspector

### Entry Criteria
- `regression_test` is red.

### Actions
1. Force a single process so the debugger attaches to the code that runs the test:

| Runner | Command |
|---|---|
| Jest | `node --inspect-brk node_modules/.bin/jest --runInBand <file> -t "<name>"` (on Windows use `node_modules/jest/bin/jest.js`) |
| Vitest | `npx vitest run <file> -t "<name>" --inspect-brk --no-file-parallelism` (Vitest 1.x+; older versions use `--pool threads --poolOptions.threads.singleThread`; check `npx vitest --help`) |
| Mocha | `npx mocha --inspect-brk <file> --grep "<name>"` |
| node:test | `node --inspect-brk --test --test-concurrency=1 --test-name-pattern="<name>" <file>` |

2. The process prints `Debugger listening on ws://127.0.0.1:9229/<uuid>` and waits.
3. Attach with one of:
   - Chrome: open `chrome://inspect`, click "inspect" under Remote Target.
   - VS Code: run "Debug: Attach to Node Process", or a `launch.json` entry `{"type": "node", "request": "attach", "port": 9229, "skipFiles": ["<node_internals>/**", "**/node_modules/**"]}`.
   - Terminal only: `node inspect 127.0.0.1:9229`; commands `c` (continue), `n` (next), `s` (step in), `o` (step out), `bt` (backtrace), `exec <expr>`, `repl`, `setBreakpoint('file.js', line)` or `sb('file.js', line)`, `breakOnException`.
4. For TypeScript, confirm source maps: compiled output must have `//# sourceMappingURL=` or the transform (ts-jest, Vitest, `tsx`) must produce inline maps. If breakpoints appear in compiled JS only, set them in the JS file or enable `"sourceMap": true` in `tsconfig.json` for the debug run (do not commit that change).

### Output
Paused debugger attached to the test process.

### Quality Gate
- The console shows `Debugger attached.` after `Debugger listening on ws://...`.

---

## Phase 2: Pause at the Failure

### Entry Criteria
- Debugger attached.

### Actions
1. Enable pause on exceptions: Chrome DevTools Sources panel "Pause on uncaught exceptions" (and "caught" when the code catches and rethrows); VS Code Breakpoints pane "Uncaught Exceptions"; terminal `breakOnException`.
2. Continue. When paused, copy the Call Stack pane as text. Turn on "Async" stack traces (on by default in DevTools) so frames before an `await` show under "async" separators.
3. In the Scope pane, record Local and Closure values for every variable on the failing line. In the terminal client use `exec <var>` or `repl`, then `JSON.stringify(x, null, 2)` for objects.
4. For wrong-value bugs (no exception), set a breakpoint on the `expect` or `assert` line in the test and step into the call under test.

### Output
Paused frame and scope values.

### Quality Gate
- Call stack text and the value of each variable on the failing line are pasted.

---

## Phase 3: Walk Back to the Origin

### Entry Criteria
- Failure frame captured.

### Actions
1. Click (or `bt` then step out with `o`) through caller frames until the frame where an argument first holds the bad value.
2. Set a conditional breakpoint where that value is created (DevTools: right-click the line number, "Add conditional breakpoint"; VS Code: "Add Conditional Breakpoint"). Use logpoints ("Add logpoint", prints without stopping) to trace a value through many calls without editing code.
3. Restart the run and stop at the conditional breakpoint; step with `n` / `s` until the line that produces the bad value.
4. Common Node origins to check at that line:

| Pattern | What to check |
|---|---|
| `undefined` property read | Destructuring default missing; optional field absent in config; `await` forgotten so a Promise was used as a value |
| Wrong number | String concatenation (`"1" + 1`), `parseInt` without radix, floating point from JSON |
| Wrong date | `new Date("YYYY-MM-DD")` parses as UTC, `new Date(y, m, d)` as local time; months are zero-based |
| Order bug | `Array.prototype.sort` without comparator sorts as strings |
| Event ordering | `setImmediate` versus `process.nextTick` versus promise microtasks |

5. Write the one-sentence defect: "At <file>:<line>, <expr> evaluates to <value> because <cause>."

### Output
`node_debug_trace`.

### Quality Gate
- The defect sentence cites a file and line that appears in the copied call stack or a stepped frame.

---

## Worked Example

Illustrative only.

```
$ node --inspect-brk node_modules/.bin/jest --runInBand src/config/load.test.ts -t "defaults port"
Debugger listening on ws://127.0.0.1:9229/1f0e...
Debugger attached.
```

DevTools pauses on `TypeError: Cannot read properties of undefined (reading 'port')` at `load.ts:42`. Scope: `svc.listen = { host: "::" }`, `defaults = undefined`. Caller frame `normalizeServices` at `load.ts:30` shows `const { defaults } = cfg.listen ?? {}`; `cfg.listen` is undefined at top level, so `defaults` is undefined. Defect: "At load.ts:42, `defaults.port` is read when no top-level `listen` block exists, because the default object is only built when the top-level block is present."

---

## Exit Criteria

DONE when `node_debug_trace` contains the copied call stack, scope values at the origin line, and a defect sentence tied to that line.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Breakpoints never hit | **Adjust**: the test ran in a worker; add `--runInBand` (Jest) or single-thread flags (Vitest); confirm with `process.pid` logs. |
| Phase 1 | Port 9229 in use | **Adjust**: `--inspect-brk=9230` and attach to that port. |
| Phase 2 | Exception is caught and converted by a framework | **Adjust**: enable "Pause on caught exceptions" and add `skipFiles` for `node_modules` to avoid stopping in library internals. |
| Phase 3 | Weak model edits source to add `console.log` and forgets to remove it | **Adjust**: use logpoints instead; if a log was added, `git diff` must be empty before leaving this flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
