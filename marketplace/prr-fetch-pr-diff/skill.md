# PR Fetch and Diff Capture

**One-line description:** Fetches a GitHub pull request or GitLab merge request head into a local review branch with plain git refspecs, records the exact head commit, and saves the merge-base diff, the changed file list with rename detection, the size summary and the PR description that every later review flow reads.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to a local clone of the repository with `origin` pointing at the forge.
- `pr_number` (integer, required): The pull request number (GitHub) or merge request IID (GitLab).
- `forge` (string, required): `github` or `gitlab`.
- `base_branch` (string, required): Target branch of the PR, for example `main`.

---

## Outputs

- `diff_file` (string): Path to the saved unified diff of `origin/<base_branch>...<head_sha>`.
- `changed_files` (object[]): One row per file: status letter from `--name-status` (A, M, D, R<score>, C<score>), old path, new path.
- `diff_stat` (string): Output of `git diff --shortstat` for the same range.
- `head_sha` (string): Full 40-character commit SHA of the PR head at fetch time.
- `pr_description` (string): PR title and body as returned by the forge CLI.

---

## Phase 1: Fetch the PR Head

### Entry Criteria
- `forge` is `github` or `gitlab`.
- `git -C <repo_dir> remote get-url origin` succeeds.

### Actions
1. Choose the refspec from this table. Both forges publish PR heads as hidden refs on the target repository, so this works for PRs from forks too.

| `forge` | Fetch command |
|---|---|
| github | `git -C <repo_dir> fetch origin pull/<pr_number>/head:review/pr-<pr_number>` |
| gitlab | `git -C <repo_dir> fetch origin merge-requests/<pr_number>/head:review/pr-<pr_number>` |

2. Fetch the base too: `git -C <repo_dir> fetch origin <base_branch>`.
3. Record `head_sha`: `git -C <repo_dir> rev-parse review/pr-<pr_number>`.
4. If `review/pr-<pr_number>` already exists from an earlier review, the fetch fails with "non-fast-forward" after a force-push. Then delete the local branch with `git branch -D review/pr-<pr_number>` and fetch again. Never review a stale head.
5. Do not run `git checkout` in a working tree that has uncommitted work. Check out the PR in a separate worktree instead: `git -C <repo_dir> worktree add ../review-pr-<pr_number> review/pr-<pr_number>`.

### Output
Local branch `review/pr-<pr_number>`, a worktree at `../review-pr-<pr_number>`, and `head_sha`.

### Quality Gate
- `git rev-parse review/pr-<pr_number>` prints a 40-character SHA equal to `head_sha`.
- The SHA matches the forge: `gh pr view <pr_number> --json headRefOid -q .headRefOid` (github) or `glab mr view <pr_number> -F json` field `sha` (gitlab).

---

## Phase 2: Save the Diff and the File List

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Save the diff with the three-dot range, which compares the PR head against the merge base. This matches the forge's "Files changed" view; the two-dot form would also show changes made on the base since the branch point.
   `git -C <repo_dir> diff -M origin/<base_branch>...<head_sha> > <repo_dir>/../pr-<pr_number>.diff`
2. Save the file list with rename detection: `git -C <repo_dir> diff -M --name-status origin/<base_branch>...<head_sha>`. Each line is `STATUS<TAB>path` or `R<score><TAB>old<TAB>new`. Parse it into `changed_files`.
3. Save `diff_stat`: `git -C <repo_dir> diff -M --shortstat origin/<base_branch>...<head_sha>`.
4. Also save a whitespace-insensitive view for later readers: `git diff -M -w --color-moved=zebra --color-moved-ws=allow-indentation-change origin/<base_branch>...<head_sha> > ../pr-<pr_number>.moved.diff`. Moved blocks appear in a distinct color in a terminal; this shows code that was moved, not rewritten.

### Output
`diff_file`, `changed_files`, `diff_stat`.

### Quality Gate
- `wc -l < <diff_file>` is greater than 0.
- The count of rows in `changed_files` equals the "N files changed" number in `diff_stat`.

---

## Phase 3: Fetch the PR Description

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Fetch title and body:

| `forge` | Command |
|---|---|
| github | `gh pr view <pr_number> --json title,body,baseRefName,headRefOid,isDraft` |
| gitlab | `glab mr view <pr_number> -F json` (fields `title`, `description`, `target_branch`, `sha`, `draft`) |

2. Confirm `baseRefName` (github) or `target_branch` (gitlab) equals `base_branch`. If it differs, the PR targets another branch: stop and rerun with the correct `base_branch`.
3. If the PR is a draft, record that in `pr_description`; the author has not asked for review yet.
4. Store title and body verbatim as `pr_description`. Do not summarize it here; the intent flow does that.

### Output
`pr_description`.

### Quality Gate
- The forge's base branch field equals `base_branch`.
- The forge's head SHA field equals `head_sha`.

---

## Worked Example

Illustrative. Input: `repo_dir=/work/shop`, `pr_number=482`, `forge=github`, `base_branch=main`.

- Phase 1: `git fetch origin pull/482/head:review/pr-482` prints ` * [new ref] refs/pull/482/head -> review/pr-482`. `head_sha=9f3c1e0d...` (40 chars). `gh pr view 482 --json headRefOid -q .headRefOid` prints the same SHA.
- Phase 2: `--name-status` prints:
  ```
  M	src/cart/pricing.py
  R087	src/cart/util.py	src/cart/money.py
  A	tests/cart/test_pricing.py
  ```
  `diff_stat` = ` 3 files changed, 141 insertions(+), 38 deletions(-)`; 3 rows match.
- Phase 3: `baseRefName` is `main`, `isDraft` false, body stored.

---

## Exit Criteria

DONE when the PR head is fetched at a recorded SHA that matches the forge, the merge-base diff and the rename-aware file list are saved and agree with each other, and the description is stored verbatim.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `couldn't find remote ref pull/N/head` | **Stop**: the number is wrong or `origin` is a fork; set `origin` (or another remote) to the upstream repository and retry. |
| Phase 1 | Fetch rejected as non-fast-forward | **Retry**: delete `review/pr-<pr_number>` locally and fetch again. |
| Phase 2 | `diff_stat` count and `changed_files` count differ | **Retry**: rerun both commands with the same `-M` flag; mismatched rename detection is the usual cause. |
| Phase 3 | `gh` or `glab` not authenticated | **Adjust**: run `gh auth status` or `glab auth status` and log in, then rerun Phase 3 only. |
| Phase 3 | Base branch differs from `base_branch` | **Return**: rerun Phase 2 with the forge's base branch. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
