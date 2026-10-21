# GitLab CI Baseline Pipeline

**One-line description:** Writes a `.gitlab-ci.yml` from verified commands with pinned images, `workflow:rules` that prevent duplicate branch and merge request pipelines, `interruptible` jobs, job `timeout`, and validates it with the CI Lint API before a real pipeline run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository checkout.
- `verified_commands` (object, required): From `ci0-clean-room-command-check`, including the image digest used.
- `default_branch` (string, required): Default branch, for example `main`.

---

## Outputs

- `gitlab_ci_path` (string): Path of the pipeline file, normally `.gitlab-ci.yml`.

---

## Phase 1: Pipeline Rules and Defaults

### Entry Criteria
- `.gitlab-ci.yml` does not exist, or the user approved replacing it.
- `glab --version` works and `glab auth status` shows the GitLab host, or the user supplies an API token for the lint call.

### Actions
1. Start the file with:
```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH && $CI_OPEN_MERGE_REQUESTS
      when: never
    - if: $CI_COMMIT_BRANCH
    - if: $CI_COMMIT_TAG

stages: [lint, test]

default:
  image: <image@sha256:digest from verified_commands>
  interruptible: true
```
2. Why: without `workflow:rules`, a push to a branch with an open merge request can start both a branch pipeline and a merge request pipeline. These rules are the pattern from the GitLab `workflow:rules` docs: run merge request pipelines, skip branch pipelines when an MR is open, otherwise run branch pipelines.
3. `interruptible: true` lets GitLab cancel a running pipeline when a newer one starts on the same ref, if the project setting "Auto-cancel redundant pipelines" is on (Settings, CI/CD, General pipelines). Set it to `false` on any deploy or release job.
4. Pin the image by digest, the same one the clean-room check used. A tag such as `python:3.12` can change under you.

### Output
Pipeline header.

### Quality Gate
- `workflow:` with `rules:` is the first key.
- `default:image` contains `@sha256:`.

---

## Phase 2: Jobs

### Entry Criteria
- Header written.

### Actions
1. One job per concern, with `stage:` set:
```yaml
lint:
  stage: lint
  timeout: <user value>
  script:
    - <lint command 1 from verified_commands>

test:
  stage: test
  timeout: <user value>
  script:
    - <install command>
    - <test command>
```
2. `script` commands are copied verbatim from `verified_commands`. Put system package installs in `before_script` of the job that needs them.
3. Each `script` line runs in one shell; a failing line fails the job. Do not append `|| true` to any line.
4. Job-level `timeout` uses the user's value. If none is given, leave it out (the project's setting applies, default 60 minutes per the GitLab docs) and raise it as an open question.
5. Do not use the deprecated `only:`/`except:` keywords; use `rules:` when a job needs conditions.

### Output
Complete `.gitlab-ci.yml`.

### Quality Gate
- Every `script` line appears verbatim in `verified_commands`.
- `grep -nE '\|\| *true|only:|except:' .gitlab-ci.yml` prints nothing.

---

## Phase 3: Lint and Run

### Entry Criteria
- File complete.

### Actions
1. Validate against the server: `glab ci lint` (from the repo root). It prints `CI/CD YAML is valid!` or the errors. Without glab: `curl --header "PRIVATE-TOKEN: $TOKEN" --header "Content-Type: application/json" --data "$(jq -n --arg c "$(cat .gitlab-ci.yml)" '{content: $c}')" "https://<host>/api/v4/projects/<id>/ci/lint"` and read `.valid` and `.errors`.
2. Push a branch and open a merge request: `git switch -c ci/baseline && git add .gitlab-ci.yml && git commit -m "ci: baseline pipeline" && git push -u origin ci/baseline && glab mr create --fill --draft`.
3. Watch: `glab ci status --live` (or `glab ci view`). Read the result: `glab ci get --output json | jq '.status, (.jobs[] | [.name,.status])'`; confirm the JSON fields with `glab ci get --help` for your glab version.
4. Confirm there is exactly one pipeline for the MR head commit: `glab api "projects/:id/pipelines?sha=$(git rev-parse HEAD)" | jq length` prints `1`.

### Output
`gitlab_ci_path`.

### Quality Gate
- CI Lint reported valid.
- The MR pipeline status is `success` and only one pipeline exists for the head SHA.

---

## Worked Example

Illustrative only. Go project, image `golang:1.23-bookworm@sha256:4f9e...`, user timeout `20m`.

Phase 3:
```
$ glab ci lint
Validating...
.gitlab-ci.yml is invalid
1. jobs:test:timeout config should be a duration
```
The user wrote `timeout: 20`; fixed to `timeout: 20m`. Rerun prints `CI/CD YAML is valid!`. Pipeline 55120 succeeds; jobs `lint success`, `test success`. `glab api "projects/:id/pipelines?sha=..." | jq length` prints `1`.

---

## Exit Criteria

DONE when `.gitlab-ci.yml` passes CI Lint, one merge request pipeline succeeds, and no duplicate branch pipeline runs for the same commit.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | File already exists | **Stop**: ask the user; never overwrite. |
| Phase 3 | `glab ci lint` reports errors | **Adjust**: fix the named key from the GitLab CI YAML reference; rerun lint. |
| Phase 3 | Job stuck `pending` | **Return**: no runner matches the job (tags or no shared runners); report to the user. |
| Phase 3 | Two pipelines per commit | **Adjust**: compare `workflow:rules` with Phase 1; a job-level `rules` may be adding pipelines. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
