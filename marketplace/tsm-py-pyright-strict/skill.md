# pyright Strict by Path

**One-line description:** Configures pyright with `typeCheckingMode` set to `standard` for the whole project and a `strict` path list (or `# pyright: strict` file comments) for converted modules, adds paths in conversion order, and finishes with project-wide `strict` once every path is clean.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `py_conversion_order` (object[], required): From `tsm-py-conversion-order`; the order paths join the strict list.
- `py_stub_report` (object[], required): From `tsm-py-stubs-missing-imports`; import errors must already be resolved.

---

## Outputs

- `py_pyright_config` (object): The committed pyright configuration, the strict path list, files using a `# pyright: strict` or `# pyright: basic` comment, the pyright version, and the error count after each ratchet commit.

---

## Phase 1: Base Configuration

### Entry Criteria
- pyright is pinned (`pyright==X` in the Python dev group, or `"pyright": "X"` in `package.json` devDependencies) and `pyright --version` prints that version.

### Actions
1. Pick one config location. If `pyrightconfig.json` exists, pyright uses it and ignores `[tool.pyright]` in `pyproject.toml`. Keep exactly one.
2. Write the base (pyproject form shown):
   ```toml
   [tool.pyright]
   include = ["src"]
   exclude = ["**/__pycache__", "src/billing/generated"]
   pythonVersion = "3.12"
   venvPath = "."
   venv = ".venv"
   typeCheckingMode = "standard"
   strict = []
   reportUnnecessaryTypeIgnoreComment = "error"
   ```
   `typeCheckingMode` values are `off`, `basic`, `standard`, `strict`. `standard` is the default in current releases; writing it explicitly protects against a default change. `venvPath` and `venv` must point at the environment where the project's dependencies are installed, or every third-party import reports `reportMissingImports`.
3. Read the rule table for the installed version in the pyright docs ("Configuration" page, the table of rules and their default severity per mode). Rules that `strict` turns on and `standard` does not include `reportUnknownParameterType`, `reportUnknownArgumentType`, `reportUnknownVariableType`, `reportUnknownMemberType`, `reportMissingParameterType`, `reportMissingTypeArgument`, `reportUnnecessaryCast`, `reportUnnecessaryIsInstance`, `reportPrivateUsage`, `reportUntypedFunctionDecorator`, among others. Confirm against the docs for your version before relying on a specific rule.
4. Run `pyright --outputjson > .typecheck-logs/pyright-base.json` and read `summary.errorCount`. It must equal `py_error_baseline.current` total if the previous config was also `standard`; if the previous mode was `basic`, record the new count as the adjusted baseline and fix those errors before Phase 2.
5. Commit `types: pyright base config`.

### Output
Base config committed.

### Quality Gate
- `pyright --outputjson` `summary.errorCount` is recorded and matches the baseline or the recorded adjusted baseline.
- Only one pyright config source exists: `ls pyrightconfig.json` fails or `[tool.pyright]` is absent.
- No third-party import reports `reportMissingImports` (environment is wired).

---

## Phase 2: Add Paths to strict

### Entry Criteria
- Phase 1 committed with zero errors under `standard`.

### Actions
1. Take the next unit in `py_conversion_order`. Annotate it with `tsm-py-annotate-module` first.
2. Check the unit under strict without committing: add `# pyright: strict` as the first line of each file in the unit and run `pyright src/billing/money.py --outputjson`. Errors must be 0 for that file.
3. Choose how to record it:

   | Situation | Record as |
   |---|---|
   | A whole directory is done | Add the directory to `strict = ["src/billing/core"]` and remove the per-file comments in it. |
   | A single file is done but its directory is not | Keep the `# pyright: strict` comment in the file. |

4. Run `pyright` for the whole project; total errors must not rise. Commit `types(pyright-strict): src/billing/money.py`.
5. Never use `# pyright: basic` to lower a file below the project mode except for a file already doing so; record any existing ones as debt.
6. Suppressions: only `# pyright: ignore[ruleName]` with the rule named, never a bare `# type: ignore` or bare `# pyright: ignore`. `reportUnnecessaryTypeIgnoreComment = "error"` makes stale ones fail.
7. When every path under `include` is in `strict`, replace `typeCheckingMode = "standard"` with `typeCheckingMode = "strict"`, delete the `strict` list and the per-file comments, run pyright (count must be identical), and commit `types: pyright strict project-wide`.

### Output
`py_pyright_config`.

### Quality Gate
- Each ratchet commit: `pyright <files in unit>` reports 0 errors.
- Project `summary.errorCount` never rises between commits.
- `grep -rn "# type: ignore$\|# pyright: ignore$" src` prints nothing (every suppression names a rule).
- After the final commit, `pyright --outputjson` reports 0 errors with `typeCheckingMode = "strict"`.

---

## Worked Example

Illustrative only. pyright 1.1.38x via the PyPI `pyright` package, `src/billing`.

Phase 1: base config committed; `summary.errorCount` 0 under `standard`.

Phase 2, `src/billing/money.py` with `# pyright: strict`:
```
$ pyright src/billing/money.py
src/billing/money.py
  src/billing/money.py:18:5 - error: Type of parameter "rates" is partially unknown
    Parameter type is "dict[Unknown, Unknown]" (reportUnknownParameterType)
  src/billing/money.py:18:12 - error: Expected type arguments for generic class "dict" (reportMissingTypeArgument)
2 errors, 0 warnings, 0 informations
```
`rates: dict` becomes `rates: Mapping[str, Decimal]`; rerun prints `0 errors`. Comment kept (directory not done); commit. When all of `src/billing/core/` is done, it moves into `strict = ["src/billing/core"]`.

---

## Exit Criteria

DONE when pyright runs `strict` project-wide with 0 errors, or the migration is paused with a strict path list that only grows and 0 errors in every listed path.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Every third-party import fails | **Adjust**: fix `venvPath`/`venv` or run pyright inside the activated environment. |
| Phase 1 | Both `pyrightconfig.json` and `[tool.pyright]` exist | **Return**: ask the user which to keep; pyright silently ignores the pyproject section. |
| Phase 2 | Strict errors come from an imported module's unknown types | **Adjust**: that module is earlier in the order and not done, or its stub is incomplete; fix there, not with an ignore here. |
| Phase 2 | Proposal to set a strict rule to `"none"` to pass | **Stop**: rules stay at strict severity; annotate instead. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
