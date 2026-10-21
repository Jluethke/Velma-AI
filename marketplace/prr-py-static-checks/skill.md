# Python PR Static Checks with Ruff and Mypy

**One-line description:** Runs the project's own Ruff and mypy (or Pyright) configuration on the PR head and on the merge base, reports only diagnostics the PR introduces on changed lines, and flags every newly added `# type: ignore`, `# noqa` and `Any` that hides a real error.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Local clone with the PR head checked out (a worktree from `prr-fetch-pr-diff`).
- `base_branch` (string, required): PR target branch.
- `changed_files` (object[], required): Rename-aware file list.
- `findings_dir` (string, required): Findings directory.

---

## Outputs

- `py_static_findings` (object[]): New lint and type diagnostics on changed lines plus new suppressions, written to `<findings_dir>/prr-py-static-checks.json`.

---

## Phase 1: Discover the Project's Configured Tools

### Entry Criteria
- At least one changed file ends in `.py` or `.pyi`.

### Actions
1. Read config without changing it. Look in this order: `pyproject.toml` sections `[tool.ruff]`, `[tool.mypy]`, `[tool.pyright]`; then `ruff.toml` or `.ruff.toml`; `mypy.ini` or `setup.cfg` section `[mypy]`; `pyrightconfig.json`.
2. Read the CI workflow and copy the exact invocations it uses (for example `ruff check .`, `mypy src`, `pyright`). Use those, not your own flags.
3. Confirm the tools are installed in the project environment: `ruff --version`, `mypy --version`, `pyright --version`. Install versions pinned in the project's dev dependencies only (`uv sync`, `poetry install --with dev`, or `pip install -r requirements-dev.txt`).
4. Do not add rules, change `select`, or turn on `strict`. The review checks the PR against the project's standard, not yours.

### Output
The exact lint and type check commands with tool versions.

### Quality Gate
- Every command used appears in CI config or the project's documented dev commands.
- Tool versions match the pinned dev dependency versions (`pip show ruff mypy` or `uv pip list`).

---

## Phase 2: Run on Head and on Base, Keep Only New Diagnostics

### Entry Criteria
- Phase 1 commands known.

### Actions
1. On the PR head, list changed Python files: `git diff --name-only --diff-filter=ACMR origin/<base_branch>...HEAD -- '*.py' '*.pyi'`.
2. Ruff on changed files with machine-readable output:
   `ruff check --output-format=json <files> > ruff-head.json`
   Each item has `code`, `filename`, `location.row`, `message`.
3. Type check the way CI does (whole package; mypy loses import context when given single files), save text output:
   `mypy <CI target> > mypy-head.txt` (lines look like `pkg/mod.py:42: error: Incompatible return value type ... [return-value]`)
   or `pyright --outputjson > pyright-head.json`.
4. Repeat steps 2 and 3 in a base worktree: `git worktree add ../prr-base $(git merge-base origin/<base_branch> HEAD)` and run the same commands there, saving `*-base` files.
5. Keep a diagnostic only if (a) its file and line are on an added or modified line of the PR diff (from `git diff -U0` hunk headers `@@ -a,b +c,d @@` the new lines are c..c+d-1), or (b) it is a type error in an unchanged file whose count rises between base and head (the PR broke a caller).
6. Remove the base worktree: `git worktree remove ../prr-base`.

### Output
New-diagnostic list with tool, code, file, line, message.

### Quality Gate
- Both head and base runs completed with recorded exit codes.
- Every kept diagnostic is on a changed line or is a caller breakage with base and head counts recorded.

---

## Phase 3: Audit New Suppressions and Escapes

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. List added suppressions: `git diff -U0 origin/<base_branch>...HEAD -- '*.py' | grep -nE '^\+.*(# type: ignore|# noqa|# pyright: ignore|cast\(|: Any\b|-> Any\b)'`.
2. Apply this table:

| Added line | Rule | Label |
|---|---|---|
| `# type: ignore` with no error code | A bare ignore hides every current and future error on the line | blocking if the project's mypy config enables the `ignore-without-code` error code (`enable_error_code`), else suggestion: add `[<code>]` and a reason |
| `# type: ignore[code]` or `# noqa: CODE` with a reason comment | Acceptable | none |
| `# noqa` with no code | Silences every rule on the line | suggestion: name the code |
| `cast(...)` | Unchecked at runtime | question: why is the type not narrowed with `isinstance` |
| New `Any` in a public signature | Erases checking for callers | suggestion |

3. To check whether an ignore is even needed, delete it in a scratch worktree and rerun mypy on that file's package; no new error means the ignore is unused (mypy flag `--warn-unused-ignores` reports this directly).
4. Write findings to `<findings_dir>/prr-py-static-checks.json` (fields `flow`, `category`="static", `file`, `line`, `evidence` = the exact tool line, `proposed_label`, `fix`) and validate with `python -m json.tool`.
5. Label lint diagnostics with the table: type errors on changed lines are blocking; Ruff `F` (Pyflakes, for example `F821` undefined name, `F841` unused variable) and `B` (bugbear) codes are blocking if the CI runs Ruff as a required check, else suggestion; style-only codes (`E`, `W`, `I`) are nit.

### Output
`py_static_findings`.

### Quality Gate
- Every finding's `evidence` is a verbatim tool output line or diff line.
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. Changed: `billing/tax.py`.

- Phase 1: `pyproject.toml` has `[tool.ruff] select = ["E","F","B","I"]` and `[tool.mypy] files = ["billing"]`; CI runs `ruff check .` and `mypy`.
- Phase 2: head `ruff check --output-format=json billing/tax.py` reports `F841 Local variable 'rate' is assigned to but never used` at row 31 (a changed line). Base has no such item. `mypy` head prints `billing/invoice.py:57: error: Argument 1 to "tax_for" has incompatible type "str"; expected "Decimal"  [arg-type]`; base count for `invoice.py` is 0, so the PR broke a caller.
- Phase 3: added line `+    total = compute(x)  # type: ignore` has no code. Findings: F841 blocking, arg-type in `invoice.py:57` blocking, bare ignore suggestion (the config does not enable `ignore-without-code`) with fix "fix the type or use `# type: ignore[<code>]` with a reason".

---

## Exit Criteria

DONE when the project's configured lint and type check ran on head and base, only PR-introduced diagnostics and suppressions are reported, and each finding quotes tool output.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Project has no Ruff or mypy config | **Adjust**: run `ruff check --output-format=json` with Ruff defaults only and label everything `suggestion`; skip type checking and note it. |
| Phase 2 | mypy fails with "Cannot find implementation or library stub" | **Adjust**: install the project's dev dependencies; do not add `ignore_missing_imports`. |
| Phase 2 | Base run fails to install | **Adjust**: compare head output against diff lines only and state that base comparison was unavailable. |
| Phase 3 | Unsure whether an ignore is needed | **Retry**: remove it in the scratch worktree and rerun mypy with `--warn-unused-ignores`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
