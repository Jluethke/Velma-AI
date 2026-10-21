# Run the E2E Suite in CI Inside a Pinned Browser Container

**One-line description:** Runs the E2E suite in CI inside the runner's official image (`mcr.microsoft.com/playwright:v<version>-noble`, `mcr.microsoft.com/playwright/python:v<version>-noble` or `cypress/included:<version>`) whose tag matches the installed package version, starts the app and its services before tests, applies the shard plan, uploads artifacts, and proves the container run matches a local container run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `stack` (string, required): `playwright-node`, `playwright-python` or `cypress`.
- `artifact_config` (object, required): From `e2e-failure-artifacts`.
- `node_shard_plan` (object, optional): From `e2e-node-pw-shard-merge` when `stack == 'playwright-node'`.
- `py_shard_plan` (object, optional): From `e2e-py-pw-xdist` when `stack == 'playwright-python'`.
- `cypress_shard_plan` (object, optional): From `e2e-cypress-parallel` when `stack == 'cypress'`.
- `ci_provider` (string, optional): `github` (default) or `gitlab`.

---

## Outputs

- `ci_workflow` (object): `{workflow_path, image, image_version_matches: bool, services[], shard_wiring, artifact_step, local_container_output, ci_run_url}`.

---

## Phase 1: Pin the Image to the Installed Version

### Entry Criteria
- The shard plan matching `stack` is present (or sharding is 1).

### Actions
1. Read the version and form the tag:

| stack | Version command | Image |
|---|---|---|
| playwright-node | `npx playwright --version` | `mcr.microsoft.com/playwright:v<version>-noble` |
| playwright-python | `pip show playwright \| grep Version` | `mcr.microsoft.com/playwright/python:v<version>-noble` |
| cypress | `npx cypress --version` | `cypress/included:<version>` (Cypress and browsers preinstalled; entrypoint is `cypress run`) |

2. Confirm the tag exists before writing it: `docker manifest inspect <image>` exits 0.
3. Never use `latest`; a floating tag changes the browser under the suite without a commit.
4. Run the suite locally in the image first:
   - Playwright Node: `docker run --rm --ipc=host -v "$PWD":/work -w /work <image> /bin/bash -c "npm ci && npx playwright test"`
   - Playwright Python: `docker run --rm --ipc=host -v "$PWD":/work -w /work <image> /bin/bash -c "pip install -r requirements-dev.txt && pytest e2e"`
   - Cypress: `docker run --rm -v "$PWD":/e2e -w /e2e <image>` (runs `cypress run`).
   `--ipc=host` is recommended in the Playwright Docker docs because Chromium can run out of shared memory and crash otherwise.

### Output
Pinned image and `local_container_output`.

### Quality Gate
- `docker manifest inspect <image>` exits 0.
- `local_container_output` shows the same pass count as the host run.

---

## Phase 2: Write the CI Job

### Entry Criteria
- Local container run passes.

### Actions
1. GitHub Actions, Playwright Node (adapt names for Python):
```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.48.2-noble
      options: --user 1001 --ipc=host
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3]
        shardTotal: [3]
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: postgres }
        options: >-
          --health-cmd "pg_isready -U postgres" --health-interval 5s --health-retries 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
        env:
          DATABASE_URL: postgres://postgres:postgres@postgres:5432/postgres
```
   Inside a container job, services are reached by service name (`postgres`), not `localhost`. The health-check numbers above are illustrative; take them from the service's own documentation or measured start time.
2. `options: --user 1001` matches the GitHub runner user so checkout files are writable; the Playwright CI docs show this. If Firefox fails to start as a non-root user in the container, the same docs set `HOME: /root` env for the job; apply only if that error appears.
3. Matrix values come from the shard plan (`node_shard_plan.shard_count` etc.); remove the matrix when sharding is 1.
4. Cypress: use `container: cypress/browsers:<tag>` with `cypress-io/github-action@v6` (`start`, `wait-on`), or run `cypress/included` directly.
5. GitLab: `image: <image>`, `parallel: <n>`, and `npx playwright test --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL`.
6. Add the artifact upload step from `artifact_config.ci_upload_step` with the shard index in the name, and a merge job when the shard plan has one.
7. Write the job, push to a branch, open the run. Do not edit five things at once if it fails; change one setting per push.

### Output
Workflow file.

### Quality Gate
- `actionlint .github/workflows/e2e.yml` (if installed) prints nothing; otherwise the run starts without a "workflow is not valid" error.
- The CI run's pass count equals `local_container_output`.

---

## Phase 3: Confirm Parity and Record

### Entry Criteria
- CI run finished.

### Actions
1. Compare the CI job log line for the browser version (`npx playwright --version` step or the Cypress run header `Browser: Chrome <n>`) with the local container run. They must match.
2. If CI fails but the local container passes, check in order: missing env var (print names, not values), service not healthy yet (service logs in the job's "Initialize containers" step), different base URL (container networking), CPU starvation (compare durations).
3. Record `ci_run_url`.

### Output
`ci_workflow`.

### Quality Gate
- Browser version strings match between CI and local container logs.
- `ci_run_url` points to a green run on the branch.

---

## Worked Example

Illustrative only. `stack=playwright-node`, `node_shard_plan.shard_count=3`.
```
$ npx playwright --version
Version 1.48.2
$ docker manifest inspect mcr.microsoft.com/playwright:v1.48.2-noble > /dev/null && echo ok
ok
$ docker run --rm --ipc=host -v "$PWD":/work -w /work mcr.microsoft.com/playwright:v1.48.2-noble /bin/bash -c "npm ci && npx playwright test"
  42 passed (2.4m)
```
First CI run failed: `connect ECONNREFUSED 127.0.0.1:5432`. `DATABASE_URL` used `localhost`; changed to `postgres`. Second run: 3 shards, merged report 42 passed.

---

## Exit Criteria

DONE when CI runs the suite in an image pinned to the installed runner version, services are healthy before tests, shards and artifacts are wired, and CI results and browser versions match a local container run.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `docker manifest inspect` fails | **Adjust**: the version has no image with that suffix; list tags on the registry page and pick the same version with an available OS suffix. |
| Phase 1 | Chromium crashes with "Target page, context or browser has been closed" in container | **Adjust**: add `--ipc=host` to the run options. |
| Phase 2 | `EACCES` on checkout files | **Adjust**: set `--user 1001` or run as root and record it. |
| Phase 3 | CI and local container disagree after all checks | **Return**: report both logs side by side; do not add retries to hide it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
