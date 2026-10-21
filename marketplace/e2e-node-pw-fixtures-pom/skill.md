# Playwright Node Fixtures and Page Objects

**One-line description:** Builds the Playwright Test layer between specs and pages: decides per page whether a page object class, a plain helper function or nothing is warranted, exposes each page object through `test.extend` fixtures in one `e2e/fixtures.ts`, and converts specs to import `test` and `expect` from that file.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `pw_node_config` (object, required): From `e2e-node-pw-setup`.
- `selector_policy` (object, required): From `e2e-selector-policy`.
- `critical_journeys` (object[], required): From `e2e-journey-select`.

---

## Outputs

- `node_fixture_layer` (object): `{fixtures_file, page_objects[{class, file, methods[]}], helpers[], specs_converted[], decision_log[]}`.

---

## Phase 1: Decide the Abstraction per Page

### Entry Criteria
- `pw_node_config.smoke_pass_output` contains `1 passed`.

### Actions
1. List each page or widget touched by the journey steps, and how many journeys touch it.
2. Decide with this table (first matching row):

| Condition | Build |
|---|---|
| Touched by more than one journey, with several interactions | Page object class with intent-named methods (`addToCart(product)`) |
| One multi-step action reused (login form, cookie banner dismiss) | Plain async helper function, or a fixture if it needs setup/teardown |
| Needs setup and teardown around the test (seeded user, opened modal) | Fixture with code after `await use(...)` |
| Touched by one journey only | Nothing; inline locators in the spec |

3. Rules for page objects: methods perform actions and return nothing or another page object; assertions stay in specs (use `expect` in the spec), except a method may wait for its own completion (`await expect(this.toast).toBeVisible()` after submit) so callers do not race.
4. Locators are `readonly` fields built in the constructor from `selector_policy` rank 1 to 4 calls. Never store `ElementHandle` (`page.$`); locators are lazy and re-query on each use.

### Output
`decision_log` per page.

### Quality Gate
- Every page in step 1 has exactly one row in `decision_log` with the table row that fired.

---

## Phase 2: Write Page Objects and fixtures.ts

### Entry Criteria
- Decisions made.

### Actions
1. One class per file under `e2e/pages/`. Example:
```ts
import { type Page, type Locator, expect } from '@playwright/test';

export class CartPage {
  readonly checkoutButton: Locator;
  readonly count: Locator;
  constructor(readonly page: Page) {
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
    this.count = page.getByTestId('cart-count');
  }
  async goto() { await this.page.goto('/cart'); }
  async checkout() { await this.checkoutButton.click(); }
}
```
2. Create `e2e/fixtures.ts`:
```ts
import { test as base } from '@playwright/test';
import { CartPage } from './pages/cart-page';

type Pages = { cartPage: CartPage };

export const test = base.extend<Pages>({
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
});
export { expect } from '@playwright/test';
```
3. Fixtures are lazy: a test that does not list `cartPage` in its arguments never builds it. Do not mark page fixtures `{ auto: true }`.
4. Write one class, run `npx tsc --noEmit -p .` (or the project's typecheck script), then write the next. Do not create all files in one pass.
5. Use only methods that exist on `Page` and `Locator` in the installed version; check `node_modules/playwright-core/types/types.d.ts` with grep before calling an unfamiliar method.

### Output
Page objects and `fixtures.ts`.

### Quality Gate
- `npx tsc --noEmit` exits 0.
- `grep -rn "page\.\$\|elementHandle" e2e/pages` prints nothing.

---

## Phase 3: Convert Specs

### Entry Criteria
- Typecheck passes.

### Actions
1. In each spec, replace `import { test, expect } from '@playwright/test'` with `import { test, expect } from './fixtures'` (adjust the relative path). Convert one spec, run it, then the next.
2. Request fixtures by name: `test('checkout', async ({ cartPage }) => { await cartPage.goto(); ... })`.
3. Run the full suite: `npx playwright test`. The pass count must equal the count before conversion; record both.
4. Do not delete or `test.skip` a spec that fails after conversion. Diff it against the old version and fix the conversion.

### Output
`node_fixture_layer`.

### Quality Gate
- `grep -rln "from '@playwright/test'" e2e/*.spec.ts` prints nothing.
- `npx playwright test` passed count after conversion equals the count before.

---

## Worked Example

Illustrative only. Journeys `checkout-card` and `apply-coupon` both use the cart page; only `delete-account` uses the settings page.

Phase 1 `decision_log`:
```
cart page      2 journeys, 4 interactions -> page object CartPage
settings page  1 journey                  -> inline locators
login form     used by 3 journeys         -> fixture (moved to auth flow later)
```
Phase 3:
```
before: $ npx playwright test  ->  5 passed (14.2s)
after:  $ npx playwright test  ->  5 passed (13.9s)
$ grep -rln "from '@playwright/test'" e2e/*.spec.ts
(no output)
```

---

## Exit Criteria

DONE when every page has a recorded decision, page objects and `fixtures.ts` typecheck, all specs import from `fixtures.ts`, and the pass count is unchanged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `Fixture "x" has unknown parameter` | **Adjust**: the fixture name in the test signature does not match the key in `base.extend`; fix the spelling. |
| Phase 3 | Pass count drops after conversion | **Stop**: revert that spec with `git checkout -- <file>` and convert it again step by step. |
| Phase 3 | Circular import between page objects | **Adjust**: return a new page object from the method via a lazy `import type` and construct it in the caller. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
