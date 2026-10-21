# Find the Python Verify Commands the Repo Already Uses

**One-line description:** Discovers how this Python repository is actually tested, type-checked and linted (environment runner, pytest or unittest, mypy or pyright, ruff or flake8) from its config files and CI workflow, and writes the exact commands at four speeds: compile one file, run one test, check touched files, run the full suite.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `goal_check` (object, required): From `stp-goal-to-runnable-check`.

---

## Outputs

- `py_verify_commands` (object): `{ "runner_prefix": str, "compile_one": str, "test_one": str, "check_touched": [str], "full_suite": str, "collect_count": str, "sources": [str] }`. Each command is a literal line with `<file>` or `<nodeid>` placeholders.

---

## Phase 1: Find the Environment Runner

### Entry Criteria
- `repo_path` contains `pyproject.toml`, `setup.py`, `setup.cfg`, `requirements*.txt` or `tox.ini`.

### Actions
1. List the root: `ls -a <repo_path>` (PowerShell: `Get-ChildItem -Force <repo_path>`).
2. Pick `runner_prefix` with the first row that matches:

| File present at root | `runner_prefix` | Notes |
|---|---|---|
| `uv.lock` | `uv run` | `uv run` syncs the environment from the lockfile before running. |
| `poetry.lock` | `poetry run` | Requires `poetry install` to have been run once. |
| `pdm.lock` | `pdm run` | |
| `Pipfile.lock` | `pipenv run` | |
| `.venv/` directory | `.venv/bin/python -m` (Windows: `.venv\Scripts\python.exe -m`) | Use the venv's interpreter directly; do not rely on an activated shell. |
| none of the above | `python -m` | Confirm with `python -c "import sys; print(sys.prefix)"` that it is not the system interpreter you are about to install into. |

3. Run `<runner_prefix> python --version` (or `<prefix> --version` for the venv form) and record the version.
4. Never run `pip install` to make a command work. A missing package means the environment is not set up; that is a stop trigger, not something to fix.

### Output
`runner_prefix` and Python version.

### Quality Gate
- `<runner_prefix> python --version` exits 0 and prints `Python 3.`.

---

## Phase 2: Read What the Repo Runs in CI

### Entry Criteria
- `runner_prefix` chosen.

### Actions
1. Read these files if they exist, in this order, and copy every test, type and lint command you find into `sources` with `file:line`:
   - `.github/workflows/*.yml` (lines under `run:`), `.gitlab-ci.yml` (`script:`), `azure-pipelines.yml`
   - `tox.ini` (`commands =`), `noxfile.py` (`session.run(`), `Makefile` (`test:`, `lint:` targets)
   - `pyproject.toml` sections `[tool.pytest.ini_options]`, `[tool.mypy]`, `[tool.pyright]`, `[tool.ruff]`, `[tool.black]`, `[tool.coverage.run]`
   - `setup.cfg` sections `[tool:pytest]`, `[mypy]`, `[flake8]`; `pytest.ini`; `mypy.ini`; `.flake8`; `ruff.toml`
   - `.pre-commit-config.yaml` (hook `id:` lines)
2. Search quickly: `rg -n "pytest|unittest|mypy|pyright|ruff|flake8|black" .github tox.ini noxfile.py Makefile pyproject.toml setup.cfg .pre-commit-config.yaml`.
3. Decide the test runner:

| Evidence | Test runner |
|---|---|
| `pytest` in CI, `[tool.pytest.ini_options]`, `pytest.ini`, or `conftest.py` exists | pytest |
| `manage.py` exists and CI runs `manage.py test` | Django test runner |
| only `unittest` in CI or `python -m unittest` in Makefile | unittest |

4. Note options set in `addopts` (for example `--cov`, `-n auto` from pytest-xdist). They apply to every run; `-p no:cacheprovider` and `-o addopts=""` exist if `addopts` breaks single-test runs, but record that you used them.

### Output
`sources` and the chosen test, type and lint tools.

### Quality Gate
- Every tool you will put in a command appears in at least one entry of `sources`. A tool with no source is not used.

---

## Phase 3: Write the Four-Speed Command Set

### Entry Criteria
- Tools chosen in Phase 2.

### Actions
1. `compile_one`: `<runner_prefix> python -m py_compile <file>`. Exit 0 means the file parses. It does not import or run the file.
2. `test_one` by runner:
   - pytest: `<runner_prefix> pytest <nodeid> -x -q` where `<nodeid>` is `path/to/test_file.py::TestClass::test_name` or `path/to/test_file.py::test_name`. Use `python -m pytest` instead of `pytest` when the repo has no installed package layout: `python -m pytest` adds the current directory to `sys.path`.
   - unittest: `<runner_prefix> python -m unittest tests.test_slugify.SlugTests.test_accents -v` (dotted module path, not a file path).
   - Django: `<runner_prefix> python manage.py test app.tests.SlugTests.test_accents`.
3. `check_touched`: only the tools found in Phase 2, scoped to `<file>`:
   - `<runner_prefix> ruff check <file>` and, if CI checks formatting, `<runner_prefix> ruff format --check <file>`
   - `<runner_prefix> mypy <file>` or `<runner_prefix> pyright <file>`
   - `<runner_prefix> flake8 <file>`, `<runner_prefix> black --check <file>`
4. `full_suite`: the exact CI test command from `sources`, with `<runner_prefix>` in front.
5. `collect_count`: `<runner_prefix> pytest --collect-only -q` (the last line reads `N tests collected`), or for unittest `<runner_prefix> python -m unittest discover -v 2>&1` and count lines ending in `ok`/`FAIL`/`ERROR`.
6. Write the pytest exit-code table into the output so later flows can read results without guessing:

| pytest exit code | Meaning |
|---|---|
| 0 | all collected tests passed |
| 1 | some tests failed |
| 2 | interrupted (Ctrl-C or collection error with `-x`) |
| 3 | internal error |
| 4 | usage error (bad flag or bad node id) |
| 5 | no tests were collected |

### Output
`py_verify_commands`.

### Quality Gate
- Running `test_one` with the node id from `goal_check.command` returns an exit code from the table (any code; the point is that the command form is accepted). Exit code 4 means the command form is wrong; fix it before continuing.
- `full_suite` text matches a command in `sources` apart from the prefix.

---

## Worked Example

Illustrative only.

Repo `/work/slugkit` has `uv.lock`, `pyproject.toml` with `[tool.pytest.ini_options] addopts = "-ra"` and `[tool.ruff]`, and `.github/workflows/ci.yml` line 31 `run: uv run pytest` and line 32 `run: uv run mypy slugkit`.

- Phase 1: `runner_prefix` = `uv run`; `uv run python --version` prints `Python 3.12.4`.
- Phase 2: `sources` = [`.github/workflows/ci.yml:31 uv run pytest`, `.github/workflows/ci.yml:32 uv run mypy slugkit`, `pyproject.toml:[tool.ruff]`].
- Phase 3:
```
compile_one:   uv run python -m py_compile <file>
test_one:      uv run pytest <nodeid> -x -q
check_touched: uv run ruff check <file> ; uv run mypy <file>
full_suite:    uv run pytest
collect_count: uv run pytest --collect-only -q
$ uv run pytest tests/test_slugify.py::test_strips_accents -x -q
ERROR: not found: /work/slugkit/tests/test_slugify.py::test_strips_accents
$ echo $?
4
```
Exit 4 here is expected because the test does not exist yet; the form is valid (a typo in the flag would also give 4, so the message text is checked: "not found" means node id, not flag).

---

## Exit Criteria

DONE when `py_verify_commands` has all five fields filled with commands whose tools appear in `sources`, and `test_one` is accepted by the runner.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `uv`/`poetry` not installed but its lockfile exists | **Stop**: report the missing tool; do not switch to plain `pip`. |
| Phase 1 | `ModuleNotFoundError: No module named pytest` | **Stop**: the environment is not installed; report the install command from the README or CI, do not run it unasked. |
| Phase 2 | No CI file and no tool config | **Adjust**: use pytest if `tests/` contains `test_*.py`, else unittest; mark `sources` as "inferred". |
| Phase 3 | `test_one` exits 4 with "unrecognized arguments" | **Retry**: run `<runner_prefix> pytest --help` and use only flags it lists. |
| Phase 3 | `addopts` adds a plugin that is not installed | **Adjust**: add `-o addopts=""` to `test_one` and record why. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
