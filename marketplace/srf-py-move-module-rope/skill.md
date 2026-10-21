# Python Move Module with rope

**One-line description:** Moves a Python module into another package with rope's `create_move` (MoveModule), which rewrites every `import` and `from ... import` that refers to it, leaves a re-export shim at the old path when external code imports it, and verifies tests, import-time checks and the griffe API check before one commit.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `test_command` (string, required): Full suite command.
- `characterization_tests` (object, required): From `srf-py-characterization-tests`.
- `move_source` (string, required): Module file to move, for example `billing/utils/money.py`.
- `move_destination` (string, required): Destination package directory, for example `billing/core`. It must be a package (contains `__init__.py`).

---

## Outputs

- `step_commits` (string[]): SHAs of the commits made by this step (move commit, optional shim commit).
- `step_log` (object[]): Old and new dotted paths, files changed, dynamic imports handled, test and API results, SHAs.

---

## Phase 1: Prepare the Move

### Entry Criteria
- `git status --porcelain` empty; `pip show rope` succeeds.

### Actions
1. Compute old and new dotted names: `billing.utils.money` becomes `billing.core.money`.
2. Destination checks, apply in order:

| Check | Command | If it fails |
|---|---|---|
| Destination is a package | `ls billing/core/__init__.py` | Create an empty `__init__.py` in its own commit first: `git add billing/core/__init__.py && git commit -m "build: add billing.core package"`. |
| No module with the same name there | `ls billing/core/money.py` | Stop: choose another destination or rename first with `srf-py-rename-rope`. |
| Destination does not import the source's importers (cycle risk) | `git grep -n "billing.utils" billing/core` | Note it; run the cycle check in Phase 3. |

3. Find string references rope will not rewrite: `git grep -n "billing.utils.money" -- ":!*.py"` and `git grep -n -e "\"billing.utils.money" -e "'billing.utils.money" -- "*.py"` (`importlib.import_module`, `mock.patch`, logging config, Django `INSTALLED_APPS`, Celery task names). Task names and logger names derived from `__name__` change with the move; list them as behavior changes to confirm with the user.
4. Decide on a shim: if the package is published or imported by other repositories, plan a shim at the old path.

### Output
Move plan with dotted names, string references and shim decision.

### Quality Gate
- Destination `__init__.py` exists in HEAD.
- Every string reference is listed with an action.
- Every `__name__`-derived identifier (logger, task name) is listed and user-confirmed or flagged.

---

## Phase 2: Move with rope

### Entry Criteria
- Phase 1 complete.

### Actions
1. Write `/tmp/rope_move.py` outside the repo:
```python
import sys
from rope.base.project import Project
from rope.refactor.move import create_move

repo, src_rel, dest_rel = sys.argv[1], sys.argv[2], sys.argv[3]
project = Project(repo, ropefolder=None)
mover = create_move(project, project.get_resource(src_rel))  # no offset: moves the whole module
changes = mover.get_changes(project.get_resource(dest_rel))
print(changes.get_description())
if "--apply" in sys.argv:
    project.do(changes)
project.close()
```
2. Preview: `python /tmp/rope_move.py . billing/utils/money.py billing/core`. Confirm a file move entry and import rewrites in each importer.
3. Apply with `--apply`. Rope moves the file on disk; git sees a delete plus an add. `git add -A` then `git status` should show `renamed: billing/utils/money.py -> billing/core/money.py`.
4. Edit the string references from Phase 1 by hand.
5. Check every importer still imports: `python -c "import billing.core.money"` and for each changed file `python -c "import <dotted module>"`.

### Output
Module at the new path with imports rewritten.

### Quality Gate
- `git status` shows a rename for the module.
- `git grep -n "billing.utils.money" -- "*.py"` prints nothing (before the shim).
- Each import command in step 5 exits 0.

---

## Phase 3: Shim, Verify, Commit

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Run the characterization command and `test_command`. If `pylint` is available, run `pylint --disable=all --enable=cyclic-import billing` and confirm no new `R0401` lines.
2. Green: `git commit -m "refactor: move billing.utils.money to billing.core.money"`. Red: the tree was clean before the move, so `git stash push -u -m failed-move` returns it to HEAD without deleting anything permanently; report the failing test and keep the stash for inspection.
3. If a shim is planned, create `billing/utils/money.py` containing only `from billing.core.money import *  # noqa: F401,F403` plus explicit re-imports of any underscore-prefixed names that external code uses (star import skips them and skips names not in `__all__`).
4. Run tests and the griffe check. griffe must report no `Public object was removed` for the old path.
5. Commit the shim separately: `git add billing/utils/money.py && git commit -m "refactor: compatibility shim for billing.utils.money"`.

### Output
`step_commits`, `step_log`.

### Quality Gate
- Tests pass after each commit.
- griffe check silent after the shim commit.
- `git log --oneline -2` shows the move and the shim as separate commits.

---

## Worked Example

Illustrative only.
```
$ python /tmp/rope_move.py . billing/utils/money.py billing/core --apply
$ git add -A && git status --short
R  billing/utils/money.py -> billing/core/money.py
M  billing/invoice.py
M  billing/report.py
$ git grep -n "billing.utils.money" -- "*.py"
$ pytest -q
215 passed, 2 skipped
$ git commit -m "refactor: move billing.utils.money to billing.core.money"
```
Shim added and committed; `griffe check billing --search . --against 9f2c4e1` prints nothing.

---

## Exit Criteria

DONE when the module lives at the new path, every import is rewritten, string references are handled, tests and API check pass, and the move and shim are separate commits.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Destination not a package | **Adjust**: add `__init__.py` in its own commit. |
| Phase 2 | rope leaves relative imports inside the moved module pointing at old siblings | **Adjust**: fix them by hand to absolute imports; rerun step 5. |
| Phase 3 | Circular import introduced (`ImportError: cannot import name ... partially initialized module`) | **Return**: revert and run `srf-py-break-import-cycle` first. |
| Phase 3 | Logger or task name change breaks configuration | **Stop**: report; the user decides whether to keep explicit names. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
