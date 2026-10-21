# Changelog and Release with semantic-release

**One-line description:** Writes an explicit `.releaserc.json` for semantic-release (branches with pre-release and maintenance channels, commit-analyzer, release-notes-generator, changelog, npm, git and github plugins), adds the GitHub Actions job with full history and the right permissions, and proves the computed version with `--dry-run` before any real release.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository root.
- `branching_model` (object, required): From rel-branching-model-select; main branch, pre-release branch and maintenance branch pattern.
- `next_version` (object, required): From rel-semver-bump-decision; the expected version.

---

## Outputs

- `semantic_release_config` (object): `.releaserc.json` contents, installed plugin list with versions, workflow file path.
- `sr_changelog` (object): Dry-run computed version, release notes text, whether it matches `next_version`, and the `CHANGELOG.md` path if the changelog plugin is used.

---

## Phase 1: Configure

### Entry Criteria
- A Node toolchain is available. Check what semantic-release needs: `npm view semantic-release engines` and compare with `node --version`.

### Actions
1. Install: `npm install --save-dev semantic-release @semantic-release/changelog @semantic-release/git`. The commit-analyzer, release-notes-generator, npm and github plugins ship with semantic-release.
2. Map `branching_model` to the `branches` array:

   | `branching_model.model` | `branches` value |
   |---|---|
   | trunk | `["main"]` |
   | trunk with pre-releases | `["main", {"name": "next", "prerelease": true}]` |
   | maintenance-branches | `["+([0-9])?(.{+([0-9]),x}).x", "main", {"name": "next", "prerelease": true}]` (the first entry is semantic-release's documented maintenance pattern, matching `1.x` and `1.4.x`) |

3. Write `.releaserc.json`. List plugins explicitly; the order is the order they run:
   ```json
   {
     "branches": ["main"],
     "plugins": [
       "@semantic-release/commit-analyzer",
       "@semantic-release/release-notes-generator",
       ["@semantic-release/changelog", {"changelogFile": "CHANGELOG.md"}],
       "@semantic-release/npm",
       ["@semantic-release/git", {"assets": ["CHANGELOG.md", "package.json", "package-lock.json"], "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"}],
       "@semantic-release/github"
     ]
   }
   ```
4. Decide whether to commit the changelog: the git plugin pushes a commit to the release branch, which branch rulesets may block. If the user does not need a committed `CHANGELOG.md` (GitHub release notes are enough), remove both the changelog and git plugins. If they keep it, add the release bot to the ruleset bypass list.
5. Not publishing to npm (for example a Go or Python repo using semantic-release only for tags): set `["@semantic-release/npm", {"npmPublish": false}]` or remove the npm plugin.
6. `package.json` `version` may stay at `0.0.0-development`; semantic-release sets it at publish time.

### Output
`.releaserc.json`.

### Quality Gate
- `python -m json.tool .releaserc.json` succeeds.
- `npx semantic-release --version` prints a version.

---

## Phase 2: Workflow

### Entry Criteria
- Config committed.

### Actions
1. Create `.github/workflows/release.yml`:
   ```yaml
   name: release
   on:
     push:
       branches: [main]
   permissions:
     contents: write
     issues: write
     pull-requests: write
     id-token: write
   jobs:
     release:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
           with:
             fetch-depth: 0
             persist-credentials: false
         - uses: actions/setup-node@v4
           with: {node-version: lts/*}
         - run: npm ci
         - run: npm audit signatures
         - run: npx semantic-release
           env:
             GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
             NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
             NPM_CONFIG_PROVENANCE: true
   ```
2. `fetch-depth: 0` is mandatory: semantic-release reads all tags and commits to find the last release. A shallow clone makes it think there was no previous release and computes `1.0.0`.
3. `id-token: write` plus `NPM_CONFIG_PROVENANCE: true` makes npm attach provenance on publish. If npm trusted publishing is configured instead of `NPM_TOKEN`, follow the current `@semantic-release/npm` README for token-less publishing; do not guess.
4. If the git plugin pushes to a protected branch, `persist-credentials: false` plus a bot token in `GITHUB_TOKEN` (a GitHub App token) is required; record which.

### Output
Workflow file.

### Quality Gate
- `actionlint .github/workflows/release.yml` reports no errors.
- The checkout step has `fetch-depth: 0`.

---

## Phase 3: Dry Run and Compare

### Entry Criteria
- On the release branch locally with all tags fetched (`git fetch --tags`).

### Actions
1. Run: `GITHUB_TOKEN=<read token> npx semantic-release --dry-run --no-ci --branches main`. `--no-ci` lets it run outside CI; `--dry-run` skips prepare, publish and tag steps.
2. Read the log lines:
   - `Found git tag v1.8.0 associated with version 1.8.0 on branch main` (the base it found).
   - `Analysis of N commits complete: minor release`.
   - `The next release version is 1.9.0`.
   - The release notes preview.
3. Compare `The next release version is X` with `next_version.semver`. If no line appears and the log says `There are no relevant changes, so no new version is released`, then only non-release commit types exist.
4. If the found base tag is wrong, the tag format differs: set `"tagFormat": "v${version}"` (the default) or the project's format.

### Output
`sr_changelog`.

### Quality Gate
- The dry-run log contains `The next release version is` with a version equal to `next_version.semver`, or the mismatch and its cause are recorded.
- The dry-run log names the expected previous tag.

---

## Worked Example

Illustrative. npm library, last tag `v1.8.0`, trunk model, `next_version.semver` = `1.9.0`.

- Phase 1: `.releaserc.json` as above with `"branches": ["main"]`.
- Phase 2: workflow added with `fetch-depth: 0` and `id-token: write`.
- Phase 3: `npx semantic-release --dry-run --no-ci --branches main` prints:
  ```
  [semantic-release] › ℹ  Found git tag v1.8.0 associated with version 1.8.0 on branch main
  [semantic-release] [@semantic-release/commit-analyzer] › ℹ  Analysis of 5 commits complete: minor release
  [semantic-release] › ℹ  The next release version is 1.9.0
  ```
  Matches `next_version`.

---

## Exit Criteria

DONE when `.releaserc.json` and the workflow are committed, and a dry run reports a next version equal to `next_version` with the correct previous tag.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Node version below semantic-release `engines` | **Adjust**: use the Node version from `npm view semantic-release engines` in CI. |
| Phase 2 | `EGITNOPERMISSION` or push rejected | **Adjust**: the token cannot push tags or commits; use an App token in the ruleset bypass list. |
| Phase 3 | Dry run computes `1.0.0` on an existing project | **Retry**: tags were not fetched or the clone is shallow; `git fetch --unshallow --tags`. |
| Phase 3 | `ENOTINHISTORY` or branch not configured | **Adjust**: add the current branch to `branches` or run on a configured branch. |
| Phase 3 | Version mismatch | **Return**: report both and the commits semantic-release analyzed; do not hand-tag to force it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
