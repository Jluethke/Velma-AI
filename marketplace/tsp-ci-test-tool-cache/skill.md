# CI Cache for Test Tool State

**One-line description:** Persists the test-tool state that makes reruns cheap between GitHub Actions jobs (Go's `GOCACHE` holding build and test results, the Jest `cacheDirectory` of transformed files, Vitest's results cache, `.pytest_cache`, and the `.test_durations` or `.testmondata` files that sharding and selection depend on) with `actions/cache` keys that invalidate correctly.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ci_config_path` (string, required): Path to the GitHub Actions workflow file that runs the tests (for example `.github/workflows/test.yml`).
- `stack` (string, required): `python`, `node` or `go`.

---

## Outputs

- `ci_cache_config` (object): Cached paths, cache keys and restore keys, the workflow diff, and job durations plus cache-hit log lines for a cold run and a warm run.

---

## Phase 1: Locate What Is Rebuilt Every Run

### Entry Criteria
- `ci_config_path` exists and runs the test suite.

### Actions
1. Read the workflow. Record the setup actions and their cache settings: `actions/setup-go` (`cache` input; v4 and later default to caching the module and build caches keyed on `go.sum`), `actions/setup-node` (`cache: npm|yarn|pnpm` caches the package manager store only, not Jest transforms), `actions/setup-python` (`cache: pip|pipenv|poetry` caches downloads only).
2. List the test-tool state per stack:

| `stack` | State | Default location | Effect when cached |
|---|---|---|---|
| go | Build and test result cache | `go env GOCACHE` | Unchanged packages print `(cached)` and skip execution, unless the command passes `-count=1` |
| node (Jest) | Transform cache | `cacheDirectory` from `npx jest --showConfig` (a temp dir by default) | Skips re-transforming unchanged files |
| node (Vitest) | Results cache used to run failed and long files first | Under Vite's `cacheDir` (`node_modules/.vite` by default); check your version's docs | Ordering only; does not skip tests |
| python | `.pytest_cache` | repo root | `--lf`/`--ff` state; does not speed full runs by itself |
| python | `.test_durations` (pytest-split), `.testmondata` (pytest-testmon) | repo root | Needed by `tsp-ci-shard-by-timing` and `tsp-changed-test-selection` |

3. Check the Go command: if CI uses `-count=1`, the test result cache is disabled on purpose; record that and ask whether to keep it. Go's test cache tracks files and environment variables the test opens through the `os` package; tests that read external services are not tracked, so cached passes can hide external changes.

### Output
List of state to persist.

### Quality Gate
- Each listed path is copied from a command output (`go env GOCACHE`, `--showConfig`) or the tool's docs.

---

## Phase 2: Add the Cache Steps

### Entry Criteria
- List exists.

### Actions
1. Go: keep `actions/setup-go` cache on (default) or set `cache: true`. If the workflow uses multiple Go versions or OSes, include them in the key (setup-go does this). Remove `-count=1` only with user agreement.
2. Jest: set `cacheDirectory: '<rootDir>/.jest-cache'` in `jest.config.*` (and add `.jest-cache` to `.gitignore`), then add before the test step:
   `- uses: actions/cache@v4`
   `  with:`
   `    path: .jest-cache`
   `    key: jest-${{ runner.os }}-${{ hashFiles('package-lock.json', 'jest.config.*', 'babel.config.*', 'tsconfig*.json') }}-${{ github.sha }}`
   `    restore-keys: jest-${{ runner.os }}-${{ hashFiles('package-lock.json', 'jest.config.*', 'babel.config.*', 'tsconfig*.json') }}-`
   The `github.sha` suffix saves a fresh cache per commit; the restore key loads the newest matching one.
3. Python sharding and selection data: cache `.testmondata` with a key including the lockfile hash and `github.sha`, restore keys without the sha. `.test_durations` is usually committed to the repo instead (pytest-split docs); record which the project does.
4. Edit only `ci_config_path` and the one config file named per step. Commit each stack item separately.
5. Do NOT cache `node_modules` together with the Jest cache in one key; dependency caching belongs to the setup actions.

### Output
Workflow changes committed on a branch.

### Quality Gate
- `actionlint <ci_config_path>` (if installed) prints nothing, or the workflow parses in a pushed branch run.
- The diff touches only `ci_config_path`, one runner config file, and `.gitignore`.

---

## Phase 3: Prove Cold Versus Warm in CI

### Entry Criteria
- Branch pushed by the user (this flow does not push).

### Actions
1. Trigger two runs on the same branch: the first is cold (no cache), the second warm. Re-run with `gh run rerun <run-id>` or push an empty commit.
2. Read the cache step log: `actions/cache` prints `Cache restored from key: <key>` on a hit and `Cache not found for input keys` on a miss.
3. Record both runs' test step durations: `gh run view <run-id> --json jobs --jq '.jobs[] | {name, startedAt, completedAt}'`, or step timings from `gh run view <run-id> --log`.
4. Go: count `(cached)` lines in the warm run log (`gh run view <run-id> --log | grep -c "(cached)"`).

### Output
`ci_cache_config`.

### Quality Gate
- The warm run log contains `Cache restored from key`.
- Durations for both runs are recorded from `gh` output.

---

## Worked Example

Illustrative. `stack=node`, Jest with `ts-jest`, `.github/workflows/test.yml`.

- Phase 1: `--showConfig` shows `"cacheDirectory": "/tmp/jest_rs"`; CI starts cold every run.
- Phase 2: `cacheDirectory: '<rootDir>/.jest-cache'`; `actions/cache@v4` step with the key above.
- Phase 3: run 1 log `Cache not found for input keys: jest-Linux-3f9c...`, test step 4m12s; run 2 log `Cache restored from key: jest-Linux-3f9c...-a1b2c3...`, test step 2m51s.

---

## Exit Criteria

DONE when every listed tool state is cached with a key that changes with its inputs, a warm CI run shows a cache restore, and both run durations are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | CI is not GitHub Actions | **Return**: record the platform; cache the same paths with that platform's cache feature (GitLab `cache:` with `key: files:`). |
| Phase 2 | Cache size grows without bound | **Adjust**: rely on the `github.sha` key per commit and GitHub's eviction; do not cache build outputs outside the listed paths. |
| Phase 3 | Warm run never hits | **Retry**: the key includes a file that changes every run (timestamps, generated files); remove it from `hashFiles`. |
| Phase 3 | Go tests pass from cache but should have rerun | **Adjust**: the test reads an untracked input; add `-count=1` for that package only or make the input a tracked file. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
