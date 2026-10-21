# Python Environment Setup and Test Baseline

**One-line description:** Creates the project's Python environment with the package manager its lockfile names (uv, poetry, pdm, pipenv or pip), runs the full pytest suite once before any change, and records every pre-existing failure so later steps never blame or "fix" a failure the ticket did not cause.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_profile` (object, required): Output of `tkt-repo-orient-detect` with `stack` containing python.

---

## Outputs

- `py_baseline_report` (object): Python version used, install command run, test command run, collected test count, pass/fail/skip/xfail/error counts, the node ids of every failing or erroring test with the first line of its error, and wall time.

---

## Phase 1: Create the Environment

### Entry Criteria
- `repo_profile.stack` includes python.

### Actions
1. Find the required Python version, in this order: `.python-version` file; `requires-python` in `[project]` of `pyproject.toml`; `python_requires` in `setup.cfg`/`setup.py`; the `python-version:` key in the CI workflow. Run `python3 --version` (or `py -3 --version` on Windows) and confirm it satisfies the constraint.
2. Install with the command for the detected package manager. Use the lockfile; never upgrade it during setup.

| package_manager | Install command | Run prefix |
|---|---|---|
| uv | `uv sync --frozen` (add `--all-extras` only if CI does) | `uv run` |
| poetry | `poetry install --sync` (Poetry 1.x) or `poetry sync` (Poetry 2.x; check `poetry --version`) | `poetry run` |
| pdm | `pdm sync` | `pdm run` |
| pipenv | `pipenv sync --dev` | `pipenv run` |
| pip | `python -m venv .venv`, activate it, then `python -m pip install -e ".[dev]"` if a `dev` extra exists, else `python -m pip install -r requirements-dev.txt` or whatever file CI installs | none (activated venv) |

3. Copy the exact install line from CI if CI has one; the table is the fallback.
4. Do NOT run `pip install <package>` for a missing import to make tests pass. A missing import means the install step is wrong; reread the CI install step.

### Output
Working environment and the install command used.

### Quality Gate
- The install command exits 0 (check `$?` on POSIX shells or `$LASTEXITCODE` in PowerShell).
- `git status --porcelain` shows no change to any lockfile (`uv.lock`, `poetry.lock`, `pdm.lock`, `Pipfile.lock`, `requirements*.txt`).

---

## Phase 2: Collect and Run the Baseline

### Entry Criteria
- Environment installed.

### Actions
1. Collect only, to confirm test discovery works: `<prefix> pytest --collect-only -q`. The last line reads like `412 tests collected in 1.84s`. If it ends with `errors`, read the first `ERROR collecting` block; it names the file and the import that failed.
2. Run the full suite with the CI command from `repo_profile.commands.test`. If it is `undocumented`, use `<prefix> pytest -q -rfE`. The `-rfE` flag prints a short summary of failures (`f`) and errors (`E`) at the end.
3. If the project uses tox or nox and CI calls it, run the same: `tox -e <env>` or `nox -s <session>`. Read the env name from CI, not from guesswork.
4. Read the final summary line, for example `3 failed, 405 passed, 4 skipped in 52.10s`. Copy the `FAILED` and `ERROR` lines from the short test summary info block; each starts with a node id like `tests/test_tax.py::test_rounding`.
5. For each failure, run it alone once: `<prefix> pytest tests/test_tax.py::test_rounding -x -q`. If it passes alone but failed in the suite, mark it `order-dependent`. If it fails alone, mark it `pre-existing`.

### Output
Raw counts and failure list.

### Quality Gate
- The summary line from pytest is copied verbatim into the report.
- Every failing node id has a classification: `pre-existing` or `order-dependent`.

---

## Phase 3: Record the Baseline

### Entry Criteria
- Suite has run to completion.

### Actions
1. Write `py_baseline_report` with: python version, install command, test command, collected count, counts by outcome, failing node ids with first error line and classification, wall time.
2. Record how to run one test (`test_single`): `<prefix> pytest <path>::<test_name>`, and with `-k "<expr>"` for keyword selection.
3. If the baseline has failures, post them to the ticket or PR as "pre-existing failures on <default_branch> at <git rev-parse --short HEAD>". Do not fix them inside this ticket unless the ticket asks.

### Output
`py_baseline_report`.

### Quality Gate
- `py_baseline_report` contains the commit hash from `git rev-parse --short HEAD`.
- Collected count in the report equals the number from Phase 2 Action 1.

---

## Worked Example

Illustrative only. `repo_profile.package_manager` = uv, CI test command `uv run pytest -q`.

```
$ cat .python-version
3.12
$ uv sync --frozen
Resolved 61 packages in 2ms
Installed 58 packages in 410ms
$ uv run pytest --collect-only -q | tail -1
412 tests collected in 1.84s
$ uv run pytest -q -rfE
...
=========================== short test summary info ============================
FAILED tests/test_tax.py::test_rounding_half_even - AssertionError: assert Decimal('2.67') == Decimal('2.66')
1 failed, 407 passed, 4 skipped in 52.10s
$ uv run pytest tests/test_tax.py::test_rounding_half_even -x -q
1 failed in 0.21s
```

`py_baseline_report`: python 3.12.4, 412 collected, 407 passed, 1 failed (`tests/test_tax.py::test_rounding_half_even`, pre-existing), 4 skipped, at commit `a1b2c3d`.

---

## Exit Criteria

DONE when the environment installs from the lockfile without changing it, the full suite has run once, and every failure is listed with a classification and the commit hash.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Installed Python does not meet `requires-python` | **Stop**: report the required and found versions; install the right interpreter (for example `uv python install 3.12`) only with user approval. |
| Phase 1 | Lockfile out of date (`--frozen` or `--sync` refuses) | **Stop**: report it; regenerating the lockfile is a separate change, not part of this ticket. |
| Phase 2 | Collection errors | **Adjust**: read the first `ERROR collecting` block; usually a missing extra or env var named in CI `env:`; set it and rerun. |
| Phase 2 | Suite needs a database or service | **Adjust**: start the service the CI `services:` block lists (for example `docker run` of the same image and tag); record it in the report. |
| Phase 2 | Suite hangs | **Retry**: rerun with `-x --timeout` only if `pytest-timeout` is installed (check `pytest --help`); else run per-directory to find the hanging file. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
