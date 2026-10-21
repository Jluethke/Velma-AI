# Flaky Test Quarantine Release

**One-line description:** Returns a quarantined test to the blocking CI job only after `flk-verify-same-count` reports PASS, by removing its quarantine marker and blocking-job exclusion in one change, confirming the blocking job now executes it, and closing the tracking issue with the verification numbers.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `quarantine_record` (object, required): From `flk-quarantine-apply`; mechanism, issue URL, blocking and quarantine job changes.
- `verification_verdict` (string, required): Must be `PASS`.
- `post_fix_rate_report` (object, required): Counts and probabilities from verification.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `release_diff` (string): Unified diff that removes the quarantine for this one test, plus the closed issue URL.

---

## Phase 1: Gate On The Verdict

### Entry Criteria
- `quarantine_record.status` is `quarantined`.

### Actions
1. Apply:

| `verification_verdict` | Quarantine job history since the fix merged | Action |
|---|---|---|
| `PASS` | no failures of this test | Continue |
| `PASS` | a failure of this test | **Stop**: the fix is incomplete; reopen classification with that run's log |
| `FAIL` | any | **Stop**: keep quarantined |

2. Read the quarantine job history for the test: with GitHub, `gh run list --workflow <file> --json databaseId,headSha,conclusion` then the job's JUnit artifact for each run after the fix commit.
3. Check the expiry: if `quarantine_record.expiry` has passed, still release only on PASS; note in the issue that the expiry was exceeded.

### Output
Go or stop.

### Quality Gate
- The verdict and the quarantine-job runs inspected are recorded with run ids.

---

## Phase 2: Remove The Quarantine

### Entry Criteria
- Phase 1 says continue.

### Actions
1. Undo exactly what `quarantine_record` lists, for this one test:
   - python: remove `@pytest.mark.quarantine` and its comment. Leave the marker registration if other tests use it (`grep -rn "mark.quarantine" tests/`); remove the registration and the `-m "not quarantine"` and quarantine job only if no test uses it.
   - node: remove ` [quarantine]` from the test title and its comment.
   - go: remove the test from the blocking job's `-skip` pattern; delete the `-skip` flag if the pattern becomes empty; remove the comment.
2. Do not touch other quarantined tests.
3. Prove the blocking selection now runs the test:
   - python: `python -m pytest -m "not quarantine" --co -q | grep -c "<test_id>"` prints `1`.
   - node: run the blocking command on the file and confirm the test name appears in `--verbose` output as passed.
   - go: the blocking command with `-v` prints `=== RUN   <TestName>`.

### Output
Edited test and CI file.

### Quality Gate
- The proof command output is recorded.
- `git diff --stat` lists only the test file and, if applicable, the CI file and config.

---

## Phase 3: Close The Loop

### Entry Criteria
- Release change ready.

### Actions
1. Push the branch and confirm the blocking job ran and passed the test in CI (read its JUnit report or log).
2. Close the issue with numbers: `gh issue close <number> --comment "Fixed in <sha>. Verified 0/<N> fixed order and 0/<N> shuffled at the baseline command; an unfixed test would show zero with probability <p_zero_if_unfixed>; remaining rate below <rate_upper_bound> at confidence <c>. Released from quarantine in <PR url>."`
3. `git -C <repo_path> diff > flk-release.diff` before commit, copy into `release_diff`, delete it.

### Output
`release_diff`.

### Quality Gate
- The CI run URL showing the test executed in the blocking job is recorded, and `gh issue view <number> --json state` prints `CLOSED`.

---

## Worked Example

Illustrative. Python, `tests/api/test_orders.py::test_refund_total`, issue 812.

- Phase 1: verdict `PASS`; quarantine job runs 9120000001 to 9120000014 after the fix all show the test passed.
- Phase 2: marker removed; `python -m pytest -m "not quarantine" --co -q | grep -c "test_refund_total"` prints `1`. No other quarantined tests, so the marker registration, the `-m` filter and the quarantine job are removed too.
- Phase 3: blocking job green with the test executed; issue 812 closed with the numbers.

---

## Exit Criteria

DONE when the test runs in the blocking job again, the change touches only its quarantine artifacts, and the issue is closed with the verification numbers.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Verdict is FAIL | **Stop**: keep the quarantine; update the issue with the new evidence. |
| Phase 2 | Test still excluded after edit | **Adjust**: another exclusion exists (a second CI job or a config `addopts`); grep the repo for the test name and the marker. |
| Phase 3 | Blocking job fails on the test after release | **Return**: re-apply the quarantine with `flk-quarantine-apply` and reopen the issue with the log. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
