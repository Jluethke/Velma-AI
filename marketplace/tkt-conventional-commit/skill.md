# Conventional Commit Messages

**One-line description:** Turns the branch's work-in-progress commits into final commits whose messages follow Conventional Commits 1.0.0 (type, optional scope, `!`, description, body, `BREAKING CHANGE:` and ticket footers), validated with commitlint when the repo uses it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `change_diff` (string, required): Output of `tkt-small-edit-loop`.
- `ticket_id` (string, required): Tracker key.
- `working_requirements` (object[], required): Output of `tkt-ticket-ambiguity-extract`, for the description and body.

---

## Outputs

- `commit_log` (object[]): Final commits on the branch: hash, full message, files changed, and the commitlint result (or `not configured`).

---

## Phase 1: Decide Commit Boundaries

### Entry Criteria
- All edit steps committed; `git status --porcelain` is empty.
- Static check flow for the stack has passed.

### Actions
1. List the branch commits: `git log --oneline <base>..HEAD`.
2. Find how the repo merges PRs. Check the repository settings if you can see them (GitHub: `gh repo view --json squashMergeAllowed,mergeCommitAllowed,rebaseMergeAllowed`), or read `CONTRIBUTING.md`. Then pick:

| Merge method used by the repo | What matters | Commit plan |
|---|---|---|
| Squash merge only | The PR title becomes the commit subject on the base branch | One local commit is fine; the PR title must follow Conventional Commits. Still write a correct message for the branch. |
| Rebase merge or merge commit | Every branch commit lands on the base branch | Each commit must build, pass tests, and carry its own Conventional Commits message. Squash WIP commits into logical commits. |
| Unknown | | Assume every commit lands: make each one clean. |

3. Group WIP commits into logical commits: one per independent change a reviewer could revert alone (for example "add currency column to export" and "document status filter in OpenAPI"). Tests go in the same commit as the code they test.

### Output
Commit plan: list of final commits and the files in each.

### Quality Gate
- Every file in `git diff --name-only <base>...HEAD` belongs to exactly one planned commit.
- The merge method is recorded with its source.

---

## Phase 2: Write the Messages

### Entry Criteria
- Commit plan exists.

### Actions
1. Format (Conventional Commits 1.0.0):
```
<type>[(<scope>)][!]: <description>

[body: what changed and why, wrapped lines]

[footers]
```
2. `type`: use the repo's allowed list if commitlint is configured (read `type-enum` in `commitlint.config.*`; `@commitlint/config-conventional` allows build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test). Decision: new behavior = `feat`; corrected behavior = `fix`; no behavior change = `refactor`; speed = `perf`; tests only = `test`; docs only = `docs`; dependencies or build = `build`; CI = `ci`.
3. `scope`: the module or package name as used in recent history (`git log --format=%s -50 | rg -o '^\w+\(([^)]+)\)' -r '$1' | sort | uniq -c`). Omit if the repo does not use scopes. Check `scope-enum` if commitlint restricts scopes.
4. `description`: imperative mood, lowercase start unless a proper noun, no trailing period ("add currency column to invoice CSV export"). Length limit: use the repo's commitlint `header-max-length` if set (`@commitlint/config-conventional` sets 100 characters for the whole header); if no tool enforces one, follow the length used in recent history.
5. Body: why the change was made and what behavior changed, referring to acceptance criteria in plain words. Not a list of files.
6. Footers, one per line, after a blank line:
   - Ticket reference in the form the tracker integration recognizes: `Refs: PAY-412` (Jira smart commits match the key anywhere), or GitHub closing keyword `Closes #1873` (also `Fixes`, `Resolves`) when the issue should close on merge to the default branch.
   - Breaking change: `BREAKING CHANGE: <what breaks and how to migrate>` (uppercase, exact token), and add `!` after the type or scope (`feat(api)!:`). Required if `impact_list` had a HIGH-CONTRACT row that breaks old clients.
7. Write each message to a file in the scratch area and use `git commit -F <file>`, not `-m`, so line breaks are exact.
8. Do not mention the AI tool, invent co-authors, or reference reviewers in messages unless the repo's policy requires a trailer.

### Output
Message text for each planned commit.

### Quality Gate
- Each header matches the regex `^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([\w./-]+\))?!?: \S` (or the repo's `type-enum`).
- Every breaking change has both `!` and a `BREAKING CHANGE:` footer.

---

## Phase 3: Rewrite the Branch Commits

### Entry Criteria
- Messages written.

### Actions
1. Make a safety ref first: `git branch backup/<branch_name> HEAD`.
2. Collapse WIP commits without losing changes: `git reset --soft $(git merge-base HEAD origin/<base>)`. All changes stay staged. Do NOT use `git reset --hard`.
3. For each planned commit, in order: `git restore --staged .`, then `git add <files of that commit>` (use `git add -p <file>` only if one file is split across commits), confirm with `git diff --cached --name-only`, then `git commit -F <message file>`.
4. Confirm the tree is identical to before: `git diff backup/<branch_name> HEAD` prints nothing.
5. If each commit lands on the base branch (Phase 1 table), check every commit builds and passes tests: `git rebase --exec "<test command>" origin/<base>` runs the command after each commit and stops at the first failure.
6. Validate messages if commitlint is configured: `npx commitlint --from origin/<base> --to HEAD --verbose`. Each commit must report `found 0 problems, 0 warnings`.
7. Delete the backup only after the PR is merged.

### Output
`commit_log`.

### Quality Gate
- `git diff backup/<branch_name> HEAD` prints nothing.
- commitlint reports 0 problems for every commit, or `not configured` is recorded and the header regex check passed.

---

## Worked Example

Illustrative only.

```
$ git log --oneline origin/develop..HEAD
e5f6a7b wip(PAY-412): step 5 openapi
d4e5f6a wip(PAY-412): step 4 routes filter
b2c3d4e wip(PAY-412): step 3 csv_response columns
a1b2c3d wip(PAY-412): step 2 currency field
7a8b9c0 test(export): add failing tests for PAY-412 acceptance criteria
$ gh repo view --json squashMergeAllowed,rebaseMergeAllowed,mergeCommitAllowed
{"mergeCommitAllowed":false,"rebaseMergeAllowed":true,"squashMergeAllowed":false}
```

Rebase merge: every commit lands. Plan: commit 1 (tests + service + responses + routes), commit 2 (openapi.yaml + CHANGELOG.md).

Message 1:
```
feat(export): add currency column and status filter to invoice CSV export

The invoices page export now writes ISO 8601 UTC dates, a separate
currency column, and only the rows matching the active status filter,
matching the existing PDF export behavior.

Refs: PAY-412
```

```
$ git branch backup/feat/PAY-412-invoice-csv-export HEAD
$ git reset --soft $(git merge-base HEAD origin/develop)
$ ... two commits created with git commit -F ...
$ git diff backup/feat/PAY-412-invoice-csv-export HEAD
$ npx commitlint --from origin/develop --to HEAD --verbose
⧗   input: feat(export): add currency column and status filter to invoice CSV export
✔   found 0 problems, 0 warnings
⧗   input: docs(api): document status query parameter for invoice export
✔   found 0 problems, 0 warnings
```

---

## Exit Criteria

DONE when the branch holds the planned logical commits, the tree is identical to the pre-rewrite backup, every message follows Conventional Commits (validated by commitlint when configured), and each commit passes tests when the merge method lands every commit.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Branch already pushed and others committed on it | **Stop**: do not rewrite shared history; add new commits with correct messages instead. |
| Phase 2 | Change fits two types | **Adjust**: split into two commits; if inseparable, use the type of the user-visible effect (`feat` over `refactor`). |
| Phase 3 | `git diff backup/... HEAD` shows differences | **Stop**: a file was left out; restore from the backup branch with `git checkout backup/<branch_name> -- <file>` and recommit. |
| Phase 3 | `git rebase --exec` stops on a failing commit | **Adjust**: the commit split put code before its dependency; `git rebase --abort`, regroup files, recommit. |
| Phase 3 | commitlint rejects a message | **Retry**: fix the message with `git commit --amend -F <file>` for the last commit, or redo Phase 3 for earlier ones. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
