# Playwright Node Parallel Workers, Sharding and Report Merge

**One-line description:** Turns on `fullyParallel` so tests (not files) are the unit of distribution, chooses worker count per machine from measured CPU, splits CI across machines with `--shard=i/n` and the `blob` reporter, and merges shard reports into one HTML report with `npx playwright merge-reports`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `pw_node_config` (object, required): From `e2e-node-pw-setup`.
- `shard_count` (integer, optional): Number of CI machines the user is willing to run. When absent, 1 (no sharding).

---

## Outputs

- `node_shard_plan` (object): `{fully_parallel, workers_ci, shard_count, shard_command, reporter_ci, merge_command, isolation_proof, timing_before, timing_after}`.

---

## Phase 1: Make Tests Safe to Run in Parallel

### Entry Criteria
- The data seeding flow passed its double parallel run.

### Actions
1. Set `fullyParallel: true` in `playwright.config.ts`. Without it, tests in one file run in order in one worker and sharding splits by file.
2. Find serial assumptions: `grep -rn "describe.serial\|mode: 'serial'" e2e`. Each hit means tests depend on each other. Keep it only when the user confirms the journey must be one sequence; otherwise make each test create its own state.
3. Run `npx playwright test --workers=1` and `npx playwright test` (default workers = half the logical CPU cores). Both must pass. Record durations.

### Output
Parallel-safe suite.

### Quality Gate
- Both runs in step 3 report 0 failed.
- Every remaining `serial` hit has a user confirmation recorded.

---

## Phase 2: Choose CI Workers

### Entry Criteria
- Suite parallel-safe.

### Actions
1. Measure the CI machine: add a step `nproc` (Linux) and read the output. GitHub-hosted runner sizes are listed in GitHub docs; do not assume.
2. The template sets `workers: process.env.CI ? 1 : undefined`. Raise it only after measuring: run the suite in CI with `--workers=<nproc/2>` and with `--workers=1`, compare durations and failure counts. Keep the faster value that has 0 failures. A percentage string is also allowed: `workers: '50%'`.
3. If failures appear only at higher worker counts, that is a data or resource collision: return to the data seeding flow; do not lower workers to hide it without recording why.

### Output
`workers_ci`.

### Quality Gate
- Two CI runs at the chosen worker count both pass; their durations are recorded.

---

## Phase 3: Shard Across Machines and Merge Reports

### Entry Criteria
- `shard_count` > 1. Otherwise record `shard_count: 1` and finish.

### Actions
1. Reporter in CI: `reporter: process.env.CI ? 'blob' : 'html'`. Each shard writes `blob-report/`.
2. Shard command: `npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}` with matrix `shardIndex: [1..shard_count]`, `shardTotal: [shard_count]`. Indexes start at 1.
3. Upload each shard's `blob-report` with a unique name, then in a `merge` job:
```yaml
- uses: actions/download-artifact@v4
  with:
    path: all-blob-reports
    pattern: blob-report-*
    merge-multiple: true
- run: npx playwright merge-reports --reporter html ./all-blob-reports
```
4. List what each shard gets before trusting it: `npx playwright test --list --shard=1/<n> | tail -1` for each index; totals must add up to `npx playwright test --list | tail -1`.
5. The merge job needs the repo checked out and dependencies installed (`npm ci`), because merge-reports reads source for the report.

### Output
`node_shard_plan`.

### Quality Gate
- Sum of per-shard `--list` totals equals the full `--list` total.
- The merged HTML report shows the full test count.

---

## Worked Example

Illustrative only. `shard_count=3`, 42 tests.
```
$ npx playwright test --list | tail -1
Total: 42 tests in 9 files
$ for i in 1 2 3; do npx playwright test --list --shard=$i/3 | tail -1; done
Total: 14 tests in 4 files
Total: 14 tests in 3 files
Total: 14 tests in 3 files
$ npx playwright merge-reports --reporter html ./all-blob-reports
```
Merged report: 42 passed. CI wall time 9m10s before, 3m40s after (measured on runs 5120 and 5134).

---

## Exit Criteria

DONE when the suite passes with 1 and many workers, CI workers come from a measurement, shard lists add up to the full suite, and merged reports show every test.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Passes with `--workers=1` only | **Stop**: shared state between tests; fix data isolation before sharding. |
| Phase 3 | One shard much longer than others | **Adjust**: confirm `fullyParallel: true`; split the slowest file's tests so they distribute. |
| Phase 3 | `merge-reports` finds no blobs | **Adjust**: check `pattern` matches the uploaded names and `merge-multiple: true` is set. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
