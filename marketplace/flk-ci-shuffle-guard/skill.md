# CI Shuffle And Repeat Guard

**One-line description:** Adds two CI guards so new flakes fail the pull request that introduces them: test order is always shuffled with the seed printed for replay (pytest-randomly, `jest --randomize --showSeed`, `go test -shuffle=on`), and test files changed in the pull request are rerun at the derived count.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `verification_verdict` (string, required): Must be `PASS`; guards go in after the known flake is fixed so they start green.
- `baseline_command` (string, required): Shows the flags and selection style this repo uses.
- `repeat_count` (integer, required): N used by the changed-test repeat job.
- `stack` (string, required): `python`, `node` or `go`.
- `repo_path` (string, required): Repository root.
- `ci_platform` (string, required): `github` or `gitlab`.

---

## Outputs

- `ci_guard_config` (object): `{shuffle_change, repeat_job, files_changed[], first_ci_run_url, replay_instructions}`.

---

## Phase 1: Shuffle Every Run

### Entry Criteria
- `verification_verdict` is `PASS`.

### Actions
1. Add shuffling to the existing blocking test command, changing nothing else:

| Stack | Change | Seed appears as | Replay |
|---|---|---|---|
| python | Add `pytest-randomly` to the dev dependencies (it is on by default once installed) | `Using --randomly-seed=<n>` in the header | `pytest -p randomly --randomly-seed=<n>` |
| node (Jest 29.2+) | Add `--randomize --showSeed` to the test script | `Seed: <n>` in the output | `jest --randomize --seed=<n>` |
| go (1.17+) | Add `-shuffle=on` to `go test` | `-test.shuffle <n>` line per package | `go test -shuffle=<n> ./pkg` |

2. Write the replay line into the CI file as a comment next to the command and into `replay_instructions`.
3. Run the full suite locally with three different seeds before pushing; any failure is an existing order dependence that must be fixed (run this chain on it) before the guard merges. Do not merge a guard that is red.

### Output
Shuffle change.

### Quality Gate
- Three local full-suite runs pass; their seeds are recorded.

---

## Phase 2: Repeat Changed Tests

### Entry Criteria
- Shuffle change ready.

### Actions
1. Add a job that runs only on pull requests and reruns the test files the pull request changed, `repeat_count` times:
   - GitHub Actions: `on: pull_request`; check out with `fetch-depth: 0`; list files with `git diff --name-only --diff-filter=AM origin/${{ github.base_ref }}...HEAD`.
   - GitLab CI: `rules: - if: $CI_PIPELINE_SOURCE == "merge_request_event"`; list with `git diff --name-only --diff-filter=AM origin/$CI_MERGE_REQUEST_TARGET_BRANCH_NAME...HEAD` after `git fetch origin $CI_MERGE_REQUEST_TARGET_BRANCH_NAME`.
2. Filter to test files and run them by stack:
   - python: files matching `test_*.py` or `*_test.py`: `python -m pytest $FILES --count=<repeat_count> -p no:rerunfailures -q` (pytest-repeat in dev deps).
   - node: files matching `*.test.*` or `*.spec.*`: a shell loop of `<repeat_count>` iterations over `npx jest $FILES --ci --randomize`.
   - go: map changed `_test.go` files to their package directories (`dirname`, deduplicated) and run `go test $PKGS -count=<repeat_count> -shuffle=on -race`.
3. If no test files changed, the job exits 0 with a message saying so.
4. This job is blocking: it uses neither `continue-on-error` nor `allow_failure`. Its purpose is to stop new flaky tests.
5. Validate the CI file: `actionlint` for GitHub if installed; `glab ci lint` for GitLab.

### Output
Repeat job.

### Quality Gate
- CI lint exits 0.

---

## Phase 3: Prove The Guards Run

### Entry Criteria
- Changes committed on a branch.

### Actions
1. Open a pull request that also touches one test file (for example the fixed test), so the repeat job has work.
2. Read the CI logs: the blocking job shows the seed line; the repeat job shows the expected number of runs for the changed file (pytest summary count equals tests in file times `repeat_count`; Go `-json` or `-v` shows `repeat_count` runs).
3. Record `first_ci_run_url` and the `files_changed`.
4. Do NOT add retries to either job.

### Output
`ci_guard_config`.

### Quality Gate
- `first_ci_run_url` shows both jobs green, with the seed line and the run count visible in the logs.

---

## Worked Example

Illustrative. Go repo on GitHub Actions, `repeat_count` = 299.

- Phase 1: `go test ./... -race -count=1` becomes `go test ./... -race -count=1 -shuffle=on  # replay: go test -shuffle=<seed> ./<pkg>`. Three local runs with printed seeds pass.
- Phase 2: job `changed-tests-repeat` on `pull_request`; `PKGS=$(git diff --name-only --diff-filter=AM origin/${{ github.base_ref }}...HEAD | grep '_test\.go$' | xargs -r -n1 dirname | sort -u | sed 's|^|./|')`; `go test $PKGS -count=299 -shuffle=on -race`. `actionlint` prints nothing.
- Phase 3: PR run shows `-test.shuffle 1718123456789` in the main job and `ok  example.com/shop/internal/billing 41.3s` in the repeat job.

---

## Exit Criteria

DONE when the blocking job shuffles with a printed seed and replay note, a blocking pull-request job repeats changed tests at `repeat_count`, and a CI run proves both are active and green.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Shuffled suite fails locally | **Stop**: an existing order dependence; run this chain on that test before adding the guard. |
| Phase 2 | Repeat job too slow at `repeat_count` | **Adjust**: shard the changed files across matrix jobs; keep the count. |
| Phase 2 | Shallow clone, `git diff` cannot find the base | **Adjust**: `fetch-depth: 0` (GitHub) or fetch the target branch (GitLab). |
| Phase 3 | Repeat job ran zero tests although tests changed | **Adjust**: fix the file filter; print `$FILES` in the job. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
