# E2E Selector Policy: Roles First, Test IDs Second

**One-line description:** Writes the project's locator policy as a ranked table (role plus accessible name, label, text, test id, last-resort CSS), configures the test id attribute for the chosen runner, audits existing specs with grep for banned selector shapes, and adds missing test ids to the app only where no role or label can identify the element.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `stack` (string, required): `playwright-node`, `playwright-python` or `cypress`.
- `critical_journeys` (object[], required): From `e2e-journey-select`; every step names an element by role and visible text.

---

## Outputs

- `selector_policy` (object): `{ranked_locators[], test_id_attribute, banned_patterns[], audit_command, audit_findings[], test_ids_added[{file, element, value}]}`.

---

## Phase 1: Write the Ranked Policy

### Entry Criteria
- `stack` is one of the three values.

### Actions
1. Use this ranking. Take the first row that uniquely identifies the element:

| Rank | Locator | playwright-node | playwright-python | cypress |
|---|---|---|---|---|
| 1 | Role + accessible name | `page.getByRole('button', { name: 'Place order' })` | `page.get_by_role("button", name="Place order")` | `cy.findByRole('button', { name: 'Place order' })` (needs `@testing-library/cypress`) |
| 2 | Form label | `page.getByLabel('Email')` | `page.get_by_label("Email")` | `cy.findByLabelText('Email')` |
| 3 | Visible text (non-interactive) | `page.getByText('Order confirmed')` | `page.get_by_text("Order confirmed")` | `cy.contains('Order confirmed')` |
| 4 | Test id | `page.getByTestId('cart-count')` | `page.get_by_test_id("cart-count")` | `cy.get('[data-cy=cart-count]')` |
| 5 | CSS on a stable attribute | `page.locator('[name="q"]')` | `page.locator('[name="q"]')` | `cy.get('[name="q"]')` |

2. Banned shapes (record in `banned_patterns`): XPath on structure (`//div[3]/span`), `nth-child`, generated class names (CSS module hashes like `_btn_x7f3a`, utility classes like `.mt-4`), text inside an `id` that changes per build, and Playwright `.first()`/`.nth()` added only to silence a strict mode error.
3. Rank 1 is preferred because it also checks the element is exposed to assistive technology; a button without an accessible name fails it, which is a real defect.
4. To narrow, chain inside a region instead of using `nth`: `page.getByRole('row', { name: 'Blue mug' }).getByRole('button', { name: 'Remove' })`.

### Output
Ranked policy.

### Quality Gate
- The table names one concrete call per rank for the chosen `stack`.
- `banned_patterns` lists at least the shapes in step 2.

---

## Phase 2: Configure the Test Id Attribute

### Entry Criteria
- Policy written.

### Actions
1. Check which attribute the app already uses: `grep -rhoE 'data-(testid|test-id|test|cy|qa)=' src app components 2>/dev/null | sort | uniq -c`.
2. Keep the attribute with the highest count. If none exist, use the runner default: `data-testid` for Playwright, `data-cy` for Cypress (the attribute Cypress docs use in their best practices).
3. Configure it, one row:

| stack | Setting |
|---|---|
| playwright-node | `use: { testIdAttribute: 'data-qa' }` in `playwright.config.ts` (only if not `data-testid`) |
| playwright-python | in `conftest.py`: `@pytest.fixture(scope="session", autouse=True)` that calls `playwright.selectors.set_test_id_attribute("data-qa")` (the `playwright` fixture is session scoped) |
| cypress | `npm i -D @testing-library/cypress`, add `import '@testing-library/cypress/add-commands'` to `cypress/support/e2e.ts`, add `"@testing-library/cypress"` to `types` in `cypress/tsconfig.json` |

### Output
`test_id_attribute` configured.

### Quality Gate
- For Playwright: a spec using `getByTestId`/`get_by_test_id` on a known element passes.
- For Cypress: a spec calling `cy.findByRole` runs without `cy.findByRole is not a function`.

---

## Phase 3: Audit Specs and Add Missing Hooks

### Entry Criteria
- Attribute configured.

### Actions
1. Run the audit and save it as `audit_command`:
```
grep -rnE "xpath=|//[a-z]+\[|nth-child|\.nth\(|\.first\(\)|locator\('\.[a-zA-Z_-]+|cy\.get\('\.[a-zA-Z_-]+" e2e cypress tests 2>/dev/null
```
2. Record each hit in `audit_findings` with file, line and the rank that should replace it.
3. For each journey step, find its locator with the runner's tool: `npx playwright codegen <app_url>` (Node), `playwright codegen <app_url>` (Python), Selector Playground in `npx cypress open` (Cypress). Accept the suggestion only if it is rank 1 to 4.
4. If no rank 1 to 3 locator is unique, add the test id to the app source. Edit one component file, rerun its unit tests, then move to the next. Record each in `test_ids_added`.
5. Do not change visible text or ARIA attributes to make a test pass; that changes the product.

### Output
`selector_policy`.

### Quality Gate
- `audit_command` output, rerun after fixes made in this flow, has no hit in files this flow touched.
- Each entry in `test_ids_added` has a matching `git diff` hunk and the component's unit tests pass.

---

## Worked Example

Illustrative only. `stack=playwright-node`, app uses `data-testid` (37 occurrences).

Phase 2: `grep ... | uniq -c` prints `37 data-testid=`; default kept, no config change.

Phase 3 audit:
```
e2e/cart.spec.ts:14:  await page.locator('.cart__badge').textContent();
e2e/cart.spec.ts:22:  await page.locator('button').nth(2).click();
```
Fixes: line 22 becomes `page.getByRole('button', { name: 'Checkout' })` (rank 1). Line 14 badge has no role or label; added `data-testid="cart-count"` to `src/components/CartBadge.tsx`, `npm test -- CartBadge` passes, spec now uses `await expect(page.getByTestId('cart-count')).toHaveText('2')`.

---

## Exit Criteria

DONE when the ranked policy and banned shapes are written, the test id attribute is configured, and every audit hit in touched files is replaced by a rank 1 to 4 locator.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Element has no accessible name (icon button) | **Return**: report it as an accessibility defect to the user; use a test id meanwhile. |
| Phase 2 | Two test id attributes in heavy use | **Return**: show both counts; ask the user which to standardize on. |
| Phase 3 | Strict mode violation "resolved to 2 elements" | **Adjust**: scope the locator inside a parent region; do not add `.first()`. |
| Phase 3 | Adding a test id breaks a snapshot unit test | **Adjust**: update that snapshot only, show the diff to the user. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
