# GitHub Actions Tag-Triggered Release Workflow

**One-line description:** Writes a `release.yml` that runs on a version tag, rebuilds and tests from the tagged commit, creates the GitHub Release with `gh release create --verify-tag`, attaches artifacts with a build provenance attestation, and limits write permissions to the release job.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository checkout.
- `verified_commands` (object, required): From `ci0-clean-room-command-check`; the build and test commands the release reruns.
- `release_trigger` (string, optional): Tag pattern that starts a release, for example `v*.*.*`. Default: ask the user; no default is assumed.

---

## Outputs

- `gha_release_workflow_path` (string): Path of the release workflow, normally `.github/workflows/release.yml`.

---

## Phase 1: Decide Version Source and Artifacts

### Entry Criteria
- `release_trigger` is known.

### Actions
1. Find where the version lives, so the tag can be checked against it:

| Stack | Version source | Read command |
|---|---|---|
| Python | `[project] version` in `pyproject.toml`, or dynamic via `setuptools-scm`/`hatch-vcs` | `grep -nE '^version|dynamic' pyproject.toml` |
| Node | `version` in `package.json` | `node -p "require('./package.json').version"` |
| Go | the git tag itself (module versions are tags) | none |
| Maven | `<version>` in `pom.xml` | `./mvnw -q help:evaluate -Dexpression=project.version -DforceStdout` |
| Gradle | `version` in `build.gradle(.kts)` or `gradle.properties` | `./gradlew -q properties | grep '^version:'` |

2. List release artifacts (wheel and sdist, npm tarball from `npm pack`, Go binaries, JAR). Ask the user which ones ship. Do not add a publish step to a package registry here; that is a separate decision.
3. If the version is static in a file, the release job must fail when the tag and file disagree (Phase 2 step 3).

### Output
Version source and artifact list.

### Quality Gate
- The version read command ran and its output is recorded.
- The artifact list is confirmed by the user.

---

## Phase 2: Write release.yml

### Entry Criteria
- Phase 1 complete.

### Actions
1. Write:
```yaml
name: Release
on:
  push:
    tags: ["v*.*.*"]
permissions:
  contents: read
concurrency:
  group: release-${{ github.ref }}
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: <user value>
    steps:
      - uses: actions/checkout@<sha> # <version>
        with:
          persist-credentials: false
      # setup action and verified install, build, test commands here
      - uses: actions/upload-artifact@<sha> # <version>
        with:
          name: dist
          path: dist/
          if-no-files-found: error
  release:
    needs: build
    runs-on: ubuntu-latest
    environment: release
    permissions:
      contents: write
      id-token: write
      attestations: write
    steps:
      - uses: actions/download-artifact@<sha> # <version>
        with:
          name: dist
          path: dist
      - uses: actions/attest-build-provenance@<sha> # <version>
        with:
          subject-path: dist/*
      - env:
          GH_TOKEN: ${{ github.token }}
          TAG: ${{ github.ref_name }}
        run: gh release create "$TAG" --repo "$GITHUB_REPOSITORY" --verify-tag --generate-notes dist/*
```
   Replace the `tags` pattern with `release_trigger`.
2. Copy build and test commands verbatim from `verified_commands`; the release must not skip tests.
3. Add a tag-version check step in `build` when the version is static, for example Node: `test "v$(node -p "require('./package.json').version")" = "$GITHUB_REF_NAME"`.
4. Do not grant `contents: write` at the top level or to the build job. Only the release job writes.
5. `cancel-in-progress: false` so a second tag push never kills a release halfway.
6. Run `actionlint` on the file.

### Output
`release.yml`.

### Quality Gate
- `actionlint` prints nothing.
- `grep -n 'contents: write'` matches only inside the `release` job.
- Every build and test `run:` line appears verbatim in `verified_commands`.

---

## Phase 3: Dry Run on a Pre-Release Tag

### Entry Criteria
- Workflow merged to the default branch (tag workflows run the file as it exists at the tagged commit).

### Actions
1. With user approval, push a pre-release tag on a commit that contains the workflow: `git tag v0.0.0-rc.1 && git push origin v0.0.0-rc.1` (choose a tag that matches the trigger and that the user agrees to).
2. `gh run watch --exit-status` on the run started by the tag.
3. Check the release: `gh release view v0.0.0-rc.1 --json assets --jq '.assets[].name'`.
4. Verify provenance: `gh release download v0.0.0-rc.1 -D /tmp/rel && gh attestation verify /tmp/rel/<artifact> --repo <owner/repo>`; it must print a verification success line.
5. Remove the dry-run release if the user asks: `gh release delete v0.0.0-rc.1 --cleanup-tag --yes`.

### Output
`gha_release_workflow_path`.

### Quality Gate
- The release lists every artifact from Phase 1.
- `gh attestation verify` exits 0.

---

## Worked Example

Illustrative only. Node CLI package, `release_trigger=v*.*.*`, artifact `acme-cli-1.4.0.tgz` from `npm pack`.

Phase 2 check step: `test "v$(node -p "require('./package.json').version")" = "$GITHUB_REF_NAME"`.
Phase 3 on tag `v1.4.0-rc.1`: first run fails at the check (`package.json` says 1.3.2), which is the intended guard. After the user bumps the version and retags, the run passes; `gh release view` lists `acme-cli-1.4.0-rc.1.tgz`; `gh attestation verify` prints `Verification succeeded!`.

---

## Exit Criteria

DONE when a tag push rebuilds and retests, creates a release with every artifact, provenance verifies, and only the release job holds write permission.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Version is dynamic from git (setuptools-scm) | **Adjust**: skip the tag-version check; `actions/checkout` needs `fetch-depth: 0` so tags are present. |
| Phase 2 | User wants semantic-release or release-please | **Return**: those replace this flow's tag trigger; record the choice and stop. |
| Phase 3 | `gh release create` fails with `HTTP 403` | **Adjust**: the job lacks `contents: write`, or an environment protection rule is waiting for approval. |
| Phase 3 | Attestation step fails with permissions error | **Adjust**: add `id-token: write` and `attestations: write` to the release job; private repos need a plan that supports attestations. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
