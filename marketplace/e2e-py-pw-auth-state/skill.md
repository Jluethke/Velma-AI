# pytest-playwright Auth State Reuse

**One-line description:** Logs in once per pytest session (once per xdist worker, coordinated with a file lock), saves the session with `context.storage_state(path=...)`, injects it into every test by overriding the `browser_context_args` fixture, and keeps one test that drives the real login form.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `pw_py_config` (object, required): From `e2e-py-pw-setup`.
- `py_data_fixtures` (object, required): From `e2e-py-pw-data-seed`; provides the `api` request context.
- `test_accounts` (object, required): `{roles: [{role, username_env, password_env}]}`. Environment variable names only.

---

## Outputs

- `py_auth_setup` (object): `{state_fixture, state_path, xdist_safe: bool, login_ui_test, verification_output}`.

---

## Phase 1: Write the Session State Fixture

### Entry Criteria
- `py_data_fixtures.api_context_fixture` exists.

### Actions
1. Find where the session lives (DevTools Application tab after manual login). `storage_state` saves cookies and `localStorage`, not `sessionStorage`.
2. In `e2e/conftest.py`:
```python
import os
from pathlib import Path

import pytest
from filelock import FileLock
from playwright.sync_api import Browser


def _login_and_save(browser: Browser, base_url: str, path: Path) -> None:
    context = browser.new_context(base_url=base_url)
    page = context.new_page()
    page.goto("/login")
    page.get_by_label("Email").fill(os.environ["E2E_MEMBER_EMAIL"])
    page.get_by_label("Password").fill(os.environ["E2E_MEMBER_PASSWORD"])
    page.get_by_role("button", name="Sign in").click()
    page.get_by_role("heading", name="Dashboard").wait_for()
    context.storage_state(path=str(path))
    context.close()


@pytest.fixture(scope="session")
def member_state(browser: Browser, base_url: str, tmp_path_factory, worker_id: str) -> str:
    root = tmp_path_factory.getbasetemp().parent
    path = root / "member_state.json"
    with FileLock(str(path) + ".lock"):
        if not path.is_file():
            _login_and_save(browser, base_url, path)
    return str(path)
```
3. The `tmp_path_factory.getbasetemp().parent` plus `FileLock` pattern is the one pytest-xdist documents for "making session-scoped fixtures execute only once"; it makes all workers share one login. Add `filelock` as a dev dependency.
4. If tests change user-level state, skip the lock and write per worker: `path = root / f"member_state_{worker_id}.json"`, with an account per worker from `py_data_fixtures`.

### Output
Session state fixture.

### Quality Gate
- `pytest --fixtures e2e | grep member_state` lists it.
- `python -c "import filelock"` exits 0 in the test environment.

---

## Phase 2: Inject State into Every Context

### Entry Criteria
- Fixture written.

### Actions
1. Override `browser_context_args` (session scoped in pytest-playwright) in `e2e/conftest.py`:
```python
@pytest.fixture(scope="session")
def browser_context_args(browser_context_args: dict, member_state: str) -> dict:
    return {**browser_context_args, "storage_state": member_state}
```
   Always merge the incoming dict; replacing it drops options such as `base_url` and viewport from the plugin.
2. For tests that must be signed out, mark them and override per test: `@pytest.mark.browser_context_args(storage_state=None)` works in pytest-playwright versions that support the marker (check `pytest --markers | grep browser_context_args`); otherwise create a fresh context in the test with `browser.new_context()`.

### Output
State applied to all tests.

### Quality Gate
- A test that does `page.goto("/account")` and asserts a signed-in heading passes with no login steps.

---

## Phase 3: Verify and Keep One Real Login Test

### Entry Criteria
- State injected.

### Actions
1. Keep `e2e/test_login.py` signed out, driving the form and asserting the dashboard heading.
2. Remove form login from other tests one file at a time; run each.
3. Run `pytest e2e -n 4 -q` and confirm in output or logs that login ran once (add a `print` in `_login_and_save` temporarily and run with `-s`, then remove it).
4. Add the state file location to `.gitignore` if it is inside the repo.

### Output
`py_auth_setup`.

### Quality Gate
- Full run pass count equals the baseline.
- With the temporary print and `-s`, the login message appears once (shared) or once per worker (per-worker).

---

## Worked Example

Illustrative only.
```
$ uv add --dev filelock
$ uv run pytest e2e -n 4 -q -s | grep "logging in"
logging in member
$ uv run pytest e2e -n 4 -q
........                                               [100%]
8 passed in 7.31s     (was 8 passed in 19.80s with form login per test)
```

---

## Exit Criteria

DONE when login happens once per session (or per worker by choice), every context starts with the saved state through a merged `browser_context_args`, and one test still covers the real login form.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `fixture 'worker_id' not found` | **Adjust**: install pytest-xdist or remove the parameter and the lock. |
| Phase 2 | Tests lose `base_url` after override | **Adjust**: merge with `{**browser_context_args, ...}` instead of returning a new dict. |
| Phase 3 | Signed-in check redirects to `/login` | **Adjust**: the session lives in `sessionStorage`; set it with `context.add_init_script` in a per-test fixture. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
