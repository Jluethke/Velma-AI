# Python Break Circular Imports

**One-line description:** Detects Python import cycles with pylint's `cyclic-import` (R0401) check and reproduces each at import time, then breaks it with the least invasive fix from a fixed order (type-only imports under `TYPE_CHECKING`, extract the shared code to a third module, invert the dependency), never with a function-level import as the first choice, one cycle per commit.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `test_command` (string, required): Full suite command.
- `characterization_tests` (object, required): From `srf-py-characterization-tests`.
- `package_name` (string, required): Top-level package to analyze, for example `billing`.

---

## Outputs

- `step_commits` (string[]): One SHA per cycle broken.
- `step_log` (object[]): Per cycle: modules involved, imported names, fix chosen, results, SHA.

---

## Phase 1: Detect and Reproduce

### Entry Criteria
- `git status --porcelain` empty; `pip show pylint` succeeds (install into dev environment if the user approves).

### Actions
1. Run `pylint --disable=all --enable=cyclic-import billing`. Output lines read `R0401: Cyclic import (billing.invoice -> billing.customer)`. Record each cycle. pylint reports cycles it finds across the modules it analyzed, so pass the whole package.
2. Optionally confirm with `pydeps billing --show-cycles --no-output` if pydeps is installed; check `pydeps --help` for the flag names in your version.
3. Reproduce each cycle at runtime in a fresh interpreter, importing each module of the cycle first: `python -c "import billing.customer"` and `python -c "import billing.invoice"`. A real failure reads `ImportError: cannot import name 'Invoice' from partially initialized module 'billing.invoice' (most likely due to a circular import)`. Record which order fails. A cycle that never fails at runtime is still a design defect; fix it but note "latent".
4. For each edge of the cycle, list exactly which names are imported and where they are used: `git grep -n "^from billing.customer import\|^import billing.customer" billing/invoice.py`, then search each name's uses in that file.

### Output
Cycle list with imported names and their uses.

### Quality Gate
- Every R0401 line is recorded.
- Every edge has its imported names and use sites listed.

---

## Phase 2: Choose the Fix

### Entry Criteria
- Phase 1 complete.

### Actions
1. For each cycle, walk this table top to bottom and take the first row that applies:

| Condition on one edge of the cycle | Fix |
|---|---|
| The imported names are used only in type annotations | Add `from __future__ import annotations` at the top of the importing module (if not present) and move the import under `if TYPE_CHECKING:` (`from typing import TYPE_CHECKING`). Runtime import edge disappears. Not valid if the name is used at runtime (in `isinstance`, a default value, a dataclass field type inspected by pydantic or similar). |
| Both modules import a shared helper, constant or base class from each other | Extract the shared code to a new third module (`billing/_shared.py` or a name for the concept) that imports neither; both import from it. Use `srf-py-move-module-rope`-style tooling or rope's move for functions. |
| A low-level module calls up into a high-level module (callback, registry) | Invert: the low-level module accepts a callable or protocol (`typing.Protocol`) as a parameter, and the high-level module passes it in. |
| The cycle is via the package `__init__.py` re-exporting submodules that import from the package root | Change submodules to import from the defining submodule (`from billing.customer import Customer`), not from `billing`. |
| None of the above fits within this step | Function-level import inside the one function that needs it, with a comment naming the cycle. Last resort; record it as technical debt in `step_log`. |

2. Do NOT reorder imports at module level to make one order work; it leaves the cycle in place and breaks again with another import order.
3. Do NOT use `importlib.import_module` or `sys.modules` tricks.

### Output
Chosen fix per cycle with the table row.

### Quality Gate
- Each cycle has exactly one fix and the cited row.
- The `TYPE_CHECKING` row is chosen only if every use site of the names is an annotation.

---

## Phase 3: Apply, Verify, Commit

### Entry Criteria
- Phase 2 complete.

### Actions
1. Apply the fix for one cycle only.
2. Rerun the Phase 1 step 3 imports for every module in the cycle; all must exit 0.
3. Rerun `pylint --disable=all --enable=cyclic-import billing`; the fixed cycle must be gone and no new cycle may appear.
4. Run the characterization command, `test_command`, the type checker if configured (`mypy`/`pyright`; they evaluate `TYPE_CHECKING` imports), and the griffe check if present.
5. Green: `git commit -am "refactor: break billing.invoice <-> billing.customer cycle (TYPE_CHECKING import)"`. Red: `git checkout -- .` (and `git stash push -u` if a new module file was created), choose the next row.
6. Repeat per cycle.

### Output
`step_commits`, `step_log`.

### Quality Gate
- pylint prints no `R0401` lines for fixed cycles and none new.
- Every module of each fixed cycle imports cleanly first in a fresh interpreter.
- Tests, type checker and API check exit 0.

---

## Worked Example

Illustrative only.
```
$ pylint --disable=all --enable=cyclic-import billing
billing/customer.py:1:0: R0401: Cyclic import (billing.customer -> billing.invoice) (cyclic-import)
$ python -c "import billing.customer"
ImportError: cannot import name 'Invoice' from partially initialized module 'billing.invoice' ...
```
`billing/customer.py` uses `Invoice` only in `def latest(self) -> Invoice:`. Fix: `from __future__ import annotations` plus `if TYPE_CHECKING: from billing.invoice import Invoice`. Both imports now succeed; pylint prints no R0401; `pytest -q` and `mypy billing` pass; one commit.

---

## Exit Criteria

DONE when pylint reports no cyclic imports in the package (or each remaining one is a recorded last-resort function-level import), every module imports first in a fresh interpreter, and each fix is one green commit.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | pylint reports nothing but the runtime ImportError exists | **Adjust**: the cycle passes through a dynamic import; trace with `python -X importtime -c "import billing.customer"` and read the nested order. |
| Phase 2 | Annotation evaluated at runtime (pydantic, dataclass with `get_type_hints`) | **Adjust**: skip the `TYPE_CHECKING` row; extract a shared module. |
| Phase 3 | New cycle appears | **Retry**: revert; the new module imports one of the two; move only the shared leaf code. |
| Phase 3 | griffe reports removed name after extraction | **Adjust**: re-export the moved name from the original module. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
