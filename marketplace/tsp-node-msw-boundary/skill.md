# Jest and Vitest HTTP Boundary with MSW

**One-line description:** Replaces real outbound HTTP in slow Jest or Vitest tests with Mock Service Worker request handlers (`setupServer` from `msw/node`, `onUnhandledRequest: 'error'`) or `nock` where MSW does not fit, one test file per change, so no test reaches the network and every stubbed payload has a documented source.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `hotspot_plan` (object, required): From `tsp-hotspot-classify`; items with cause `network`.

---

## Outputs

- `node_boundary_mocks` (object): One row per file: HTTP client (`fetch`, `axios`, `got`, SDK), interception library and version, handlers added (method, URL), payload source per handler, commit SHA, file time before and after, and the unhandled-request check result.

---

## Phase 1: Choose the Interceptor

### Entry Criteria
- At least one `network` item is `todo`.

### Actions
1. Record versions: `npm ls msw nock` (either may be absent) and `node --version`.
2. Choose with this table:

| Situation | Use |
|---|---|
| `msw` already a dependency, or client is `fetch`, `axios`, `got`, `undici` | MSW (`msw/node`) |
| `nock` already used across the suite and client is `http`/`https`-based (`axios` in Node, `got`) | `nock` |
| Client is native `fetch` and only `nock` is present | Check `nock` release notes: native `fetch` interception arrived in nock 14; on older nock switch to MSW |

3. Read the MSW major version. v2 API: `import { http, HttpResponse } from 'msw'`, `http.get(url, () => HttpResponse.json(body))`. v1 API: `rest.get(url, (req, res, ctx) => res(ctx.json(body)))`. Do NOT mix them.
4. Find the real calls: run the file once with an MSW server listening with `onUnhandledRequest: 'error'` and zero handlers (after Phase 2 step 2 exists, this is `MSW_STRICT=1`); each real request is printed as an error naming method and URL. For `nock`, run with `nock.disableNetConnect()`; each real request fails with `NetConnectNotAllowedError` naming the host.

### Output
Interceptor, version and the request list.

### Quality Gate
- Every request printed by the unhandled-request run is in the request list.

---

## Phase 2: Add Handlers to One File

### Entry Criteria
- One file selected; suite green.

### Actions
1. Time before: `npx jest <file>` or `npx vitest run <file>`.
2. If no shared server exists, create one in the test setup file the runner already loads (`setupFilesAfterEnv` for Jest, `setupFiles` for Vitest):
   `export const server = setupServer()`
   `beforeAll(() => server.listen({ onUnhandledRequest: process.env.MSW_STRICT ? 'error' : 'bypass' }))`
   `afterEach(() => server.resetHandlers())`
   `afterAll(() => server.close())`
   Start with `'bypass'` as the default because other files still make real calls; `MSW_STRICT=1` turns on `'error'` for one run. Adding the shared server is its own commit, made only after the full suite passes with it.
3. In the target file, add handlers with `server.use(...)` inside the test or a `beforeEach`, built from a real payload source: provider API docs example, a recorded response saved from a sandbox, or an existing fixture file. Record the source.
4. With `nock`: `nock('https://api.example.com').get('/v1/items').reply(200, body)` and `nock.disableNetConnect()` plus `nock.enableNetConnect('127.0.0.1')` in setup; `afterEach(() => nock.cleanAll())`.
5. Keep assertions. Add one check that the request happened (MSW: capture the request in the handler and assert on it; nock: `expect(scope.isDone()).toBe(true)`).
6. Do NOT mock the module under test with `jest.mock('./client')` to make the network disappear; that removes the code path the test covers.

### Output
One file changed.

### Quality Gate
- `git diff --stat` shows one test file (plus the shared setup file only in its own earlier commit).
- Each handler has a recorded payload source.

---

## Phase 3: Prove and Commit

### Entry Criteria
- Handlers in place.

### Actions
1. Run the file in strict mode: `MSW_STRICT=1 npx jest <file>` or `MSW_STRICT=1 npx vitest run <file>`. It must pass, proving no real request remains. For `nock`, `nock.disableNetConnect()` already makes stray requests fail.
2. Mutation check: change one field the code reads in a handler payload; a test must fail. Revert.
3. Full suite with the baseline command must pass.
4. Commit: `git commit -m "test: MSW handlers for <file>"`. Record time before and after.
5. After every network item is done, set `onUnhandledRequest: 'error'` permanently as a separate commit and run the full suite.

### Output
Row in `node_boundary_mocks`.

### Quality Gate
- Strict-mode run of the file passes.
- Mutation run fails; reverted run passes.
- Full suite has zero failures.

---

## Worked Example

Illustrative. Item: `src/catalog/sync.test.ts`, 7.4 s, client `fetch`, `msw@2.4`.

- Phase 1: strict zero-handler run prints `[MSW] Error: intercepted a request without a matching request handler: GET https://pim.example.com/v2/products?page=1` and `page=2`.
- Phase 2: `server.use(http.get('https://pim.example.com/v2/products', ({ request }) => HttpResponse.json(new URL(request.url).searchParams.get('page') === '1' ? page1 : page2)))` with `page1`, `page2` loaded from `src/catalog/__fixtures__/products-page*.json`, recorded from the vendor sandbox.
- Phase 3: 7.4 s to 0.3 s; changing `sku` to `sku_id` in `page1` fails `maps vendor products`; full suite green.

---

## Exit Criteria

DONE when every `network` item is `done` with handlers that pass in strict mode, a failing payload mutation and a green suite, and the shared server finally runs with `onUnhandledRequest: 'error'`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | MSW v2 requires a newer Node than installed | **Adjust**: use MSW v1 API or `nock`; record the reason. |
| Phase 2 | Handlers do not intercept (requests still leave) | **Retry**: confirm the client is not using a custom agent or a proxy; with `jsdom`, check the MSW docs for the environment polyfill notes. |
| Phase 2 | No real payload source | **Stop**: record one from a sandbox first. |
| Phase 3 | Other files break after `'error'` is enabled | **Return**: those files still have real calls; add them to `hotspot_plan` as `network` items. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
