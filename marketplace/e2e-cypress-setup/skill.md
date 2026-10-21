# Cypress E2E Setup

**One-line description:** Installs Cypress, writes a `cypress.config.ts` with `e2e.baseUrl`, `specPattern`, `supportFile`, `retries`, `video` and `screenshotOnRunFailure` set on purpose, starts the app with `start-server-and-test`, and proves the setup with one smoke spec that passes in `cypress run` and is seen to fail.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository (contains `package.json`).
- `app_url` (string, required): URL the app serves on locally.
- `runner_decision` (object, required): From `e2e-runner-select`; `stack` must be `cypress`.
- `start_command` (string, optional): npm script that starts the app, for example `dev`.

---

## Outputs

- `cypress_config` (object): `{config_path, cypress_version, spec_pattern, support_file, base_url, run_script, smoke_spec_path, smoke_pass_output, smoke_fail_output}`.

---

## Phase 1: Install

### Entry Criteria
- `runner_decision.stack == "cypress"`.

### Actions
1. `npm install --save-dev cypress start-server-and-test` (match the lockfile's tool).
2. `npx cypress verify` downloads nothing new; it checks the binary runs. Then `npx cypress --version` and record `cypress_version`.
3. If a `cypress.json` exists, stop: that is Cypress 9 or older and needs the migration helper in `cypress open`; it is out of scope here.
4. Add `cypress/videos/`, `cypress/screenshots/`, `cypress/downloads/` to `.gitignore`.

### Output
Installed Cypress.

### Quality Gate
- `npx cypress verify` prints `Verified Cypress!`.
- `ls cypress.json 2>/dev/null` prints nothing.

---

## Phase 2: Write cypress.config.ts

### Entry Criteria
- Cypress verified.

### Actions
1. Create `cypress.config.ts`:
```ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(on, config) {
      return config;
    },
  },
  retries: { runMode: 0, openMode: 0 },
  video: false,
  screenshotOnRunFailure: true,
});
```
2. Replace `baseUrl` with `app_url`. `cy.visit('/')` then resolves against it; also Cypress refuses to start a run if `baseUrl` is set and not reachable, which is a useful guard.
3. `retries` `{runMode: 0, openMode: 0}` and `video: false` are the documented defaults in Cypress 13 and later. The retries policy and failure artifacts flows change them; do not set other numbers here.
4. Create `cypress/support/e2e.ts` (may be empty for now) and `cypress/tsconfig.json`:
```json
{ "compilerOptions": { "target": "es2020", "lib": ["es2020", "dom"], "types": ["cypress", "node"] }, "include": ["**/*.ts"] }
```
5. Add npm scripts: `"cy:run": "cypress run --browser chrome"`, `"e2e": "start-server-and-test <start_command> <app_url> cy:run"`. `start-server-and-test` waits for the URL to answer before running.

### Output
`cypress.config.ts`, support file, scripts.

### Quality Gate
- `npx cypress run --spec "cypress/e2e/does-not-exist.cy.ts"` fails with a "No spec files were found" message (proves the config was read and the pattern is applied).
- `grep -n baseUrl cypress.config.ts` shows `app_url`.

---

## Phase 3: Smoke Spec Proves the Setup

### Entry Criteria
- Config read without error.

### Actions
1. Create `cypress/e2e/smoke.cy.ts`:
```ts
describe('smoke', () => {
  it('home page renders its main heading', () => {
    cy.visit('/');
    cy.get('h1').should('be.visible');
  });
});
```
   Use an element you saw on the real page. The selector policy flow will later replace tag selectors with `data-cy` or Testing Library queries.
2. Run `npm run e2e`. Save the summary table as `smoke_pass_output`.
3. Break it (`cy.get('h6')`), rerun, confirm `AssertionError: Timed out retrying after 4000ms: Expected to find element: h6, but never found it.` (4000 ms is the default `defaultCommandTimeout`) and a PNG under `cypress/screenshots/`. Save as `smoke_fail_output`. Revert and rerun green.
4. Never add `cy.wait(<number>)`; Cypress queries already retry until `defaultCommandTimeout`.

### Output
`cypress_config`.

### Quality Gate
- `smoke_pass_output` shows the spec with `Passing: 1` and `Failing: 0`.
- `smoke_fail_output` shows `Failing: 1` and `ls cypress/screenshots/smoke.cy.ts/` listed a file during the failing run.

---

## Worked Example

Illustrative only. Vite app on `http://localhost:5173`, `start_command=dev`.

```
$ npm install --save-dev cypress start-server-and-test
$ npx cypress verify
✔  Verified Cypress! /home/dev/.cache/Cypress/13.15.0/Cypress
$ npm run e2e
> start-server-and-test dev http://localhost:5173 cy:run
  (Run Finished)
       Spec              Tests  Passing  Failing
  ✔  smoke.cy.ts         1        1        -
```
With `cy.get('h6')`: `Timed out retrying after 4000ms: Expected to find element: h6, but never found it.` Screenshot written. Reverted, green.

---

## Exit Criteria

DONE when Cypress is verified, `cypress.config.ts` sets every listed key, `npm run e2e` starts the app and passes the smoke spec, and the spec has been seen to fail with a screenshot.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `cypress verify` fails on Linux with missing libraries | **Adjust**: install the OS packages listed on the Cypress "System requirements" docs page, or run inside the `cypress/included` image. |
| Phase 1 | `cypress.json` present | **Stop**: report a legacy config; migration is a separate task. |
| Phase 3 | "Cypress could not verify that this server is running" | **Retry** after confirming `curl -sf <app_url>` answers; check `baseUrl` port. |
| Phase 3 | Smoke spec passes when broken | **Stop**: the selector matches something else; fix before writing other specs. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
