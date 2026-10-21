# PR Self-Review Before Requesting Review

**One-line description:** The author reads their own branch diff line by line, removes debug leftovers, runs the project's formatter, linter and tests, cleans the commit history non-interactively, and drafts a PR description with what, why, how tested and rollback, before any reviewer is asked to spend time on it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the local clone with the feature branch checked out.
- `base_branch` (string, required): Branch the PR will merge into, for example `main`. The flow compares against `origin/<base_branch>`.
- `test_command` (string, required): The exact command the project's CI runs for tests, for example `pytest -q`, `npm test`, `go test ./...`. Copy it from the CI config file; do not guess.

---

## Outputs

- `self_review_report` (object): Checklist results: each check, the command run, its exit code, and every leftover found and fixed.
- `pr_description_draft` (string): Markdown PR body with the sections What, Why, How tested, Risk and rollback, Reviewer notes.
- `diff_file` (string): Path to the saved unified diff `origin/<base_branch>...HEAD`.
- `changed_files` (string[]): Output of `git diff --name-only origin/<base_branch>...HEAD`.
- `diff_stat` (string): Output of `git diff --shortstat origin/<base_branch>...HEAD`.

---

## Phase 1: Capture the Diff Exactly as a Reviewer Will See It

### Entry Criteria
- `repo_dir` exists and `git -C <repo_dir> status` succeeds.
- The feature branch is checked out (`git branch --show-current` is not `base_branch`).

### Actions
1. Run `git -C <repo_dir> fetch origin <base_branch>` so the comparison uses the current remote base, not a stale local copy.
2. Run `git status --porcelain`. If it prints anything, decide per file: commit it if it belongs to this change, or leave it uncommitted and note it. Do not run `git add -A` blindly.
3. Save the diff with the three-dot form, which diffs against the merge base (what the PR page shows):
   `git diff origin/<base_branch>...HEAD > <repo_dir>/../self-review.diff`
4. Record `changed_files` with `git diff --name-only origin/<base_branch>...HEAD` and `diff_stat` with `git diff --shortstat origin/<base_branch>...HEAD`.
5. Run `git log --oneline origin/<base_branch>..HEAD` and list every commit.

### Output
`diff_file`, `changed_files`, `diff_stat`, and the commit list.

### Quality Gate
- `diff_file` exists and is non-empty (`test -s <path>` exits 0).
- `changed_files` contains no file you cannot explain in one sentence. Any unexplained file is listed in `self_review_report` under "unexpected files".

---

## Phase 2: Read Every Added Line and Remove Leftovers

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Open `diff_file` and read it top to bottom. Read it as a stranger would: for every hunk ask "would I understand why this line changed if I had not written it?" If not, either simplify the code or plan a reviewer note for it.
2. Search only the added lines for leftovers:
   `git diff -U0 origin/<base_branch>...HEAD | grep -nE '^\+' | grep -nE 'console\.log|debugger|print\(|pprint|breakpoint\(\)|pdb\.set_trace|fmt\.Print|System\.out\.print|TODO|FIXME|XXX|\.only\(|fit\(|fdescribe\('`
3. Search added lines for silenced checks:
   `git diff -U0 origin/<base_branch>...HEAD | grep -nE '^\+' | grep -nE '# type: ignore|# noqa|# nosec|@ts-ignore|@ts-expect-error|eslint-disable|//nolint|#nosec|@SuppressWarnings'`
4. Use this table for every hit:

| Hit | Action |
|---|---|
| Debug print or `debugger` | Delete it. |
| `.only(`, `fit(`, `fdescribe(` | Delete it; it silently skips every other test. |
| TODO/FIXME you added | Either do it now or link a ticket in the comment text. |
| Suppression comment | Keep only if a comment on the same line names the rule and the reason; otherwise fix the underlying error. |
| Commented-out code | Delete it; history keeps it. |

5. Make fixes one file at a time and re-run step 2 and step 3 after each file. Do not batch-edit many files with search and replace.
6. Check for secrets and large files: `git diff --stat origin/<base_branch>...HEAD` shows sizes; any binary or file you did not mean to add gets removed with `git rm --cached <file>`.

### Output
Leftover list with the fix applied to each, recorded in `self_review_report`.

### Quality Gate
- Re-running the commands in steps 2 and 3 prints no unexplained hit.
- Every remaining suppression comment names its rule and reason on the same line.

---

## Phase 3: Run the Same Checks CI Runs

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Open the CI config (`.github/workflows/*.yml`, `.gitlab-ci.yml`, `Jenkinsfile`, `.circleci/config.yml`) and copy the formatter, linter, type check and test commands it runs.
2. Run the formatter in check mode first, then fix: Python `ruff format --check .` then `ruff format .`; JS/TS `npx prettier --check .` then `npx prettier --write <files>`; Go `gofmt -l .` then `gofmt -w <files>`. Use only the formatter the project already configures.
3. Run the linter and type checker the CI runs, then `test_command`. Record each exit code.
4. If a test fails, fix the code or the test for a real reason. Never delete a test, add a skip marker, or loosen an assertion to make the run green.
5. Clean history without an interactive editor. To fold `fixup!` commits:
   `GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash origin/<base_branch>`
   The `:` editor accepts the generated todo list unchanged, so no editor opens. Skip this step if the project squashes on merge (check the repository merge settings or CONTRIBUTING file).
6. After any rebase, re-run `test_command`.

### Output
Exit codes for format, lint, type check and tests, recorded in `self_review_report`.

### Quality Gate
- Every CI command run locally exited 0, with the command and exit code recorded.
- `git log --oneline origin/<base_branch>..HEAD` shows no `fixup!` or `wip` commits (unless the project squashes on merge).

---

## Phase 4: Write the PR Description

### Entry Criteria
- Phase 3 gate passed.

### Actions
1. If the repository has a template (`.github/pull_request_template.md`, `.gitlab/merge_request_templates/*.md`), fill that template. Otherwise use these sections:
   - **What**: one paragraph describing the behavior change, not the files.
   - **Why**: the issue link and the user-visible problem.
   - **How tested**: the exact commands run and new test names.
   - **Risk and rollback**: what could break and how to revert (plain `git revert`, a feature flag, or a migration down step).
   - **Reviewer notes**: suggested reading order and the hunks you are least sure about.
2. Paste the `diff_stat` line into Reviewer notes so the reviewer knows the size before opening the diff.
3. Save the text as `pr_description_draft`. Open the PR as a draft first (`gh pr create --draft --title "<title>" --body-file <file>` or `glab mr create --draft --title "<title>" --description "<text>"`), check the rendered diff once in the browser, then mark it ready (`gh pr ready` or `glab mr update <id> --ready`).

### Output
`pr_description_draft`.

### Quality Gate
- `pr_description_draft` contains all five headings.
- The How tested section contains at least one command that appears in the Phase 3 record with exit code 0.

---

## Worked Example

Illustrative. Input: `repo_dir=/work/billing`, `base_branch=main`, `test_command=pytest -q`.

- Phase 1: `git diff --shortstat origin/main...HEAD` prints ` 4 files changed, 96 insertions(+), 12 deletions(-)`. `changed_files` = `billing/invoice.py`, `billing/tax.py`, `tests/test_tax.py`, `.vscode/settings.json`. The last file is unexpected and is removed with `git rm --cached .vscode/settings.json`.
- Phase 2: the leftover grep prints `+    print("DEBUG", rate)` in `billing/tax.py`; deleted. `+    rate = Decimal(x)  # type: ignore` has no reason; the underlying type is fixed instead.
- Phase 3: `ruff format --check .` exit 1, `ruff format billing/tax.py` fixes it, rerun exit 0; `ruff check .` exit 0; `pytest -q` prints `38 passed in 2.11s`, exit 0. `GIT_SEQUENCE_EDITOR=: git rebase -i --autosquash origin/main` folds two `fixup!` commits.
- Phase 4: description lists How tested: `pytest -q tests/test_tax.py::test_rounding_half_even`.

---

## Exit Criteria

DONE when the diff contains no unexplained file or leftover, every CI check passes locally with recorded exit codes, history has no fixup commits (or the project squashes), and `pr_description_draft` has all five sections.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `git fetch` fails (no network or no remote) | **Stop**: the diff against a stale base is wrong; fix the remote first. |
| Phase 2 | A leftover is needed temporarily for debugging | **Adjust**: move it behind the project's log level (for example `logger.debug`) instead of a print. |
| Phase 3 | Rebase stops with conflicts | **Return**: run `git rebase --abort`, resolve by merging `origin/<base_branch>` instead, and rerun Phase 3. |
| Phase 3 | A test fails that also fails on `origin/<base_branch>` | **Adjust**: record it as pre-existing with the failing output in Reviewer notes; do not skip it. |
| Phase 4 | No CI config exists | **Adjust**: state in How tested that no CI exists and list the commands you ran. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
