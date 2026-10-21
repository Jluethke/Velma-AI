# Jest Open Handles Fix

**One-line description:** Finds servers, sockets, timers, database pools and child processes that Jest tests leave open, using `--detectOpenHandles` and the worker force-exit warning, closes each in `afterAll` or `afterEach`, and removes `--forceExit` so new leaks fail visibly.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_cause_evidence` (object, required): Leak markers such as `Jest did not exit one second after the test run has completed.` or `A worker process has failed to exit gracefully and has been force exited`.
- `flake_class` (string, required): Must be `resource_leak`.
- `baseline_command` (string, required): Reproduction.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `node_leak_fix_diff` (string): Unified diff with a note per hunk naming the handle now closed.

---

## Phase 1: List The Open Handles

### Entry Criteria
- `flake_class` is `resource_leak`. Otherwise return an empty diff.

### Actions
1. Run the affected files in band with handle detection:
   `npx jest <files> --runInBand --detectOpenHandles --ci`
   Jest then prints `Jest has detected the following <n> open handle(s) potentially keeping Jest from exiting:` followed by a type (`TCPSERVERWRAP`, `TCPWRAP`, `Timeout`, `PROCESSWRAP`, `FILEHANDLE`) and the stack where it was created.
2. `--detectOpenHandles` slows runs and can miss handles in some cases. If it reports nothing but Jest still hangs, use `why-is-node-running` only if already installed, or log `process._getActiveHandles()` in a temporary `afterAll` (an undocumented Node internal; use for diagnosis only and remove it).
3. Search config and scripts for masking flags: `grep -n -E "forceExit|detectOpenHandles" package.json jest.config.* 2>/dev/null`.
4. Record each handle: type, creation file:line, owning test file.

### Output
Handle list.

### Quality Gate
- Every handle has a creation stack line copied from Jest's output.

---

## Phase 2: Close Each Handle

### Entry Criteria
- Handle list exists.

### Actions
1. One handle at a time:

| Handle | Close with |
|---|---|
| `TCPSERVERWRAP` from `app.listen()` | Keep the server: `server = app.listen(0)`; `afterAll(() => new Promise(r => server.close(r)))`. With supertest, pass `app` (not a listening server) so supertest manages the port |
| `TCPWRAP` from a DB or Redis client | `afterAll(async () => { await pool.end(); })`, `await redis.quit()`, `await mongoose.disconnect()`, `await prisma.$disconnect()` |
| `Timeout` from `setInterval` or a retry loop | `clearInterval(id)` in teardown; product code exposes a `stop()`; or call `.unref()` on timers that must not keep the process alive |
| `PROCESSWRAP` from `child_process.spawn` | `child.kill()` and await its `exit` event |
| `FILEHANDLE` | `await fh.close()` |
| Event listeners on `process` | `process.removeListener(...)` in teardown |

2. If the handle is created at import time in product code (a module that connects on load), change it to connect lazily or export a `close()` the tests call.
3. Do NOT add `--forceExit`. It kills the process after tests and hides the leak; a leaking test can still pollute later tests in the same worker. Do NOT raise `testTimeout` or add `jest.setTimeout` to cover slow teardown.

### Output
Closed handles.

### Quality Gate
- The Phase 1 command ends with no open-handle report and the process exits by itself.

---

## Phase 3: Remove Masks And Diff

### Entry Criteria
- No handles reported.

### Actions
1. If `--forceExit` was in a script or config, remove it in this change and run the full suite once: `npx jest --ci`. It must exit on its own without `Jest did not exit` or the worker force-exit message.
2. `git -C <repo_path> diff > flk-nodeleak.diff`; copy into `node_leak_fix_diff`; delete it.

### Output
`node_leak_fix_diff`.

### Quality Gate
- Full suite exits on its own; output has no `did not exit` and no `failed to exit gracefully` line.

---

## Worked Example

Illustrative. `src/api/orders.test.ts` with the warning `A worker process has failed to exit gracefully and has been force exited...`.

- Phase 1: `npx jest src/api/orders.test.ts --runInBand --detectOpenHandles --ci` reports `TCPWRAP` at `src/db/pool.ts:8 new Pool(...)` and `Timeout` at `src/cache/refresh.ts:22 setInterval(...)`.
- Phase 2: `afterAll(async () => { await pool.end(); stopRefresh(); })`; `refresh.ts` exports `stopRefresh()` calling `clearInterval`.
- Phase 3: `--forceExit` removed from `package.json` `test` script; `npx jest --ci` prints `Tests: 214 passed` and exits.

---

## Exit Criteria

DONE when no open handles are reported, `--forceExit` is gone, and the full suite exits on its own.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `flake_class` not matched | **Return**: empty diff. |
| Phase 1 | Detection reports nothing but process hangs | **Adjust**: use the diagnosis in Phase 1 action 2, then remove it. |
| Phase 2 | Library offers no close method | **Adjust**: `.unref()` its timer or socket if exposed; otherwise record the library and version as a follow-up. |
| Phase 3 | Removing `--forceExit` exposes leaks in other files | **Adjust**: list them as follow-ups and fix the ones in this change's scope; do not put `--forceExit` back. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
