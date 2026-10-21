# Jest and Vitest Per-Test Durations Report

**One-line description:** Produces a ranked per-file and per-test timing table for a Jest or Vitest suite from the runner's JSON reporter (`perfStats.runtime`, `assertionResults[].duration`) and Vitest's phase summary, so slow files and slow tests are named with milliseconds.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root containing `package.json`.
- `test_command` (string, required): The test command used in the baseline (for example `npx jest` or `npx vitest run`).
- `baseline_report` (object, required): From `tsp-baseline-lock`; confirms a green run at this commit.

---

## Outputs

- `node_duration_report` (object): Runner name and version, ranked file rows (path, runtime ms, test count), ranked test rows (file, full name, duration ms), Jest `perfStats.slow` flags or Vitest phase totals, and the raw JSON file path.

---

## Phase 1: Identify the Runner

### Entry Criteria
- `package.json` exists at `repo_path`.

### Actions
1. Read `package.json` `scripts.test` and `devDependencies`. Use this table:

| Found | Runner |
|---|---|
| `jest` in devDependencies or `jest` in the test script | Jest |
| `vitest` in devDependencies or `vitest` in the test script | Vitest |
| both | The one named in `test_command` |
| `mocha`, `ava`, `node --test` only | Not covered by this flow; see Error Handling |

2. Print the version: `npx jest --version` or `npx vitest --version`.
3. Print the effective config so you know the environment and transformer: Jest `npx jest --showConfig > jest-config.json`; Vitest has no equivalent flag, so read `vitest.config.*` or the `test` block of `vite.config.*`.

### Output
Runner name, version, and config location.

### Quality Gate
- The runner name and version are copied from command output.
- For Jest, `jest-config.json` exists and its `testEnvironment` value is recorded.

---

## Phase 2: Capture the JSON Report

### Entry Criteria
- Runner identified.

### Actions
1. Jest: `npx jest --json --outputFile=jest-durations.json --testLocationInResults`. Keep the same arguments that `test_command` passes (projects, config path).
2. Vitest: `npx vitest run --reporter=json --outputFile=vitest-durations.json --reporter=default`. The default reporter prints the phase summary line at the end: `Duration  41.20s (transform 6.10s, setup 1.20s, collect 18.40s, tests 12.30s, environment 3.90s, prepare 2.10s)`. Save that line.
3. Do NOT pass `--onlyChanged`, `--changedSince`, `--bail` or a file filter. A partial run hides slow files.
4. Do NOT pass `--runInBand` unless the baseline command uses it; worker count changes per-file runtimes.

### Output
Raw JSON report and, for Vitest, the phase summary line.

### Quality Gate
- The JSON file exists and `numTotalTests` equals the count in `baseline_report`.
- `success` is `true` in the JSON.

---

## Phase 3: Rank Files and Tests

### Entry Criteria
- Raw JSON exists.

### Actions
1. Rank files. Jest stores per-file timing in `testResults[].perfStats.runtime` (ms):
   `jq -r '.testResults[] | [.perfStats.runtime, .name, (.assertionResults|length)] | @tsv' jest-durations.json | sort -rn > files-ranked.tsv`
   Vitest JSON has `testResults[].startTime` and `endTime`; use `(.endTime - .startTime)` in place of `perfStats.runtime`.
2. Rank tests: `jq -r '.testResults[] as $f | $f.assertionResults[] | [(.duration // 0), $f.name, .fullName] | @tsv' <json> | sort -rn > tests-ranked.tsv`.
3. Compute file overhead: for each file, file runtime minus the sum of its test durations. A large remainder means module import, transform, `beforeAll`, or test environment setup (jsdom), not test bodies. Record it per file.
4. Jest only: list files with `perfStats.slow == true`. Jest sets this when runtime exceeds `slowTestThreshold`, whose documented default is 5 seconds; record the threshold from `jest-config.json` (`slowTestThreshold`) next to the list.
5. Tag each file with one signal by grepping it:

| Grep hit | Signal |
|---|---|
| `setTimeout(`, `await sleep(`, `waitForTimeout(`, `new Promise(r => setTimeout` | `sleep` |
| `fetch(`, `axios`, `got(`, `http.request` without `msw` or `nock` in the file or setup files | `network` |
| `pg`, `knex`, `prisma`, `typeorm`, `mongoose` connection or migration in `beforeAll`/`beforeEach` | `database` |
| File overhead larger than the sum of its test durations | `file_setup` |
| `@testing-library/react` with `testEnvironment` `jsdom` | `dom_environment` |
| none | `cpu_in_test` |

### Output
`node_duration_report`.

### Quality Gate
- `files-ranked.tsv` has one row per entry in `testResults`.
- Every file row has one signal and the grep line that justified it.
- `git status --porcelain` shows no edited source or test files.

---

## Worked Example

Illustrative. `test_command=npx jest`, Jest 29.7.0, 1,204 tests in 188 files.

- Phase 1: `jest-config.json` shows `"testEnvironment": "jsdom"` and transform `ts-jest`.
- Phase 2: `npx jest --json --outputFile=jest-durations.json --testLocationInResults` ends with `Tests: 1204 passed, 1204 total`.
- Phase 3: top of `files-ranked.tsv`:
  `14210  src/checkout/Checkout.test.tsx  9`
  `9877   src/api/client.test.ts  31`
  Sum of test durations in `Checkout.test.tsx` is 2,140 ms, so file overhead is 12,070 ms, signal `file_setup` (imports the whole app shell). `client.test.ts` has `await new Promise(r => setTimeout(r, 300))` on line 58, signal `sleep`.

---

## Exit Criteria

DONE when `node_duration_report` holds ranked files and tests from the saved JSON, per-file overhead, and one signal per file.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Runner is Mocha, AVA or `node --test` | **Return**: report the runner; this flow covers Jest and Vitest only. Mocha's `--reporter json` gives per-test `duration` and can be ranked the same way. |
| Phase 2 | `assertionResults[].duration` is `null` for many tests | **Adjust**: rank by file runtime only and record that per-test durations were not reported. |
| Phase 2 | JSON `numTotalTests` differs from baseline | **Retry**: use exactly the baseline arguments, including `--config` and `--selectProjects`. |
| Phase 3 | `jq` not installed | **Adjust**: install it (`apt install jq`, `brew install jq`, `winget install jqlang.jq`); do not hand-copy values from the JSON. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
