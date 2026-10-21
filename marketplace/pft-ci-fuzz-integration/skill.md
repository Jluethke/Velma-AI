# CI for Property Tests and Fuzzing

**One-line description:** Adds three CI jobs: a per-change job that runs property tests under a fixed profile and replays every committed fuzz regression input, a short time-boxed fuzz job on pull requests (ClusterFuzzLite or a direct fuzzer call), and a scheduled longer fuzz job whose corpus persists between runs, each with a gate that is a command exit code.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `regression_tests` (object[], required): Committed regression tests and inputs from `pft-crash-regression-test`.
- `fuzz_targets` (object[], required): Targets to fuzz in CI.
- `hypothesis_config` (object, optional): Profile names when `stack` is `python`.
- `stack` (string, required): Selects commands.
- `repo_path` (string, required): Project root.
- `ci_platform` (string, required): `github-actions`, `gitlab-ci` or another named system.

---

## Outputs

- `ci_config` (object[]): One row per job: file path, trigger, commands, time budget and its source, artifact upload paths, and the run URL or log excerpt that proves it executed.

---

## Phase 1: Per-Change Replay Job

### Entry Criteria
- Regression tests pass locally with the full suite.

### Actions
1. Add a job that runs on every push and pull request with these commands:

| `stack` | Commands |
|---|---|
| python | `HYPOTHESIS_PROFILE=ci python -m pytest tests -q` (the `ci` profile from `hypothesis_config`) |
| node | `npx vitest run` or `npx jest`; set run counts through `fc.configureGlobal` in a setup file if the team chose a CI value |
| rust | `cargo test` (replays `proptest-regressions`); set `PROPTEST_CASES` only to a team-chosen value |
| go | `go test ./...` (replays `testdata/fuzz/*` and plain rapid tests) |
| haskell | `cabal test` |
| jvm | `mvn test` or `./gradlew test` (replays Jazzer `Inputs` and jqwik properties) |
| cpp | `cmake --build build-fuzz && ctest --test-dir build-fuzz -R fuzz_regressions --output-on-failure` |

2. Upload property failure output (`.hypothesis/` examples, `proptest-regressions/`, `testdata/rapid/`) as job artifacts on failure so the seed is not lost.
3. Do not add `continue-on-error: true` (GitHub Actions) or `allow_failure: true` (GitLab) to this job.

### Output
Replay job definition.

### Quality Gate
- The job ran on a test branch and its log shows the regression test names passing.
- `grep -nE "continue-on-error: true|allow_failure: true" <ci file>` prints nothing for this job.

---

## Phase 2: Pull Request Fuzz Job

### Entry Criteria
- Replay job is green.

### Actions
1. Choose the runner:

| Condition | Use |
|---|---|
| `ci_platform` is `github-actions` or `gitlab-ci` and the stack is supported by ClusterFuzzLite (C, C++, Rust, Go, Python, JVM) | ClusterFuzzLite: add `.clusterfuzzlite/Dockerfile`, `.clusterfuzzlite/build.sh`, `.clusterfuzzlite/project.yaml` and the workflow using `google/clusterfuzzlite/actions/build_fuzzers` and `google/clusterfuzzlite/actions/run_fuzzers` with `mode: code-change`; take input names from the ClusterFuzzLite docs |
| Go without ClusterFuzzLite | one step per target: `go test -run='^$' -fuzz='^<FuzzName>$' -fuzztime=<budget> ./<pkg>` |
| Rust without ClusterFuzzLite | `cargo +nightly fuzz run <target> -- -max_total_time=<budget>` per target |
| Other | the target's direct fuzz command with `-max_total_time=<budget>` |

2. The budget per target is a team input; record its source. Do not choose one.
3. On failure, upload the crash files (`fuzz/artifacts/`, `testdata/fuzz/`, `crash-*`) as artifacts.
4. Mark this job required only if the team agrees; new random findings can fail an unrelated PR.

### Output
PR fuzz job definition.

### Quality Gate
- One PR run log shows the fuzzer started (`INITED` or `now fuzzing with`) and ran for the configured budget.
- The artifact upload step exists and points at the stack's crash directory.

---

## Phase 3: Scheduled Fuzz Job With Persistent Corpus

### Entry Criteria
- PR fuzz job works.

### Actions
1. Add a scheduled trigger (GitHub Actions `on: schedule: - cron: '<team value>'`, GitLab pipeline schedule). For ClusterFuzzLite use `mode: batch` here and a separate `mode: prune` job per its docs, with a storage repo or bucket for the corpus.
2. Without ClusterFuzzLite, persist the corpus with the CI cache (`actions/cache` keyed by target name) or an artifact store, restore it before fuzzing, and save it after.
3. Make the scheduled job open an issue or notify on failure using the platform's standard mechanism; check the platform docs for the exact action or API.
4. Trigger the schedule once manually (`workflow_dispatch` on GitHub Actions or "Run pipeline" on GitLab) and read the log.

### Output
`ci_config`.

### Quality Gate
- The manual run log shows the corpus was restored (non-zero file count in the `INITED corp:` field or a cache-hit line) and saved at the end.
- Each job row in `ci_config` links a real run log.

---

## Worked Example

Illustrative. `stack` = `go`, `ci_platform` = `github-actions`, team budget 5 minutes per target on PRs.

```yaml
# .github/workflows/fuzz.yml
on:
  pull_request:
  schedule:
    - cron: "17 3 * * *"        # team value
  workflow_dispatch:
jobs:
  replay:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version-file: go.mod }
      - run: go test ./...
  fuzz-pr:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version-file: go.mod }
      - run: go test -run='^$' -fuzz='^FuzzParseHeader$' -fuzztime=5m ./internal/hdr
      - if: failure()
        uses: actions/upload-artifact@v4
        with: { name: fuzz-crash, path: internal/hdr/testdata/fuzz }
```

Run log excerpt: `fuzz: elapsed: 0s, gathering baseline coverage: 10/10 completed, now fuzzing with 4 workers` ... `PASS`.

---

## Exit Criteria

DONE when the replay job runs on every change with no failure allowance, the PR fuzz job and the scheduled job with persistent corpus each have a real run log, and crash files upload on failure.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Replay job fails in CI but passes locally | **Adjust**: compare tool versions and the active Hypothesis profile or `PROPTEST_CASES`; pin versions in the lockfile. |
| Phase 2 | Team has not set a budget | **Return**: ask for the per-target budget; leave the job out until answered. |
| Phase 2 | ClusterFuzzLite build fails | **Adjust**: run its build locally with the Docker image per its docs, fix `build.sh`, retry. |
| Phase 3 | Corpus not restored | **Retry**: check the cache key and path match between restore and save. |
| Phase 3 | Scheduled job finds a crash | **Return**: send the uploaded crash file into `pft-crash-triage-dedup`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
