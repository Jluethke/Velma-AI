# Python Rename Across the Codebase with rope

**One-line description:** Renames a Python function, class, method, attribute or module-level name in every file that references it using rope's `Rename` refactoring, which follows imports and attribute access through static analysis, then handles string references by hand, verifies tests and the griffe API check, and commits.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `test_command` (string, required): Full suite command.
- `characterization_tests` (object, required): From `srf-py-characterization-tests`.
- `rename_target` (string, required): `<file>:<line>:<name>` of the definition, for example `billing/invoice.py:10:parse_invoice`.
- `new_name` (string, required): New identifier, snake_case for functions, CapWords for classes (PEP 8).

---

## Outputs

- `step_commits` (string[]): SHA of the commit made by this step.
- `step_log` (object[]): Old and new names, files changed, dynamic references handled, test and API results, SHA.

---

## Phase 1: Find Static and Dynamic References

### Entry Criteria
- `git status --porcelain` empty; `pip show rope` succeeds.

### Actions
1. Static references: `git grep -n -w "<old>" -- "*.py"`. Count files.
2. Dynamic references rope cannot follow, search each pattern:

| Pattern | Command |
|---|---|
| `getattr`/`setattr`/`hasattr` with the name as a string | `git grep -n -e "\"<old>\"" -e "'<old>'" -- "*.py"` |
| `mock.patch("pkg.mod.<old>")` | `git grep -n "patch(.*<old>" -- "*.py"` |
| Entry points, plugin registries | `git grep -n -w "<old>" -- pyproject.toml setup.cfg setup.py "*.ini" "*.yaml" "*.yml"` |
| Pickled objects or ORM column names | Stop and ask the user: renaming a pickled class or a mapped attribute breaks stored data. |
| Sphinx docs | `git grep -n -w "<old>" -- "*.rst" "*.md"` |

3. If the name is in `__all__` or imported from the package root by users, plan a compatibility alias: `<old> = <new>` in the original module with a comment, plus a `DeprecationWarning` only if the user asks for one.
4. Do NOT use `sed` or editor find-and-replace for the rename itself; a textual replace also hits unrelated names like `self.<old>` on other classes.

### Output
Static count, dynamic reference list, alias decision.

### Quality Gate
- Every grep hit from step 2 is listed with a planned action.

---

## Phase 2: Rename with rope

### Entry Criteria
- Phase 1 complete.

### Actions
1. Write `/tmp/rope_rename.py` outside the repo:
```python
import sys
from rope.base.project import Project
from rope.refactor.rename import Rename

repo, rel, line, old, new = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4], sys.argv[5]
project = Project(repo, ropefolder=None)
res = project.get_resource(rel)
src = res.read()
line_start = sum(len(l) for l in src.splitlines(keepends=True)[: line - 1])
offset = src.index(old, line_start)
changes = Rename(project, res, offset).get_changes(new, docs=False)
print(changes.get_description())
if "--apply" in sys.argv:
    project.do(changes)
project.close()
```
2. Preview: `python /tmp/rope_rename.py . billing/invoice.py 10 parse_invoice parse_invoice_text`. Read every hunk.
3. For a method, rope renames only that class's method unless asked to include the hierarchy. If subclasses override the method, check the `in_hierarchy` argument in the rope docs for your version and set it, or the override silently stops overriding.
4. Keep `docs=False` so strings and comments are not rewritten blindly; edit dynamic references from Phase 1 by hand.
5. Apply with `--apply`. Then make the hand edits and add the alias if planned.
6. `python -m compileall -q .` exits 0, and `git grep -n -w "<old>" -- "*.py"` shows only the alias and lines you chose to keep.

### Output
Renamed symbol with dynamic references and alias handled.

### Quality Gate
- `compileall` exits 0.
- Remaining `<old>` hits equal the planned keep list exactly.

---

## Phase 3: Verify and Commit

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Run the characterization command, then `test_command`. If the project uses a type checker (`mypy` or `pyright` config present), run it too.
2. Run the griffe check. `Public object was removed` means the alias is missing.
3. Green: `git commit -am "refactor: rename parse_invoice to parse_invoice_text"`. Red: `git checkout -- .`, report the failing test.
4. Record outputs.

### Output
`step_commits`, `step_log`.

### Quality Gate
- Tests and type checker exit 0; griffe check silent; tree clean after commit.

---

## Worked Example

Illustrative only.
```
$ git grep -n "patch(.*parse_invoice" -- "*.py"
tests/test_api.py:8:@patch("billing.api.parse_invoice")
$ python /tmp/rope_rename.py . billing/invoice.py 10 parse_invoice parse_invoice_text --apply
$ git diff --stat | tail -1
 5 files changed, 9 insertions(+), 9 deletions(-)
```
The `@patch` string updated by hand to `billing.api.parse_invoice_text`; alias `parse_invoice = parse_invoice_text` added in `billing/invoice.py`; `pytest -q` shows `215 passed`.

---

## Exit Criteria

DONE when rope renamed every static reference, dynamic references are handled by hand, tests, type check and API check pass, and one commit holds the step.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Name is a pickled class or ORM attribute | **Stop**: ask the user; data migration is out of scope. |
| Phase 2 | rope misses a reference reached through a dynamic import | **Adjust**: edit it by hand; it appears in the step 6 grep. |
| Phase 2 | rope reports a name clash | **Adjust**: choose another `new_name`. |
| Phase 3 | `mock.patch` target errors (`AttributeError ... does not have the attribute`) | **Adjust**: update the patch string. Never remove the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
