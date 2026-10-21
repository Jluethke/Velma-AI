# Choose Rebase or Merge to Sync with the Base Branch

**One-line description:** Decides whether to bring the latest base-branch commits into a topic branch by rebasing or by merging, using a fixed table of facts read from git and the hosting platform (who else pushed to the branch, review state, required linear history, merge method), and predicts which files will conflict before anything is changed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `branch_name` (string, required): Output of `tkt-branch-create`.
- `base_branch` (string, optional): Base branch; defaults to the PR's base.
- `pr_url` (string, required): Output of `tkt-pr-description`.

---

## Outputs

- `sync_strategy` (object): `strategy` (`rebase`, `merge`, or `none`), the facts that decided it, commits behind and ahead counts, and the list of files predicted to conflict.

---

## Phase 1: Gather Facts

### Entry Criteria
- `git status --porcelain` prints nothing.

### Actions
1. Fetch: `git fetch origin --prune`.
2. Base = `base_branch` if given, else `gh pr view <number> --json baseRefName --jq .baseRefName`.
3. Behind and ahead counts: `git rev-list --left-right --count origin/<base>...HEAD` prints `<behind> <ahead>`.
4. Other authors on the branch: `git log --format='%ae' origin/<base>..origin/<branch_name> | sort -u`. More than one address means others pushed to it.
5. Platform rules: `gh pr view <number> --json mergeStateStatus,reviewDecision,mergeable`. `mergeStateStatus` of `BEHIND` means branch protection requires the branch to be up to date; `DIRTY` means conflicts. Check whether the base branch requires linear history: `gh api repos/{owner}/{repo}/branches/<base>/protection --jq .required_linear_history.enabled` (needs admin read permission; if it returns 403 or 404, record `unknown`).
6. Repo convention: read `CONTRIBUTING.md` for "rebase" or "merge main into" guidance (`rg -n -i 'rebase|merge (main|master|develop) into' CONTRIBUTING.md`).

### Output
Fact sheet.

### Quality Gate
- The behind/ahead counts come from the `git rev-list` output.
- Each platform fact is the raw JSON value or `unknown`.

---

## Phase 2: Decide

### Entry Criteria
- Fact sheet complete.

### Actions
1. Apply this table top to bottom; first match wins:

| Condition | strategy | Reason |
|---|---|---|
| behind = 0 and `mergeStateStatus` is not `DIRTY` | none | Already up to date. |
| Another author pushed commits to the branch | merge | Rebasing rewrites commits they have; their next push would conflict or reintroduce old commits. |
| CONTRIBUTING says to merge the base in, or says never force-push | merge | Repo rule. |
| Base branch requires linear history, or the repo merges PRs with "rebase and merge" | rebase | A merge commit inside the branch is rejected or pollutes history. |
| CONTRIBUTING says to rebase | rebase | Repo rule. |
| Review is in progress (`reviewDecision` is `REVIEW_REQUIRED` or `CHANGES_REQUESTED` and reviewers have left comments) and the repo squash-merges | merge | Squash removes the merge commit at the end; merging keeps reviewers' "changes since last review" view intact. |
| Otherwise | rebase | Clean history; the branch is yours alone. |

2. Predict conflicts without touching the working tree: on Git 2.38 or newer, `git merge-tree --write-tree --name-only origin/<base> HEAD` prints a tree id and, if conflicts exist, the conflicted file names, and exits 1. On older Git, list files changed on both sides: `comm -12 <(git diff --name-only $(git merge-base origin/<base> HEAD) origin/<base> | sort) <(git diff --name-only $(git merge-base origin/<base> HEAD) HEAD | sort)`.
3. Record the strategy, deciding row, and predicted conflict files.

### Output
`sync_strategy`.

### Quality Gate
- The strategy cites exactly one row of the table.
- The predicted conflict list comes from the `git merge-tree` or `comm` output, including an empty list.

---

## Worked Example

Illustrative only.

```
$ git fetch origin --prune
$ git rev-list --left-right --count origin/develop...HEAD
7	2
$ git log --format='%ae' origin/develop..origin/feat/PAY-412-invoice-csv-export | sort -u
dev@acme.example
$ gh pr view 1907 --json mergeStateStatus,reviewDecision,mergeable
{"mergeStateStatus":"DIRTY","mergeable":"CONFLICTING","reviewDecision":"APPROVED"}
$ gh api repos/acme/billing/branches/develop/protection --jq .required_linear_history.enabled
true
$ git merge-tree --write-tree --name-only origin/develop HEAD
3c9e...
src/billing/api/routes.py
```

Decision: single author, linear history required -> `rebase`. Predicted conflict: `src/billing/api/routes.py`. Next flow: `tkt-rebase-conflict-resolve`.

---

## Exit Criteria

DONE when `sync_strategy` names rebase, merge or none, cites the deciding table row and its facts, and lists predicted conflict files.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Working tree not clean | **Stop**: commit the work first; never stash silently. |
| Phase 1 | Branch protection API returns 403 | **Adjust**: record `unknown` and use the repo's PR merge method (`gh repo view --json rebaseMergeAllowed,squashMergeAllowed,mergeCommitAllowed`) as the signal. |
| Phase 2 | Repo rules conflict (CONTRIBUTING says merge, protection requires linear) | **Return**: report both facts to a maintainer and wait for a decision. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
