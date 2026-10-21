# Python CI Install, Lint and Test Commands

**One-line description:** Writes the exact non-interactive install, lint, type-check and pytest commands a Python project needs in CI for its package manager (uv, Poetry, pipenv or pip), with lockfile enforcement and a JUnit XML report path.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository checkout.
- `stack_profile` (object, required): From `ci0-detect-stack`; `stack` must be `python`.

---

## Outputs

- `py_ci_commands` (object): `{setup[], install[], lint[], typecheck[], test[], junit_path, notes[]}`. Each entry is one shell command that exits non-zero on failure.

---

## Phase 1: Install Command With Lockfile Enforcement

### Entry Criteria
- `stack_profile.stack` is `python`.

### Actions
1. Pick the install command from `stack_profile.package_manager`:

| Manager | Setup | Install (fails if lockfile is stale) |
|---|---|---|
| uv | `pip install uv` or the `astral-sh/setup-uv` action | `uv sync --locked` |
| poetry | `pipx install poetry` | `poetry check --lock` then `poetry install --no-interaction` |
| pipenv | `pip install pipenv` | `pipenv install --deploy --dev` |
| pip with requirements file | none | `python -m pip install -r requirements.txt` (add `--require-hashes` only if the file contains `--hash=` lines) |
| pip with pyproject only | none | `python -m pip install -e ".[test]"` only if `[project.optional-dependencies]` has a `test` key; otherwise `python -m pip install -e .` and report missing test extras |

2. Confirm the flag exists in the installed tool version before writing it: run `uv sync --help | grep -- --locked`, `poetry check --help | grep -- --lock`, or `pipenv install --help | grep -- --deploy`. If grep prints nothing, read the tool's official docs for the equivalent flag and record it in `notes[]`.
3. Run the install once in a fresh virtual environment: `python -m venv /tmp/ci-venv && . /tmp/ci-venv/bin/activate` (skip for uv and poetry, which create their own), then the install command. Record the exit code.
4. Do not use `pip install` without a lockfile or requirements file "to make it work". An unlocked install makes CI non-reproducible.

### Output
`setup[]` and `install[]` entries.

### Quality Gate
- The install command exited 0 in a fresh environment, and the exit code is recorded.
- For uv, Poetry and pipenv, the command includes the lockfile check flag confirmed by step 2.

---

## Phase 2: Lint and Type-Check Commands

### Entry Criteria
- Install succeeded.

### Actions
1. Add only tools the project already configures. Check with `grep -nE '^\[tool\.(ruff|black|isort|flake8|mypy|pyright)' pyproject.toml` and for files `.flake8`, `mypy.ini`, `pyrightconfig.json`, `.pre-commit-config.yaml`.
2. Map each configured tool to its check-only command (never the auto-fix form in CI):

| Tool | CI command |
|---|---|
| ruff | `ruff check .` and, if ruff formats, `ruff format --check .` |
| black | `black --check .` |
| isort | `isort --check-only .` |
| flake8 | `flake8` |
| mypy | `mypy` (uses config file targets) or `mypy <package_dir>` |
| pyright | `pyright` |
| pre-commit | `pre-commit run --all-files --show-diff-on-failure` |

3. Prefix each with the manager runner: `uv run`, `poetry run`, or `pipenv run`; plain pip uses the activated venv.
4. Run each command now. If it fails on the current main branch, record it in `notes[]` as "pre-existing failure" and keep it out of the blocking list until the user decides. Do not edit source files to make lint pass in this flow.

### Output
`lint[]` and `typecheck[]` entries.

### Quality Gate
- Every listed tool appears in a config file shown by step 1.
- Each command was run and its exit code is recorded next to it.

---

## Phase 3: Test Command With JUnit XML

### Entry Criteria
- Lint commands recorded.

### Actions
1. Build the test command: `<runner> pytest --junitxml=reports/junit.xml -o junit_family=xunit2`. Keep the project's own `addopts`; do not add `-x` or `--lf`, which hide failures.
2. If `pytest-xdist` is in the lockfile (`grep -i 'pytest-xdist' uv.lock poetry.lock Pipfile.lock requirements*.txt`), you may add `-n auto`. If not, do not add it.
3. If the project uses `tox` or `nox` and `[gh-actions]` or session matrices exist, record the equivalent `tox -e <env>` or `nox -s <session>` in `notes[]`, but keep the direct pytest command as the primary.
4. Run the test command. Confirm `reports/junit.xml` exists and count cases: `python -c "import xml.etree.ElementTree as E;r=E.parse('reports/junit.xml').getroot();s=r if r.tag=='testsuite' else r[0];print(s.get('tests'),s.get('failures'),s.get('errors'),s.get('skipped'))"`.
5. Set `junit_path` to `reports/junit.xml`.
6. Do not delete, skip or mark tests to make this run green. A failing test is reported in `notes[]`.

### Output
`py_ci_commands`.

### Quality Gate
- `reports/junit.xml` exists and the printed `tests` count is greater than 0.
- The test command exit code and the four printed counts are recorded in `notes[]`.

---

## Worked Example

Illustrative only. `stack_profile = {package_manager: "uv", lockfile: "uv.lock", test_runner: "pytest"}`.

Phase 1: `uv sync --help | grep -- --locked` prints `--locked  Assert that the uv.lock will remain unchanged`. `uv sync --locked` exits 0.
Phase 2: `pyproject.toml` has `[tool.ruff]` and `[tool.mypy]`. `uv run ruff check .` exits 0; `uv run ruff format --check .` prints `2 files would be reformatted` and exits 1, recorded as pre-existing.
Phase 3: `uv run pytest --junitxml=reports/junit.xml -o junit_family=xunit2` ends with `214 passed, 3 skipped in 41.20s`; the XML check prints `217 0 0 3`.

Result:
```
{"setup": ["pip install uv"], "install": ["uv sync --locked"],
 "lint": ["uv run ruff check ."], "typecheck": ["uv run mypy"],
 "test": ["uv run pytest --junitxml=reports/junit.xml -o junit_family=xunit2"],
 "junit_path": "reports/junit.xml",
 "notes": ["pre-existing: ruff format --check fails on 2 files"]}
```

---

## Exit Criteria

DONE when every command in `py_ci_commands` has been run once with its exit code recorded and the JUnit file contains at least one test case.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `uv sync --locked` fails with lockfile out of date | **Return**: report that `uv.lock` must be regenerated and committed by the user; do not drop `--locked`. |
| Phase 1 | Package needs system libraries (compile error mentioning a missing header) | **Adjust**: record the needed `apt-get install` package in `setup[]`, citing the error line. |
| Phase 2 | Lint fails on main | **Adjust**: record as pre-existing and non-blocking; never auto-fix in this flow. |
| Phase 3 | JUnit file missing after run | **Retry**: check that `--junitxml` was not overridden in `addopts`; rerun once. |
| Phase 3 | Tests fail | **Return**: report failing test IDs; never delete or skip tests to pass. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
