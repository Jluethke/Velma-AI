# Cypress Test Data Seeding and Cleanup

**One-line description:** Seeds Cypress test data through `cy.task()` handlers registered in `setupNodeEvents` (for database or CLI access) or `cy.request()` (for HTTP APIs), resets state in `beforeEach` rather than `after`, makes identities unique with `Cypress._.uniqueId` plus a run id, and proves isolation by running the suite twice.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `cypress_command_layer` (object, required): From `e2e-cypress-commands-pom`.
- `seed_api` (object, optional): `{kind: "http"|"db"|"cli", create_endpoints[], delete_endpoints[], reset_command}`.

---

## Outputs

- `cypress_data_tasks` (object): `{tasks[{name, does}], commands[], reset_location, unique_key_rule, double_run_output}`.

---

## Phase 1: Choose the Seeding Path

### Entry Criteria
- `cypress_command_layer.commands_file` exists.

### Actions
1. First available row:

| Available | Use |
|---|---|
| HTTP API that creates and deletes records | `cy.request()` inside a custom command |
| DB access or a seed CLI (`npm run db:seed`, `rails db:seed`) | `cy.task()` handler in `setupNodeEvents`; the handler runs in Node, not the browser |
| Neither | Stop and ask |

2. Verify each call by hand (`curl -i` or run the CLI) and record the result.

### Output
Chosen path.

### Quality Gate
- Each call has a recorded 2xx status or exit code 0.

---

## Phase 2: Register Tasks and Commands

### Entry Criteria
- Calls verified.

### Actions
1. For DB or CLI seeding, in `cypress.config.ts`:
```ts
import { execSync } from 'node:child_process';

setupNodeEvents(on, config) {
  on('task', {
    'db:reset'() {
      execSync('npm run db:reset:test', { stdio: 'inherit' });
      return null;
    },
    'db:createProduct'({ sku }: { sku: string }) {
      const out = execSync(`node scripts/create-product.mjs ${sku}`).toString();
      return JSON.parse(out);
    },
  });
  return config;
},
```
   A task must return a value or `null`; returning `undefined` fails the test with an error that says so.
2. For HTTP seeding, a custom command: `Cypress.Commands.add('createProduct', (sku: string) => cy.request('POST', '/api/admin/products', { sku }).its('body'))`, typed in `index.d.ts`.
3. Unique key rule: `const sku = \`e2e-${Cypress._.uniqueId()}-${Date.now()}\``. `uniqueId` restarts per spec file, so it is combined with a time component; never use a fixed identity.
4. Reset in `beforeEach`, not `after`/`afterEach`. Cypress docs recommend cleaning state before tests: an `after` hook does not run if the runner is stopped mid-spec, which leaves dirty data for the next run.
5. Do not import DB clients into spec files; specs run in the browser and cannot open DB connections.

### Output
Tasks and commands.

### Quality Gate
- `npx tsc --noEmit -p cypress` exits 0.
- `grep -rnE "^\s*(after|afterEach)\(" cypress/e2e` prints no hook that deletes data.

---

## Phase 3: Prove Isolation

### Entry Criteria
- Tasks and commands written.

### Actions
1. Run twice: `npx cypress run && npx cypress run`.
2. Interrupt test: start `npx cypress run`, press Ctrl+C partway, then run `npx cypress run` again. It must pass, which proves the `beforeEach` reset handles dirty state.
3. Record both summaries as `double_run_output`.

### Output
`cypress_data_tasks`.

### Quality Gate
- Both full runs show `Failing: 0`.
- The run after the interrupted run shows `Failing: 0`.

---

## Worked Example

Illustrative only. `seed_api={kind:"cli", reset_command:"npm run db:reset:test"}`.

```ts
beforeEach(() => {
  cy.task('db:reset');
  cy.task('db:createProduct', { sku: `e2e-${Cypress._.uniqueId()}-${Date.now()}` }).as('product');
});
```
```
$ npx cypress run && npx cypress run
  ✔  All specs passed!   00:31   5   5   -
  ✔  All specs passed!   00:30   5   5   -
```
First draft returned nothing from `db:reset`; the run failed with "The task 'db:reset' returned undefined. You must return a value, null, or a promise". Added `return null`.

---

## Exit Criteria

DONE when test data comes from tasks or API commands with unique identities, state is reset in `beforeEach`, and two consecutive runs plus a run after an interrupt all pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No API, DB or CLI path | **Stop**: ask the user for a seeding method. |
| Phase 2 | Task times out | **Adjust**: the default `taskTimeout` is 60000 ms; measure the reset command with `time` and raise it only to the measured value plus a recorded margin. |
| Phase 3 | Run after interrupt fails | **Adjust**: move the cleanup that lives in `after` into the `beforeEach` reset. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
