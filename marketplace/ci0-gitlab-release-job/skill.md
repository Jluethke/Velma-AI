# GitLab CI Tag Release Job

**One-line description:** Adds a release stage to `.gitlab-ci.yml` that runs only on tag pipelines, rebuilds and retests the tagged commit, uploads build outputs, and creates a GitLab Release with the `release:` keyword linking those outputs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `gitlab_ci_path` (string, required): Pipeline file.
- `verified_commands` (object, required): Build and test commands from `ci0-clean-room-command-check`.

---

## Outputs

- `gitlab_release_diff` (object): `{diff, release_tag, release_api_json, asset_links[]}`.

---

## Phase 1: Tag-Only Build Job

### Entry Criteria
- `workflow:rules` in the file allow `$CI_COMMIT_TAG` pipelines (see `ci0-gitlab-ci-baseline`).

### Actions
1. Add a `release` stage at the end of `stages:`.
2. Add a build job that runs only for tags and keeps its outputs:
```yaml
build-release:
  stage: release
  rules:
    - if: $CI_COMMIT_TAG
  interruptible: false
  script:
    - <install command>
    - <test command>
    - <build command>
  artifacts:
    paths: [dist/]
    expire_in: never
```
   `expire_in: never` keeps release files linkable; if the user prefers a duration, use it and note that asset links break when artifacts expire.
3. Commands are copied verbatim from `verified_commands`. The release must run tests; do not remove them for speed.
4. `interruptible: false`: an auto-cancel must never stop a release halfway.

### Output
Tag-only build job.

### Quality Gate
- The job has `rules: - if: $CI_COMMIT_TAG` and `interruptible: false`.
- Every script line appears in `verified_commands`.

---

## Phase 2: Release Job

### Entry Criteria
- Build job written.

### Actions
1. Add the release job. The `release:` keyword needs the release CLI in the job image; the GitLab docs name the image (historically `registry.gitlab.com/gitlab-org/release-cli`, with newer GitLab versions moving to `glab`). Read the current docs for your GitLab version and pin the image by digest.
```yaml
create-release:
  stage: release
  image: <release image@sha256:digest>
  rules:
    - if: $CI_COMMIT_TAG
  needs: [build-release]
  script:
    - echo "Creating release $CI_COMMIT_TAG"
  release:
    tag_name: $CI_COMMIT_TAG
    name: "Release $CI_COMMIT_TAG"
    description: "Release $CI_COMMIT_TAG"
    assets:
      links:
        - name: "<artifact file name>"
          url: "$CI_PROJECT_URL/-/jobs/<build job id>/artifacts/file/dist/<artifact file name>"
```
2. The job ID of `build-release` is not known in YAML. Pass it through a dotenv report: in `build-release` add `- echo "BUILD_JOB_ID=$CI_JOB_ID" > build.env` and `artifacts: reports: dotenv: build.env`; then use `$BUILD_JOB_ID` in the link URL.
3. Protect release tags so only maintainers can create them: `glab api -X POST "projects/:id/protected_tags" -f name='v*' -f create_access_level=40` (pattern and level are the user's choice). Protected variables are then available to tag pipelines.
4. Run `glab ci lint`.

### Output
Release job.

### Quality Gate
- CI Lint valid.
- `release:tag_name` is `$CI_COMMIT_TAG` and the job image contains `@sha256:`.

---

## Phase 3: Dry Run With a Pre-Release Tag

### Entry Criteria
- Changes merged to the default branch.

### Actions
1. With user approval, create a pre-release tag: `git tag v0.0.0-rc.1 && git push origin v0.0.0-rc.1`.
2. Watch the tag pipeline: `glab ci status --live --branch v0.0.0-rc.1` (confirm flag with `glab ci status --help`).
3. Read the release: `glab release view v0.0.0-rc.1` and `glab api "projects/:id/releases/v0.0.0-rc.1" | jq '.assets.links[] | [.name,.url]'`.
4. Fetch each link URL with `curl -sSfIL -H "PRIVATE-TOKEN: $TOKEN" <url>`; each must return HTTP 200.
5. Delete the dry-run release and tag if the user asks: `glab release delete v0.0.0-rc.1 --with-tag`.

### Output
`gitlab_release_diff`.

### Quality Gate
- The release API lists every expected asset link.
- Each asset URL returned HTTP 200.

---

## Worked Example

Illustrative only. Python wheel `invoice_api-2.1.0-py3-none-any.whl`.

Phase 2: dotenv passes `BUILD_JOB_ID=8812345`; link URL resolves to `.../-/jobs/8812345/artifacts/file/dist/invoice_api-2.1.0-py3-none-any.whl`.
Phase 3 on `v2.1.0-rc.1`: pipeline `build-release success`, `create-release success`. `glab api .../releases/v2.1.0-rc.1` lists one link; `curl -sSfIL` prints `HTTP/2 200`.

---

## Exit Criteria

DONE when a protected tag pipeline rebuilds and retests, creates a release whose asset links all resolve, and release jobs cannot be auto-cancelled.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tag pipeline does not start | **Adjust**: `workflow:rules` lacks `$CI_COMMIT_TAG`; add it. |
| Phase 2 | `release-cli: command not found` | **Adjust**: the job image lacks the release tool; use the image the GitLab docs name for your version. |
| Phase 3 | Asset link returns 404 | **Adjust**: artifact expired or path wrong; check `expire_in` and the `dist/` file name. |
| Phase 3 | Release already exists for the tag | **Stop**: never overwrite a published release; ask the user. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
