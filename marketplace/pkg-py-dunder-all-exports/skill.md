# Python __all__ and py.typed Exports

**One-line description:** Pins a Python package's public surface with an explicit `__all__`, explicit re-exports from underscore-prefixed private modules, and a PEP 561 `py.typed` marker, then proves it with ruff, pyright `--verifytypes` and an import test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `public_api` (object[], required): From `pkg-public-api-inventory`; the rows marked `public` and the leaks with their fixes.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `py_export_surface` (object): `import_name`, the final `__all__` list per public module, `private_modules` renamed, `shims` kept for deprecated paths, `py_typed` path, and the pasted output of every gate command.

---

## Phase 1: Write __all__ in the Top-Level Package

### Entry Criteria
- `public_api` has zero `undecided` rows.
- `git status --porcelain` is empty (start from a clean tree so the diff is reviewable).

### Actions
1. Open only `src/<import_name>/__init__.py` (or `<import_name>/__init__.py` for flat layout). Edit this one file in this phase.
2. Import each public symbol explicitly from its implementation module, using the redundant-alias form so type checkers treat it as a re-export:
   ```python
   from ._core import retry as retry
   from ._errors import RetryError as RetryError
   ```
3. Add `__all__` as a literal list of strings, sorted, listing exactly the `public` rows:
   ```python
   __all__ = ["RetryError", "backoff", "retry"]
   ```
4. Do not build `__all__` with code (`__all__ = [n for n in dir() ...]`). Static tools only read literal lists.
5. Do not use `from ._core import *` in `__init__.py`; it re-imports leaks.

### Output
Edited `__init__.py` with literal `__all__`.

### Quality Gate
- `python -m ruff check --select F401,F822 src/<import_name>/__init__.py` exits 0. F822 flags a name in `__all__` that is not defined; F401 flags an unused import that is not re-exported.
- `python -c "import <import_name> as m; missing=[n for n in m.__all__ if not hasattr(m, n)]; print(missing)"` prints `[]`.

---

## Phase 2: Make Implementation Modules Private

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. For each module in `api_leaks` with fix "rename to `_name.py`", run one rename at a time with git so history follows: `git mv src/<pkg>/utils.py src/<pkg>/_utils.py`.
2. After each rename, update imports: `git grep -n "from .utils\|<pkg>.utils\|from <pkg> import utils"` and change each hit. Re-run the tests after each module, not once at the end: `python -m pytest -q`.
3. If the leak is `deprecate_first`, keep a shim at the old path:
   ```python
   # src/<pkg>/utils.py
   import warnings
   from ._utils import *  # noqa: F403
   from ._utils import __all__ as __all__
   warnings.warn("<pkg>.utils is deprecated; import from <pkg> instead", DeprecationWarning, stacklevel=2)
   ```
4. Never delete or weaken a test to make the rename pass. If a test imports the old private path, change the test's import to the new path and keep its assertions unchanged.

### Output
Private modules renamed, shims in place, tests passing.

### Quality Gate
- `python -m pytest -q` exits 0 after the last rename.
- `git diff --stat` shows no test file with deleted assertion lines (`git diff -U0 tests | grep '^-\s*assert'` prints nothing).

---

## Phase 3: Ship Type Information

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Create an empty marker file `src/<import_name>/py.typed` (PEP 561). Hatchling and setuptools include package data files inside the package directory in the wheel by default for most layouts; `pkg-py-dist-inspect` confirms it shipped.
2. Run `python -m pip install pyright` then `pyright --verifytypes <import_name> --ignoreexternal`. Read the summary lines "Symbols exported by ..." and "Type completeness score". Every symbol listed as "partially unknown" or "missing" needs a type annotation.
3. Annotate the public functions reported, one module at a time, then re-run step 2.
4. Run the consumer check: write `/tmp/consumer_check.py` containing `from <import_name> import *` plus one call to each public function, then `python -m mypy --strict /tmp/consumer_check.py`. It must report no `attr-defined` or `no-untyped-call` errors for package symbols.

### Output
`py_export_surface`.

### Quality Gate
- `py.typed` exists (`test -f src/<import_name>/py.typed`).
- `pyright --verifytypes` output shows zero symbols with missing type information for names in `__all__`, or each remaining one is listed as an open item.
- `python -m pytest -q` exits 0.

---

## Worked Example

Illustrative. `tinyretry` with leaks `sleep_for_tests`, `time`, `utils` (deprecate_first).

Phase 1: `__init__.py` becomes:
```python
from ._core import backoff as backoff, retry as retry
from ._errors import RetryError as RetryError
__all__ = ["RetryError", "backoff", "retry"]
```
`ruff check --select F401,F822` prints `All checks passed!`. The missing-names check prints `[]`.

Phase 2: `git mv src/tinyretry/utils.py src/tinyretry/_utils.py`, shim added at `utils.py`, `pytest -q` prints `42 passed`.

Phase 3:
```
$ pyright --verifytypes tinyretry --ignoreexternal
Symbols exported by "tinyretry": 9
  With known type: 8
  With partially unknown type: 1
Type completeness score: 88.9%
error: Type is partially unknown for function "tinyretry.backoff"
```
Annotate `backoff(base: float, cap: float) -> Iterator[float]`; rerun reports 100%.

---

## Exit Criteria

DONE when `__all__` lists exactly the public rows, leaks are private or shimmed with a warning, `py.typed` exists, and ruff, pytest and pyright gates pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | F822 reports an undefined name | **Adjust**: add the missing import or remove the name; never silence F822 with noqa. |
| Phase 2 | Tests fail after a rename | **Adjust**: fix the import that the traceback names; revert that one rename with `git mv` back if unclear. |
| Phase 2 | Circular import after moving code | **Stop**: report the cycle from the traceback; moving more files at once makes it worse. |
| Phase 3 | pyright not installable | **Adjust**: use `python -m mypy --strict` on the consumer file alone and note the missing check. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
