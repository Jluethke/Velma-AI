# Python Mutation Check of Changed Modules with mutmut

**One-line description:** Runs mutmut only on the production modules the PR changed, in a throwaway worktree, then reads each surviving mutant that falls on a changed line as a concrete missing assertion and turns it into a finding with the test that would kill it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Local clone with the PR head checked out.
- `changed_files` (object[], required): Rename-aware file list.
- `findings_dir` (string, required): Findings directory.

---

## Outputs

- `mutation_findings` (object[]): One finding per surviving mutant on a changed line, written to `<findings_dir>/prr-py-mutmut-check.json`.

---

## Phase 1: Prepare an Isolated Mutation Run

### Entry Criteria
- At least one changed production `.py` file (not a test file).
- The test suite passes on the PR head (mutation testing on a failing suite is meaningless).

### Actions
1. Create a separate worktree; mutmut rewrites source files while it runs, so never run it in the author's checkout:
   `git -C <repo_dir> worktree add ../prr-mut HEAD`
2. Check the installed major version: `mutmut --version`. The interface differs:

| Version | How to limit to changed modules |
|---|---|
| 2.x | `mutmut run --paths-to-mutate <file1.py>,<file2.py>` |
| 3.x | In the worktree's `pyproject.toml`, add `[tool.mutmut]` with `paths_to_mutate = ["<file1.py>", "<file2.py>"]`, then `mutmut run` |

   Confirm with `mutmut run --help` before running. mutmut 3 documents that it does not run natively on Windows; on Windows run it under WSL.
3. Edit config only inside `../prr-mut`. Never commit it.
4. If the full test suite is slow, limit the tests mutmut runs to the changed modules' test files using the option the installed version documents (2.x: `--runner "python -m pytest -x -q tests/test_x.py"`; 3.x: check the `[tool.mutmut]` keys in the mutmut README for your version). Do not guess a key name.

### Output
Worktree with mutmut configured for the changed modules only.

### Quality Gate
- `git -C <repo_dir> status --porcelain` is unchanged (all edits are in `../prr-mut`).
- `mutmut --version` output is recorded.

---

## Phase 2: Run and Read Results

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Run: `mutmut run` (plus the 2.x flags from Phase 1). It prints progress counts per status.
2. List results: `mutmut results`. Statuses mean:

| Status | Meaning |
|---|---|
| killed | A test failed on the mutant: good |
| survived | All tests passed with the mutant: a missing or weak assertion |
| timeout | The mutant made tests hang: usually counts as killed |
| suspicious | Tests ran much slower: inspect manually |
| no tests | No test executed the mutated line: coverage gap |

3. For every survived and no-tests mutant, show the change: `mutmut show <id-or-name>`. Output is a small diff, for example `- if total > limit:` / `+ if total >= limit:`.
4. Keep only mutants whose line is on a line the PR added or changed (compare with `git diff -U0` hunk headers). Survivors on untouched lines are pre-existing and out of scope.

### Output
List of surviving mutants on changed lines with their diffs.

### Quality Gate
- `mutmut results` output is recorded.
- Each kept mutant has its `mutmut show` diff and a changed-line match.

---

## Phase 3: Turn Survivors into Findings and Clean Up

### Entry Criteria
- Phase 2 complete.

### Actions
1. For each kept survivor, write the input that distinguishes original from mutant. Example: mutant `>` to `>=` survives, so add a test at exactly `total == limit`.
2. Label with this table:

| Survivor | Label |
|---|---|
| Boundary or comparison operator changed (`<` to `<=`, `==` to `!=`) in business logic | blocking |
| Return value or argument changed and no test noticed | blocking |
| `no tests` status on a changed line | blocking (no test runs it at all) |
| String literal in a log or error message changed | nit |
| Equivalent mutant (same behavior, for example changing a default that is always overridden) | none; record "equivalent" with a reason |

3. Write `<findings_dir>/prr-py-mutmut-check.json` (fields `flow`, `category`="tests", `file`, `line`, `evidence` = the `mutmut show` diff, `proposed_label`, `fix` = the test to add) and validate with `python -m json.tool`.
4. Remove the worktree: `git -C <repo_dir> worktree remove --force ../prr-mut`.
5. Do not delete or weaken a test to make mutation results look better, and do not report a mutation score as a pass/fail unless the team supplied a threshold.

### Output
`mutation_findings`.

### Quality Gate
- Every kept survivor has a finding or an "equivalent" note with a reason.
- `git worktree list` no longer shows `prr-mut`.

---

## Worked Example

Illustrative. Changed: `billing/limits.py`. mutmut 2.x.

- Phase 1: `git worktree add ../prr-mut HEAD`; `mutmut --version` prints `mutmut, version 2.4.4`.
- Phase 2: `mutmut run --paths-to-mutate billing/limits.py` ends with `12 killed, 2 survived`. `mutmut show 7` prints:
  ```
  --- billing/limits.py
  +++ billing/limits.py
  @@ -18 +18 @@
  -    if amount > daily_limit:
  +    if amount >= daily_limit:
  ```
  Line 18 is a changed line. Mutant 11 changes a log message: changed line too.
- Phase 3: finding blocking for mutant 7, fix "add `test_amount_equal_to_limit_is_allowed`"; mutant 11 nit.

---

## Exit Criteria

DONE when mutmut ran only on changed production modules in an isolated worktree, every surviving mutant on a changed line is a finding or a reasoned equivalent, and the worktree is removed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Test suite fails on the head | **Stop**: mutation results would be meaningless; report the failing tests. |
| Phase 1 | mutmut not installable on the platform | **Adjust**: run under WSL or a Linux container; if impossible, record "mutation check not run" and rely on `prr-test-revert-check`. |
| Phase 2 | Run takes too long for the review window | **Adjust**: reduce `paths_to_mutate` to the file with the most changed logic and state the reduction. |
| Phase 3 | Unsure whether a mutant is equivalent | **Adjust**: label it `question` and show the diff to the author. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
