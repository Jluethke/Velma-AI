# Changelog Generation with git-cliff

**One-line description:** Creates a `cliff.toml` that parses Conventional Commits into Keep a Changelog groups, prepends the unreleased section for the new version to `CHANGELOG.md` with `git cliff --unreleased --tag`, and cross-checks git-cliff's own `--bumped-version` against the decided version.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository root.
- `next_version` (object, required): From rel-semver-bump-decision or rel-hotfix-from-tag; uses its `tag` field.
- `last_tag` (string, optional): Previous release tag; used to confirm git-cliff picked the right range.

---

## Outputs

- `cliff_config` (object): Path and key settings of `cliff.toml` (`conventional_commits`, `filter_unconventional`, `commit_parsers`, `tag_pattern`).
- `cliff_changelog` (object): The new `CHANGELOG.md` section text, the release notes text for the tag annotation, and the `--bumped-version` comparison result.

---

## Phase 1: Install and Configure

### Entry Criteria
- `repo_path` has full history and tags (`git rev-parse --is-shallow-repository` prints `false`).

### Actions
1. Install one way: `cargo install git-cliff --locked`, or `pip install git-cliff`, or `npm install --save-dev git-cliff`. Confirm `git cliff --version`.
2. If `cliff.toml` does not exist: `git cliff --init keepachangelog` (writes a Keep a Changelog template). Confirm the template name with `git cliff --help` under `--init`.
3. Set these keys in `[git]` (edit only these lines):
   ```toml
   [git]
   conventional_commits = true
   filter_unconventional = true
   split_commits = false
   protect_breaking_commits = true
   tag_pattern = "v[0-9].*"
   commit_parsers = [
     { message = "^feat", group = "Added" },
     { message = "^fix", group = "Fixed" },
     { message = "^perf", group = "Changed" },
     { message = "^revert", group = "Removed" },
     { body = ".*security", group = "Security" },
     { message = "^(chore|ci|docs|style|test|build|refactor)", skip = true },
   ]
   ```
   `protect_breaking_commits = true` keeps breaking commits even when a parser says `skip`. For a monorepo with component tags, set `tag_pattern` to the component prefix (for example `"core-v[0-9].*"`) and use `--include-path` when running.
4. Do not hand-edit old sections of `CHANGELOG.md` in this flow.

### Output
`cliff.toml`.

### Quality Gate
- `git cliff --unreleased` runs and prints a section without errors.
- `git cliff --unreleased --context | python -m json.tool` succeeds (context is valid JSON).

---

## Phase 2: Cross-Check the Version

### Entry Criteria
- Config works.

### Actions
1. Run `git cliff --bumped-version`. It prints the next version git-cliff computes from the unreleased commits.
2. Compare with `next_version.tag`:

   | Result | Action |
   |---|---|
   | Equal | Continue. |
   | git-cliff lower (for example minor vs your major) | Expected when the major came from an API diff tool, not a commit marker. Record it and use `next_version.tag`. |
   | git-cliff higher | Stop and return: a breaking or feat commit was missed by the decision step. |

3. For a 0.x project, git-cliff's `[bump]` settings (for example `features_always_bump_minor`, `breaking_always_bump_major`) change its 0.x behavior; read the `[bump]` section of the git-cliff docs before comparing.

### Output
Comparison result.

### Quality Gate
- The `--bumped-version` output is recorded verbatim next to `next_version.tag`.
- A "git-cliff higher" result never proceeds to Phase 3.

---

## Phase 3: Write the Section

### Entry Criteria
- Version agreed.

### Actions
1. Prepend only the new section: `git cliff --unreleased --tag <next_version.tag> --prepend CHANGELOG.md`. Do NOT use `-o CHANGELOG.md` on an existing changelog unless the user wants the whole file regenerated; `-o` overwrites manual edits in older sections.
2. Produce release notes for the tag annotation and GitHub release body: `git cliff --unreleased --tag <next_version.tag> --strip header > RELEASE_NOTES.md`. Keep `RELEASE_NOTES.md` out of the commit (add it to `.gitignore` or write it outside the repo).
3. Review the diff: `git diff CHANGELOG.md`. Only lines at the top should be added.
4. Commit with `git commit -m "chore(release): prepare <next_version.tag>" CHANGELOG.md` together with the version file bump (`pyproject.toml`, `package.json`, `Cargo.toml`) if the project stores the version in a file. Do not tag here; tagging is rel-tag-sign-git.

### Output
`cliff_changelog`.

### Quality Gate
- `git diff HEAD~1 --stat` shows `CHANGELOG.md` (and the version file, if any) only.
- `git diff HEAD~1 -- CHANGELOG.md | grep '^-' | grep -v '^---'` prints nothing (no existing line was removed).

---

## Worked Example

Illustrative. `last_tag` = `v1.8.0`, `next_version.tag` = `v1.9.0`.

- Phase 1: `git cliff --version` prints `git-cliff 2.x`. `cliff.toml` created from the keepachangelog template with the parsers above.
- Phase 2: `git cliff --bumped-version` prints `v1.9.0`. Equal.
- Phase 3: `git cliff --unreleased --tag v1.9.0 --prepend CHANGELOG.md` adds:
  ```
  ## [1.9.0] - 2026-10-20

  ### Added
  - Add --json output

  ### Fixed
  - Handle BOM in input
  ```
  `git diff HEAD~1 --stat` shows `CHANGELOG.md | 9 +++++++++` and `pyproject.toml | 2 +-`.

---

## Exit Criteria

DONE when `CHANGELOG.md` has a new top section for `next_version.tag` with no older lines removed, release notes text exists for the tag, and the git-cliff version check is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Empty output from `--unreleased` | **Adjust**: `tag_pattern` does not match your tags; compare it with `git tag -l` and fix the pattern. |
| Phase 1 | Unknown template name for `--init` | **Adjust**: run `git cliff --help` and pick a listed template; or start from the default. |
| Phase 2 | git-cliff higher than `next_version` | **Return**: send the commit list back to rel-semver-bump-decision. |
| Phase 3 | `--prepend` duplicated an existing section | **Retry**: `git checkout -- CHANGELOG.md`; the version was already released or the tag already exists; check `git tag -l <tag>`. |
| Any | Shallow clone in CI | **Adjust**: `actions/checkout` with `fetch-depth: 0`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
