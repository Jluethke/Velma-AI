# Python CLI Packaging for pipx

**One-line description:** Packages a Python CLI as a wheel with a `[project.scripts]` console entry point, single-sourced version via `importlib.metadata`, checks the archive contents with `twine check` and `unzip -l`, proves it installs and runs in isolation with `pipx install` (and `uv tool install`), and publishes to TestPyPI before PyPI.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tool_name` (string, required): Executable and distribution name.
- `release_version` (string, required): Version to release, PEP 440 form, for example `1.4.0`.
- `project_dir` (string, required): Root of the Python project.
- `e2e_run_log` (string, required): Passing log from `cli-py-e2e-tests`; packaging does not start on a failing suite.

---

## Outputs

- `package_artifact` (string[]): Paths of the built wheel and sdist.
- `install_check_log` (string): Output of the isolated install and run checks.

---

## Phase 1: pyproject.toml

### Entry Criteria
- `e2e_run_log` shows 0 failed.

### Actions
1. Confirm or write these keys in `pyproject.toml`:
```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "logtrim"
version = "1.4.0"
description = "Trim old log lines and report counts"
readme = "README.md"
requires-python = ">=3.9"
license = "MIT"
dependencies = ["click>=8.1"]

[project.scripts]
logtrim = "logtrim.cli:main"
```
   Keep the build backend the project already uses (setuptools, hatchling, flit-core, pdm-backend); do not switch backends during a release. `requires-python` and `license` come from the user, not from this example. Check your backend's docs for the accepted `license` form (newer backends accept an SPDX string per PEP 639; older ones need a table).
2. Set `version` to `release_version`. Read the version at runtime with `importlib.metadata.version("logtrim")`; do not keep a second copy in `__init__.py`.
3. The console script wrapper calls `sys.exit(main())`, so `main` returning an int sets the exit code.
4. With a `src/` layout, hatchling and setuptools find the package automatically in common layouts; confirm in Phase 2 by listing the wheel.

### Output
Updated `pyproject.toml`.

### Quality Gate
- `python -c "import tomllib; d=tomllib.load(open('pyproject.toml','rb')); print(d['project']['version'], d['project']['scripts'])"` prints `release_version` and the entry point (Python 3.11+).

---

## Phase 2: Build and Inspect

### Entry Criteria
- `pyproject.toml` updated.

### Actions
1. Clean and build: `rm -rf dist/ && python -m build` (install with `pip install build` if missing). Expect `dist/logtrim-1.4.0-py3-none-any.whl` and `dist/logtrim-1.4.0.tar.gz`.
2. Inspect: `unzip -l dist/*.whl`. The package modules must be present, and `logtrim-1.4.0.dist-info/entry_points.txt` must contain `[console_scripts]` with `logtrim = logtrim.cli:main`.
3. Check metadata: `python -m twine check dist/*` must print `PASSED` for both files.
4. Confirm no test files, `.env` files or caches were packed: `tar tzf dist/*.tar.gz | grep -E "\.env|__pycache__|\.pyc"` prints nothing.

### Output
Wheel and sdist.

### Quality Gate
- `twine check` prints `PASSED` twice.
- `unzip -p dist/*.whl '*/entry_points.txt'` shows the console script line.

---

## Phase 3: Isolated Install and Publish

### Entry Criteria
- Artifacts pass inspection.

### Actions
1. Install from the wheel into an isolated venv with pipx and run it:
```
pipx install --force dist/logtrim-1.4.0-py3-none-any.whl
logtrim --version; echo "exit=$?"
logtrim --help >/dev/null; echo "exit=$?"
pipx uninstall logtrim
```
   Run from a directory outside the project so the source tree is not importable by accident.
2. Optional second installer: `uv tool install dist/logtrim-1.4.0-py3-none-any.whl` then `logtrim --version`, then `uv tool uninstall logtrim`.
3. Publish to TestPyPI first: `python -m twine upload --repository testpypi dist/*`, then `pipx install --index-url https://test.pypi.org/simple/ --pip-args="--extra-index-url https://pypi.org/simple/" logtrim==1.4.0` and run `logtrim --version`. (Check `pipx install --help` for the flag spelling in your pipx version.)
4. Publish to PyPI only after the user approves: `python -m twine upload dist/*`. PyPI never accepts the same version twice; a mistake needs a new version.
5. Save all command outputs as `install_check_log`.

### Output
`package_artifact`, `install_check_log`.

### Quality Gate
- `install_check_log` shows `logtrim 1.4.0` (or the tool's version format) and `exit=0` for both commands from the pipx install.
- The TestPyPI install ran the same checks before any PyPI upload.

---

## Do Not

- Do not upload to PyPI without the user's explicit go-ahead.
- Do not test the install from inside the project directory.
- Do not bump the version by editing the wheel file name; rebuild.

---

## Worked Example

Illustrative.
```
$ python -m build
Successfully built logtrim-1.4.0.tar.gz and logtrim-1.4.0-py3-none-any.whl
$ python -m twine check dist/*
Checking dist/logtrim-1.4.0-py3-none-any.whl: PASSED
Checking dist/logtrim-1.4.0.tar.gz: PASSED
$ cd /tmp && pipx install --force ~/src/logtrim/dist/logtrim-1.4.0-py3-none-any.whl
  installed package logtrim 1.4.0, installed using Python 3.12.3
  These apps are now globally available
    - logtrim
$ logtrim --version; echo "exit=$?"
logtrim 1.4.0
exit=0
```

---

## Exit Criteria

DONE when the wheel and sdist pass `twine check`, the console script installs and runs from an isolated pipx venv outside the source tree, and TestPyPI install succeeds before any PyPI upload.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `e2e_run_log` shows failures | **Stop**: return to `cli-py-e2e-tests`. |
| Phase 2 | Wheel has no package modules | **Adjust**: configure the backend's package discovery (hatch `[tool.hatch.build.targets.wheel] packages = ["src/logtrim"]`); rebuild. |
| Phase 3 | `logtrim: command not found` after pipx install | **Adjust**: run `pipx ensurepath` and open a new shell. |
| Phase 3 | `ModuleNotFoundError` at run time | **Return**: a runtime dependency is missing from `dependencies`; add it and rebuild. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
