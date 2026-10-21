# Cypress Custom Commands, App Actions and Page Objects

**One-line description:** Builds the Cypress layer between specs and pages: decides per interaction whether a typed custom command, an app action through the API, a small page object module or nothing is warranted, writes commands in `cypress/support/commands.ts` with their `Chainable` type declarations, and converts specs one at a time.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `cypress_config` (object, required): From `e2e-cypress-setup`.
- `selector_policy` (object, required): From `e2e-selector-policy`.
- `critical_journeys` (object[], required): From `e2e-journey-select`.

---

## Outputs

- `cypress_command_layer` (object): `{commands_file, types_file, commands[{name, signature}], page_modules[], specs_converted[], decision_log[]}`.

---

## Phase 1: Decide per Interaction

### Entry Criteria
- `cypress_config.smoke_pass_output` shows `Passing: 1`.

### Actions
1. List each repeated interaction in the journeys (login, add to cart, fill address).
2. Decide with this table (first matching row):

| Condition | Build |
|---|---|
| The interaction is a precondition, not the thing under test (create a cart before testing checkout) | App action: `cy.request()` to the API in a custom command, no UI clicks |
| The interaction is under test and reused by more than one spec | Custom command that drives the UI |
| A page has many element queries reused across specs | Plain module exporting selector functions (`export const cart = { checkout: () => cy.findByRole('button', { name: 'Checkout' }) }`) |
| Used by one spec | Nothing; inline |

3. Do not write page object classes that store elements in fields (`this.button = cy.get(...)`). Cypress commands are queued and yield later; a stored chain is not an element. Return a fresh chain from a function each time.
4. Do not `await` Cypress commands or assign their return value (`const el = cy.get(...)`); they are not promises.

### Output
`decision_log`.

### Quality Gate
- Every listed interaction has one row naming the table row that fired.

---

## Phase 2: Write Typed Commands

### Entry Criteria
- Decisions made.

### Actions
1. In `cypress/support/commands.ts`:
```ts
Cypress.Commands.add('addToCartViaApi', (sku: string, qty = 1) => {
  cy.request('POST', '/api/cart/items', { sku, qty }).its('status').should('eq', 201);
});
```
2. Declare the type in `cypress/support/index.d.ts`:
```ts
declare global {
  namespace Cypress {
    interface Chainable {
      addToCartViaApi(sku: string, qty?: number): Chainable<void>;
    }
  }
}
export {};
```
3. Import commands from `cypress/support/e2e.ts`: `import './commands';`.
4. App action endpoints must exist in the app. Confirm each with `curl -i -X POST <app_url>/api/cart/items -H 'content-type: application/json' -d '{"sku":"MUG-BLUE","qty":1}'` before writing the command. Never invent an endpoint.
5. Add one command, run `npx tsc --noEmit -p cypress`, then the next.

### Output
Commands and types.

### Quality Gate
- `npx tsc --noEmit -p cypress` exits 0.
- Every app action endpoint has a recorded `curl` response with a 2xx status.

---

## Phase 3: Convert Specs

### Entry Criteria
- Typecheck passes.

### Actions
1. Record baseline: `npx cypress run` summary (Passing count).
2. Convert one spec: replace precondition clicks with the app action command, keep the UI steps for the behavior under test.
3. Run `npx cypress run --spec cypress/e2e/<file>.cy.ts`, then the next spec.
4. Rerun the full suite; Passing count must equal the baseline.
5. Never add `it.skip` or remove assertions to recover the count.

### Output
`cypress_command_layer`.

### Quality Gate
- Full run Passing count equals baseline and Failing is 0.
- `grep -rnE "const .* = cy\.|await cy\." cypress/e2e cypress/support` prints nothing.

---

## Worked Example

Illustrative only. Journeys `checkout-card` and `apply-coupon` both start with a filled cart.

Phase 1: "add item to cart" is a precondition in both, so it becomes `cy.addToCartViaApi('MUG-BLUE')`. "Apply coupon" is under test in one spec only, so it stays inline.

Phase 2: `curl -i -X POST http://localhost:3000/api/cart/items ...` returns `HTTP/1.1 201 Created`.

Phase 3:
```
before: checkout.cy.ts  Passing 3   (Duration 0:21)
after:  checkout.cy.ts  Passing 3   (Duration 0:12)
```

---

## Exit Criteria

DONE when every repeated interaction has a decision, commands typecheck and are imported from the support file, and the converted suite passes the same count as before.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `Property 'addToCartViaApi' does not exist on type 'cy & CyEventEmitter'` | **Adjust**: the `.d.ts` is not included; add it to `include` in `cypress/tsconfig.json`. |
| Phase 2 | No API exists for a precondition | **Return**: report it; use the UI path in a command and ask the user whether a test-only endpoint may be added. |
| Phase 3 | `cy.request` fails with 401 | **Adjust**: run the auth session flow first; app actions need the session cookie. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
