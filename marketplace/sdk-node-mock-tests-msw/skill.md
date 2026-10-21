# SDK Node Mock Tests With MSW

**One-line description:** Writes the TypeScript SDK's HTTP-level test suite with Mock Service Worker v2 in Node (`setupServer` from `msw/node`, `http` handlers, `HttpResponse`), with `onUnhandledRequest: "error"`, per-test overrides through `server.use`, and request capture for auth, errors, retries and pagination.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): SDK repository root.
- `api_inventory` (object, required): Output of `sdk-spec-inventory`.
- `error_hierarchy` (object, required): Output of `sdk-error-hierarchy`.
- `retry_policy` (object, required): Output of `sdk-retry-backoff`.

---

## Outputs

- `ts_mock_tests` (object): MSW and test runner versions, setup file, handler files, scenario coverage table, and the runner result line.

---

## Phase 1: Install and Wire MSW

### Entry Criteria
- Node 18 or later; the SDK uses global `fetch` or a fetch passed in options.

### Actions
1. `npm install --save-dev --save-exact msw vitest`.
2. Confirm MSW major version 2: `npm ls msw`. The v1 API (`rest`, `res(ctx.json())`) does not exist in v2; do NOT copy v1 examples.
3. Create `test/setup.ts`:
   ```ts
   import { setupServer } from "msw/node";
   import { beforeAll, afterEach, afterAll } from "vitest";
   import { handlers } from "./handlers";
   export const server = setupServer(...handlers);
   beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
   afterEach(() => server.resetHandlers());
   afterAll(() => server.close());
   ```
4. Register it in `vitest.config.ts`: `test: { setupFiles: ["./test/setup.ts"] }`.
5. If the SDK captured `globalThis.fetch` at import time before MSW patched it, interception can miss. Construct the client inside tests (after `server.listen`), or pass `fetch: (...a) => fetch(...a)` so lookup is late.

### Output
MSW wired.

### Quality Gate
- `npm ls msw` shows a 2.x version.
- A test that calls an unhandled URL fails with an MSW unhandled-request error (write, confirm, delete).

---

## Phase 2: Handlers and Request Capture

### Entry Criteria
- Setup file registered.

### Actions
1. Default handlers in `test/handlers.ts`, one happy path per resource:
   ```ts
   import { http, HttpResponse } from "msw";
   export const handlers = [
     http.get("https://api.test/v1/users/:id", ({ params }) =>
       HttpResponse.json({ id: params.id, email: "a@b.c", created_at: "2026-01-01T00:00:00Z" })),
   ];
   ```
2. Per-test override for error and retry sequences: `server.use(http.get(url, () => new HttpResponse(null, { status: 503 }), { once: true }))`. `once: true` makes the handler apply to one request, then fall through to the next matching handler; stacking one `once` 503 over the default 200 handler gives "503 then 200".
3. Network failure: `HttpResponse.error()` produces a `TypeError: Failed to fetch`-style failure; assert it maps to `APIConnectionError`.
4. Capture requests: inside a resolver, read `request.headers.get("authorization")`, `new URL(request.url).searchParams`, and `await request.clone().json()`; push into an array the test asserts on. Or listen with `server.events.on("request:start", ({ request }) => seen.push(request.clone()))`.
5. Delay for timeout tests: `import { delay } from "msw"; await delay(500);` inside the resolver.

### Output
Handlers and capture helpers.

### Quality Gate
- `npx tsc --noEmit` passes including `test/`.

---

## Phase 3: Cover the Scenarios

### Entry Criteria
- Handlers exist.

### Actions
1. One test per row:

| Scenario | Assertion |
|---|---|
| Happy path per resource | Typed result; request method, path, query, body |
| Auth header | Captured header equals the configured value |
| Each error class | `await expect(p).rejects.toBeInstanceOf(<Class>)` and fields |
| 503 then 200 | 2 captured requests; success |
| 400 not retried | 1 captured request |
| POST without key not retried | 1 captured request |
| `Retry-After` honored | Injected sleep called with the value (or fake timers advanced by it) |
| Idempotency key reused | Same header value on each captured retry |
| Pagination | Item count and captured request count |
| Network error | `APIConnectionError` |

2. Run `npx vitest run`.
3. Do NOT replace failing assertions with `expect.anything()` or skip tests with `.skip` to get green. Fix the SDK or the handler and record which.

### Output
`ts_mock_tests`.

### Quality Gate
- Every row has a named test.
- The vitest summary shows 0 failed.

---

## Worked Example

Illustrative only.

```ts
it("retries 503 then succeeds", async () => {
  const seen: Request[] = [];
  server.events.on("request:start", ({ request }) => seen.push(request));
  server.use(http.get("https://api.test/v1/users/:id", () => new HttpResponse(null, { status: 503 }), { once: true }));
  const user = await client.users.retrieve("u_1");
  expect(user.id).toBe("u_1");
  expect(seen).toHaveLength(2);
});
```
```
$ npx vitest run
 ✓ test/users.test.ts (6)
 ✓ test/errors.test.ts (10)
 ✓ test/retry.test.ts (5)
 Test Files  3 passed (3)
      Tests  21 passed (21)
```

---

## Exit Criteria

DONE when MSW v2 intercepts every request with unhandled requests failing, and every scenario row has a test asserting on captured requests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Requests bypass MSW | **Adjust**: build the client after `server.listen()` or pass a late-bound fetch, as in Action 5. |
| Phase 2 | `request.json()` throws "body used" | **Adjust**: read `request.clone()` in capture code. |
| Phase 3 | Event listeners leak across tests | **Adjust**: call `server.events.removeAllListeners()` in `afterEach`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
