# Branch Naming and Creation

**One-line description:** Creates a topic branch from the freshly fetched tip of the base branch, named by the repository's own convention (or `<type>/<ticket-id>-<slug>` when none exists), with git ref-name rules checked and upstream tracking set on first push.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ticket_id` (string, required): Tracker key, for example `PAY-412`.
- `working_requirements` (object[], required): Output of `tkt-ticket-ambiguity-extract`, used for the type and slug.
- `repo_profile` (object, required): Output of `tkt-repo-orient-detect`, for `default_branch`.
- `base_branch` (string, optional): Branch to start from when it is not the default branch (for example a release branch `release/2.4`).

---

## Outputs

- `branch_name` (string): The created branch name, the base it was cut from, and the base commit hash.

---

## Phase 1: Choose the Name

### Entry Criteria
- `ticket_id` known; working tree clean (`git status --porcelain` prints nothing).

### Actions
1. Find the repo's convention, in this order: (1) a documented rule in `CONTRIBUTING.md` (`rg -n -i 'branch' CONTRIBUTING.md`); (2) a branch-name check in CI or hooks (`rg -n -i 'branch' .github/workflows .husky .pre-commit-config.yaml`); (3) the last 30 remote branch names: `git for-each-ref --sort=-committerdate --count=30 --format='%(refname:short)' refs/remotes/origin`. Group the sample by pattern (for example `type/KEY-n-slug`, `user/slug`, `KEY-n`), count each group, and follow the group with the highest count. If two groups tie, or the sample has no repeated pattern, use the fallback below.
2. Fallback pattern: `<type>/<ticket-id>-<slug>`.
3. Choose `<type>` from the Conventional Commits type list (same types `tkt-conventional-commit` uses):

| The ticket mainly... | type |
|---|---|
| adds user-visible behavior | feat |
| fixes wrong behavior | fix |
| changes code without changing behavior | refactor |
| only tests | test |
| only docs | docs |
| build, deps, tooling | build or chore (follow the repo's history) |
| CI config only | ci |
| speeds something up | perf |

4. Build `<slug>`: the nouns and verb of the ticket title with filler words (a, the, to, for) dropped, lowercase, words joined with `-`, ASCII letters, digits and `-` only. Keep the ticket id's case as the tracker shows it (Jira keys are uppercase; many integrations match them case-sensitively).
5. Check the name against git's rules: `git check-ref-format --branch "<name>"`. It prints the name on success and errors on invalid names (spaces, `..`, `~`, `^`, `:`, `?`, `*`, `[`, a trailing `.lock` or `/`).

### Output
Proposed branch name.

### Quality Gate
- `git check-ref-format --branch "<name>"` exits 0.
- The name contains `ticket_id` exactly as written in the tracker, unless the repo convention from Action 1 forbids it (cite the source).

---

## Phase 2: Create from a Fresh Base

### Entry Criteria
- Name chosen.

### Actions
1. Base = `base_branch` if given, else `repo_profile.default_branch`.
2. Fetch: `git fetch origin <base> --prune`.
3. Confirm the name is free locally and remotely: `git rev-parse --verify --quiet refs/heads/<name>` and `git ls-remote --heads origin <name>` must both print nothing.
4. Create from the remote tip, not from a possibly stale local base: `git switch -c <name> origin/<base>` (Git 2.23 or newer; older: `git checkout -b <name> origin/<base>`).
5. Do NOT create the branch from whatever branch happens to be checked out; that carries unrelated commits into the PR.
6. Record the base commit: `git rev-parse --short origin/<base>`.
7. Upstream is set on the first push with `git push -u origin <name>` (done in `tkt-pr-description`). Do not push an empty branch now unless the team requires draft PRs from the start.

### Output
`branch_name` with base and base commit.

### Quality Gate
- `git branch --show-current` prints the new name.
- `git log --oneline origin/<base>..HEAD` prints nothing (no commits beyond the base yet).

---

## Worked Example

Illustrative only.

```
$ git for-each-ref --sort=-committerdate --count=30 --format='%(refname:short)' refs/remotes/origin | head -4
origin/feat/PAY-398-refund-webhook
origin/fix/PAY-405-tax-rounding
origin/feat/PAY-401-dunning-emails
origin/chore/PAY-399-bump-fastapi
$ git check-ref-format --branch "feat/PAY-412-invoice-csv-export"
feat/PAY-412-invoice-csv-export
$ git fetch origin develop --prune
$ git ls-remote --heads origin feat/PAY-412-invoice-csv-export
$ git switch -c feat/PAY-412-invoice-csv-export origin/develop
branch 'feat/PAY-412-invoice-csv-export' set up to track 'origin/develop'.
Switched to a new branch 'feat/PAY-412-invoice-csv-export'
```

Note the tracking message: `git switch -c` from a remote branch sets the base as upstream when `branch.autoSetupMerge` is on (its default). The first `git push -u origin feat/PAY-412-invoice-csv-export` replaces it with the topic branch's own upstream.

`branch_name`: `feat/PAY-412-invoice-csv-export`, base `develop` at `4d5e6f7`.

---

## Exit Criteria

DONE when the branch exists locally, follows the repo convention or the fallback pattern, passes `git check-ref-format`, and points at the fetched base tip with no extra commits.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Working tree not clean | **Stop**: ask the user to commit or stash; do not discard changes. |
| Phase 1 | Repo convention conflicts with the fallback | **Adjust**: use the repo convention; cite its source. |
| Phase 2 | Name already exists remotely | **Stop**: someone may already work on this ticket; ask before reusing or renaming with a suffix. |
| Phase 2 | `git fetch` fails (auth) | **Stop**: report the error text; never create the branch from a stale base. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
