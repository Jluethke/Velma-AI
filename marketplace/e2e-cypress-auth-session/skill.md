# Cypress Auth Reuse with cy.session

**One-line description:** Wraps login in a `cy.login(role)` custom command that uses `cy.session()` with a role-based id, an API login in the setup function, a `validate` callback that proves the session is still live, and `cacheAcrossSpecs: true`, so each role logs in once per run, and keeps one spec that drives the real login form.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `cypress_command_layer` (object, required): From `e2e-cypress-commands-pom`.
- `cypress_data_tasks` (object, required): From `e2e-cypress-data-seed`; used when accounts are created per run.
- `test_accounts` (object, required): `{roles: [{role, username_env, password_env}]}`. Environment variable names only.

---

## Outputs

- `cypress_auth_session` (object): `{command_name, session_ids[], validate_request, login_ui_spec, verification_output}`.

---

## Phase 1: Write cy.login with cy.session

### Entry Criteria
- Cypress 12 or later (`npx cypress --version`); `cy.session` is generally available from 12.0.

### Actions
1. Pass credentials through Cypress env, not source: run with `CYPRESS_MEMBER_EMAIL=... CYPRESS_MEMBER_PASSWORD=...`; read with `Cypress.env('MEMBER_EMAIL')`. Env vars with the `CYPRESS_` prefix are picked up automatically.
2. In `cypress/support/commands.ts`:
```ts
Cypress.Commands.add('login', (role: 'member' | 'admin') => {
  const email = Cypress.env(`${role.toUpperCase()}_EMAIL`);
  const password = Cypress.env(`${role.toUpperCase()}_PASSWORD`);
  cy.session(
    ['login', role],
    () => {
      cy.request('POST', '/api/session', { email, password }).its('status').should('eq', 200);
    },
    {
      validate() {
        cy.request('/api/me').its('status').should('eq', 200);
      },
      cacheAcrossSpecs: true,
    },
  );
});
```
3. The session id (`['login', role]`) must include everything that changes the session. Two different users under one id return the wrong cached session.
4. `validate` must fail when the session is dead; Cypress then reruns setup. A validate that only checks a cookie exists does not detect server-side expiry.
5. Add `login(role: 'member' | 'admin'): Chainable<void>` to `cypress/support/index.d.ts`.

### Output
`cy.login` command.

### Quality Gate
- `npx tsc --noEmit -p cypress` exits 0.
- `grep -n "cacheAcrossSpecs" cypress/support/commands.ts` prints the line.

---

## Phase 2: Use It and Verify Caching

### Entry Criteria
- Command typechecks.

### Actions
1. In specs: `beforeEach(() => { cy.login('member'); cy.visit('/account'); })`. `cy.session` clears the page, so `cy.visit` must come after `cy.login`.
2. Remove UI login steps from other specs, one spec at a time, running each after editing.
3. Keep `cypress/e2e/login.cy.ts` that does not call `cy.login` and drives the real form.
4. Verify caching: run `npx cypress open`, open two specs in sequence, and in the Command Log expand the `session` entry. The first shows "Session created"; later ones show "Session restored". In `cypress run` there is no log UI; instead count login requests by adding `cy.intercept('POST', '/api/session').as('login')` temporarily and checking the alias count, then remove it.

### Output
`cypress_auth_session`.

### Quality Gate
- Full `npx cypress run` Passing count equals the baseline and Failing is 0.
- `grep -rln "Password" cypress/e2e | wc -l` equals the number of specs that deliberately test login.

---

## Worked Example

Illustrative only. Two roles, 6 specs.
```
$ CYPRESS_MEMBER_EMAIL=m@shop.test CYPRESS_MEMBER_PASSWORD=... CYPRESS_ADMIN_EMAIL=a@shop.test CYPRESS_ADMIN_PASSWORD=... npx cypress run
  ✔  All specs passed!   00:48   14   14   -      (was 01:37 with form login in each test)
```
Command Log in `cypress open`, second spec: `session  login,member  (restored)`.

---

## Exit Criteria

DONE when every spec signs in through `cy.login(role)` backed by `cy.session` with a role-scoped id, a validate that hits the server and cross-spec caching, and one spec still covers the real login form.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No login API | **Adjust**: drive the form inside the `cy.session` setup function; caching still removes the repeat cost. |
| Phase 1 | Login redirects to another origin (SSO) | **Adjust**: wrap the identity provider steps in `cy.origin('<idp origin>', () => {...})` inside the setup function. |
| Phase 2 | Blank page after `cy.login` | **Adjust**: `cy.visit` was called before `cy.login`; reorder. |
| Phase 2 | Wrong user's data appears | **Stop**: session id does not include the role or user; fix the id. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
