# GitHub Actions Test Sharding Across Parallel Jobs

**One-line description:** Splits a slow test suite across N parallel GitHub Actions jobs using the runner's native shard flag (pytest-split, Jest `--shard`, Vitest `--shard`, Playwright `--shard`, Go package lists), then proves every test ran exactly once by comparing JUnit case counts.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `gha_workflow_path` (string, required): Workflow file from `ci0-gha-workflow-baseline`.
- `stack_profile` (object, required): From `ci0-detect-stack` (test runner).
- `shard_count` (integer, required): Number of parallel shards, chosen by the user. Not derived here.

---

## Outputs

- `gha_shard_diff` (object): `{diff, shard_tool, baseline_case_count, sharded_case_counts[], max_shard_seconds, run_id}`.

---

## Phase 1: Baseline Count and Tool Choice

### Entry Criteria
- `shard_count` is an integer of 2 or more.
- The unsharded test job has a recent green run with a JUnit report.

### Actions
1. Get the baseline case count from the unsharded report: `grep -c '<testcase' reports/junit.xml` (download it with `gh run download <run_id> -n <artifact>` if needed).
2. Pick the shard method:

| Runner | Shard command for shard i of N | Balancing |
|---|---|---|
| pytest | `pytest --splits N --group i --junitxml=reports/junit-i.xml` (plugin `pytest-split`) | By durations from `.test_durations`, created with `pytest --store-durations` and committed |
| Jest (28 or later) | `jest --ci --shard=i/N` | By test file, deterministic |
| Vitest | `vitest run --shard=i/N` | By test file |
| Playwright | `playwright test --shard=i/N` | By test file, or test when `fullyParallel: true` |
| Go | `go test $(go list ./... | awk -v n=N -v i=i 'NR % n == i % n')` | By package, round-robin |
| Maven or Gradle | No built-in shard flag; split by module (`-pl <modules>`) or report as open question | By module |

3. `i` is 1-based for pytest-split, Jest, Vitest and Playwright. Confirm with each tool's `--help` before writing.
4. pytest-split is a plugin: if `grep -i pytest-split <lockfile>` prints nothing, report "dependency needed" and stop; do not add it to the lockfile yourself.
5. Do not shard with `pytest-xdist` inside one job and call it sharding. xdist parallelizes in-process on one runner; this flow splits across runners.

### Output
Baseline count and the shard command.

### Quality Gate
- `baseline_case_count` is a number read from a real JUnit file.
- The shard flag was confirmed by the tool's `--help` output, quoted in the notes.

---

## Phase 2: Edit the Workflow

### Entry Criteria
- Shard command chosen.

### Actions
1. Add a shard index to the test job matrix (combine with any existing matrix):
```yaml
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
```
   The list must contain exactly the integers 1 to `shard_count`.
2. Change only the test `run:` line to the shard command with `${{ matrix.shard }}` for `i` and the literal `shard_count` for `N`. Write one JUnit file per shard (`reports/junit-${{ matrix.shard }}.xml`).
3. Make the artifact name unique: `name: junit-shard-${{ matrix.shard }}`.
4. Add a summary job so branch protection can require one stable name instead of N shard names:
```yaml
  tests-passed:
    if: always()
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - run: test "${{ needs.test.result }}" = "success"
```
   `if: always()` is required: without it the job is skipped when a shard fails, and a skipped required check counts as passing.
5. Run `actionlint <gha_workflow_path>`.

### Output
Edited workflow.

### Quality Gate
- The matrix `shard` list equals `[1 .. shard_count]`.
- `actionlint` prints nothing.
- The summary job has `if: always()`.

---

## Phase 3: Prove Completeness

### Entry Criteria
- Sharded run finished.

### Actions
1. Download all shard reports: `gh run download <run_id> --pattern 'junit-shard-*' --dir shards`.
2. Count cases per shard: `for f in shards/*/*.xml; do echo "$f $(grep -c '<testcase' "$f")"; done`.
3. Sum the counts and compare to `baseline_case_count`. They must be equal. A smaller sum means tests were dropped; a larger sum means tests ran twice.
4. Check no test name appears in two shards: `grep -ho 'classname="[^"]*" name="[^"]*"' shards/*/*.xml | sort | uniq -d` must print nothing.
5. Record each shard's job duration from `gh run view <run_id> --json jobs --jq '.jobs[] | [.name,.startedAt,.completedAt] | @tsv'`; `max_shard_seconds` is the slowest shard.
6. Do not claim a speedup without comparing `max_shard_seconds` to the baseline test job duration from the same branch.

### Output
`gha_shard_diff`.

### Quality Gate
- Sum of shard case counts equals `baseline_case_count`.
- The duplicate check prints nothing.

---

## Worked Example

Illustrative only. pytest suite, `shard_count=4`, baseline 1,840 cases in 19 min.

Phase 1: `pytest --help | grep -A1 -- --splits` shows the option; `.test_durations` created with `uv run pytest --store-durations` and committed by the user.
Phase 3:
```
shards/junit-shard-1/junit-1.xml 471
shards/junit-shard-2/junit-2.xml 455
shards/junit-shard-3/junit-3.xml 462
shards/junit-shard-4/junit-4.xml 452
```
Sum 1,840 equals baseline; duplicate check prints nothing. Shard durations 5m40s, 5m12s, 5m31s, 5m05s; `max_shard_seconds=340` versus 1,140 baseline, both measured.

---

## Exit Criteria

DONE when the sharded run passes, the summed case count equals the baseline, no case runs twice, and the summary job gives one stable check name.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Runner has no shard support | **Return**: report the open question (module split or a third-party splitter); do not write a custom splitter. |
| Phase 1 | `.test_durations` missing for pytest-split | **Adjust**: run `pytest --store-durations` once; the user commits the file. |
| Phase 3 | Case sum lower than baseline | **Stop**: tests were dropped; check `i` indexing (0 versus 1) and fix. |
| Phase 3 | One shard far slower than others | **Adjust**: for pytest-split refresh `.test_durations`; for file-based shards report the heaviest file. |
| Phase 3 | Tests fail only when sharded | **Return**: report as an order-dependent test; do not reorder or delete tests. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
