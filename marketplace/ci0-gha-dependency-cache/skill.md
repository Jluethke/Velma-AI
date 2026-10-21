# GitHub Actions Dependency Cache Keys

**One-line description:** Adds dependency caching to a GitHub Actions workflow using the setup action's built-in cache or `actions/cache` with a lockfile-hash key, correct paths per package manager, and restore-keys, then proves the cache hits on a second run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `gha_workflow_path` (string, required): Workflow file from `ci0-gha-workflow-baseline`.
- `stack_profile` (object, required): From `ci0-detect-stack` (package manager and lockfile).

---

## Outputs

- `gha_cache_diff` (object): `{diff, cache_keys[], run_ids: {cold, warm}, install_seconds: {cold, warm}, hit_evidence[]}`.

---

## Phase 1: Choose the Cache Mechanism

### Entry Criteria
- The workflow has at least one successful run (`gh run list --workflow <file> --limit 1`).

### Actions
1. Prefer the setup action's built-in cache. Use this table and nothing else:

| Manager | Setup action input | What is cached | Key is hashed from |
|---|---|---|---|
| npm | `actions/setup-node` `cache: npm` | `~/.npm` download cache | `package-lock.json` |
| pnpm | `actions/setup-node` `cache: pnpm` (needs pnpm on PATH first: `pnpm/action-setup` before setup-node) | pnpm store | `pnpm-lock.yaml` |
| yarn | `actions/setup-node` `cache: yarn` | yarn cache dir | `yarn.lock` |
| pip | `actions/setup-python` `cache: pip` | pip cache | `requirements*.txt` or `cache-dependency-path` |
| poetry | `actions/setup-python` `cache: poetry` (poetry must be installed before setup-python) | poetry cache | `poetry.lock` |
| pipenv | `actions/setup-python` `cache: pipenv` | pipenv cache | `Pipfile.lock` |
| uv | `astral-sh/setup-uv` `enable-cache: true` | uv cache | `uv.lock` by default (check the action README) |
| go | `actions/setup-go` cache is on by default (v4 and later) | module and build cache | `go.sum` |
| maven | `actions/setup-java` `cache: maven` | `~/.m2/repository` | `**/pom.xml` |
| gradle | `gradle/actions/setup-gradle` (handles caching itself) | Gradle user home | Gradle files |

2. If the lockfile is not at the repository root, set `cache-dependency-path:` to its path (supported by setup-node, setup-python, setup-go, setup-java; confirm in each `action.yml`).
3. Use raw `actions/cache` only for something the table does not cover (for example a tool binary or a build output cache). Then:
   - `key: ${{ runner.os }}-<tool>-${{ hashFiles('<lockfile>') }}`
   - `restore-keys: ${{ runner.os }}-<tool>-` (prefix match: restores the newest partial match when the exact key misses)
   - Include `runner.os` and any matrix version (`${{ matrix.python-version }}`) in the key when the cached files differ by OS or version.
4. Do not cache `node_modules` when installing with `npm ci`: `npm ci` deletes `node_modules` before installing, so the restore is wasted time. Cache the download cache instead (the table rows do this).
5. Do not put `${{ github.sha }}` or a date in the key of a dependency cache; every run would miss.

### Output
Chosen mechanism and key per job.

### Quality Gate
- Every cache key contains `hashFiles(` of a lockfile that exists (`ls <lockfile>` succeeds), or uses a setup-action built-in cache from the table.
- No step caches `node_modules` together with `npm ci`.

---

## Phase 2: Edit and Measure Cold Versus Warm

### Entry Criteria
- Mechanism chosen.

### Actions
1. Edit only `gha_workflow_path`. Change only the setup step `with:` blocks or add one `actions/cache` step before the install step.
2. Run `actionlint <gha_workflow_path>`; it must print nothing.
3. Push and record the first run ID (cold): `gh run list --workflow <file> --branch <branch> --limit 1 --json databaseId --jq '.[0].databaseId'`.
4. Rerun the same commit to get a warm run: `gh run rerun <cold_id>`, then wait with `gh run watch <cold_id> --exit-status`. A rerun keeps the run ID and increments the attempt.
5. Read install step durations from both attempts: `gh api repos/{owner}/{repo}/actions/runs/<id>/attempts/<n>/jobs --jq '.jobs[].steps[] | select(.name=="install") | [.started_at,.completed_at] | @tsv'`.
6. Read hit evidence from the warm log: `gh run view <id> --attempt 2 --log | grep -iE 'cache restored|cache hit|Cache restored from key'`. Setup actions print a line such as `Cache restored from key: ...`; `actions/cache` sets output `cache-hit` to `true` on an exact key match.
7. Cache scope rule to explain misses: a run can restore caches created on its own branch, on the default branch, and for PRs on the base branch; it cannot restore a sibling feature branch's cache. The first run on a new branch therefore restores from the default branch only if a cache was saved there.

### Output
`gha_cache_diff`.

### Quality Gate
- The warm attempt log contains a cache restore line, quoted in `hit_evidence[]`.
- `install_seconds.warm` and `install_seconds.cold` are both measured from step timestamps, not estimated.

---

## Worked Example

Illustrative only. npm project, `package-lock.json` at `web/package-lock.json`.

Phase 1: row npm; set `cache: npm` and `cache-dependency-path: web/package-lock.json`.
Phase 2 diff:
```diff
       - uses: actions/setup-node@v4
         with:
           node-version-file: web/.nvmrc
+          cache: npm
+          cache-dependency-path: web/package-lock.json
```
Cold attempt log: `Cache not found for keys: node-cache-Linux-x64-npm-5e1b...`; install 71 s. Warm attempt log: `Cache restored from key: node-cache-Linux-x64-npm-5e1b...`; install 23 s. Both values recorded with timestamps.

---

## Exit Criteria

DONE when every job's dependency install uses a lockfile-keyed cache, actionlint is clean, and a warm rerun shows a cache restore line with measured install time for both runs.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No lockfile | **Stop**: a cache keyed on nothing is never invalidated correctly; report to the user. |
| Phase 1 | setup-node fails with `Unable to locate executable file: pnpm` | **Adjust**: move `pnpm/action-setup` before `actions/setup-node`. |
| Phase 2 | Warm run shows no restore line | **Adjust**: check the key printed in both logs; if it differs, a non-lockfile value is in the key. Fix and rerun. |
| Phase 2 | Warm install is not faster | **Return**: report both durations; caching may not help this install (for example network is not the bottleneck). Do not claim a speedup. |
| Phase 2 | Cache save warns about size or reserve failure | **Return**: quote the warning; the repository cache limit is described in the GitHub caching docs. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
