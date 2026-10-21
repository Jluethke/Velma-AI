# Cypress Network Control with cy.intercept

**One-line description:** Implements the `mock` rows of the backend plan in Cypress: stubs third-party calls with `cy.intercept()` and fixture files recorded from the real service, blocks noise hosts with `blockHosts`, spies on owned-backend calls with aliases and `cy.wait('@alias')` instead of fixed waits, and forces error states with `statusCode` stubs in separate tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `backend_plan` (object[], required): From `e2e-mock-vs-real-decide`.

---

## Outputs

- `cypress_intercepts` (object): `{block_hosts[], fixture_files[], spy_aliases[], error_case_specs[], match_proof[]}`.

---

## Phase 1: Block Noise and Spy on Owned Calls

### Entry Criteria
- `backend_plan` exists.

### Actions
1. For rule 4 hosts, add to `cypress.config.ts` top level: `blockHosts: ['*.google-analytics.com', '*.doubleclick.net']`. Blocked requests get a 503 from Cypress without reaching the network.
2. For owned-backend calls that the test waits on, spy without stubbing (request goes to the real server):
```ts
cy.intercept('POST', '/api/orders').as('createOrder');
cy.findByRole('button', { name: 'Place order' }).click();
cy.wait('@createOrder').its('response.statusCode').should('eq', 201);
```
3. Replace every `cy.wait(<number>)` in specs with an alias wait or an assertion on the UI. Find them: `grep -rnE "cy\.wait\([0-9]" cypress/e2e`.
4. Define intercepts before the action that triggers the request (normally before `cy.visit`).

### Output
Block list and spies.

### Quality Gate
- `grep -rnE "cy\.wait\([0-9]" cypress/e2e` prints nothing.
- Each spy alias is followed by a `cy.wait('@alias')` with a status assertion.

---

## Phase 2: Stub Third-Party Calls from Recorded Fixtures

### Entry Criteria
- Rule 5 rows exist.

### Actions
1. Record the real response once: `curl -s '<sandbox url>' -H '<auth header from env>' > cypress/fixtures/tax-rates.json`. Scrub tokens and personal data, then commit.
2. Stub:
```ts
cy.intercept('GET', 'https://api.taxrates.example/v1/rates*', { fixture: 'tax-rates.json' }).as('taxRates');
```
3. Matching rules: a string URL is matched with glob semantics against the full URL; use `**` for any path segment and `*` before a query string, or pass a RegExp, or a `RouteMatcher` object `{ method, hostname, pathname }` for clarity.
4. Later-defined intercepts take precedence over earlier ones for the same request; when a stub "does not apply", check for a broader intercept defined after it.

### Output
Fixture files and stubs.

### Quality Gate
- `grep -ciE "authorization|bearer|password" cypress/fixtures/*.json` prints 0 per file, or each hit was reviewed.
- Each stub alias is waited on with `cy.wait('@taxRates')` in at least one spec.

---

## Phase 3: Error State Specs and Match Proof

### Entry Criteria
- Rule 6 rows exist.

### Actions
1. One `it` per error case:
```ts
it('shows sold-out message when order returns 409', () => {
  cy.intercept('POST', '/api/orders', { statusCode: 409, body: { error: 'out_of_stock' } }).as('createOrder');
  // ... drive checkout ...
  cy.wait('@createOrder');
  cy.findByRole('alert').should('have.text', 'This item just sold out');
});
```
2. For timeouts or network failure use `{ forceNetworkError: true }`; for slow responses use `{ delay: <ms>, fixture: ... }` with the delay taken from the requirement being tested.
3. Prove the stub matched: the `cy.wait('@alias')` fails with "No request ever occurred" when it did not. Then remove the intercept once and confirm the spec fails; restore it.

### Output
`cypress_intercepts`.

### Quality Gate
- Each error spec contains a `cy.wait('@...')` on its stub alias.
- Removing the stub makes the spec fail (run once, restore).

---

## Worked Example

Illustrative only.
```
$ grep -rnE "cy\.wait\([0-9]" cypress/e2e
cypress/e2e/checkout.cy.ts:31:    cy.wait(3000);
```
Line 31 replaced by `cy.wait('@createOrder').its('response.statusCode').should('eq', 201)`.
```
$ npx cypress run --spec cypress/e2e/checkout.cy.ts
  ✔  checkout.cy.ts   00:09   4   4   -     (was 00:15)
```
With the 409 stub removed: `CypressError: Timed out retrying after 4000ms: Expected to find element: [role=alert]` style failure. Restored, green.

---

## Exit Criteria

DONE when noise hosts are blocked, fixed waits are replaced by alias waits, third-party calls are stubbed from scrubbed recorded fixtures, and every error state has a spec that proves its stub matched.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `cy.wait('@x')` times out with "No request ever occurred" | **Adjust**: the intercept was registered after the request or the URL does not match; log `req.url` in a temporary `cy.intercept('**', (req) => console.log(req.url))`. |
| Phase 2 | Request from an iframe or another origin not intercepted | **Adjust**: confirm `chromeWebSecurity` setting and that the request is made by the app under test; record it in the open risks. |
| Phase 3 | Spec passes with the stub removed | **Stop**: the spec does not observe the error path; fix the assertion. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
