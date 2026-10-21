# Changelog Entry From Git History

**One-line description:** Writes the Keep a Changelog entry for one release from the commits between the previous release tag and HEAD, with every line traceable to a commit and breaking changes listed first with migration steps.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `release_version` (string, required): From `pkg-release-version-lock`.
- `previous_release_ref` (string, optional): Previous release tag. Absent means first release.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `changelog_entry` (object): The Markdown text of the entry, the commit hash behind each line, and the path of the edited `CHANGELOG.md`.

---

## Phase 1: Collect Commits

### Entry Criteria
- `git -C <project_dir> rev-parse HEAD` succeeds.

### Actions
1. List commits: `git log --no-merges --pretty=format:'%h %s' <previous_release_ref>..HEAD`. For a first release, use `git log --no-merges --pretty=format:'%h %s'`.
2. Also list merged pull request titles if the project squashes or merges PRs: `git log --merges --pretty=format:'%h %s' <ref>..HEAD`.
3. Save the raw list in the report.

### Output
Raw commit list.

### Quality Gate
- The command line and full output are in the report.

---

## Phase 2: Sort Commits Into Sections

### Entry Criteria
- Raw list exists.

### Actions
1. Map each commit with this table. If the project uses Conventional Commits, use the prefix; otherwise read the subject:

   | Commit prefix or meaning | Section |
   |---|---|
   | `feat:` / new public feature | Added |
   | change in existing behavior | Changed |
   | marks something for removal | Deprecated |
   | removes a feature or public symbol | Removed |
   | `fix:` / bug fix | Fixed |
   | security fix (CVE, advisory) | Security |
   | `feat!:`, `fix!:`, or a `BREAKING CHANGE:` footer | Changed or Removed, prefixed **BREAKING** |
   | `chore:`, `ci:`, `test:`, `refactor:` with no user effect, `docs:` for internal docs | omit |

2. Rewrite each kept subject for a user: what changed for them, in past or present tense, naming the public symbol. Keep the commit hash.
3. For each BREAKING line, add one migration step: old usage and new usage.
4. Do not add any line without a commit behind it. Do not describe a change you cannot see in the commit list.

### Output
Sorted, rewritten lines.

### Quality Gate
- Every line carries a commit hash from the raw list.
- Every BREAKING line has a migration step.

---

## Phase 3: Write the Entry

### Entry Criteria
- Sorted lines exist.

### Actions
1. Open `CHANGELOG.md` (create it with a `# Changelog` heading and a line linking `https://keepachangelog.com/en/1.1.0/` if missing).
2. Insert the entry below the `## [Unreleased]` section (or at the top if none):
   ```
   ## [<release_version>] - <YYYY-MM-DD>
   ### Changed
   - **BREAKING** ...
   ### Added
   - ...
   ```
   Use section order: Added, Changed, Deprecated, Removed, Fixed, Security. Omit empty sections. Use today's date in ISO 8601.
3. Move any lines that were under `[Unreleased]` into the new entry.
4. Add the compare link at the bottom if the file uses them: `[<release_version>]: https://github.com/<owner>/<repo>/compare/<previous_release_ref>...<release_tag>`.
5. Edit only `CHANGELOG.md`.

### Output
`changelog_entry`.

### Quality Gate
- `grep -n "## \[<release_version>\]" CHANGELOG.md` prints exactly one line.
- `git diff --stat` shows only `CHANGELOG.md` changed by this flow.

---

## Worked Example

Illustrative. `release_version = 1.0.0`, ref `v0.4.1`.

Phase 1:
```
$ git log --no-merges --pretty=format:'%h %s' v0.4.1..HEAD
a1b2c3d feat!: make retry attempts keyword-only
d4e5f6a feat: add backoff() iterator
0f9e8d7 fix: stop sleeping after the final attempt
77aa11b ci: cache pip
```

Phase 3 entry:
```
## [1.0.0] - 2026-10-20
### Added
- `backoff()` yields delay values for custom loops. (d4e5f6a)
### Changed
- **BREAKING** `retry()` takes `attempts` as keyword-only. Migrate `retry(fn, 3)` to `retry(fn, attempts=3)`. (a1b2c3d)
### Fixed
- `retry()` no longer sleeps after the final failed attempt. (0f9e8d7)
```
The `ci:` commit is omitted.

---

## Exit Criteria

DONE when `CHANGELOG.md` has exactly one entry for the version, each line traces to a commit, and each breaking change has a migration step.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Ref not found | **Stop**: ask for the correct previous tag. |
| Phase 2 | Commit subject too vague to describe | **Adjust**: read `git show --stat <hash>` and describe what the diff changed; if still unclear, **Return** it as a question. |
| Phase 3 | Entry for this version already exists | **Stop**: the version was already prepared; confirm with the user before editing it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
