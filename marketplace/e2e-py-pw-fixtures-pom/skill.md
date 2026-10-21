# pytest-playwright Fixtures and Page Objects

**One-line description:** Builds the Python layer between tests and pages: decides per page whether a page object class, a fixture or nothing is warranted, writes page objects under `e2e/pages/`, exposes them as function-scoped fixtures in `e2e/conftest.py`, and keeps assertions in the tests with `playwright.sync_api.expect`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `pw_py_config` (object, required): From `e2e-py-pw-setup`.
- `selector_policy` (object, required): From `e2e-selector-policy`.
- `critical_journeys` (object[], required): From `e2e-journey-select`.

---

## Outputs

- `py_fixture_layer` (object): `{conftest_path, page_objects[{class, file, methods[]}], fixtures[{name, scope}], tests_converted[], decision_log[]}`.

---

## Phase 1: Decide the Abstraction per Page

### Entry Criteria
- `pw_py_config.smoke_pass_output` contains `1 passed`.

### Actions
1. List each page touched by the journey steps and the journeys that touch it.
2. Decide with this table (first matching row):

| Condition | Build |
|---|---|
| Touched by more than one journey, with several interactions | Page object class |
| Needs setup/teardown around a test | Fixture with `yield` and cleanup after it |
| One reused multi-step action without teardown | Plain function in `e2e/helpers.py` |
| Touched by one journey only | Nothing; inline locators |

3. Scope rules: the built-in `page` and `context` fixtures are function scoped and `browser` is session scoped. A fixture that takes `page` must be function scoped too, or pytest raises `ScopeMismatch`.

### Output
`decision_log`.

### Quality Gate
- Each page from step 1 has one `decision_log` row naming the table row that fired.

---

## Phase 2: Write Page Objects and conftest.py

### Entry Criteria
- Decisions made.

### Actions
1. One class per module in `e2e/pages/` (add `e2e/pages/__init__.py`):
```python
from playwright.sync_api import Page


class CartPage:
    def __init__(self, page: Page) -> None:
        self.page = page
        self.checkout_button = page.get_by_role("button", name="Checkout")
        self.count = page.get_by_test_id("cart-count")

    def goto(self) -> None:
        self.page.goto("/cart")

    def checkout(self) -> None:
        self.checkout_button.click()
```
2. In `e2e/conftest.py`:
```python
import pytest
from playwright.sync_api import Page
from e2e.pages.cart_page import CartPage


@pytest.fixture
def cart_page(page: Page) -> CartPage:
    return CartPage(page)
```
   If `from e2e.pages...` fails to import, set `pythonpath = ["."]` in `[tool.pytest.ini_options]` instead of editing `sys.path` in code.
3. Use snake_case Python method names (`get_by_role`, `to_have_text`); the camelCase names from Node docs do not exist in Python. Check with `python -c "from playwright.sync_api import Locator; print([m for m in dir(Locator) if 'role' in m])"` before using an unfamiliar method.
4. Write one module, run `pytest e2e --collect-only -q`, then the next.

### Output
Page objects and conftest fixtures.

### Quality Gate
- `pytest e2e --collect-only -q` exits 0.
- `pytest --fixtures e2e | grep cart_page` lists the fixture.

---

## Phase 3: Convert Tests

### Entry Criteria
- Collection passes.

### Actions
1. Record the baseline: `pytest e2e -q | tail -1`.
2. Convert one test file at a time to request the fixture: `def test_checkout(cart_page: CartPage) -> None:`. Keep `expect(...)` calls in the test.
3. Run that file; then the next.
4. Rerun `pytest e2e -q | tail -1`; the passed count must equal the baseline.
5. Never add `@pytest.mark.skip` or delete a test to restore the count.

### Output
`py_fixture_layer`.

### Quality Gate
- Passed count after equals before.
- `grep -rn "from e2e.pages" e2e/test_*.py` shows imports only for type hints; objects are built only in `conftest.py` (`grep -rn "Page(page)" e2e/test_*.py` prints nothing).

---

## Worked Example

Illustrative only.
```
$ pytest e2e -q | tail -1
4 passed in 9.12s
$ pytest --fixtures e2e | grep -A1 cart_page
cart_page -- e2e/conftest.py:8
$ pytest e2e -q | tail -1
4 passed in 8.97s
```
A first attempt made `cart_page` session scoped and pytest printed `ScopeMismatch: You tried to access the function scoped fixture page with a session scoped request object`; scope removed, rerun green.

---

## Exit Criteria

DONE when every page has a decision, page objects load through function-scoped fixtures in `conftest.py`, and the converted suite passes the same count as before.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `ModuleNotFoundError: No module named 'e2e'` | **Adjust**: add `pythonpath = ["."]` to pytest config and an `e2e/__init__.py`. |
| Phase 2 | `ScopeMismatch` | **Adjust**: make the fixture function scoped. |
| Phase 3 | Passed count drops | **Stop**: `git checkout -- <file>` and convert again one test at a time. |
| Phase 3 | `AttributeError: 'Locator' object has no attribute 'getByRole'` | **Adjust**: use the snake_case name `get_by_role`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
