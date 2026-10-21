# Python Dead Code Removal with vulture and Coverage Evidence

**One-line description:** Removes Python code only when three independent pieces of evidence agree: vulture reports it unused, a repository-wide search finds no dynamic or configuration reference, and coverage.py shows zero executions under the test suite (and under a production-like run when available), deleting one symbol per commit with tests green after each.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `test_command` (string, required): Full suite command.
- `characterization_tests` (object, required): From `srf-py-characterization-tests`; its `unreachable_candidate` entries seed the candidate list.
- `dead_code_scope` (string, required): Package or directory to analyze, for example `billing`.

---

## Outputs

- `step_commits` (string[]): One SHA per removed symbol.
- `step_log` (object[]): Per symbol: vulture line and confidence, grep evidence, coverage evidence, decision, SHA.

---

## Phase 1: Collect Candidates

### Entry Criteria
- `git status --porcelain` empty.
- `pip show vulture coverage` succeeds or the user approves installing them into the dev environment.

### Actions
1. Run `vulture billing --sort-by-size`. Each line reads `billing/report.py:88: unused function 'legacy_csv' (60% confidence)`. Record every line.
2. vulture also needs to see test usage only if tests are the only callers; run it on the package alone first. Code used only by tests is still a candidate; record "test-only caller" in the evidence.
3. If the repo has a whitelist (`vulture_whitelist.py` or `whitelist.py` passed in config, or `[tool.vulture]` in `pyproject.toml`), use the same config so known false positives are excluded. Do not create a whitelist to hide findings you have not investigated.
4. Run the suite under branch coverage: `coverage run --branch -m pytest -q` then `coverage report -m --include="billing/*"`. Missing lines are listed per file.
5. Add every `unreachable_candidate` from `characterization_tests` to the list.

### Output
Candidate list with vulture confidence and coverage misses.

### Quality Gate
- Every candidate has a vulture line or an `unreachable_candidate` source.
- `coverage report` ran with `--branch` data (column `Branch` present).

---

## Phase 2: Prove Each Candidate Is Dead

### Entry Criteria
- Phase 1 list exists.

### Actions
1. For each candidate run every search in this table and record hit counts:

| Reference kind | Command |
|---|---|
| Direct name anywhere | `git grep -n -w "legacy_csv"` (all files, not only `.py`) |
| String reference (`getattr`, registries, URL routes, Celery tasks, Django settings) | `git grep -n -e "\"legacy_csv\"" -e "'legacy_csv'"` |
| Package exports | `git grep -n "__all__" billing` then read the lists |
| Entry points | `grep -n -A20 -e "entry-points" -e "entry_points" -e "scripts" pyproject.toml setup.cfg setup.py` |
| Framework hooks by naming convention (`test_*`, `setUp`, `pytest_*` hooks, Django `clean_<field>`, `visit_<Node>` in AST visitors, `__dunder__` methods) | Read the class; these are called implicitly |

2. Decide with this table:

| vulture | grep (excluding the definition) | coverage of the definition body | Decision |
|---|---|---|---|
| Reported | 0 hits | 0 executions | Delete. |
| Reported | Only tests reference it | Executed only by those tests | Delete the symbol and its tests in the same commit only if the user confirms the feature is retired; else keep. |
| Reported | Any non-test hit | any | Keep; record as false positive. |
| Reported | 0 hits | Executed | Keep: something calls it dynamically. Investigate the caller with a breakpoint or `traceback.print_stack()` in a scratch run. |
| Not reported, `unreachable_candidate` branch | n/a | 0 executions, and no input reaches it per the condition | Delete the branch only if the condition can be shown impossible from the code (for example `if x is None` after `x = compute()` that never returns None by its signature and body); else keep. |

3. When production traffic matters, ask the user whether a production coverage file exists (`coverage` run with `COVERAGE_PROCESS_START`, or a profiler sample). Absent that, record "test evidence only" in the log.

### Output
Decision per candidate with evidence.

### Quality Gate
- Every "Delete" decision has vulture output, a zero-hit grep, and zero coverage recorded together.
- Every "Keep" has its reason.

---

## Phase 3: Delete One Symbol per Commit

### Entry Criteria
- At least one Delete decision.

### Actions
1. Delete one symbol (function, class, method, branch). Also delete imports that become unused only because of it; find them with `vulture` again or `ruff check --select F401 <file>` if ruff is used.
2. Run `python -m compileall -q billing`, the characterization command, `test_command`, and the griffe check if present. A removed public name in the griffe output means it was public API: revert and mark Keep.
3. Green: `git commit -am "refactor: remove unused legacy_csv (vulture 60%, 0 refs, 0 coverage)"`. Red: `git checkout -- .`, mark Keep with the failing test name.
4. Repeat per symbol. Never batch several deletions into one commit; a failing batch hides which deletion broke it.

### Output
`step_commits`, `step_log`.

### Quality Gate
- After each commit, tests exit 0 with counts unchanged except deleted tests the user confirmed.
- Rerunning `vulture billing` no longer lists deleted symbols.
- `git status --porcelain` empty.

---

## Worked Example

Illustrative only.
```
$ vulture billing --sort-by-size
billing/report.py:88: unused function 'legacy_csv' (60% confidence, 24 lines)
billing/models.py:12: unused attribute 'created_by' (60% confidence, 1 line)
$ git grep -n -w legacy_csv
billing/report.py:88:def legacy_csv(rows):
$ git grep -n -w created_by
migrations/0003_add_created_by.py:9:  "created_by",
$ coverage report -m --include="billing/report.py"
billing/report.py   140   26   38   2   80%   88-111, ...
```
`legacy_csv`: delete (0 refs, lines 88 to 111 never executed). `created_by`: keep (ORM column referenced in a migration). One commit, `pytest -q` shows `215 passed`.

---

## Exit Criteria

DONE when each removed symbol had all three pieces of evidence, each removal is its own green commit, and every kept candidate has a recorded reason.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | vulture floods with low-confidence results | **Adjust**: process `--min-confidence 100` results first, then lower values, recording the flag used. |
| Phase 2 | Name used by a plugin or framework convention | **Adjust**: mark Keep and add it to the project's existing whitelist only if the user approves. |
| Phase 3 | Tests fail after deletion | **Retry**: revert; mark Keep with the evidence that it is live. |
| Phase 3 | griffe reports removal | **Stop**: public API; keep it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
