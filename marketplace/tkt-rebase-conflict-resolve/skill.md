# Rebase onto the Base Branch and Resolve Conflicts

**One-line description:** Rebases a single-author topic branch onto the fetched base tip, resolves each conflict hunk by reading both sides with zdiff3 markers (remembering that during a rebase "ours" is the base and "theirs" is your commit), regenerates lockfiles instead of hand-merging them, verifies with range-diff and the test suite, and pushes with `--force-with-lease`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sync_strategy` (object, required): Output of `tkt-sync-strategy-choose`; `strategy` must be `rebase`.
- `branch_name` (string, required): Output of `tkt-branch-create`.
- `base_branch` (string, optional): Base branch; defaults to the value recorded in `sync_strategy`.
- `repo_profile` (object, required): Output of `tkt-repo-orient-detect`, for test and install commands.

---

## Outputs

- `rebase_result` (object): Old and new head hashes, every conflicted file with how each hunk was resolved, lockfiles regenerated, range-diff summary, test summary line after the rebase, and the push result.

---

## Phase 1: Prepare

### Entry Criteria
- `sync_strategy.strategy` == `rebase`.
- `git status --porcelain` prints nothing.

### Actions
1. Safety ref: `git branch backup/pre-rebase-<branch_name> HEAD`.
2. Turn on context-rich conflict markers for this repo: `git config merge.conflictStyle zdiff3` (Git 2.35 or newer; use `diff3` on older Git). The markers then show three sections: `<<<<<<<` side A, `|||||||` the common ancestor, `=======`, side B, `>>>>>>>`.
3. Optional: `git config rerere.enabled true` records your resolutions so the same conflict is resolved automatically if it recurs on a later rebase.
4. Fetch: `git fetch origin <base>`. Then record the old fork point: `git merge-base origin/<base> HEAD` and save the printed hash as `<old_fork>`; Phase 3 needs it.
5. Memorize this rule. During `git rebase`, the sides are swapped compared to a merge:

| Label in markers or flag | During rebase it means |
|---|---|
| `<<<<<<< HEAD` / `--ours` | The base branch plus your commits already replayed |
| `>>>>>>> <sha> (<your commit subject>)` / `--theirs` | The commit of yours being replayed now |

Weak models commonly run `git checkout --ours <file>` during a rebase thinking it keeps their work; it throws their work away.

### Output
Backup ref and configured markers.

### Quality Gate
- `git rev-parse backup/pre-rebase-<branch_name>` equals the pre-rebase `git rev-parse HEAD`.

---

## Phase 2: Rebase and Resolve

### Entry Criteria
- Prepared.

### Actions
1. Start: `git rebase origin/<base>`.
2. On a stop, run `git status`. Files under "Unmerged paths" marked `both modified`, `both added`, `deleted by us` or `deleted by them` need resolution. `git rebase` also prints which commit it is applying.
3. Resolve each file with this table:

| File kind | Resolution |
|---|---|
| Source code | Open the file. For each hunk, read the ancestor section (`|||||||`) to see what each side changed. Keep both intents: apply your commit's change on top of the base's new code. Remove all marker lines. |
| `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` | Take the base version (`git checkout --ours <lockfile>` during rebase), then rerun the install that updates the lock (`npm install`, `pnpm install`, `yarn install`) so your dependency changes are reapplied. |
| `poetry.lock`, `uv.lock`, `pdm.lock` | Take the base version, then `poetry lock` (Poetry 2.x; on 1.x `poetry lock --no-update`), `uv lock`, or `pdm lock --update-reuse` (check `pdm lock --help`). |
| `go.sum` / `go.mod` | Resolve `go.mod` by hand (keep both requirements, higher version of the same module), take either `go.sum`, then `go mod tidy`. |
| `Cargo.lock` | Take the base version, then `cargo build` (cargo adds only what your `Cargo.toml` changes need). |
| Migration files with duplicate numbers or two heads | Do not edit both. Alembic: change your migration's `down_revision` to the base's new head (`alembic heads` shows them). Django: renumber is not needed; run `python manage.py makemigrations --merge` only if the team uses merge migrations, else update your migration's `dependencies`. |
| Generated files | Take the base version and rerun the generator. |
| `CHANGELOG.md` | Keep both entries in order. |

4. After editing a file, check no markers remain: `rg -n '^(<<<<<<<|\|\|\|\|\|\|\||=======|>>>>>>>)( |$)' <file>` prints nothing. Then `git add <file>`.
5. Compile or run the fastest check for the touched file before continuing (for example `python -m py_compile <file>`, `npx tsc --noEmit`, `go build ./...`, `cargo check`).
6. Continue: `git rebase --continue`. Repeat Actions 2 to 5 for each stop. If a commit becomes empty because the base already contains it, `git rebase --skip` is correct only after confirming with `git diff` that its change is present in the base.
7. If it goes wrong: `git rebase --abort` returns the branch exactly to its state before the rebase.

### Output
Rebased branch.

### Quality Gate
- `git status` shows no rebase in progress and nothing unmerged.
- `git grep -n -E '^(<<<<<<<|>>>>>>>) '` prints nothing in tracked files.

---

## Phase 3: Verify and Push

### Entry Criteria
- Rebase finished.

### Actions
1. Compare your commits before and after: `git range-diff <old_fork>..backup/pre-rebase-<branch_name> origin/<base>..HEAD`. Lines starting with `=` are unchanged commits; `!` shows commits whose diff changed (expected only where you resolved conflicts).
2. Confirm the branch now contains the base: `git merge-base --is-ancestor origin/<base> HEAD && echo contains-base`.
3. Reinstall if a lockfile changed, then run the full test suite and the stack's static checks. Compare to the baseline: no new failures.
4. Push: `git push --force-with-lease=<branch_name>:<old remote sha> origin <branch_name>` where `<old remote sha>` is `git rev-parse origin/<branch_name>` captured before the rebase, or simply `git push --force-with-lease origin <branch_name>` if you fetched right before rebasing. `--force-with-lease` refuses to overwrite commits someone else pushed. Never use plain `--force`.
5. Delete the backup ref after the PR merges.

### Output
`rebase_result`.

### Quality Gate
- `git merge-base --is-ancestor origin/<base> HEAD` exits 0.
- Test summary after the rebase shows no failures outside the baseline pre-existing list.
- `gh pr view <number> --json mergeStateStatus` no longer shows `DIRTY` or `BEHIND`.

---

## Worked Example

Illustrative only. Predicted conflict in `src/billing/api/routes.py`.

```
$ git branch backup/pre-rebase-feat/PAY-412-invoice-csv-export HEAD
$ git config merge.conflictStyle zdiff3
$ git rebase origin/develop
CONFLICT (content): Merge conflict in src/billing/api/routes.py
error: could not apply a1b2c3d... feat(export): add currency column and status filter to invoice CSV export
$ sed -n '38,52p' src/billing/api/routes.py
<<<<<<< HEAD
@router.get("/accounts/{account_id}/invoices/export", dependencies=[Depends(require_scope("invoices:read"))])
async def export_invoices(account_id: int):
||||||| parent of a1b2c3d
@router.get("/accounts/{account_id}/invoices/export")
async def export_invoices(account_id: int):
=======
@router.get("/accounts/{account_id}/invoices/export")
async def export_invoices(account_id: int, status: InvoiceStatus | None = None):
>>>>>>> a1b2c3d (feat(export): add currency column ...)
```

Reading the ancestor: the base added an auth dependency; your commit added the `status` parameter. Keep both:
```
@router.get("/accounts/{account_id}/invoices/export", dependencies=[Depends(require_scope("invoices:read"))])
async def export_invoices(account_id: int, status: InvoiceStatus | None = None):
```

```
$ rg -n '^(<<<<<<<|\|\|\|\|\|\|\||=======|>>>>>>>)( |$)' src/billing/api/routes.py
$ git add src/billing/api/routes.py && git rebase --continue
Successfully rebased and updated refs/heads/feat/PAY-412-invoice-csv-export.
$ uv run pytest -q
409 passed, 4 skipped in 53.02s
$ git push --force-with-lease origin feat/PAY-412-invoice-csv-export
```

---

## Exit Criteria

DONE when the branch contains the base tip, no conflict markers remain, lockfiles were regenerated rather than hand-merged, range-diff shows only expected changes, tests and static checks match the baseline, and the push used `--force-with-lease`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `sync_strategy` is not rebase | **Stop**: run `tkt-merge-conflict-resolve` instead. |
| Phase 2 | Conflict intent unclear (both sides changed the same logic differently) | **Stop**: `git rebase --abort`, ask the author of the base change (`git log -1 --format='%an %h %s' origin/<base> -- <file>`). |
| Phase 2 | Same conflict repeats on every commit | **Adjust**: abort, squash your commits into one first (`tkt-conventional-commit` Phase 3), then rebase once. |
| Phase 3 | Tests fail after rebase | **Adjust**: the base changed an API your code uses; fix in a new commit through `tkt-small-edit-loop`. |
| Phase 3 | `--force-with-lease` rejected | **Stop**: someone pushed; fetch and inspect `git log HEAD..origin/<branch_name>` before anything else. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
