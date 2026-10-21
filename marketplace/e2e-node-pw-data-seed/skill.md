# Playwright Node Test Data Seeding and Cleanup

**One-line description:** Gives every Playwright test its own data through fixtures that create records with an `APIRequestContext` before `use()` and delete them after it, makes names unique with `crypto.randomUUID()` and `testInfo.parallelIndex`, puts shared reference data in a `setup` project with a matching `teardown` project, and proves isolation by running the suite twice in a row with parallel workers.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `node_fixture_layer` (object, required): From `e2e-node-pw-fixtures-pom`.
- `seed_api` (object, optional): How the app creates test data: `{kind: "http"|"db"|"cli", create_endpoints[], delete_endpoints[], admin_token_env}`. When absent, Phase 1 finds it.

---

## Outputs

- `node_data_fixtures` (object): `{data_fixtures[{name, scope, creates, deletes}], setup_project, teardown_project, unique_key_rule, double_run_output}`.

---

## Phase 1: Find the Seeding Path

### Entry Criteria
- `node_fixture_layer.fixtures_file` exists.

### Actions
1. Choose the seeding path, first row that is available:

| Available | Use |
|---|---|
| Public or admin HTTP API that creates and deletes the record | `request` fixture or `request.newContext()` |
| Test-only seed endpoint guarded by env (for example only when `NODE_ENV=test`) | Same, record the guard |
| Only a CLI (`rails runner`, `manage.py`, `npm run seed`) | `execSync` in a worker fixture |
| Only direct DB access | DB client in a worker fixture, using the app's own schema names |

2. Confirm each create and delete call by hand with `curl -i` and record the status codes.
3. Never seed through the UI for data that is a precondition; it is slow and couples unrelated tests to one screen.

### Output
Chosen path with verified calls.

### Quality Gate
- Every create and delete call has a recorded 2xx response (or exit code 0 for CLI).

---

## Phase 2: Write Per-Test Data Fixtures

### Entry Criteria
- Calls verified.

### Actions
1. Add to `e2e/fixtures.ts`:
```ts
import { randomUUID } from 'node:crypto';
import { test as base, expect } from '@playwright/test';

type Data = { product: { id: string; sku: string } };

export const test = base.extend<Pages & Data>({
  product: async ({ request }, use, testInfo) => {
    const sku = `e2e-${testInfo.parallelIndex}-${randomUUID().slice(0, 8)}`;
    const res = await request.post('/api/admin/products', {
      data: { sku, name: `Mug ${sku}`, price_cents: 1200 },
      headers: { Authorization: `Bearer ${process.env.E2E_ADMIN_TOKEN}` },
    });
    expect(res.status()).toBe(201);
    const product = await res.json();
    await use(product);
    await request.delete(`/api/admin/products/${product.id}`, {
      headers: { Authorization: `Bearer ${process.env.E2E_ADMIN_TOKEN}` },
    });
  },
});
```
2. The `request` fixture uses `baseURL` from config. Code after `await use()` runs even when the test fails, so cleanup is guaranteed there; do not put cleanup in `afterAll` that can be skipped by an earlier hook failure.
3. Unique key rule: every created record embeds a random id. Never use a fixed email like `test@example.com`; parallel workers will collide.
4. Data that is expensive and read-only for all tests (catalog, tax tables) goes in a worker-scoped fixture: `[async ({}, use) => {...}, { scope: 'worker' }]`, created once per worker.
5. Read secrets from environment variables; never write tokens into the spec files.

### Output
Data fixtures.

### Quality Gate
- `npx tsc --noEmit` exits 0.
- `grep -rnE "@example\.com'|'test-user'" e2e` prints nothing (no fixed identities).

---

## Phase 3: Global Reference Data and Proof of Isolation

### Entry Criteria
- Data fixtures written.

### Actions
1. If a one-time reset is needed (migrate and seed a fresh DB), use project dependencies, not `globalSetup` (setup projects show in the HTML report and produce traces):
```ts
projects: [
  { name: 'seed', testMatch: /global\.setup\.ts/, teardown: 'cleanup' },
  { name: 'cleanup', testMatch: /global\.teardown\.ts/ },
  { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['seed'] },
],
```
2. Run the suite twice back to back with parallel workers: `npx playwright test --workers=4 && npx playwright test --workers=4`. The worker count here is only for the check; use any value above 1 the machine allows.
3. After the run, list leftovers: `curl -s <app_url>/api/admin/products?sku_prefix=e2e- -H "Authorization: Bearer $E2E_ADMIN_TOKEN"` (or the equivalent query). It must be empty.

### Output
`node_data_fixtures` with `double_run_output`.

### Quality Gate
- Both runs report 0 failed.
- The leftover query returns no records created by this run.

---

## Worked Example

Illustrative only. `seed_api={kind:"http", create_endpoints:["POST /api/admin/products"], delete_endpoints:["DELETE /api/admin/products/:id"], admin_token_env:"E2E_ADMIN_TOKEN"}`.

```
$ curl -i -X POST http://localhost:3000/api/admin/products -H "Authorization: Bearer $E2E_ADMIN_TOKEN" -H 'content-type: application/json' -d '{"sku":"probe","name":"probe","price_cents":1}'
HTTP/1.1 201 Created
$ npx playwright test --workers=4 && npx playwright test --workers=4
  6 passed (11.4s)
  6 passed (11.0s)
$ curl -s 'http://localhost:3000/api/admin/products?sku_prefix=e2e-' -H "Authorization: Bearer $E2E_ADMIN_TOKEN"
[]
```

---

## Exit Criteria

DONE when every test gets uniquely named data from a fixture that cleans up after `use()`, shared setup runs as a dependency project, and two consecutive parallel runs pass with no leftover records.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No create/delete API and no DB access | **Return**: ask the user for a seeding method; do not seed through the UI. |
| Phase 2 | Delete endpoint returns 404 for a record just created | **Stop**: the fixture is reading the wrong id field; print `await res.json()` and fix. |
| Phase 3 | Second run fails with "already exists" | **Adjust**: a fixed identifier remains; apply the unique key rule to it. |
| Phase 3 | Leftover records after a passing run | **Adjust**: cleanup is in a hook that did not run; move it after `await use()`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
