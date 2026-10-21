# SDK Node Timeouts

**One-line description:** Adds a per-request deadline to a TypeScript SDK built on Node's global fetch (undici) with `AbortSignal.timeout` combined with the caller's signal through `AbortSignal.any`, distinguishes `TimeoutError` from caller `AbortError`, and proves both with a slow local server.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): SDK repository root.
- `timeout_budget` (object, required): User-supplied per-request timeout in milliseconds, and optionally an overall deadline across retries. This flow does not choose the values.

---

## Outputs

- `node_timeout_config` (object): Node version floor, where the signal is created, how caller signals are combined, the error mapping, and test results.

---

## Phase 1: Check the Runtime

### Entry Criteria
- `timeout_budget` has a per-request value.

### Actions
1. Read `engines.node` in `package.json`. Record the floor.
2. Record what exists at that floor:

| API | Available from |
|---|---|
| Global `fetch` (undici) | Node 18 |
| `AbortSignal.timeout(ms)` | Node 17.3 / 16.14 |
| `AbortSignal.any([...])` | Node 20.3 |

   If the floor is below 20.3, combine signals manually (Phase 2 Action 3).
3. Know the default: Node's fetch has no overall request timeout. undici's dispatcher has `headersTimeout` and `bodyTimeout` defaults (300 seconds each in current undici; confirm in the undici docs for the bundled version with `node -p process.versions.undici`). These are far longer than most callers expect.

### Output
Runtime facts.

### Quality Gate
- `engines.node` floor and `process.versions.undici` value are recorded.

---

## Phase 2: Implement the Deadline

### Entry Criteria
- Runtime facts recorded.

### Actions
1. In the shared request function, create the signal per attempt:
   ```ts
   const timeoutSignal = AbortSignal.timeout(opts.timeoutMs ?? this.defaultTimeoutMs);
   const signal = opts.signal ? AbortSignal.any([opts.signal, timeoutSignal]) : timeoutSignal;
   const res = await fetch(url, { ...init, signal });
   ```
   Create a new timeout signal for EACH retry attempt; reusing one makes later attempts start already aborted.
2. Body reads are covered: the same signal aborts `res.json()` if the body stalls, as long as the body is read before the signal fires.
3. Below Node 20.3: create an `AbortController`, call `controller.abort(reason)` from both a `setTimeout` and the caller signal's `abort` event, and `clearTimeout` in a `finally` block so the timer does not keep the process alive.
4. Map errors by name:

| Thrown | `err.name` | SDK error |
|---|---|---|
| Our timeout fired | `TimeoutError` (DOMException) | `APITimeoutError` |
| Caller aborted | `AbortError` | `APIUserAbortError` (rethrow; never retry) |
| DNS or connect failure | `TypeError` with `cause.code` such as `ECONNREFUSED` or `ENOTFOUND` | `APIConnectionError` |

   Pass the original as `{ cause: err }` to the SDK error constructor.
5. Overall deadline (optional): create one `AbortSignal.timeout(totalMs)` before the retry loop and include it in every attempt's `AbortSignal.any` list.
6. Do NOT use `Promise.race` with a timer as the only mechanism; it leaves the request running and the socket open.

### Output
Deadline implementation.

### Quality Gate
- `npx tsc --noEmit` exits 0.
- `grep -n "AbortSignal.timeout" src/` shows the call inside the per-attempt code path.

---

## Phase 3: Test

### Entry Criteria
- Implementation compiles.

### Actions
1. Start a local server in the test with `node:http` `createServer` that writes headers only after a delay longer than the test timeout (use small values such as 100 ms timeout, 500 ms delay). msw can delay responses too (`await delay(500)`), but a real server proves the socket behavior.
2. Test timeout: assert the rejection is `APITimeoutError` and elapsed time is below the delay.
3. Test caller abort: pass a controller's signal, abort it after 20 ms, assert `APIUserAbortError` and that no retry happened.
4. Test fresh signal per retry: first attempt times out, second responds fast; assert success and two server hits.
5. Run `npx vitest run src/transport/timeouts.test.ts`.

### Output
`node_timeout_config`.

### Quality Gate
- All four tests pass.
- Mutation check: move `AbortSignal.timeout` outside the retry loop; Test 4 must fail; restore.

---

## Worked Example

Illustrative only. `engines.node = ">=20.3"`, `timeout_budget = { per_request_ms: 30000 }`.

```
$ node -p process.versions.undici
6.x.y
$ npx vitest run src/transport/timeouts.test.ts
 ✓ times out slow server with APITimeoutError
 ✓ caller abort is not retried
 ✓ creates a fresh signal per retry attempt
 ✓ maps ECONNREFUSED to APIConnectionError
 Tests  4 passed (4)
```

---

## Exit Criteria

DONE when every attempt has its own timeout signal combined with the caller's signal, timeout and abort map to distinct SDK errors, and tests prove timeout, abort and per-retry behavior.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Node floor below 18 | **Stop**: global fetch is missing; raise the floor or use undici explicitly, by user decision. |
| Phase 2 | Error name is `AbortError` for timeouts | **Adjust**: some code paths call `controller.abort()` without a reason; pass `new DOMException("timeout", "TimeoutError")` as the reason. |
| Phase 3 | Test leaves an open handle | **Adjust**: close the test server in `afterEach` and clear timers in `finally`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
