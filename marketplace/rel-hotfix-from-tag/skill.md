# Hotfix from a Release Tag

**One-line description:** Produces a patch version for an already-released line by cutting (or reusing) a branch from the release tag, cherry-picking one tested fix with `git cherry-pick -x`, running the full test suite on that branch, computing the patch version, and proving the same fix is also on the main branch so the bug does not return in the next release.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository root.
- `branching_model` (object, required): From rel-branching-model-select; gives the release branch pattern and hotfix rule.
- `bad_version` (string, optional): The released version that needs the fix (for example `1.9.0`). Required unless `withdrawal_actions` names it.
- `fix_commit` (string, optional): SHA of the commit that fixes the bug, already merged on main (or on the oldest affected line, per the hotfix rule). If absent, this flow stops and asks for it.
- `withdrawal_actions` (object, optional): From rel-yank-bad-release; supplies `bad_version` and the reason.

---

## Outputs

- `hotfix_branch` (object): Branch name, base tag, cherry-picked commit SHAs with their `(cherry picked from commit ...)` trailers, test command and result, and the main-branch presence check.
- `hotfix_version` (object): `semver`, `pep440`, `tag` for the patch release (same shape as `next_version`, so the changelog and tag flows accept it).

---

## Phase 1: Prepare the Branch

### Entry Criteria
- `fix_commit` is given and exists: `git cat-file -t <fix_commit>` prints `commit`.
- `bad_version` is known (input or `withdrawal_actions.bad_version`).

### Actions
1. Base tag: `v<bad_version>`; confirm with `git rev-parse v<bad_version>^{commit}`.
2. Branch name from `branching_model`:

   | Model | Branch |
   |---|---|
   | trunk | none needed if main has no unreleased `feat` or breaking commits since the tag (`git log v<bad_version>..main --format=%s` shows only `fix:`/`docs:`/`chore:`); then release the patch from main and skip to Phase 3. Otherwise create `hotfix/<major>.<minor>.x` from the tag. |
   | trunk-with-release-branches | existing `release/<major>.<minor>`; create it from the tag if it was deleted |
   | maintenance-branches | existing `<major>.x` (or `<major>.<minor>.x`); create from the tag if missing |

3. Create or update: `git fetch origin --tags` then `git switch -c <branch> v<bad_version>` (new) or `git switch <branch> && git pull --ff-only` (existing). Confirm `git merge-base --is-ancestor v<bad_version> HEAD` exits 0.

### Output
Branch checked out at or after the tag.

### Quality Gate
- `git rev-parse --abbrev-ref HEAD` prints the chosen branch name.
- The ancestor check exits 0.

---

## Phase 2: Cherry-Pick and Test

### Entry Criteria
- Branch ready.

### Actions
1. Cherry-pick only the fix: `git cherry-pick -x <fix_commit>`. `-x` appends `(cherry picked from commit <sha>)` so the origin is traceable. Do not cherry-pick unrelated commits "while you are there".
2. If the pick conflicts, resolve ONLY the conflicting hunks so the old line gets the same behavior change; keep the rest of the old code as is. `git cherry-pick --continue`. If the fix depends on a refactor that is not on the old line, stop and return: the fix needs a backport-specific commit written for the old code, reviewed separately.
3. If the fix commit has a regression test, it is picked with it. If the test was in a separate commit, cherry-pick that commit too, and only that.
4. Run the project's full test suite exactly as CI runs it on this branch (read the CI workflow for the command). Do not skip, delete or mark tests as expected failures to get green.
5. Push the branch and open a pull request into it: `git push -u origin <branch>` then `gh pr create --base <branch> ...` if the branch is protected, so CI runs and a reviewer approves.

### Output
Branch with the fix, tests passing.

### Quality Gate
- `git log -1 --format=%B` contains `(cherry picked from commit <fix_commit>)`.
- The CI run on the hotfix branch or PR is green (`gh pr checks <pr>` shows all checks passing).

---

## Phase 3: Version and Forward-Port Check

### Entry Criteria
- Tests green.

### Actions
1. Patch version: `npx --yes semver -i patch <bad_version>` (for example `1.9.0` to `1.9.1`). If a later patch on this line already exists (`git tag -l 'v1.9.*'`), increment from the highest one, not from `bad_version`.
2. Fill `hotfix_version`: `semver`, `pep440` (same digits for plain patches), `tag` = `v<semver>`.
3. Prove the fix is on main: `git branch -r --contains <fix_commit>` lists `origin/main`, or, if the fix was made on the old line first, `git log origin/main --grep "cherry picked from commit <fix_commit>"` finds the forward-port. If neither, open a forward-port PR to main with `git cherry-pick -x` and record its URL; the hotfix is not complete without it.
4. For each other supported line in `branching_model` that also contains the bug (`git merge-base --is-ancestor <commit that introduced the bug> <line branch>`), repeat Phases 1 and 2 for that line and list it.
5. Hand off: the changelog step (git-cliff with `next_version` = `hotfix_version`) and rel-tag-sign-git run on the hotfix branch. With semantic-release maintenance branches or release-please `target-branch`, merging the PR makes the tool release; do not hand-tag.

### Output
`hotfix_branch`, `hotfix_version`.

### Quality Gate
- `npx --yes semver <bad_version> <hotfix semver>` lists the hotfix version last.
- The main-branch presence check output (or forward-port PR URL) is recorded.

---

## Worked Example

Illustrative. Maintenance model, lines `2.x` (main) and `1.x`. `bad_version` = `1.9.0` (yanked: missing dependency). `fix_commit` = `7ab31c0` on main ("fix(deps): declare PyYAML").

- Phase 1: branch `1.x` exists; `git switch 1.x && git pull --ff-only`; ancestor check passes.
- Phase 2: `git cherry-pick -x 7ab31c0` applies cleanly; `git log -1 --format=%B` ends with `(cherry picked from commit 7ab31c0...)`. PR into `1.x`; CI green.
- Phase 3: `git tag -l 'v1.9.*'` shows only `v1.9.0`; `npx --yes semver -i patch 1.9.0` prints `1.9.1`. `git branch -r --contains 7ab31c0` lists `origin/main`. `hotfix_version` = `{semver: "1.9.1", pep440: "1.9.1", tag: "v1.9.1"}`.

---

## Exit Criteria

DONE when the fix is cherry-picked with `-x` onto the correct branch from the release tag, the full suite is green there, the patch version is computed from the highest existing patch on the line, and the fix is confirmed on main (or a forward-port PR exists).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `fix_commit` not provided | **Stop**: the fix must exist, reviewed and tested, before a hotfix branch is cut. |
| Phase 2 | Cherry-pick conflict needing other refactors | **Return**: request a backport-specific commit for the old line; do not drag in unrelated commits. |
| Phase 2 | Tests fail on the old line | **Stop**: do not release; investigate whether the fix relies on newer behavior. |
| Phase 3 | Fix not on main | **Adjust**: open the forward-port PR and record it before handing off. |
| Phase 3 | Patch version already taken | **Adjust**: increment from the highest existing tag on the line. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
