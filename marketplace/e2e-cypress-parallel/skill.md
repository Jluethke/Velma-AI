# Cypress Parallel Runs Across CI Machines

**One-line description:** Splits a Cypress suite across CI machines, choosing between Cypress Cloud load balancing (`cypress run --record --parallel`) and the free `cypress-split` plugin with a decision table, wires either into a GitHub Actions matrix, and proves every spec ran exactly once.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `cypress_config` (object, required): From `e2e-cypress-setup`.
- `shard_count` (integer, optional): Number of CI machines. When absent, 1.

---

## Outputs

- `cypress_shard_plan` (object): `{method: "cloud"|"cypress-split"|"none", shard_count, run_command, spec_assignment_proof, timing_before, timing_after}`.

---

## Phase 1: Choose the Method

### Entry Criteria
- `shard_count` > 1, otherwise record `method: "none"` and finish.
- The data seeding flow passed its double run.

### Actions
1. Cypress runs specs one after another inside a single machine; there is no in-process worker option. Parallelism means more machines.
2. Decide:

| Condition | Method |
|---|---|
| Team has a Cypress Cloud project and record key | `cloud`: Cloud assigns specs to machines from past durations |
| No Cloud account, or specs cannot be uploaded to a third party | `cypress-split` (npm package by Gleb Bahmutov) |

3. Read the specs: `ls cypress/e2e/**/*.cy.* | wc -l`. If the number of specs is smaller than `shard_count`, some machines idle; reduce `shard_count` to the spec count or split large specs.

### Output
Method choice.

### Quality Gate
- `method` cites its row; spec count is recorded.

---

## Phase 2: Wire It into CI

### Entry Criteria
- Method chosen.

### Actions
1. `cloud` (GitHub Actions):
```yaml
strategy:
  fail-fast: false
  matrix:
    containers: [1, 2, 3]
steps:
  - uses: actions/checkout@v4
  - uses: cypress-io/github-action@v6
    with:
      start: npm run dev
      wait-on: 'http://localhost:3000'
      record: true
      parallel: true
    env:
      CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```
   The action sets `--ci-build-id` from the GitHub run so all matrix jobs join one Cloud run. `projectId` must be in `cypress.config.ts`.
2. `cypress-split`: `npm i -D cypress-split`, then in `setupNodeEvents`:
```ts
import cypressSplit from 'cypress-split';
setupNodeEvents(on, config) {
  cypressSplit(on, config);
  return config;
},
```
   In the matrix job pass the split through env, as documented in the cypress-split README (for example `SPLIT: ${{ strategy.job-total }}` and `SPLIT_INDEX: ${{ strategy.job-index }}`). Confirm the variable names in the README of the installed version before using them.
3. `fail-fast: false` keeps other machines running when one fails, so all failures are reported.
4. Each machine uploads its own `cypress/screenshots` and `cypress/videos` with the index in the artifact name.

### Output
CI configuration.

### Quality Gate
- `actionlint` (if installed) or the GitHub workflow editor shows no syntax errors.
- The workflow file passes `CYPRESS_RECORD_KEY` only from `secrets`, never as a literal.

---

## Phase 3: Prove Every Spec Ran Once

### Entry Criteria
- A CI run completed.

### Actions
1. For `cypress-split`: each job's log prints the specs it was assigned. Collect them: download logs (`gh run view <id> --log > run.log`) and `grep -oE "cypress/e2e/[^ ]+\.cy\.(ts|js)" run.log | sort | uniq -c`. Every spec must appear with the same count, and the set must equal `ls cypress/e2e/**/*.cy.*`.
2. For `cloud`: the Cloud run page lists specs per machine; confirm the total equals the local spec count.
3. Record wall time before and after.

### Output
`cypress_shard_plan`.

### Quality Gate
- Spec set in CI equals the local spec set; no spec missing, none run on two machines in the same run (unless the log format repeats names; then count per job).
- Before and after wall times recorded from real runs.

---

## Worked Example

Illustrative only. 11 specs, `shard_count=3`, no Cloud account.
```
$ npm i -D cypress-split
$ gh run view 77812 --log > run.log
$ grep -oE "cypress/e2e/[^ ]+\.cy\.ts" run.log | sort -u | wc -l
11
$ ls cypress/e2e/*.cy.ts | wc -l
11
```
Wall time 7m40s to 3m05s (runs 77790 and 77812).

---

## Exit Criteria

DONE when the split method is chosen by rule, CI runs it across `shard_count` machines with `fail-fast: false`, and logs prove every spec ran exactly once.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Cloud run shows separate runs per machine | **Adjust**: all jobs need the same `--ci-build-id`; use the official action or pass it explicitly. |
| Phase 2 | `cypress-split` runs all specs on every machine | **Adjust**: the env vars are not reaching Cypress; print them in the job and check names against the README. |
| Phase 3 | Spec missing from CI | **Stop**: check `specPattern` and the split; do not report success. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
