# Changelog and Release PR with release-please

**One-line description:** Sets up release-please in manifest mode (`release-please-config.json` plus `.release-please-manifest.json`) with `googleapis/release-please-action@v4`, so each merge to the release branch updates a release pull request whose merge writes `CHANGELOG.md`, bumps version files, tags and creates the GitHub release, and checks its computed version against the decided one.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository root.
- `branching_model` (object, required): From rel-branching-model-select; gives the main branch and any maintenance branches.
- `next_version` (object, required): From rel-semver-bump-decision; the expected version.
- `release_type` (string, required): release-please strategy for the package, for example `python`, `node`, `go`, `rust` or `simple`. Check the supported list in the release-please README; do not invent one.

---

## Outputs

- `release_please_config` (object): Paths and contents of `release-please-config.json`, `.release-please-manifest.json` and the workflow file.
- `rp_changelog` (object): The release PR URL, the version in its title, the `CHANGELOG.md` section it adds, and whether it matches `next_version`.

---

## Phase 1: Write Config and Manifest

### Entry Criteria
- `repo_path` on GitHub. Commits follow Conventional Commits (release-please ignores non-conforming commits for the bump).

### Actions
1. Create `release-please-config.json`:
   ```json
   {
     "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
     "packages": {
       ".": {
         "release-type": "<release_type>",
         "changelog-path": "CHANGELOG.md",
         "include-v-in-tag": true
       }
     }
   }
   ```
   For a monorepo, add one key per package path (for example `"packages/core"`) and set `"include-component-in-tag": true` so tags become `core-v1.2.3`.
2. Create `.release-please-manifest.json` with the CURRENT released version, not the next one: `{".": "1.8.0"}`. A wrong value here makes release-please compute from the wrong base.
3. For a 0.x project that wants breaking changes to bump the middle number, set `"bump-minor-pre-major": true` in the package block; for features to bump the last number, also `"bump-patch-for-minor-pre-major": true`. Only set these if `next_version` was computed with the same 0.x rule.
4. For a pre-release (`next_version.semver` contains `-`), set `"prerelease": true` and `"versioning": "prerelease"` and confirm both keys in the schema file before committing.

### Output
Two config files.

### Quality Gate
- `python -m json.tool release-please-config.json` and `python -m json.tool .release-please-manifest.json` both succeed.
- The manifest version equals the latest release tag without `v` (`git describe --tags --abbrev=0`).

---

## Phase 2: Add the Workflow

### Entry Criteria
- Config committed on a branch.

### Actions
1. Create `.github/workflows/release-please.yml`:
   ```yaml
   name: release-please
   on:
     push:
       branches: [main]
   permissions:
     contents: write
     pull-requests: write
   jobs:
     release-please:
       runs-on: ubuntu-latest
       outputs:
         release_created: ${{ steps.rp.outputs.release_created }}
         tag_name: ${{ steps.rp.outputs.tag_name }}
       steps:
         - uses: googleapis/release-please-action@v4
           id: rp
           with:
             token: ${{ secrets.RELEASE_PLEASE_TOKEN }}
             config-file: release-please-config.json
             manifest-file: .release-please-manifest.json
   ```
   For a monorepo, outputs are per path, for example `steps.rp.outputs['packages/core--release_created']`.
2. Token decision:

   | Need | Token |
   |---|---|
   | CI must run on the release PR and on the created tag | A GitHub App installation token or fine-grained PAT stored as `RELEASE_PLEASE_TOKEN` (events created with `GITHUB_TOKEN` do not trigger other workflows) |
   | Publishing happens in the same workflow, gated on `release_created` | `GITHUB_TOKEN` is enough; enable "Allow GitHub Actions to create and approve pull requests" in repository settings |

3. Publishing jobs go in the same workflow with `needs: release-please` and `if: needs.release-please.outputs.release_created == 'true'`. Do NOT publish on every push.
4. For maintenance branches from `branching_model`, add the branch to `on.push.branches` and pass `target-branch: ${{ github.ref_name }}` to the action.

### Output
Workflow file.

### Quality Gate
- `actionlint .github/workflows/release-please.yml` reports no errors (install from rhysd/actionlint releases).
- The publish job's `if:` references `release_created`.

---

## Phase 3: Dry Run and Compare

### Entry Criteria
- Workflow and config merged to the main branch, or available on a branch for the CLI.

### Actions
1. Local dry run: `npx --yes release-please release-pr --repo-url=OWNER/REPO --token=$GITHUB_TOKEN --config-file=release-please-config.json --manifest-file=.release-please-manifest.json --target-branch=main --dry-run`. Confirm each flag with `npx release-please release-pr --help` first.
2. Read the version in the printed PR title (default form `chore(main): release 1.9.0`) and compare it to `next_version.semver`.
3. If they differ: list commits release-please counted (they appear in the printed changelog body) against `commit_list`. Usual causes: non-conventional commits ignored, wrong manifest version, `bump-minor-pre-major` mismatch. To force a version once, put a commit footer `Release-As: 2.0.0` on an empty commit: `git commit --allow-empty -m "chore: release 2.0.0" -m "Release-As: 2.0.0"`.
4. After the real release PR opens, record its URL and the `CHANGELOG.md` section. Edit the PR body only to add notes; editing the version by hand is overwritten on the next push.

### Output
`rp_changelog`.

### Quality Gate
- The dry-run version equals `next_version.semver`, or the mismatch cause and the `Release-As` fix are recorded.
- `gh pr list --label "autorelease: pending"` shows exactly one open release PR per package.

---

## Worked Example

Illustrative. Python library, `current` 1.8.0, `next_version.semver` = `1.9.0`, `release_type` = `python`.

- Phase 1: manifest `{".": "1.8.0"}`.
- Phase 2: workflow added; App token stored as `RELEASE_PLEASE_TOKEN`.
- Phase 3: dry run prints a PR titled `chore(main): release 1.9.0` with:
  ```
  ## [1.9.0](https://github.com/acme/parser/compare/v1.8.0...v1.9.0) (2026-10-20)
  ### Features
  * **cli:** add --json output (a1c3e9f)
  ### Bug Fixes
  * **parser:** handle BOM in input (d4e5f60)
  ```
  Versions match. After merge, the action outputs `release_created=true`, `tag_name=v1.9.0`.

---

## Exit Criteria

DONE when config, manifest and workflow are committed, the dry run or release PR shows a version equal to `next_version`, and publishing is gated on `release_created`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Manifest version unknown | **Adjust**: use the latest release tag; check the registry for the last published version if tags are missing. |
| Phase 2 | Release PR created but CI does not run on it | **Adjust**: switch from `GITHUB_TOKEN` to an App token. |
| Phase 2 | Action fails with "GitHub Actions is not permitted to create or approve pull requests" | **Adjust**: enable the repository setting or use an App token. |
| Phase 3 | Version mismatch | **Return**: report both values and the cause; do not hand-edit the release PR version. |
| Phase 3 | Release PR never appears | **Retry**: check `gh run list --workflow release-please.yml` logs for "no user facing commits"; that means only non-release types were merged. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
