# GitLab CI Cache Keys and needs DAG

**One-line description:** Adds lockfile-keyed `cache:key:files` caching with the right cache directory per package manager and `pull`/`pull-push` policies, and replaces stage-by-stage waiting with a `needs:` dependency graph, then measures both on real pipelines.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `gitlab_ci_path` (string, required): Pipeline file from `ci0-gitlab-ci-baseline`.
- `stack_profile` (object, required): From `ci0-detect-stack`.

---

## Outputs

- `gitlab_cache_diff` (object): `{diff, cache_keys[], pipeline_ids: {cold, warm}, install_seconds: {cold, warm}, hit_evidence[], needs_graph}`.

---

## Phase 1: Cache Configuration

### Entry Criteria
- A green baseline pipeline exists.

### Actions
1. GitLab caches only paths inside the project directory. Point each tool's cache there with a variable, then cache that path:

| Manager | Variable or flag | `cache:paths` | `cache:key:files` |
|---|---|---|---|
| pip | `PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"` | `.cache/pip` | `requirements.txt` |
| uv | `UV_CACHE_DIR: "$CI_PROJECT_DIR/.cache/uv"` | `.cache/uv` | `uv.lock` |
| poetry | `POETRY_CACHE_DIR: "$CI_PROJECT_DIR/.cache/poetry"` | `.cache/poetry` | `poetry.lock` |
| npm | `npm ci --cache .npm --prefer-offline` | `.npm` | `package-lock.json` |
| pnpm | `pnpm config set store-dir .pnpm-store` before install | `.pnpm-store` | `pnpm-lock.yaml` |
| yarn berry | `YARN_CACHE_FOLDER` or `.yarnrc.yml` `cacheFolder` | that folder | `yarn.lock` |
| go | `GOMODCACHE: "$CI_PROJECT_DIR/.go/pkg/mod"`, `GOCACHE: "$CI_PROJECT_DIR/.go/cache"` | `.go/` | `go.sum` |
| maven | `MAVEN_OPTS: "-Dmaven.repo.local=$CI_PROJECT_DIR/.m2/repository"` | `.m2/repository` | `pom.xml` |
| gradle | `GRADLE_USER_HOME: "$CI_PROJECT_DIR/.gradle"` | `.gradle/caches`, `.gradle/wrapper` | `gradle/wrapper/gradle-wrapper.properties` and build files |

2. Write the cache block:
```yaml
.deps-cache: &deps-cache
  key:
    files: [uv.lock]
    prefix: $CI_JOB_IMAGE
  paths: [.cache/uv]
```
   `cache:key:files` accepts at most two files (per the GitLab docs); the key is a hash of their contents. The `prefix` keeps caches from different images apart.
3. Policy: one job (the first to install, usually `test` on the default branch) uses `policy: pull-push`; every other job that uses the same key uses `policy: pull`, so parallel jobs do not race to upload the same cache.
4. Do not cache `node_modules` with `npm ci` (it deletes `node_modules`). Do not use `$CI_COMMIT_SHA` in a dependency cache key.
5. Cache is a speed hint, not a contract: on runners without a distributed cache (S3 or GCS configured in the runner's `config.toml`), caches are local to each runner and a job on another runner starts cold. Use `artifacts` for files a later job must have.

### Output
Cache block per job.

### Quality Gate
- Every `cache:key:files` entry exists in the repo (`ls` it).
- Exactly one job per key has `policy: pull-push`.

---

## Phase 2: needs DAG

### Entry Criteria
- Cache added.

### Actions
1. For each job, list what it really waits for. A test job does not need the lint job; a package job needs the build job's artifacts.
2. Add `needs:` per job: `needs: []` to start immediately regardless of stage; `needs: [build]` to wait only for `build` and download its artifacts. Use `needs: [{job: build, artifacts: false}]` when only ordering matters.
3. Keep `stages:` (GitLab still uses it for display and for jobs without `needs`).
4. Run `glab ci lint`.

### Output
`needs_graph`.

### Quality Gate
- CI Lint valid.
- Every `needs:` target names an existing job: `yq '.. | select(has("needs")) | .needs' <gitlab_ci_path>` values all match job names.

---

## Phase 3: Measure Cold and Warm

### Entry Criteria
- Pipeline file edited on a branch.

### Actions
1. Push; record the pipeline ID (cold). Then rerun the same commit: `glab ci run --branch <branch>` (new pipeline, warm).
2. For each pipeline, read job durations: `glab api "projects/:id/pipelines/<pid>/jobs" | jq '.[] | [.name,.duration,.queued_duration] | @tsv'`.
3. Read the install job trace for cache lines: `glab ci trace <job_id> | grep -E 'Checking cache|Successfully extracted cache|No URL provided, cache will not be|Creating cache'`.
4. `hit_evidence` must quote `Successfully extracted cache` from the warm run. If the warm run prints `No URL provided, cache will not be downloaded from shared cache server`, the runner has no distributed cache: report it.
5. Report durations from the API only.

### Output
`gitlab_cache_diff`.

### Quality Gate
- The warm trace contains `Successfully extracted cache`.
- Cold and warm durations are API values for the same job name.

---

## Worked Example

Illustrative only. npm project; jobs `lint`, `test`, `build`.

Phase 1: `cache: {key: {files: [package-lock.json]}, paths: [.npm], policy: pull-push}` on `test`, `policy: pull` on `lint` and `build`; install becomes `npm ci --cache .npm --prefer-offline`.
Phase 2: `lint: needs: []`, `test: needs: []`, `build: needs: []`; pipeline no longer waits for the lint stage.
Phase 3: cold `test` 212 s; warm trace shows `Successfully extracted cache`, warm `test` 141 s. Both read from `/pipelines/<pid>/jobs`.

---

## Exit Criteria

DONE when caches are lockfile-keyed inside the project dir with one writer per key, `needs:` reflects real dependencies, and a warm pipeline shows an extracted cache with measured durations.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | More than two key files needed | **Adjust**: combine with `prefix` or pick the two lockfiles that change most; record the choice. |
| Phase 2 | `needs` names a job in a later stage | **Adjust**: CI Lint reports it; move the job or fix the name. |
| Phase 3 | Warm run still cold on a different runner | **Return**: report missing distributed cache; the user decides on runner config. |
| Phase 3 | Warm not faster | **Return**: report both numbers; do not claim improvement. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
