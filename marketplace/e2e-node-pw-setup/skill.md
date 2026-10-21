# Playwright Test Setup for Node/TypeScript

**One-line description:** Installs `@playwright/test` and one browser, writes a `playwright.config.ts` whose `baseURL`, `webServer`, `projects`, `forbidOnly`, `retries`, `workers`, `reporter` and `use.trace` keys are each set on purpose, and proves the setup with one smoke spec that passes locally and fails when the page is broken.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository (must contain `package.json`).
- `app_url` (string, required): URL the app serves on locally, for example `http://localhost:3000`.
- `runner_decision` (object, required): From `e2e-runner-select`; `stack` must be `playwright-node`.
- `start_command` (string, optional): Command that starts the app, for example `npm run dev`. Omit when the app is started outside the tests.

---

## Outputs

- `pw_node_config` (object): `{config_path, test_dir, playwright_version, projects[], base_url, web_server_command|null, smoke_spec_path, smoke_pass_output, smoke_fail_output}`.

---

## Phase 1: Install

### Entry Criteria
- `runner_decision.stack == "playwright-node"`.
- `node --version` prints a version listed as supported in the Playwright release notes.

### Actions
1. `cd <repo_dir> && npm install --save-dev @playwright/test` (use `pnpm add -D` or `yarn add -D` if a `pnpm-lock.yaml` or `yarn.lock` exists; never mix lockfiles).
2. Install only the browsers in `runner_decision.browsers_required`: `npx playwright install --with-deps chromium`. `--with-deps` installs OS libraries and needs sudo on Linux; on macOS/Windows it is harmless.
3. Record the version: `npx playwright --version`. Write it into `playwright_version`; the CI container tag must match it later.
4. Add to `.gitignore`: `test-results/`, `playwright-report/`, `blob-report/`, `playwright/.cache/`, `playwright/.auth/`.
5. Do NOT run `npm init playwright@latest` in a repo that already has a config; it can overwrite files. In an empty test setup it is fine, but the manual steps above are deterministic.

### Output
Installed package and browser.

### Quality Gate
- `npx playwright --version` prints a version.
- `npm ls @playwright/test` shows exactly one version (no duplicates).

---

## Phase 2: Write playwright.config.ts

### Entry Criteria
- Package installed.

### Actions
1. Create `playwright.config.ts` at the repo root:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['blob'], ['list']] : [['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```
2. Replace `http://localhost:3000` with `app_url` and `npm run dev` with `start_command`. If `start_command` is absent, delete the whole `webServer` block.
3. The values `retries: process.env.CI ? 2 : 0` and `workers: process.env.CI ? 1 : undefined` are the template values that `npm init playwright` generates. Keep them until the retries policy and sharding flows replace them; do not invent other numbers.
4. `webServer.timeout` defaults to 60000 ms. Only set it if the measured start time of `start_command` exceeds that; measure with `time <start_command>` until the URL answers.
5. Add `firefox`/`webkit` projects only if `browsers_required` lists them.
6. Add npm scripts: `"e2e": "playwright test"`, `"e2e:ui": "playwright test --ui"`.

### Output
`playwright.config.ts`.

### Quality Gate
- `npx playwright test --list` exits 0 (config parses and test dir resolves).
- `grep -n "forbidOnly" playwright.config.ts` shows the CI guard.

---

## Phase 3: Smoke Spec Proves the Setup

### Entry Criteria
- Config lists without error.

### Actions
1. Create `e2e/smoke.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('home page renders its main heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
```
   Replace the assertion with one visible element you saw on the home page. `page.goto('/')` resolves against `baseURL`; never hard-code the host in specs.
2. Run `npx playwright test e2e/smoke.spec.ts --project=chromium`. Save the last lines as `smoke_pass_output`.
3. Prove the test can fail: temporarily change the expected element (for example `level: 6` where none exists), rerun, confirm it fails with `Timed out 5000ms waiting for expect(locator).toBeVisible()` (5000 ms is the default `expect` timeout). Save that as `smoke_fail_output`, then revert the change and rerun to green.
4. Do not add `page.waitForTimeout()` anywhere. Web-first assertions (`expect(locator).toBeVisible()`) already retry until the timeout.

### Output
`pw_node_config`.

### Quality Gate
- `smoke_pass_output` contains `1 passed`.
- `smoke_fail_output` contains `1 failed`, and `git diff e2e/smoke.spec.ts` after revert shows only the intended final spec.

---

## Worked Example

Illustrative only. `app_url=http://localhost:5173`, `start_command="npm run dev -- --port 5173"`.

```
$ npm install --save-dev @playwright/test
$ npx playwright install --with-deps chromium
$ npx playwright --version
Version 1.48.2
$ npx playwright test --list
Listing tests:
  [chromium] > smoke.spec.ts:3:5 > home page renders its main heading
Total: 1 test in 1 file
$ npx playwright test e2e/smoke.spec.ts --project=chromium
Running 1 test using 1 worker
  1 passed (2.1s)
```
After changing the heading level to 6: `1 failed ... Timed out 5000ms waiting for expect(locator).toBeVisible()`. Reverted, green again.

---

## Exit Criteria

DONE when `playwright.config.ts` exists with every key set as above, the smoke spec passes, and it has been seen to fail on a broken expectation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `--with-deps` fails for lack of sudo | **Adjust**: run `npx playwright install chromium` and ask the user to run `sudo npx playwright install-deps chromium`. |
| Phase 2 | `--list` fails with `Error: No tests found` | **Adjust**: check `testDir` matches where the spec lives; do not change `testMatch` to a broad glob. |
| Phase 3 | `webServer` times out | **Retry** once after measuring start time; if still failing, run `start_command` by hand and read its error. |
| Phase 3 | Smoke test passes even when broken | **Stop**: the assertion is not reaching the page; fix it before any other spec is written. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
