# Playwright Setup for Python with pytest-playwright

**One-line description:** Installs `pytest-playwright` and one browser, pins `--base-url`, `--browser`, `--tracing`, `--video`, `--screenshot` and `--output` in the pytest config, starts the app before the run, and proves the setup with one smoke test that passes and is seen to fail.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `app_url` (string, required): URL the app serves on, for example `http://localhost:8000`.
- `runner_decision` (object, required): From `e2e-runner-select`; `stack` must be `playwright-python`.
- `start_command` (string, optional): Command that starts the app, for example `python manage.py runserver 8000`.

---

## Outputs

- `pw_py_config` (object): `{config_file, test_dir, playwright_version, pytest_addopts, start_procedure, smoke_test_path, smoke_pass_output, smoke_fail_output}`.

---

## Phase 1: Install Into the Project Environment

### Entry Criteria
- `runner_decision.stack == "playwright-python"`.
- A virtual environment is active: `python -c "import sys; print(sys.prefix != sys.base_prefix)"` prints `True` (or the project uses `uv`/`poetry` and you prefix commands with `uv run`/`poetry run`).

### Actions
1. Add the dependency with the project's own tool, one row only:

| Project file | Command |
|---|---|
| `uv.lock` | `uv add --dev pytest-playwright` |
| `poetry.lock` | `poetry add --group dev pytest-playwright` |
| `requirements-dev.txt` | append `pytest-playwright`, then `pip install -r requirements-dev.txt` |

2. Install the browser: `playwright install --with-deps chromium` (Linux needs sudo for `--with-deps`).
3. Record `playwright --version` as `playwright_version`.
4. Add `test-results/` and `.auth/` to `.gitignore`.
5. Use the sync API (`from playwright.sync_api import Page, expect`) in tests. pytest-playwright fixtures (`page`, `context`, `browser`) are sync; do not mix `async def` tests with them.

### Output
Installed plugin and browser.

### Quality Gate
- `pytest --help | grep -E -- "--base-url|--tracing|--browser "` prints all three options (proves the plugin loaded).
- `playwright --version` prints a version.

---

## Phase 2: Pin the pytest Options

### Entry Criteria
- Plugin loaded.

### Actions
1. Put options in the one file that already holds pytest config (`pyproject.toml` `[tool.pytest.ini_options]`, else `pytest.ini`). Merge into existing `addopts`; never replace them:
```toml
[tool.pytest.ini_options]
testpaths = ["e2e"]
addopts = "--base-url=http://localhost:8000 --browser=chromium --tracing=retain-on-failure --video=retain-on-failure --screenshot=only-on-failure --output=test-results"
```
2. `--base-url` comes from the `pytest-base-url` plugin that pytest-playwright installs; `page.goto("/")` then resolves against it.
3. Keep E2E tests in their own directory (`e2e/`) so unit runs can exclude them with `--ignore=e2e`.
4. pytest-playwright has no `webServer` option. Choose the start procedure by row:

| Situation | Procedure |
|---|---|
| CI and local both start the app by shell | `<start_command> &` then poll: `until curl -sf <app_url> >/dev/null; do sleep 1; done` wrapped in `timeout <seconds>` where seconds = measured start time plus margin you record |
| Django with `pytest-django` | Use the `live_server` fixture and pass `live_server.url` instead of `--base-url` |
| App started by docker compose | `docker compose up -d --wait` (compose healthchecks required) |

### Output
pytest config and start procedure.

### Quality Gate
- `pytest e2e --collect-only -q` exits 0.
- `git diff pyproject.toml` (or `pytest.ini`) shows the old `addopts` values still present.

---

## Phase 3: Smoke Test Proves the Setup

### Entry Criteria
- Collection succeeds and the app answers at `app_url`.

### Actions
1. Create `e2e/test_smoke.py`:
```python
from playwright.sync_api import Page, expect


def test_home_page_renders_main_heading(page: Page) -> None:
    page.goto("/")
    expect(page.get_by_role("heading", level=1)).to_be_visible()
```
   Use an element you saw on the real page.
2. Run `pytest e2e/test_smoke.py -v`; save the tail as `smoke_pass_output`.
3. Break the expectation (for example `level=6`), rerun, confirm failure with `AssertionError: Locator expected to be visible` and a `test-results/` folder containing `trace.zip`. Save as `smoke_fail_output`. Revert and rerun green.
4. Never use `time.sleep()` or `page.wait_for_timeout()` to make a test pass; `expect(...)` retries until its timeout (5000 ms default).

### Output
`pw_py_config`.

### Quality Gate
- `smoke_pass_output` contains `1 passed`.
- `smoke_fail_output` contains `1 failed` and `ls test-results/*/trace.zip` listed a file during the failing run.

---

## Worked Example

Illustrative only. Django app, `app_url=http://localhost:8000`.

```
$ uv add --dev pytest-playwright
$ uv run playwright install --with-deps chromium
$ uv run pytest --help | grep -E -- "--base-url|--tracing"
  --base-url=URL        base url for the application under test.
  --tracing={on,off,retain-on-failure}
$ python manage.py runserver 8000 &
$ uv run pytest e2e/test_smoke.py -v
e2e/test_smoke.py::test_home_page_renders_main_heading[chromium] PASSED
1 passed in 1.84s
```
With `level=6`: `FAILED ... AssertionError: Locator expected to be visible`, `test-results/e2e-test-smoke-py-test-home-page-renders-main-heading-chromium/trace.zip` present. Reverted, green.

---

## Exit Criteria

DONE when pytest loads pytest-playwright with pinned options, the app start procedure is written down, and the smoke test passes and has been seen to fail with a trace.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `pytest --help` lacks `--base-url` | **Adjust**: the plugin is installed in a different interpreter; run `which python pytest` and install into the active env. |
| Phase 2 | `addopts` conflicts with an existing `--browser` option from another plugin | **Stop**: report the conflicting plugin; do not uninstall it. |
| Phase 3 | `Error: net::ERR_CONNECTION_REFUSED` | **Retry** after confirming the app answers with `curl -sf <app_url>`. |
| Phase 3 | Event loop error ("Sync API inside the asyncio loop") | **Adjust**: remove `pytest-asyncio` auto mode from E2E tests or keep E2E in a separate pytest invocation. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
