# Playwright Network Mocking with page.route and HAR Replay

**One-line description:** Implements the `mock` rows of the backend plan in Playwright (Node or Python): aborts noise hosts with `context.route`, fulfills third-party calls from recorded HAR files with `routeFromHAR`, patches single fields of real responses with `route.fetch()`, forces error states with `route.fulfill({ status })`, and proves each route actually matched.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `stack` (string, required): `playwright-node` or `playwright-python`.
- `backend_plan` (object[], required): From `e2e-mock-vs-real-decide`.

---

## Outputs

- `pw_route_mocks` (object): `{route_fixtures[], har_files[], error_case_tests[], match_proof[]}`.

---

## Phase 1: Block Noise Hosts for All Tests

### Entry Criteria
- `backend_plan` has rule 4 rows, or skip to Phase 2.

### Actions
1. Add an automatic fixture so every test gets the block.

Node (`e2e/fixtures.ts`):
```ts
blockNoise: [async ({ context }, use) => {
  await context.route(/google-analytics\.com|doubleclick\.net|hotjar\.com/, (route) => route.abort());
  await use();
}, { auto: true }],
```
Python (`e2e/conftest.py`):
```python
import re

import pytest


@pytest.fixture(autouse=True)
def block_noise(context):
    context.route(re.compile(r"google-analytics\.com|doubleclick\.net|hotjar\.com"), lambda route: route.abort())
```
2. Use `context.route` (all pages and popups in the context), not `page.route`, for global rules.
3. If the app registers a service worker, requests can bypass routing. Set `serviceWorkers: 'block'` in `use` (Node) or `"service_workers": "block"` in `browser_context_args` (Python).

### Output
Noise blocking.

### Quality Gate
- Running one journey with `--trace on` (Node) or `--tracing on` (Python) and opening the trace shows the analytics requests as failed/aborted in the Network tab.

---

## Phase 2: Replay Third-Party Calls from HAR

### Entry Criteria
- Rule 5 rows exist with `mock_source` as HAR.

### Actions
1. Record once against the real or sandbox service, scoped by URL:
   - Node: `await page.routeFromHAR('e2e/hars/tax.har', { url: '**/api.taxrates.example/**', update: true });` then run the test once.
   - Python: `page.route_from_har("e2e/hars/tax.har", url="**/api.taxrates.example/**", update=True)`.
2. Remove `update: true` / `update=True` and commit the HAR. From now on matching requests are served from the file; unmatched requests to that URL pattern fail (`notFound: 'abort'` is the default) which exposes new calls.
3. Read the HAR before committing: `jq '.log.entries[] | {url: .request.url, status: .response.status}' e2e/hars/tax.har`. Remove entries containing secrets or personal data; never commit tokens.
4. To change one field of a real response instead of replacing it:
```ts
await page.route('**/api/feature-flags', async (route) => {
  const response = await route.fetch();
  const json = await response.json();
  json.newCheckout = true;
  await route.fulfill({ response, json });
});
```

### Output
HAR files and patch routes.

### Quality Gate
- `grep -ciE "authorization|bearer|set-cookie" e2e/hars/*.har` prints 0 per file, or each hit was reviewed and redacted.
- The journey test passes with the network to that host disabled (unplug or block the host at OS level) or, simpler, with routes asserted in Phase 3.

---

## Phase 3: Error State Tests and Match Proof

### Entry Criteria
- Rule 6 rows exist.

### Actions
1. One test per error case, separate from the happy path:
```ts
test('order shows sold-out message on 409', async ({ page }) => {
  await page.route('**/api/orders', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({ status: 409, json: { error: 'out_of_stock' } })
      : route.continue());
  // ... drive checkout ...
  await expect(page.getByRole('alert')).toHaveText('This item just sold out');
});
```
2. Register routes before the action that triggers the request (usually before `page.goto`). A route added after the request is sent does nothing.
3. Prove the route matched: wrap the trigger with `const resp = page.waitForResponse('**/api/orders')` (Python: `with page.expect_response("**/api/orders") as info:`) and assert `(await resp).status() === 409`. A test that passes without the route matching proves nothing.
4. Glob patterns: `**` matches across `/`, `*` does not. `'**/api/orders'` does not match `/api/orders?x=1`; use `'**/api/orders*'` or a RegExp when a query string is present.

### Output
`pw_route_mocks`.

### Quality Gate
- Each error test asserts the mocked status via `waitForResponse`/`expect_response`.
- Commenting out the `page.route` call makes that test fail (run once, then restore).

---

## Worked Example

Illustrative only. `stack=playwright-node`.
```
$ npx playwright test e2e/checkout.spec.ts --trace on
  3 passed
$ npx playwright show-trace test-results/checkout-.../trace.zip
  Network: www.google-analytics.com/g/collect  (failed: net::ERR_FAILED)
$ jq '.log.entries | length' e2e/hars/tax.har
2
```
Removing the 409 route: `Error: expect(locator).toHaveText ... Received: "Order confirmed"`. Restored, green.

---

## Exit Criteria

DONE when noise hosts are blocked context-wide, third-party mocks replay committed and scrubbed HARs, each error state has its own test that proves its route matched, and the owned backend stays real on happy paths.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Requests still reach analytics | **Adjust**: block service workers; check the request comes from this context and not a separate worker. |
| Phase 2 | HAR replay returns nothing for POST requests | **Adjust**: HAR matching includes the POST body; re-record with the same data, or use `route.fulfill` for that call. |
| Phase 3 | Route never fires | **Adjust**: print `page.on('request', r => console.log(r.url()))` once to see the exact URL, then fix the glob. |
| Phase 3 | Test passes with the route removed | **Stop**: the test is not checking the error path; fix the assertion. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
