# Python Stubs and Missing Imports

**One-line description:** Resolves every `import-untyped` and `import-not-found` error (mypy) or `reportMissingTypeStubs` / `reportMissingImports` (pyright) by checking for an inline-typed release with `py.typed`, installing the version-matched `types-*` stub package from typeshed, generating a local stub with stubgen or `pyright --createstub`, or as a last resort a per-module ignore override, never a global ignore.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `py_error_baseline` (object, required): From `tsm-py-error-baseline`; its logs contain the import errors.

---

## Outputs

- `py_stub_report` (object[]): One row per third-party distribution: import name, installed version, resolution (`inline`, `typeshed-stub`, `local-stub`, `scoped-ignore`), stub package and pinned version or stub path, and the error count before and after.

---

## Phase 1: List the Untyped Imports

### Entry Criteria
- The strict log from `py_error_baseline` exists.

### Actions
1. mypy: `grep -E "\[import-untyped\]|\[import-not-found\]|\[import\]" .typecheck-logs/mypy-strict.txt`. Messages read:
   - `error: Library stubs not installed for "requests"  [import-untyped]` followed by a note `Hint: "python3 -m pip install types-requests"`
   - `error: Skipping analyzing "legacy_sdk": module is installed, but missing library stubs or py.typed marker  [import-untyped]`
   - `error: Cannot find implementation or library stub for module named "acme_internal"  [import-not-found]`
2. pyright: from `pyright-strict.json` select diagnostics with rule `reportMissingTypeStubs` (package installed, no stubs) and `reportMissingImports` (not installed or wrong environment).
3. Extract unique top-level import names and record each one's installed version: `pip show <distribution> | grep Version` (the distribution name can differ from the import name; `pip show` takes the distribution name, find it in the lock file).
4. `import-not-found` / `reportMissingImports` for a package that IS in the lock file means the checker uses the wrong interpreter. Fix that first (`python_executable` in mypy config, `venvPath` and `venv` in pyright config) and rerun; these are not stub problems.

### Output
List of untyped distributions with versions.

### Quality Gate
- Every listed name maps to a distribution in the lock file, or is marked as an interpreter problem fixed in step 4.

---

## Phase 2: Resolve Each Distribution

### Entry Criteria
- Phase 1 list exists.

### Actions
For each distribution, take the first row that applies. One distribution per commit.

| Step | Check | Action |
|---|---|---|
| 1 | A newer release of the library ships `py.typed` (read its changelog or `pip download <dist>==<newer> --no-deps` and look for `py.typed` in the wheel) | **Return** to the user: an upgrade is a dependency change outside this flow. Record the option. |
| 2 | A typeshed stub package exists: the mypy hint names it, or `pip index versions types-<name>` lists versions | Install the stub whose version starts with the library's major.minor (typeshed versions stubs as `<library version>.<date stamp>`), pinned in the dev group: `uv add --dev "types-requests==2.32.0.20240914"` or the pip equivalent. |
| 3 | No stub exists and the code uses a small surface | Generate and trim a local stub (below). |
| 4 | No stub, large surface, and the library is out of the migration's scope | Scoped ignore override (below). Record it as debt. |

Rules for all rows:
1. Do not run `mypy --install-types` without `--non-interactive` in automation, and do not use it as the fix: it installs unpinned stubs into the current environment only. Use it once to discover names if helpful, then pin the names it found in the dependency file.
2. Stub packages go in the dev dependency group, never runtime dependencies.
3. Never set `ignore_missing_imports = true` globally in `[tool.mypy]`. It hides every future missing stub and makes those imports `Any` silently.

Local stub (row 3):
1. mypy: `stubgen -p legacy_sdk -o stubs` (use `-m legacy_sdk.client` for one module). Add `mypy_path = "stubs"` to `[tool.mypy]`.
2. pyright: `pyright --createstub legacy_sdk` writes to `typings/legacy_sdk/` (the default `stubPath`). Use the same directory for both checkers by setting `mypy_path = "typings"` if both run.
3. Open the generated `.pyi` files. Delete every function and class the project does not import (find the used surface with `grep -rn "legacy_sdk" src`). Replace each remaining `Incomplete` or missing annotation with a real type read from the library source or docs. A stub full of `Incomplete` is an `Any` in disguise.
4. Add a header comment in each stub: library name and version it was written against.

Scoped ignore (row 4), in `pyproject.toml`:
```toml
[[tool.mypy.overrides]]
module = ["legacy_sdk", "legacy_sdk.*"]
ignore_missing_imports = true
```
pyright equivalent: add `# pyright: ignore[reportMissingTypeStubs]` to each import line of that library only; do not turn the rule off in config.

### Output
`py_stub_report`.

### Quality Gate
- Rerunning the strict check shows zero `import-untyped` and `import-not-found` errors (or zero `reportMissingTypeStubs` and `reportMissingImports`) for every distribution marked resolved.
- `python -c "import tomllib;print(tomllib.load(open('pyproject.toml','rb'))['tool']['mypy'].get('ignore_missing_imports'))"` prints `None` or `False` (needs Python 3.11+ for `tomllib`); every `ignore_missing_imports` sits inside a `[[tool.mypy.overrides]]` block naming specific modules.
- Every `types-*` package is pinned with `==` in the dev group.
- `grep -rn "Incomplete" stubs typings 2>/dev/null` prints nothing for stubs this flow wrote.

---

## Worked Example

Illustrative only. Strict log shows `requests`, `yaml`, `legacy_sdk`, `boto3`.

Phase 2:
- `requests 2.32.3`: hint names `types-requests`; `pip index versions types-requests` lists `2.32.0.20240914`; pinned in dev group. Errors: 31 to 0.
- `yaml` (distribution `PyYAML 6.0.2`): `types-PyYAML==6.0.12.20240917` pinned.
- `boto3`: no typeshed stub; the community package `boto3-stubs` exists. Present it to the user as an option, since it is a third-party stub not from typeshed; user approves `boto3-stubs[s3]` pinned.
- `legacy_sdk 0.9`: internal, no stubs, project uses two functions. `stubgen -m legacy_sdk.client -o stubs`, trimmed to `def fetch(account_id: str, *, timeout: float = ...) -> dict[str, str]: ...` and one class. `mypy_path = "stubs"` added.

Rerun: zero import errors.

---

## Exit Criteria

DONE when every third-party import resolves through inline types, a pinned stub package, a trimmed local stub, or a recorded scoped override, with no global ignore.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Import errors for packages that are installed | **Adjust**: point the checker at the project interpreter (`python_executable`, or pyright `venvPath`/`venv`) and rerun before touching stubs. |
| Phase 2 | Stub version does not match the library major.minor | **Adjust**: choose the matching stub release; if none exists, write a local stub for the used surface. |
| Phase 2 | New errors appear after installing a stub | **Adjust**: these are real mismatches the stub exposes; they go to `tsm-py-annotate-module`, not back into an ignore. |
| Phase 2 | Someone proposes a global `ignore_missing_imports` | **Stop**: refuse; use a scoped override with the module list. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
