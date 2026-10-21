# GitHub Actions Baseline CI Workflow

**One-line description:** Writes one `.github/workflows/ci.yml` from verified commands with correct triggers, least-privilege `permissions`, a `concurrency` group that cancels superseded PR runs, job `timeout-minutes`, and stable job IDs, then validates it with actionlint and a real run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository checkout.
- `verified_commands` (object, required): From `ci0-clean-room-command-check`.
- `default_branch` (string, required): Name of the protected branch, for example `main`. Read it with `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` if unsure.

---

## Outputs

- `gha_workflow_path` (string): Path of the workflow file written, normally `.github/workflows/ci.yml`.
- `gha_job_ids` (string[]): Job IDs in the file; these become check names used by branch protection.

---

## Phase 1: Triggers, Permissions, Concurrency

### Entry Criteria
- `.github/workflows/ci.yml` does not exist, or the user approved replacing it. Check with `ls .github/workflows/`.

### Actions
1. Write the header exactly in this shape (replace `main` with `default_branch`):
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```
2. Why each line: `push` limited to the default branch avoids running twice for each PR commit (once for `push`, once for `pull_request`). Top-level `permissions: contents: read` makes the `GITHUB_TOKEN` read-only unless a job asks for more. `cancel-in-progress` only for PRs, so default-branch runs always finish and leave a status.
3. Do not use `pull_request_target` for build and test. It runs with secrets and a write token in the base repository context; checking out PR code under it lets a fork run code with those secrets.
4. Do not add `paths:` or `paths-ignore:` filters to a workflow whose jobs will be required checks. A filtered-out workflow never reports, and a required check then waits forever with "Expected - Waiting for status to be reported".

### Output
Workflow header.

### Quality Gate
- The file contains `permissions:` at top level with `contents: read`.
- `grep -n 'pull_request_target' .github/workflows/ci.yml` prints nothing.

---

## Phase 2: Jobs From Verified Commands

### Entry Criteria
- Header written.

### Actions
1. Create one job per concern with short, stable IDs: `lint` (lint and typecheck stages) and `test` (install, build, test stages). Job IDs become check names, so do not rename them later without updating branch protection.
2. Each job: `runs-on: ubuntu-latest` (or the runner the user names), `timeout-minutes:` set from the user's value, or, if none is given, from the longest `seconds` in `verified_commands` reported to the user as an open question. The GitHub default is 360 minutes, which lets a hung job burn six hours.
3. Steps in order: `actions/checkout`, the stack setup action (`actions/setup-python`, `actions/setup-node`, `actions/setup-go`, `actions/setup-java`) with the version from the version source file (`python-version-file: .python-version`, `node-version-file: .nvmrc`, `go-version-file: go.mod`), then one `run:` step per verified command with a `name:` equal to its stage.
4. Write action references with the current major tag from each action's README for now (for example `actions/checkout@v4`); `ci0-gha-pin-actions-sha` replaces them with SHAs. Do not invent inputs: read each action's `action.yml` (`gh api repos/actions/setup-python/contents/action.yml --jq .content | base64 -d`) and use only listed inputs.
5. Add `persist-credentials: false` to `actions/checkout` unless a later step pushes to git; it keeps the token out of `.git/config`.
6. Copy commands exactly from `verified_commands`. Do not add, reorder or "improve" them here.

### Output
Complete `ci.yml`.

### Quality Gate
- Every `run:` command appears verbatim in `verified_commands`.
- Every job has `timeout-minutes`.
- Every `with:` key used exists in that action's `action.yml` (checked by step 4 or by actionlint in Phase 3).

---

## Phase 3: Validate and Run

### Entry Criteria
- File written.

### Actions
1. Lint locally: `actionlint .github/workflows/ci.yml`. Install from the rhysd/actionlint releases page if missing. Output format is `file:line:col: message [rule]`; zero lines and exit 0 means clean.
2. Push to a branch and open a draft PR: `git switch -c ci/baseline && git add .github/workflows/ci.yml && git commit -m "ci: add baseline workflow" && git push -u origin ci/baseline && gh pr create --draft --fill`.
3. Watch it: `gh run watch --exit-status` (exits non-zero if the run fails). Then list job results: `gh run view --json jobs --jq '.jobs[] | [.name, .conclusion] | @tsv'`.
4. Record `gha_job_ids` from the file (`yq '.jobs | keys' .github/workflows/ci.yml`, or read the YAML).
5. Do not merge the PR in this flow.

### Output
`gha_workflow_path`, `gha_job_ids`.

### Quality Gate
- `actionlint` printed nothing and exited 0.
- `gh run view --json jobs` shows `success` for every job.

---

## Worked Example

Illustrative only. Python uv project, `default_branch=main`, user timeout 20 minutes.

Phase 2 produces:
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - uses: astral-sh/setup-uv@v6
      - name: install
        run: uv sync --locked
      - name: test
        run: uv run pytest --junitxml=reports/junit.xml -o junit_family=xunit2
```
Phase 3: `actionlint` first prints `ci.yml:14:9: input "python_version" is not defined in action "actions/setup-python@v5". available inputs are ... [action]`; fixed to `python-version-file`. Rerun prints nothing. `gh run watch --exit-status` ends with `Run CI (12345678) completed with 'success'`. `gha_job_ids = ["lint", "test"]`.

---

## Exit Criteria

DONE when `ci.yml` passes actionlint, a real run on a PR branch succeeds for every job, and the job IDs are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ci.yml` already exists | **Stop**: ask the user whether to replace it or write `ci-new.yml`; never overwrite silently. |
| Phase 2 | Action input not in `action.yml` | **Adjust**: use the documented input name; never guess. |
| Phase 3 | actionlint reports shellcheck findings | **Adjust**: quote variables as the message says; rerun actionlint. |
| Phase 3 | Run fails but the clean-room passed | **Return**: compare runner image to the clean-room image and report the first differing step. |
| Phase 3 | Workflow does not start | **Retry**: check Actions are enabled in repo settings (`gh api repos/{owner}/{repo}/actions/permissions`); report if disabled. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
