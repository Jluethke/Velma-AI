# Merge the Base Branch In and Resolve Conflicts

**One-line description:** Brings the fetched base branch into a shared or under-review topic branch with `git merge` (no history rewrite, no force push), resolves conflicts with zdiff3 markers where "ours" is your branch and "theirs" is the base, regenerates lockfiles, and verifies the merge commit with the test suite before a normal push.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sync_strategy` (object, required): Output of `tkt-sync-strategy-choose`; `strategy` must be `merge`.
- `branch_name` (string, required): Output of `tkt-branch-create`.
- `base_branch` (string, optional): Base branch; defaults to the value recorded in `sync_strategy`.
- `repo_profile` (object, required): Output of `tkt-repo-orient-detect`.

---

## Outputs

- `merge_result` (object): Merge commit hash, every conflicted file and how each was resolved, lockfiles regenerated, test summary line after the merge, and the push result.

---

## Phase 1: Prepare and Merge

### Entry Criteria
- `sync_strategy.strategy` == `merge`.
- `git status --porcelain` prints nothing.

### Actions
1. Make sure you have teammates' latest commits on the branch: `git pull --ff-only origin <branch_name>`. If it refuses (diverged), stop (Error Handling).
2. Set markers: `git config merge.conflictStyle zdiff3` (Git 2.35 or newer; else `diff3`).
3. Fetch and merge: `git fetch origin <base>` then `git merge --no-ff origin/<base>`. Without conflicts, git creates a merge commit with the default message `Merge remote-tracking branch 'origin/<base>' into <branch_name>`; keep it unless the repo's commitlint rejects it (commitlint's default ignores merge commits).
4. Sides during a merge (opposite of a rebase):

| Label or flag | During merge it means |
|---|---|
| `<<<<<<< HEAD` / `--ours` | Your topic branch |
| `>>>>>>> origin/<base>` / `--theirs` | The base branch being merged in |

### Output
Merge in progress (with conflicts) or a merge commit.

### Quality Gate
- `git log -1 --format=%P` shows two parent hashes when the merge completed, one of which equals `git rev-parse origin/<base>`.

---

## Phase 2: Resolve Conflicts

### Entry Criteria
- `git status` lists unmerged paths (skip this phase if none).

### Actions
1. For each unmerged file, apply this table:

| File kind | Resolution |
|---|---|
| Source code | Read the ancestor section between `|||||||` and `=======` to see what each side changed; combine both intents; delete all marker lines. |
| `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` | `git checkout --theirs <lockfile>` (base version), then rerun install (`npm install`, `pnpm install`, `yarn install`) to reapply your dependency changes. |
| `poetry.lock`, `uv.lock`, `pdm.lock` | Base version, then `poetry lock` (2.x; `--no-update` on 1.x), `uv lock`, or the pdm lock command from `pdm lock --help`. |
| `go.mod` / `go.sum` | Merge `go.mod` by hand keeping both requirements; take either `go.sum`; run `go mod tidy`. |
| `Cargo.lock` | Base version, then `cargo build`. |
| Migrations with two heads | Alembic: point your migration's `down_revision` at the base's head, or `alembic merge heads -m "merge"` if the team uses merge revisions. Django: update your migration's `dependencies`, or `makemigrations --merge` if that is the team's practice. |
| Generated files | Base version, rerun the generator. |

2. Check markers are gone: `rg -n '^(<<<<<<<|\|\|\|\|\|\|\||=======|>>>>>>>)( |$)' <file>` prints nothing; then `git add <file>`.
3. Run a fast compile check after each file (`python -m py_compile`, `npx tsc --noEmit`, `go build ./...`, `cargo check`).
4. When all files are staged, finish: `git commit --no-edit` (keeps the default merge message). Add a body line listing resolved files if the repo's convention asks.
5. To back out at any point: `git merge --abort`.

### Output
Merge commit.

### Quality Gate
- `git diff --name-only --diff-filter=U` prints nothing.
- `git grep -n -E '^(<<<<<<<|>>>>>>>) '` prints nothing in tracked files.

---

## Phase 3: Verify and Push

### Entry Criteria
- Merge commit exists.

### Actions
1. Review what the merge changed relative to your branch before it: `git diff HEAD^1 HEAD --stat` (changes brought in from the base) and the resolution itself: `git show --remerge-diff HEAD` (Git 2.36 or newer) shows only how conflicts were resolved.
2. Reinstall if any lockfile changed; run the full test suite and the stack's static checks. Compare with the baseline report: no new failures.
3. Push normally: `git push origin <branch_name>`. No force flag is needed or allowed; a merge does not rewrite history.
4. Confirm: `gh pr view <number> --json mergeStateStatus` is no longer `DIRTY` or `BEHIND`.

### Output
`merge_result`.

### Quality Gate
- Test summary after the merge shows no failures outside the baseline pre-existing list.
- `git push` succeeded without `--force` or `--force-with-lease`.

---

## Worked Example

Illustrative only. A teammate also pushed to `feat/PAY-412-invoice-csv-export`, so the strategy is merge.

```
$ git pull --ff-only origin feat/PAY-412-invoice-csv-export
Fast-forward
$ git fetch origin develop && git merge --no-ff origin/develop
Auto-merging package-lock.json
CONFLICT (content): Merge conflict in web/package-lock.json
Automatic merge failed; fix conflicts and then commit the result.
$ git checkout --theirs web/package-lock.json
$ (cd web && npm install)
added 2 packages, changed 1 package in 4s
$ git add web/package-lock.json && git commit --no-edit
$ git show --remerge-diff HEAD --stat
 web/package-lock.json | 14 ++++++++------
$ (cd web && npm test)
Tests  321 passed (321)
$ git push origin feat/PAY-412-invoice-csv-export
```

---

## Exit Criteria

DONE when the branch has a merge commit whose second parent is the base tip, no conflict markers remain, lockfiles were regenerated, tests and static checks match the baseline, and the push was a normal (non-force) push.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `git pull --ff-only` refuses (your local branch diverged from the remote) | **Stop**: inspect `git log --oneline HEAD...origin/<branch_name>`; merge the remote branch first with `git merge origin/<branch_name>`, never reset it away. |
| Phase 1 | `sync_strategy` is not merge | **Stop**: run `tkt-rebase-conflict-resolve` instead. |
| Phase 2 | Intent of a hunk unclear | **Stop**: `git merge --abort` and ask the author of the base change (`git log -1 --format='%an %h %s' origin/<base> -- <file>`). |
| Phase 3 | Tests fail after the merge | **Adjust**: fix in a new commit through `tkt-small-edit-loop`; do not amend the merge commit after pushing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
