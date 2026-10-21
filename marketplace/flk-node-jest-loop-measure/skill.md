# Jest Flake Rate Measurement

**One-line description:** Measures one Jest test's failure rate at the derived run count with a shell loop over `jest --runInBand --ci`, because Jest has no built-in repeat flag, counting per-run outcomes from `--json` output rather than exit codes alone.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flake_evidence` (object, required): From `flk-flake-evidence-intake`; supplies the test file, test name and CI command.
- `repeat_count` (integer, required): N from `flk-run-count-derive`.
- `repo_path` (string, required): Repository root containing `package.json`.

---

## Outputs

- `node_flake_rate_report` (object): `{single_file_inband: {command, passed, failed}, single_file_workers: {command, passed, failed}, ci_selection: {command, passed, failed}, retry_config_found, jest_version, failure_signatures_seen[]}`.

---

## Phase 1: Prepare The Harness

### Entry Criteria
- `flake_evidence.stack` is `node` and the repo runs tests with Jest.
- Dependencies installed with the lock file: `npm ci` (or `pnpm install --frozen-lockfile`, `yarn install --immutable`).

### Actions
1. Record the version: `npx jest --version`. Flags differ across major versions; check `npx jest --help` for any flag below before using it.
2. Search for retries that would hide failures: `grep -rn "retryTimes" --include=*.ts --include=*.js --include=*.cjs --include=*.mjs . --exclude-dir=node_modules`. `jest.retryTimes(n)` exists in the jest-circus runner. If found, set `retry_config_found` and measure with it disabled by passing an environment switch the setup file already reads, or by temporarily commenting the line in a local, uncommitted change. Never commit that change.
3. If the repo uses Vitest instead (`vitest` in `package.json` scripts), stop this flow: Vitest has its own `--sequence.shuffle` and per-test `repeats` option; check `npx vitest --help` and the Vitest docs, and do not apply Jest flags to it.
4. Find the exact name filter: Jest `-t` / `--testNamePattern` is a regular expression matched against the full name, which is the `describe` titles and the test title joined by spaces. Escape regex characters: `-t "Cart applies coupon once$"`.

### Output
Jest version, retry status, name pattern.

### Quality Gate
- `npx jest <file> -t "<pattern>" --listTests` lists the file, and a single run reports `Tests: 1 passed` or `1 failed` with the others skipped.

---

## Phase 2: Loop Runs

### Entry Criteria
- Harness ready.

### Actions
1. bash, one file, one test, in band:
   `pass=0; fail=0; for i in $(seq 1 <repeat_count>); do npx jest <file> -t "<pattern>" --runInBand --ci --json --outputFile="flk-$i.json" > /dev/null 2>&1; n=$(node -e "console.log(require('./flk-$i.json').numFailedTests)"); if [ "$n" = "0" ]; then pass=$((pass+1)); else fail=$((fail+1)); fi; done; echo "pass=$pass fail=$fail"`
   PowerShell: the same with `1..<repeat_count> | % { npx jest <file> -t "<pattern>" --runInBand --ci --json --outputFile="flk-$_.json" *> $null; ... }`.
2. Why `--json`: a non-zero exit code also happens for coverage thresholds, open-handle warnings in some setups, or a failing `globalSetup`. `numFailedTests` counts only failed tests. If `numRuntimeErrorTestSuites` is greater than 0, that run is a suite crash; record it as a failure with signature "suite failed to run".
3. Why `--ci`: it disables writing new snapshots, so a missing snapshot fails instead of being silently written.
4. Run the loop a second time without `--runInBand` and without `-t` on the whole file. Workers do not change one file's internal order, but the file then runs all its tests, which exposes in-file state sharing.
5. Run the loop a third time with the CI selection and flags from `flake_evidence` (for example `npx jest --ci --maxWorkers=2`), counting only `test_id` from `testResults[].assertionResults[]` where `fullName` matches and `status` is `failed`.
6. Collect `failureMessages` from failed runs into `failure_signatures_seen`.
7. Delete the `flk-*.json` files after recording; never commit them.

### Output
Counts for three modes.

### Quality Gate
- pass + fail == `repeat_count` for each mode.
- Each failure signature is copied from a `failureMessages` entry, not paraphrased.

---

## Phase 3: Read The Pattern

### Entry Criteria
- Three modes measured.

### Actions
1. Apply:

| Single test in band | Whole file | CI selection | Reading |
|---|---|---|---|
| > 0 | > 0 | > 0 | Intrinsic: async timing, timers, randomness, network or clock. |
| 0 | > 0 | any | Another test in the same file leaves state (mocks, module state, DOM). |
| 0 | 0 | > 0 | Cross-file shared resource (database, port, files, env) or worker load. |
| 0 | 0 | 0 | Not reproduced; rerun in the CI Node version (`node --version`) and container. |

2. Write the command with the highest nonzero rate as the baseline.

### Output
`node_flake_rate_report`.

### Quality Gate
- The reading cites the row of the table and the three counts.

---

## Worked Example

Illustrative. File `src/cart/cart.test.ts`, name `Cart applies coupon once`, `repeat_count` = 149, Jest 29.7.0.

- Phase 1: no `retryTimes` found. `-t "Cart applies coupon once$"`.
- Phase 2: single in band `pass=149 fail=0`; whole file `pass=141 fail=8`; failures show `expect(received).toBe(expected) Expected: 90 Received: 81`.
- Phase 3: row 2, in-file state sharing. Baseline = whole file loop.

---

## Exit Criteria

DONE when `node_flake_rate_report` has three mode counts summing to `repeat_count` each and a table reading.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Repo uses Vitest or Mocha | **Stop**: this flow is Jest-only; use the runner's own docs. |
| Phase 2 | `--outputFile` not written | **Adjust**: the run crashed before reporting; record as failure and save stderr. |
| Phase 2 | `numTotalTests` is 0 | **Adjust**: the `-t` pattern matched nothing; fix the regex. |
| Phase 3 | All zero | **Return**: to `flk-flake-evidence-intake` to rerun in the CI image. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
