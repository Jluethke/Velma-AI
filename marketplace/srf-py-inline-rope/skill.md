# Python Inline Function or Variable with rope

**One-line description:** Replaces every call of a trivial Python function (or every use of a single-assignment local variable) with its body using rope's `create_inline`, removes the definition only when rope reports no remaining references, and verifies with tests, the griffe API check and one commit.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `test_command` (string, required): Full suite command.
- `characterization_tests` (object, required): From `srf-py-characterization-tests`; must cover every call site being inlined.
- `inline_target` (string, required): `<file>:<line>:<name>` of the definition, for example `billing/money.py:14:to_cents`.

---

## Outputs

- `step_commits` (string[]): SHA of the commit made by this step.
- `step_log` (object[]): Target, number of call sites inlined, files changed, test and API check results, commit SHA.

---

## Phase 1: Decide Whether Inlining Is Safe

### Entry Criteria
- `git status --porcelain` is empty.

### Actions
1. Find all references: `git grep -n -w "to_cents" -- "*.py"`. Also search string references that rope cannot see: `git grep -n "\"to_cents\"\|'to_cents'" -- "*.py" "*.toml" "*.cfg" "*.ini" "*.yaml"`.
2. Apply this table:

| Finding | Decision |
|---|---|
| Name appears in `__all__`, in a string (`getattr`, entry points, settings) or in another repository's code | Stop: the function is public API. Inline call sites only with `remove=False` (see Phase 2) and keep the definition. |
| Function is recursive | Stop: cannot inline. |
| Function body has more than one `return` | Stop: rope requires a single exit to inline a call into an expression; use extract or by-hand rewrite instead. |
| Function is a method overridden in a subclass (`git grep -n "def to_cents"` finds more than one) | Stop: inlining removes dynamic dispatch. |
| Function is decorated (`@lru_cache`, `@property`, custom) | Stop: the decorator's behavior would be lost. |
| Target is a local variable assigned once | Allowed. |
| Plain function, single return, all references are direct calls | Allowed. |

3. Compute the character offset of the name in the definition line, which rope needs: line 14, column of `to_cents` after `def `.

### Output
Go or no-go with the reason, and the offset.

### Quality Gate
- Every reference from step 1 is classified by the table.
- No Stop row applies, or the flow ends here with the reason recorded.

---

## Phase 2: Inline with rope

### Entry Criteria
- Go decision.

### Actions
1. Write `/tmp/rope_inline.py` outside the repo:
```python
import sys
from rope.base.project import Project
from rope.refactor.inline import create_inline

repo, rel, line, name = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
project = Project(repo, ropefolder=None)
res = project.get_resource(rel)
src = res.read()
line_start = sum(len(l) for l in src.splitlines(keepends=True)[: line - 1])
offset = src.index(name, line_start)
inliner = create_inline(project, res, offset)
keep = "--keep" in sys.argv
changes = inliner.get_changes(remove=not keep)
print(changes.get_description())
if "--apply" in sys.argv:
    project.do(changes)
project.close()
```
2. Preview: `python /tmp/rope_inline.py . billing/money.py 14 to_cents`. Read every hunk. Confirm each call site now contains the body with arguments substituted, and that arguments with side effects (function calls) are not duplicated. If an argument expression appears twice in one inlined hunk and it calls a function, stop: inlining changes how often it runs.
3. If Phase 1 said the definition must stay, add `--keep`. Confirm the `get_changes` keyword names (`remove`, `only_current`) against the rope docs for the installed version (`pip show rope`).
4. Apply with `--apply`.
5. `git diff --stat`: the files listed must equal the files that held references in Phase 1 step 1. Anything else: `git checkout -- .` and stop.

### Output
Diff with call sites inlined and, if allowed, the definition removed.

### Quality Gate
- `git grep -n -w "to_cents" -- "*.py"` prints nothing when removed, or only the definition when kept.
- `python -m compileall -q billing` exits 0.

---

## Phase 3: Verify and Commit

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Run the characterization command, then `test_command`.
2. Run the griffe check command from `.refactor/` if present. If it reports `Public object was removed` for the inlined name, revert: the function was public.
3. Green: `git commit -am "refactor: inline to_cents"`. Red: `git checkout -- .`, record the failing test, stop. Do not edit tests.
4. Record `step_commits` and `step_log`.

### Output
`step_commits`, `step_log`.

### Quality Gate
- Zero failed tests; counts equal the previous step.
- `git status --porcelain` empty after commit.

---

## Worked Example

Illustrative only. `inline_target=billing/money.py:14:to_cents`, body `return int(round(amount * 100))`, 3 call sites in 2 files.
```
$ python /tmp/rope_inline.py . billing/money.py 14 to_cents
Inline method <to_cents>:
--- a/billing/invoice.py
-    total_c = to_cents(total)
+    total_c = int(round(total * 100))
...
$ python /tmp/rope_inline.py . billing/money.py 14 to_cents --apply
$ git diff --stat
 billing/invoice.py | 4 ++--
 billing/money.py   | 4 ----
 billing/report.py  | 2 +-
$ pytest -q
215 passed, 2 skipped
```

---

## Exit Criteria

DONE when every reference is inlined (definition removed or deliberately kept), tests and API check pass, and one commit holds the step.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Reference found in a string or config | **Adjust**: keep the definition with `--keep`. |
| Phase 2 | rope raises `RefactoringError` about multiple returns | **Stop**: not inlinable by rope; record and move on. |
| Phase 2 | Argument with side effects duplicated | **Stop**: revert; inlining changes call counts. |
| Phase 3 | Tests fail | **Retry**: revert, inline one call site at a time (`only_current=True` on the call site offset), testing after each. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
