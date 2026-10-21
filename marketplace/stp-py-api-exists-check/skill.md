# Prove Each Python API Exists in the Installed Version

**One-line description:** Checks every external Python name in the edit plan against the interpreter and package versions actually installed, using `importlib.metadata`, `inspect.signature`, `hasattr`, `inspect.getsourcefile` plus `rg`, and the version notes in the official docs, so no hallucinated function, keyword argument or version-gated method reaches the code.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `edit_plan` (object[], required): From `stp-edit-plan-write`.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `py_api_evidence` (object[]): `[{ "symbol": str, "status": "FOUND"|"NOT_FOUND"|"WRONG_SIGNATURE"|"VERSION_GATED", "package": str, "installed_version": str, "evidence": str, "command": str }]`.

---

## Phase 1: Resolve Package and Version for Each Symbol

### Entry Criteria
- `edit_plan` has at least one entry with non-empty `external_symbols`.

### Actions
1. Use the same interpreter as the verify card (for example `uv run python`, `.venv/bin/python`). Call it `PY` below. Never use a different `python` on PATH; it may have different packages.
2. Run `PY --version` and record it.
3. For each symbol, split the top-level module (`requests.Session.get` gives `requests`; `unicodedata.normalize` gives `unicodedata`).
4. Find whether it is standard library: `PY -c "import sys; print('unicodedata' in sys.stdlib_module_names)"` (`sys.stdlib_module_names` exists from Python 3.10; on older versions, check the module's page in the official docs at docs.python.org for that version).
5. For third-party modules, find the distribution version: `PY -c "import importlib.metadata as m; print(m.version('requests'))"`. The distribution name can differ from the import name (`import yaml` is distribution `PyYAML`, `import bs4` is `beautifulsoup4`); if `PackageNotFoundError`, run `PY -c "import importlib.metadata as m; print(m.packages_distributions().get('yaml'))"` (Python 3.10 and later).
6. If `import <module>` fails with `ModuleNotFoundError`, the package is not installed: status `NOT_FOUND`. Do not install it.

### Output
Module, stdlib flag and version per symbol.

### Quality Gate
- Every symbol has `installed_version` set to a version string, `stdlib <python version>`, or status `NOT_FOUND`.

---

## Phase 2: Check the Attribute and Signature

### Entry Criteria
- Phase 1 done.

### Actions
1. Existence: `PY -c "import unicodedata; print(hasattr(unicodedata, 'normalize'))"`. For a method on a class: `PY -c "import requests; print(hasattr(requests.Session, 'get'))"`. For a method on a built-in type: `PY -c "print(hasattr(str, 'removeprefix'))"`.
2. Signature: `PY -c "import inspect, requests; print(inspect.signature(requests.Session.get))"`.
   - If it prints `ValueError: no signature found` (C-implemented callables), use `PY -c "import unicodedata; help(unicodedata.normalize)"` and read the first lines, which show the argument list.
   - If the signature ends in `**kwargs`, the accepted keywords are not visible. Go to step 3.
3. Source: `PY -c "import inspect, requests; print(inspect.getsourcefile(requests.Session))"`, then `rg -n "def get\b" <that file>` and read the function to confirm each keyword argument your `new_text` passes.
4. For every keyword argument in `new_text`, confirm its name appears in the signature or source. A missing name is `WRONG_SIGNATURE`.
5. Version-gated names: the official docs mark them "Added in version X.Y" (older pages: "New in version X.Y"). If the docs page for the symbol shows a version higher than `PY --version`, or higher than the project's minimum in `pyproject.toml` `requires-python`, mark `VERSION_GATED`. The project minimum matters even when your local interpreter is newer, because CI and users may run the minimum.
6. Third-party: check the project's changelog or docs for the installed version only; do not use docs for "latest" if the installed version is older.

### Output
Status and evidence per symbol.

### Quality Gate
- Each `FOUND` row has a `command` whose printed output is quoted in `evidence` (for example `True`, or the signature text).
- Each keyword argument used in `new_text` appears in the quoted signature or source line.

---

## Phase 3: Report

### Entry Criteria
- Every symbol has a status.

### Actions
1. Emit `py_api_evidence` rows.
2. For each non-`FOUND` row, add an `evidence` note naming the verified alternative, if one exists in the installed version (for example: `str.removeprefix` is 3.9+, `requires-python = ">=3.8"`, so the alternative is `s[len(p):] if s.startswith(p) else s`). Mark alternatives "proposed, not yet in plan".
3. Never mark a symbol `FOUND` because it "is common" or "should exist". Only a command output is evidence.

### Output
`py_api_evidence`.

### Quality Gate
- Row count equals the number of distinct external symbols across `edit_plan`.

---

## Worked Example

Illustrative only.

Plan symbols: `unicodedata.normalize`, `str.encode`, `bytes.decode`. `PY` = `uv run python`, `requires-python = ">=3.9"`.

```
$ uv run python --version
Python 3.12.4
$ uv run python -c "import sys; print('unicodedata' in sys.stdlib_module_names)"
True
$ uv run python -c "import unicodedata; print(hasattr(unicodedata, 'normalize'))"
True
$ uv run python -c "import inspect, unicodedata; print(inspect.signature(unicodedata.normalize))"
(form, unistr, /)
$ uv run python -c "import inspect; print(inspect.signature(str.encode))"
(self, /, encoding='utf-8', errors='strict')
```

All three rows `FOUND`. `str.encode("ascii", "ignore")` passes two positional arguments that match `encoding` and `errors`. `unicodedata.normalize` has been in the standard library since Python 2, so 3.9 is fine.

---

## Exit Criteria

DONE when every external Python symbol in the plan has a status backed by a quoted command output.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ModuleNotFoundError` | **Return**: status `NOT_FOUND`; adding a dependency is out of scope. |
| Phase 1 | Wrong interpreter used (versions differ from card) | **Retry**: with the card's interpreter prefix. |
| Phase 2 | `hasattr` True but signature lacks a keyword you used | **Return**: status `WRONG_SIGNATURE` with the real signature quoted. |
| Phase 2 | Attribute created dynamically (`__getattr__`) | **Adjust**: call it in a one-line `PY -c` with a harmless input and quote the result; if that is unsafe, mark `NOT_FOUND`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
