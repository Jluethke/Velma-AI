# TDD Pytest Runner Setup

**One-line description:** Installs and configures pytest in a Python project, proves the runner both passes and fails a canary test, and records the full-suite, single-test, last-failed and watch-mode commands used during red-green-refactor.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Root of the Python project (the folder with `pyproject.toml`, `setup.cfg` or `requirements.txt`).

---

## Outputs

- `runner_config` (object): `config_file` (path), `suite_command`, `single_test_command` (template), `last_failed_command`, `watch_command`, `python_version`, `pytest_version`.
- `smoke_result` (object): Exit code and summary line of the canary pass run and the canary fail run.

---

## Phase 1: Install and Configure

### Entry Criteria
- `project_dir` exists and contains Python source.
- A virtual environment is active, or one is created in step 1.

### Actions
1. From `project_dir`, confirm the interpreter: `python --version`. If no virtual environment is active (`python -c "import sys; print(sys.prefix != sys.base_prefix)"` prints `False`), create one: `python -m venv .venv`, then activate it (`source .venv/bin/activate` on Linux/macOS, `.venv\Scripts\activate` on Windows).
2. Install: `python -m pip install pytest`. If the project uses a lock tool, use it instead (`uv add --dev pytest`, `poetry add --group dev pytest`). Do not mix tools.
3. Record the version: `python -m pytest --version`.
4. If `pyproject.toml` exists and has no `[tool.pytest.ini_options]` table, add this table (and only this table) to it:

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-ra --strict-markers"
xfail_strict = true
```

If the code lives under `src/`, also add `pythonpath = ["src"]` (pytest 7.0 or newer). If the project already has `pytest.ini`, `tox.ini [pytest]` or `setup.cfg [tool:pytest]`, edit that file instead; pytest uses only the first config file it finds and ignores the rest.
5. Create `tests/` if missing.

### Output
pytest installed; one config file holds the pytest settings.

### Quality Gate
- `python -m pytest --version` prints a version.
- The header line `configfile:` printed by `python -m pytest -q --co` names the file edited in step 4.

---

## Phase 2: Canary Pass and Fail

### Entry Criteria
- pytest installed.

### Actions
1. Create `tests/test_canary.py` containing:

```python
def test_canary_runner_executes_tests():
    assert 1 + 1 == 2
```

2. Run `python -m pytest tests/test_canary.py -q`. Expect exit code 0 and `1 passed`.
3. Change `== 2` to `== 3`. Run again. Expect exit code 1 and `1 failed`, with the `assert 2 == 3` line shown under `FAILURES`.
4. Delete `tests/test_canary.py`. Record both runs in `smoke_result`.
5. Read pytest exit codes this way: 0 all passed, 1 some failed, 2 interrupted, 3 internal error, 4 usage error (bad flag), 5 no tests collected. Exit code 5 means the file or name pattern is wrong, not that the code is fine.

### Output
`smoke_result`.

### Quality Gate
- The pass run has exit code 0 and the fail run has exit code 1 (check with `echo $?` on bash or `$LASTEXITCODE` on PowerShell).
- `tests/test_canary.py` no longer exists.

---

## Phase 3: Selection and Watch Commands

### Entry Criteria
- Canary proved pass and fail.

### Actions
1. Record these commands in `runner_config`:

| Purpose | Command |
|---|---|
| Full suite | `python -m pytest -q` |
| One test | `python -m pytest tests/test_x.py::test_name -q` |
| Tests matching words | `python -m pytest -k "username and not slow" -q` |
| Stop at first failure | `python -m pytest -x -q` |
| Only last failures | `python -m pytest --lf -q` |
| Last failures first, then rest | `python -m pytest --ff -q` |
| Show print output | add `-s` |
| Full assertion diff | add `-vv` |

2. Watch mode: install `python -m pip install pytest-watcher`, then run `ptw .` in a second terminal. It reruns pytest on file save. Check `ptw --help` for the options of the installed version before adding flags.
3. Prefer `python -m pytest` over bare `pytest`: the `python -m` form adds the current directory to `sys.path` and uses the active interpreter.

### Output
`runner_config`.

### Quality Gate
- Running `runner_config.suite_command` exits 0 or 5 on the current code (5 only when no tests exist yet).
- `ptw --help` prints usage, or `watch_command` is recorded as "none" with the reason.

---

## Worked Example

Illustrative only. `project_dir` = `~/code/invoicer` with `src/invoicer/`.

Phase 1: `python -m pip install pytest` then `python -m pytest --version` prints `pytest 8.3.3`. `pyproject.toml` gets the table plus `pythonpath = ["src"]`.

Phase 2:

```
$ python -m pytest tests/test_canary.py -q
.                                                    [100%]
1 passed in 0.01s
$ python -m pytest tests/test_canary.py -q
F                                                    [100%]
E       assert 2 == 3
1 failed in 0.03s
```

Phase 3: `runner_config.single_test_command` = `python -m pytest tests/test_invoice.py::{name} -q`, `watch_command` = `ptw .`.

---

## Exit Criteria

DONE when pytest is configured in exactly one config file, a canary test was seen both passing and failing, the canary was removed, and every command in `runner_config` was run once.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ModuleNotFoundError` for the project package in tests | **Adjust**: add `pythonpath = ["src"]` for a src layout, or install the project with `python -m pip install -e .`. |
| Phase 1 | Two config files both have pytest sections | **Adjust**: keep the one pytest reports as `configfile:` and move settings there; do not delete user files without asking. |
| Phase 2 | Exit code 5 on the canary | **Retry**: check the file name starts with `test_` and `testpaths` includes `tests`. |
| Phase 2 | Fail run still passes | **Stop**: pytest is running a different file or a cached copy; print `python -m pytest --co -q` and fix before continuing. |
| Phase 3 | `ptw` not found after install | **Adjust**: confirm the virtual environment is active (its `bin` or `Scripts` folder holds `ptw`); otherwise record watch as unavailable. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
