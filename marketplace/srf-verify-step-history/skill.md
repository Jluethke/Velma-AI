# Verify Every Refactor Commit Is Green

**One-line description:** Proves the refactor branch is a sequence of small, independently green, behavior-preserving commits: runs the full test suite and the API check at every commit between the baseline and HEAD in a separate git worktree, checks each commit touched only source and no test expectations, and uses `git bisect run` to pinpoint any red commit.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `test_command` (string, required): Full suite command.
- `baseline_commit` (string, required): From `srf-baseline-green-check`.
- `refactor_branch` (string, required): From `srf-baseline-green-check`.
- `api_check_command` (string, optional): The check command produced by `srf-py-api-snapshot-griffe`, `srf-ts-api-snapshot-api-extractor` or `srf-go-api-snapshot-apidiff`. Omit if none was set up.

---

## Outputs

- `verification_report` (object): Per commit: SHA, subject, files changed, test exit code and counts, API check exit code, test-file changes flagged.
- `red_commits` (string[]): SHAs that failed tests or the API check. Empty when the branch is fully green.

---

## Phase 1: List and Inspect Commits

### Entry Criteria
- `git -C <repo_path> rev-parse --verify <refactor_branch>` succeeds.
- `git merge-base --is-ancestor <baseline_commit> <refactor_branch>` exits 0.

### Actions
1. List commits oldest first: `git rev-list --reverse <baseline_commit>..<refactor_branch>`.
2. For each commit, collect `git show --stat --format="%H %s" <sha>`.
3. Flag commits that change test expectations, using this table:

| Files changed in the commit | Flag |
|---|---|
| Snapshot or golden files (`__snapshots__/`, `*.snap`, `*.ambr`, `*.approved.*`, `testdata/*.golden`) together with source files | `expectation-changed`: a refactor must not change recorded behavior. Report for review. |
| Test files with deleted lines containing `assert`, `expect(`, `t.Error`, `t.Fatal` | `assertion-removed`: report. |
| Added `skip`, `xfail`, `.only`, `.skip(`, `t.Skip(` | `test-disabled`: report. |
| Only test files added (characterization commits) | OK. |
| Source only | OK. |

   Use `git show <sha> -- "*test*" | grep -n "^-.*\(assert\|expect(\|t\.Error\|t\.Fatal\)"` and `git show <sha> | grep -n "^+.*\(skip\|xfail\|\.only\|t\.Skip(\)"` to find them.
4. Commits mixing refactor and behavior change in one message (`refactor` subject but flagged) are listed in the report.

### Output
Commit list with flags.

### Quality Gate
- Every commit between baseline and branch tip is listed exactly once.
- Each flag cites the file and line found.

---

## Phase 2: Run the Suite at Every Commit

### Entry Criteria
- Phase 1 complete.

### Actions
1. Create a separate worktree so the user's checkout is untouched: `git worktree add --detach /tmp/srf-verify <baseline_commit>` (Windows: a folder under the system temp directory).
2. For each SHA from Phase 1, in order:
   `git -C /tmp/srf-verify checkout --detach -q <sha>`, then run `test_command` inside `/tmp/srf-verify`, then `api_check_command` if given. Record exit codes and the summary counts. Install dependencies in the worktree once if needed (`pip install -e .`, `npm ci`, nothing for Go), and reinstall if a commit changed the lockfile.
3. Do NOT stop at the first failure; run every commit so the report is complete.
4. A commit is red if either command exits non-zero.
5. Remove the worktree at the end: `git worktree remove /tmp/srf-verify`.

### Output
Per-commit results.

### Quality Gate
- One test result per commit is recorded.
- `git worktree list` no longer shows `/tmp/srf-verify`.

---

## Phase 3: Locate and Classify Failures

### Entry Criteria
- Phase 2 complete.

### Actions
1. If `red_commits` is empty and no Phase 1 flags exist: report the branch verified.
2. If the tip is green but some intermediate commit is red: the branch is not bisectable. Report the SHA; the fix is to squash that commit with the next one that repairs it (`git rebase -i` is interactive; give the user the command rather than running it).
3. If the tip is red: recreate the worktree as in Phase 2 step 1, and inside it confirm with bisect: `git bisect start <refactor_branch> <baseline_commit>` then `git bisect run sh -c "<test_command>"`, then `git bisect reset`. The first bad commit printed is the one to revert or fix.
4. For each red commit, record the failing test names from its output.
5. Do NOT rewrite branch history yourself and do NOT push.

### Output
`verification_report`, `red_commits`.

### Quality Gate
- Every red commit has failing test names or the API check output attached.
- If the tip was red, the bisect result names one commit.

---

## Worked Example

Illustrative only. 7 commits on `refactor/split-invoice-parser`.
```
$ git rev-list --reverse 9f2c4e1..refactor/split-invoice-parser | wc -l
7
$ git worktree add --detach /tmp/srf-verify 9f2c4e1
c2d18a7 pytest: 215 passed  griffe: 0
3c90f4e pytest: 215 passed  griffe: 0
...
a41c0d2 pytest: 1 failed, 214 passed  griffe: 0
$ git bisect start refactor/split-invoice-parser 9f2c4e1
$ git bisect run sh -c "pytest -q"
a41c0d2 is the first bad commit
```
`red_commits = ["a41c0d2"]`; failing test `test_parse_invoice[negative_line]`. No expectation-changed flags.

---

## Exit Criteria

DONE when every commit since the baseline has a recorded test and API result, test-expectation changes are flagged, and any red commit is identified by SHA and failing tests.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Baseline is not an ancestor (branch was rebased) | **Adjust**: use `git merge-base <refactor_branch> <main branch>` as the start and record it. |
| Phase 2 | Commit fails to install dependencies | **Return**: report the commit as red with the install error. |
| Phase 2 | Worktree path already exists | **Adjust**: choose a new path; never delete an existing directory. |
| Phase 3 | Bisect blames a characterization-test commit | **Stop**: the test is flaky or order-dependent; return to `srf-baseline-green-check`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
