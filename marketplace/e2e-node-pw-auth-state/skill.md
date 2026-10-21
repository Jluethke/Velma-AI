# Playwright Node Auth State Reuse with storageState

**One-line description:** Logs in once per role in a `setup` project, saves cookies and local storage with `storageState({ path })` to `playwright/.auth/<role>.json`, makes browser projects depend on it, chooses between one shared account and one account per worker with a decision table, and keeps exactly one spec that exercises the real login form.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `pw_node_config` (object, required): From `e2e-node-pw-setup`.
- `node_data_fixtures` (object, required): From `e2e-node-pw-data-seed`; used when accounts are created per worker.
- `test_accounts` (object, required): `{roles: [{role, username_env, password_env}]}`, or `{create_via_api: true}` when accounts are seeded. Secrets are environment variable names, never values.

---

## Outputs

- `node_auth_setup` (object): `{auth_setup_file, state_files[], strategy: "shared"|"per-worker", projects_changed[], login_ui_spec, verification_output}`.

---

## Phase 1: Choose the Strategy

### Entry Criteria
- `test_accounts` lists at least one role or `create_via_api` is true.

### Actions
1. Decide with this table:

| Condition | Strategy |
|---|---|
| Tests change server-side state tied to the user (cart, settings, profile) and run in parallel | Per worker: one account per `parallelIndex`, created in a worker-scoped fixture |
| Tests only read, or each test's data is separate records that do not touch user-level state | Shared: one account per role, logged in once in a setup project |
| Multiple roles in one test (admin approves member's request) | Shared, one state file per role, two browser contexts in the test |

2. Check where the app keeps the session: open DevTools Application tab after manual login. `storageState` saves cookies and `localStorage`; `sessionStorage` is not saved. IndexedDB is saved only with `storageState({ path, indexedDB: true })` in versions that support it (check the release notes for your `playwright_version`). If the token lives in `sessionStorage`, record it and use the per-test login fixture fallback in the Error Handling table.

### Output
Strategy and session storage location.

### Quality Gate
- The strategy row is cited, and the session storage location is recorded from DevTools, not assumed.

---

## Phase 2: Write the Setup Project (Shared Strategy)

### Entry Criteria
- Strategy chosen.

### Actions
1. Create `e2e/auth.setup.ts`:
```ts
import { test as setup, expect } from '@playwright/test';

const memberFile = 'playwright/.auth/member.json';

setup('authenticate as member', async ({ request }) => {
  const res = await request.post('/api/session', {
    data: { email: process.env.E2E_MEMBER_EMAIL, password: process.env.E2E_MEMBER_PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  await request.storageState({ path: memberFile });
});
```
   API login is faster than UI login. If the app has no login API, use `page` and drive the form, then `await page.context().storageState({ path: memberFile })` after asserting a signed-in element is visible.
2. In `playwright.config.ts`:
```ts
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  { name: 'chromium', use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/member.json' }, dependencies: ['setup'] },
],
```
3. For tests that must start signed out, inside the spec: `test.use({ storageState: { cookies: [], origins: [] } })`.
4. Confirm `playwright/.auth` is in `.gitignore`; state files contain live session tokens.
5. For per-worker strategy, instead write a worker-scoped fixture that creates the account through `node_data_fixtures`, logs in, and writes `playwright/.auth/worker-${parallelIndex}.json`, then override `storageState` with it (pattern in the Playwright "Authentication" docs, "one account per parallel worker").

### Output
Setup project and config change.

### Quality Gate
- `npx playwright test --project=setup` passes and `ls playwright/.auth/` lists the state file.
- `git check-ignore playwright/.auth/member.json` prints the path.

---

## Phase 3: Verify Reuse and Keep One Real Login Test

### Entry Criteria
- State file created.

### Actions
1. Add a check spec: `await page.goto('/account'); await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible();` with no login steps. It must pass.
2. Keep one spec, with signed-out state, that fills the real login form and asserts the signed-in landing. That covers the login journey; all other specs skip the form.
3. Remove UI login steps from other specs one file at a time, running each after editing.
4. Run `npx playwright test`; the pass count must equal the baseline.

### Output
`node_auth_setup`.

### Quality Gate
- `grep -rn "getByLabel('Password')" e2e/*.spec.ts | wc -l` is 1 (only the login spec), or the count of specs deliberately testing login.
- Full run pass count equals baseline.

---

## Worked Example

Illustrative only. Roles: member, admin. Tests read catalog and place orders as separate records: shared strategy.
```
$ npx playwright test --project=setup
  ✓  [setup] › auth.setup.ts:5:6 › authenticate as member (402ms)
  ✓  [setup] › auth.setup.ts:12:6 › authenticate as admin (388ms)
$ git check-ignore playwright/.auth/member.json
playwright/.auth/member.json
$ npx playwright test
  9 passed (18.0s)    (was 9 passed (41.3s) with UI login in every spec)
```

---

## Exit Criteria

DONE when sessions are created once (per role or per worker) by a setup project or worker fixture, specs start signed in without UI login, state files are git-ignored, and one spec still covers the real login form.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Token stored in `sessionStorage` | **Adjust**: use a per-test fixture that logs in by API and calls `page.addInitScript` to set the `sessionStorage` key before `goto`. |
| Phase 2 | Tests land on the login page despite state | **Adjust**: the cookie domain differs from `baseURL` host; log in against the same host as `baseURL`. |
| Phase 3 | Tests pass alone but fail together (shared user state) | **Adjust**: switch to the per-worker strategy. |
| Phase 3 | Session expires during long runs | **Return**: report the expiry time; ask whether a longer-lived test session is allowed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
