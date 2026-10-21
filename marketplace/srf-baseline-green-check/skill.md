# Refactor Baseline Green Check

**One-line description:** Proves the repository starts clean and green before any refactoring: clean working tree, a dedicated branch, the full test suite passing twice in a row with identical counts, and the baseline commit SHA recorded so every later step can be compared against it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the git repository root.
- `stack` (string, required): One of `python`, `typescript`, `javascript`, `go`. Later steps branch on this value.
- `test_command` (string, required): The exact command that runs the whole test suite, for example `pytest -q`, `npx jest --ci`, `npx vitest run`, `go test ./... -count=1`.
- `refactorings` (string[], required): The refactorings planned, from this list: `extract_function`, `inline`, `rename`, `move_module`, `polymorphism`, `parameter_object`, `split_phase`, `dead_code`, `import_cycle`, `codemod_jscodeshift`, `codemod_gofmt`, `codemod_comby`, `codemod_semgrep`, `approval_tests`. Later steps run only when their name is listed.
- `refactor_name` (string, required): Short kebab-case name for the work, used in the branch name, for example `split-invoice-parser`.

---

## Outputs

- `baseline_commit` (string): Full 40-character SHA of the commit every refactoring step is measured against.
- `refactor_branch` (string): Name of the branch created for the work, `refactor/<refactor_name>`.
- `baseline_report` (object): Test command, two run results (passed, failed, skipped counts), wall time, tool versions, and the `git status --porcelain` output (must be empty).

---

## Phase 1: Clean Tree and Branch

### Entry Criteria
- `repo_path` exists and contains a `.git` directory or file.
- `test_command` is non-empty.

### Actions
1. Run `git -C <repo_path> status --porcelain`. Record the output verbatim.
2. Apply this table to the output:

| `git status --porcelain` output | Action |
|---|---|
| Empty | Continue to step 3. |
| Lines starting with `??` only (untracked files) | Stop. Ask the user whether to commit, ignore, or remove them. Do not delete them yourself. |
| Lines starting with ` M`, `M `, `A `, `D `, `R ` | Stop. Ask the user to commit or stash (`git stash push -u -m pre-refactor`). Do not run `git reset --hard` or `git checkout -- .`. |

3. Run `git -C <repo_path> rev-parse HEAD` and record the 40-character SHA as `baseline_commit`.
4. Run `git -C <repo_path> switch -c refactor/<refactor_name>`. If git reports the branch already exists, stop and ask the user whether to reuse it; never delete a branch.
5. Record tool versions for `baseline_report`: `git --version` plus the stack row below.

| `stack` | Version commands |
|---|---|
| python | `python --version`, `python -m pytest --version` |
| typescript / javascript | `node --version`, `npx tsc --version` (typescript only), `npx jest --version` or `npx vitest --version` |
| go | `go version`, `go env GOFLAGS` |

### Output
Clean tree confirmed, branch created, `baseline_commit` recorded.

### Quality Gate
- `git status --porcelain` printed nothing.
- `git branch --show-current` prints `refactor/<refactor_name>`.
- `git rev-parse HEAD` equals `baseline_commit`.

---

## Phase 2: Run the Suite Twice

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Run `test_command` from `repo_path`. Capture stdout, stderr, exit code and wall time.
2. Read the summary line for the counts:

| Runner | Where the counts are |
|---|---|
| pytest | Last line, for example `412 passed, 3 skipped in 18.20s` |
| jest | Line `Tests:       58 passed, 58 total` |
| vitest | Line `Tests  58 passed (58)` |
| go test | One `ok` or `FAIL` line per package; count `FAIL` lines. For per-test counts run `go test ./... -count=1 -json` and count `"Action":"pass"` events that carry a `"Test"` field. |

3. Run `test_command` a second time. For Go keep `-count=1` so the test cache does not replay the first result.
4. Compare both runs with this table:

| Run 1 | Run 2 | Decision |
|---|---|---|
| exit 0 | exit 0, same counts | Baseline is green. Continue. |
| exit 0 | exit 0, different counts | Test discovery is unstable. Stop and report both summaries. |
| exit 0 | non-zero (or the reverse) | Flaky suite. Stop. Report the failing test names. Do not refactor on a flaky baseline. |
| non-zero | non-zero | Baseline is red. Stop. Refactoring requires a green start; report the failing tests to the user. |

5. Do NOT mark failing tests as skipped, add `xfail`, `.skip`, `t.Skip()`, or delete tests to make the baseline green. That changes the safety net you are about to rely on.

### Output
`baseline_report` with both runs.

### Quality Gate
- Both runs exited 0.
- Both summaries show identical passed, failed and skipped counts.
- `git status --porcelain` is still empty after the runs (tests did not write tracked files). If it is not empty, the tests write into the repo; stop and report which files.

---

## Worked Example

Illustrative only. Inputs: `repo_path=/work/billing`, `stack=python`, `test_command=pytest -q`, `refactorings=["extract_function","rename"]`, `refactor_name=split-invoice-parser`.

Phase 1:
```
$ git -C /work/billing status --porcelain
$ git -C /work/billing rev-parse HEAD
9f2c4e1a7b0d3c5e8f1a2b4c6d8e0f1a3b5c7d9e
$ git -C /work/billing switch -c refactor/split-invoice-parser
Switched to a new branch 'refactor/split-invoice-parser'
```
Phase 2:
```
$ pytest -q
........................................ [100%]
212 passed, 2 skipped in 9.41s
$ pytest -q
212 passed, 2 skipped in 9.38s
```
`baseline_report`: `{"runs":[{"passed":212,"skipped":2,"failed":0},{"passed":212,"skipped":2,"failed":0}],"porcelain":""}`.

---

## Exit Criteria

DONE when the tree is clean, the refactor branch exists, the suite passed twice with identical counts, and `baseline_commit` is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Dirty working tree | **Stop**: ask the user to commit or stash; never discard changes. |
| Phase 1 | Detached HEAD | **Adjust**: record the SHA anyway and create the branch from it with `git switch -c`. |
| Phase 1 | Branch already exists | **Stop**: ask the user to choose a new `refactor_name` or confirm reuse. |
| Phase 2 | Test command not found | **Return**: ask the user for the correct `test_command`; do not guess a runner. |
| Phase 2 | Counts differ between runs | **Stop**: report flaky or order-dependent tests; refactoring waits until the suite is stable. |
| Phase 2 | Tests modify tracked files | **Stop**: report the files; snapshot or golden output written during a normal run hides regressions. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
