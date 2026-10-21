# Commit History Audit Since Last Tag

**One-line description:** Lists every commit between the last release tag and HEAD, parses each against the Conventional Commits 1.0.0 grammar (type, optional scope, `!`, `BREAKING CHANGE:` footer), and returns classified commits plus a list of non-compliant commits with a diff-based classification, without rewriting history.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository root.
- `last_tag` (string, optional): The previous release tag. If absent, derive it in Phase 1.

---

## Outputs

- `commit_list` (object[]): One entry per commit: `sha`, `type`, `scope`, `breaking` (bool), `breaking_source` (`bang`, `footer`, or none), `subject`, `is_revert`.
- `noncompliant_commits` (object[]): Commits whose subject does not parse, with `sha`, original subject, files changed, and a proposed type with the evidence from the diff.

---

## Phase 1: Resolve the Range

### Entry Criteria
- `repo_path` is a git repository.

### Actions
1. Fetch tags: `git fetch --tags --force origin`. Shallow clones hide history; if `git rev-parse --is-shallow-repository` prints `true`, run `git fetch --unshallow`.
2. If `last_tag` is empty: `git describe --tags --abbrev=0 --match 'v[0-9]*' HEAD`. For a monorepo with component tags (`pkg-a-v1.2.3`), pass the component's `--match` pattern. If no tag exists, the range is the whole history and this is the first release.
3. Confirm the tag is an ancestor: `git merge-base --is-ancestor <last_tag> HEAD; echo $?` must print 0. If it prints 1 you are on a maintenance branch whose last tag is different; rerun step 2 on that branch.

### Output
Range `<last_tag>..HEAD`.

### Quality Gate
- `git rev-list --count <last_tag>..HEAD` prints a number; record it.
- The ancestor check printed 0.

---

## Phase 2: Parse Every Commit

### Entry Criteria
- Range resolved.

### Actions
1. Dump commits with unit and record separators so multi-line bodies parse safely: `git log --no-merges --format='%H%x1f%s%x1f%b%x1e' <last_tag>..HEAD`.
   - If the repository uses merge commits, `--no-merges` is correct (the merged commits are listed individually). If it uses squash merges, each squashed commit is one entry.
2. Parse each subject with this regular expression: `^(?<type>[a-zA-Z]+)(\((?<scope>[^)]+)\))?(?<bang>!)?: (?<subject>.+)$`.
3. Set `breaking` = true if `bang` matched, OR if the body has a footer line starting with `BREAKING CHANGE: ` or `BREAKING-CHANGE: ` (the spec treats them as synonyms; the token must be uppercase).
4. A subject starting `Revert "` or with type `revert` is `is_revert` = true. If the reverted commit is inside the same range, drop both from release consideration; if it is outside, keep the revert as a fix-level change.
5. Lower-case the type for classification but keep the original text in the record.
6. Cross-check with commitlint when it is installed: `npx commitlint --from <last_tag> --to HEAD --verbose`. Every commit commitlint rejects must appear in your non-compliant set.

### Output
Draft `commit_list` and the unparsed set.

### Quality Gate
- `len(commit_list) + len(unparsed)` equals the count from `git rev-list --count --no-merges <last_tag>..HEAD`.
- Every footer-based breaking commit shows `breaking_source` = `footer`.

---

## Phase 3: Classify Non-Compliant Commits

### Entry Criteria
- Unparsed set exists.

### Actions
1. For each unparsed commit, run `git show --stat --format='%s%n%b' <sha>` and classify with this table, first match wins:

   | Evidence in the diff | Proposed type |
   |---|---|
   | Removes or renames an exported or public symbol, or changes a public signature | `feat` with `breaking` = true (mark for the API diff step to confirm) |
   | Adds a new exported or public symbol, CLI flag or config key | `feat` |
   | Changes only files under `test/`, `tests/`, `*_test.go`, `*.spec.*` | `test` |
   | Changes only `*.md`, `docs/` | `docs` |
   | Changes only CI files (`.github/`, `.gitlab-ci.yml`) | `ci` |
   | Changes only lockfiles or dependency manifests | `build` (or `fix` if it bumps a dependency to fix a vulnerability named in the message) |
   | Anything else touching source | `fix` |

2. Record the proposal and the evidence line in `noncompliant_commits`. Do NOT rebase, amend or force-push to change published commit messages.
3. If more than a handful of commits are unparsed, report that the commit gate (rel-commitlint-gate) is missing; this audit still classifies them.

### Output
`commit_list`, `noncompliant_commits`.

### Quality Gate
- Every entry in `noncompliant_commits` has a proposed type and a quoted evidence line from `git show --stat`.
- `git status --porcelain` is empty and `git log -1 --format=%H` is unchanged from Phase 1 (no history was rewritten).

---

## Worked Example

Illustrative. Repo at `v2.3.1`, 6 commits since.

- Phase 1: `git describe --tags --abbrev=0 --match 'v[0-9]*'` prints `v2.3.1`; `git rev-list --count --no-merges v2.3.1..HEAD` prints `6`.
- Phase 2: parsed:
  ```
  a1c3e9f feat(cli): add --json output             breaking=false
  b72d001 fix(parser)!: reject duplicate keys       breaking=true  source=bang
  c0ffee2 refactor: split loader                    breaking=true  source=footer ("BREAKING CHANGE: load() now returns a Result")
  d11a2b3 docs: fix typo                            breaking=false
  e9f8a77 chore(deps): bump yaml to 2.4.5           breaking=false
  ```
  One unparsed: `f00ba12 "Update handler"`.
- Phase 3: `git show --stat f00ba12` lists `src/handler.ts | 4 ++--` only, no exported names changed: proposed `fix`.

---

## Exit Criteria

DONE when every commit in the range is either in `commit_list` with a parsed type and breaking flag or in `noncompliant_commits` with a proposed type and evidence, and the counts reconcile.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `fatal: No names found, cannot describe anything` | **Adjust**: no release tag exists; use the full history and mark this as the first release. |
| Phase 1 | Repository is shallow | **Retry**: `git fetch --unshallow --tags`, then repeat. |
| Phase 2 | Counts do not reconcile | **Retry**: a body contained the separator characters or merges were mixed in; rerun with `--no-merges` and the `%x1e` record separator. |
| Phase 3 | Cannot tell whether a change is breaking from the diff | **Return**: mark `breaking` = "unknown" and let the stack API diff step decide. |
| Any | Urge to rewrite commit messages on main | **Stop**: never rewrite published history; classification lives in the output only. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
