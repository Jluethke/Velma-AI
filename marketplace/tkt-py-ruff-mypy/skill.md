# Python Lint, Format and Type Check (ruff, mypy)

**One-line description:** Runs the project's Python static checks the way CI runs them (ruff check, ruff format --check, mypy, or the older black/isort/flake8 set), separates new findings from pre-existing ones, and fixes only findings in lines this ticket changed, without blanket `noqa` or `type: ignore`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `change_diff` (string, required): Output of `tkt-small-edit-loop`.
- `repo_profile` (object, required): Output of `tkt-repo-orient-detect`.

---

## Outputs

- `py_static_report` (object): Tools and versions run, each command, findings before and after fixing split into `introduced` and `pre-existing`, every suppression added with its reason, and final exit codes.

---

## Phase 1: Identify the Tool Set

### Entry Criteria
- `repo_profile.stack` includes python and the environment from `tkt-py-env-baseline` is installed.

### Actions
1. Read the lint and type commands from `repo_profile.commands`. If `.pre-commit-config.yaml` exists and CI runs pre-commit, the hook list is the authority.
2. Map config to tool:

| Config present | Tool | CI-equivalent command |
|---|---|---|
| `[tool.ruff]` in `pyproject.toml`, or `ruff.toml` / `.ruff.toml` | ruff linter | `ruff check .` |
| same, and CI runs `ruff format` | ruff formatter | `ruff format --check .` |
| `[tool.black]` | black | `black --check .` |
| `[tool.isort]` or `.isort.cfg` | isort | `isort --check-only .` |
| `.flake8`, `[flake8]` in `setup.cfg` or `tox.ini` | flake8 | `flake8` |
| `[tool.mypy]`, `mypy.ini`, `.mypy.ini`, `[mypy]` in `setup.cfg` | mypy | `mypy <paths CI passes>` |
| `[tool.pyright]` or `pyrightconfig.json` | pyright | `pyright` |

3. Prefix each command with the run prefix from the baseline (`uv run`, `poetry run`, `pdm run`) so the pinned tool version runs, not a global one. Record `ruff --version` and `mypy --version`.
4. List changed Python files: `git diff --name-only --diff-filter=d <base>...HEAD -- '*.py' '*.pyi'` (`--diff-filter=d` drops deleted files).

### Output
Tool list with commands and changed file list.

### Quality Gate
- Each tool listed is backed by a config file path or a CI line.
- Tool versions are recorded from `--version` output run with the project prefix.

---

## Phase 2: Run and Split Findings

### Entry Criteria
- Tool list ready.

### Actions
1. Run each check over the same paths CI uses. Lint output from `ruff check --output-format concise .` reads `src/billing/api/routes.py:44:5: F841 Local variable 'x' is assigned to but never used`. mypy output reads `src/billing/api/routes.py:44: error: Argument 1 to "csv_response" has incompatible type "list[Row]"; expected "Sequence[Mapping[str, str]]"  [arg-type]`. `ruff format --check` lists `Would reformat: <file>`.
2. Split each finding: if its file:line falls on a line added or changed in `git diff -U0 <base>...HEAD`, it is `introduced`; otherwise `pre-existing`.
3. Shortcut for pre-commit repos: `pre-commit run --from-ref <base> --to-ref HEAD` runs hooks only on files changed in that range.
4. Explain any unfamiliar rule before fixing it: `ruff rule F841` prints the rule's rationale and fix. For mypy codes, the code in brackets (`[arg-type]`) is documented in the mypy "Error codes enabled by default" page.

### Output
Introduced and pre-existing findings with counts per tool.

### Quality Gate
- Every finding is classified `introduced` or `pre-existing` with its file:line.
- The raw output's summary lines are recorded (`Found 3 errors.` for ruff, `Found 2 errors in 1 file (checked 87 source files)` for mypy).

---

## Phase 3: Fix Introduced Findings

### Entry Criteria
- Findings split.

### Actions
1. Format first: `ruff format <changed files>` (or `black <changed files>`, `isort <changed files>`). Formatting only changed files avoids reformatting the whole repo in your PR.
2. Apply safe lint fixes to changed files: `ruff check --fix <changed files>`. Do not pass `--unsafe-fixes` unless you review each change; unsafe fixes can change behavior.
3. Fix the remaining introduced findings by hand, one file at a time, rerunning the single tool after each file.
4. mypy fixes in order of preference: correct the annotation or the code; narrow with `isinstance` or an explicit `None` check; use `typing.cast` only when you can name why the checker cannot see the type. Check the inferred type with `reveal_type(expr)` (mypy prints `Revealed type is ...`), then remove the `reveal_type` call.
5. Suppressions are a last resort and must be specific: `# noqa: F841` (never bare `# noqa`), `# type: ignore[arg-type]` (never bare `# type: ignore`), each followed by a short reason in the same comment. Record each one in the report.
6. Do not edit tool config (`[tool.ruff] ignore`, `per-file-ignores`, `[tool.mypy] ignore_errors`, `exclude`) to silence findings. That weakens the gate for everyone.
7. Do not fix `pre-existing` findings in untouched lines; list them in the report instead.
8. Rerun every tool in the CI form. Run the unit tests for the touched modules again, since fixes can change behavior.

### Output
`py_static_report`.

### Quality Gate
- Every tool from Phase 1 exits 0 on the CI command, or its remaining findings are all `pre-existing` and listed.
- `git diff <base>...HEAD | rg -n '^\+.*(# noqa\s*$|# type: ignore\s*$)'` prints nothing (no bare suppressions).
- `git diff --name-only <base>...HEAD` shows no change to `pyproject.toml` tool sections, `ruff.toml`, `mypy.ini`, `setup.cfg` or `.flake8` unless the ticket asked for it.

---

## Worked Example

Illustrative only.

```
$ uv run ruff check --output-format concise .
src/billing/api/responses.py:15:9: F841 Local variable `writer_opts` is assigned to but never used
src/billing/legacy/old.py:3:1: F401 `os` imported but unused
Found 2 errors.
$ uv run mypy src
src/billing/api/routes.py:44: error: Argument "columns" to "csv_response" has incompatible type "tuple[str, ...]"; expected "list[str] | None"  [arg-type]
Found 1 error in 1 file (checked 87 source files)
```

Split: `responses.py:15` and `routes.py:44` are on changed lines (introduced); `legacy/old.py:3` is pre-existing. Fix: remove the unused variable; change the parameter annotation to `Sequence[str] | None` since the function only iterates. Rerun:

```
$ uv run ruff check src/billing/api/responses.py
All checks passed!
$ uv run mypy src
Success: no issues found in 87 source files
$ uv run ruff format --check .
87 files already formatted
```

Report: 2 introduced fixed, 1 pre-existing listed (`legacy/old.py:3 F401`), zero suppressions.

---

## Exit Criteria

DONE when every CI static check passes or fails only on listed pre-existing findings, no bare suppressions or config weakening were added, and the touched modules' tests still pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tool not installed in the environment | **Adjust**: it is probably in a dev extra or dependency group; install with the baseline command (for example `uv sync --frozen --group dev`), not a global `pip install`. |
| Phase 2 | mypy reports `Cannot find implementation or library stub` | **Adjust**: the stub package (for example `types-requests`) belongs in the dev dependencies; check whether it is listed and installed before adding anything. |
| Phase 2 | Local and CI tool versions differ | **Adjust**: use the version pinned in the lockfile or the pre-commit `rev:`; rerun. |
| Phase 3 | A fix changes behavior and breaks a test | **Retry**: revert that file and choose a fix that preserves behavior. |
| Phase 3 | Finding cannot be fixed without a large refactor | **Return**: add a specific suppression with reason and a follow-up ticket id in the report. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
