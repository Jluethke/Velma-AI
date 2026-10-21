# Node.js Client Timeouts From the Timeout Plan

**One-line description:** Applies the planned per-try and connect timeouts to every Node.js client (global fetch/undici, axios, node:http, pg, ioredis, @grpc/grpc-js, AWS SDK v3) using AbortSignal.timeout and each library's own options, and proves every timeout fires with a test against a silent TCP server.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the Node.js or TypeScript service repository.
- `timeout_plan` (object[], required): Output of `res-timeout-budget`.

---

## Outputs

- `timeout_changes` (object[]): One row per client: dependency name, file:line changed, library and version, option written (exact name and value), test name proving it fires, and the test runner output line.

---

## Phase 1: Find Calls and Their Effective Timeout

### Entry Criteria
- `node --version` prints 18 or later (global `fetch` and `AbortSignal.timeout` exist from Node 17.3 / 18).
- Baseline test run saved (for example `npm test` summary line).

### Actions
1. Run `rg -n "fetch\(|axios\.(create|get|post|request)|axios\(|http\.request\(|https\.request\(|new Pool\(|new Client\(|new Redis\(|new IORedis|makeClientConstructor|loadPackageDefinition|new [A-Z][A-Za-z]+Client\(" --type js --type ts` and open each hit.
2. Record the effective default for each, checking the docs of the pinned version:

| Library | Option | Documented default |
|---|---|---|
| global fetch (undici) | `signal: AbortSignal.timeout(ms)` | no total timeout; undici `headersTimeout` and `bodyTimeout` 300000 ms, `connect.timeout` 10000 ms |
| axios | `timeout` (ms) | 0 (none) |
| node:http request | `timeout` option | sets only a socket idle timer; emits `'timeout'` and does NOT abort the request by itself |
| pg (node-postgres) | `connectionTimeoutMillis`, `statement_timeout`, `query_timeout` | 0 (no timeout) for connection; statement and query none |
| ioredis | `connectTimeout`, `commandTimeout` | 10000 ms connect; command none |
| @grpc/grpc-js | `{ deadline: Date }` per call | none |
| AWS SDK v3 | `requestHandler: new NodeHttpHandler({ connectionTimeout, requestTimeout })` | check the `@smithy/node-http-handler` docs for the installed version |

3. Do NOT treat `http.request({ timeout })` as a request timeout. It only fires an event; the code must call `req.destroy(err)` in the `'timeout'` handler.

### Output
List of clients with file:line and effective timeout.

### Quality Gate
- Every client named in `timeout_plan` appears in the list with a file:line.
- Every `http.request` hit is marked with whether it handles `'timeout'` by destroying the request.

---

## Phase 2: Set Timeouts, One Dependency per Change

### Entry Criteria
- List exists.

### Actions
1. Change ONE dependency at a time, run the tests, then move on.
2. fetch: pass `signal: AbortSignal.timeout(perTryMs)`. To combine with the inbound request's own abort signal use `AbortSignal.any([inboundSignal, AbortSignal.timeout(perTryMs)])` (Node 20.3+). The rejection is a `DOMException` with `name === 'TimeoutError'`; an outside abort gives `name === 'AbortError'`. Handle them separately.
3. For a connect timeout with fetch, create an undici `Agent({ connect: { timeout: connectMs } })` and pass it as `dispatcher` (import from the `undici` package; the global fetch accepts a `dispatcher` option, but check the undici version matches Node's bundled one).
4. axios: `axios.create({ baseURL, timeout: perTryMs })`. Note axios `timeout` covers the response wait; for a hard total deadline also pass `signal: AbortSignal.timeout(perTryMs)`.
5. node:http: `const req = http.request(opts); req.setTimeout(perTryMs, () => req.destroy(new Error('timeout')));`.
6. pg: `new Pool({ connectionTimeoutMillis: connectMs, statement_timeout: perTryMs, query_timeout: perTryMs })`. `statement_timeout` is enforced by PostgreSQL; `query_timeout` by the client. Set both.
7. ioredis: `new Redis(url, { connectTimeout: connectMs, commandTimeout: perTryMs })`.
8. grpc-js: `client.method(req, { deadline: new Date(Date.now() + Math.min(perTryMs, remainingMs)) }, cb)`.
9. If the plan says the connect timeout is an "open question", keep the library default and record it. Do NOT invent a value.

### Output
Edited client constructors.

### Quality Gate
- `rg -n "fetch\(" --type ts --type js` hits for planned dependencies all pass a `signal` (check each line).
- Tests pass after each dependency change with no drop in test count.

---

## Phase 3: Prove the Timeouts Fire

### Entry Criteria
- Timeouts set.

### Actions
1. Add a test per dependency using a TCP server that accepts and never responds (works with `node:test`, Jest or Vitest):
   ```js
   import net from 'node:net';
   import { test } from 'node:test';
   import assert from 'node:assert/strict';
   import { buildPaymentsClient } from '../src/clients/payments.js';

   test('payments fetch times out at plan value', async (t) => {
     const sockets = [];
     const srv = net.createServer((s) => sockets.push(s)).listen(0);
     t.after(() => { sockets.forEach((s) => s.destroy()); srv.close(); });
     const client = buildPaymentsClient(`http://127.0.0.1:${srv.address().port}`);
     const start = Date.now();
     await assert.rejects(client.getHealth(), (e) => e.name === 'TimeoutError');
     assert.ok(Date.now() - start < PLAN_PER_TRY_MS + 500);
   });
   ```
2. Use the real factory from `src`. Do NOT create a fresh client in the test with the value typed again.
3. Expected errors: fetch `TimeoutError`; axios error `code === 'ECONNABORTED'` (or `'ETIMEDOUT'` when `transitional.clarifyTimeoutError` is true); pg `Error: Query read timeout` for `query_timeout` and SQLSTATE `57014` for `statement_timeout` (test with `SELECT pg_sleep(n)`); ioredis `Command timed out`; grpc-js `code === status.DEADLINE_EXCEEDED`.
4. Run the timeout tests (for example `node --test --test-name-pattern=timeout` or `npx vitest run -t timeout`) and save the output.

### Output
`timeout_changes` with test names and output lines.

### Quality Gate
- Every changed dependency has a passing timeout test in the saved output.
- The total test count is not lower than the baseline, and no test was marked `.skip` or `.only` (`rg -n "\.(skip|only)\(" test/` shows no new hits).

---

## Worked Example

Illustrative. Plan: `payments` 750 ms per try, connect open question; `postgres` 45 ms per try, connect 20 ms.

Phase 1 finds `src/clients/payments.ts:9  return fetch(`${base}/charge`, { method: 'POST', body })` with no signal (undici defaults, effectively 300 s for headers).

Phase 2:
```ts
return fetch(`${base}/charge`, { method: 'POST', body, signal: AbortSignal.timeout(750) });
```
`src/db.ts:4` becomes `new Pool({ connectionTimeoutMillis: 20, statement_timeout: 45, query_timeout: 45 })`.

Phase 3: `node --test --test-name-pattern=timeout` prints `# pass 2  # fail 0`.

---

## Exit Criteria

DONE when every Node.js client has an explicit timeout from the plan that actually aborts the request, and a test per dependency proves it fires within the planned time.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Node older than 18 | **Stop**: `AbortSignal.timeout` is unavailable; report the runtime upgrade as a prerequisite. |
| Phase 2 | `AbortSignal.any` missing (Node below 20.3) | **Adjust**: create an `AbortController`, call `controller.abort()` from both the inbound signal listener and a `setTimeout`, and clear the timer in `finally`. |
| Phase 3 | Test passes but takes the undici default time | **Adjust**: the signal is not reaching the call; check the factory forwards `signal` to `fetch`. |
| Phase 3 | Existing test fails after the change | **Adjust**: compare against the plan; never raise a timeout to pass a test without updating the plan. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
