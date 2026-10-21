# Flaky Test Evidence Intake

**One-line description:** Proves a test is flaky (not broken) by finding at least one commit SHA where the same test both passed and failed, then groups every recorded failure by its error signature, runner and time so later flows classify from evidence instead of guesses.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `test_id` (string, required): Full test identifier in the runner's own syntax. pytest: `tests/api/test_orders.py::test_refund_total`. Jest: file path plus test name, `src/cart.test.ts` + `"applies coupon once"`. Go: package plus test, `./internal/billing` + `TestInvoiceRounding` (subtests as `TestInvoiceRounding/negative_amount`).
- `repo_path` (string, required): Absolute path to a clean checkout of the repository.
- `stack` (string, required): One of `python`, `node`, `go`. Selects the commands below.
- `ci_failure_logs` (string[], optional): Paths or URLs of CI logs or JUnit XML reports that contain the failure. When absent, Phase 1 fetches them.

---

## Outputs

- `flake_evidence` (object): `{test_id, stack, mixed_outcome_shas[], runs_seen, failures_seen, ci_flake_rate_estimate, signatures[{signature, count, example_log_excerpt}], runner_facts{os, arch, runtime_version, parallelism_flags}, failure_timestamps_utc[], is_flaky: true|false}`.

---

## Phase 1: Collect Runs Of The Test

### Entry Criteria
- `test_id`, `repo_path` and `stack` are present.
- `git -C <repo_path> status --porcelain` prints nothing (clean checkout).

### Actions
1. If `ci_failure_logs` is given, read every file. Skip to action 4.
2. GitHub Actions: list recent runs with their commit SHA and result:
   `gh run list --workflow <workflow-file.yml> --limit 200 --json databaseId,headSha,conclusion,createdAt`
   For each failed run, print only the failed steps: `gh run view <databaseId> --log-failed > run-<databaseId>.log`.
   GitLab CI: `glab ci list` and `glab ci view`, or the Jobs API `GET /projects/:id/jobs?scope[]=failed`. Check `glab ci --help` for the flags your glab version has.
3. If CI uploads JUnit XML (pytest `--junitxml`, `jest-junit`, `gotestsum --junitfile`), download those artifacts: `gh run download <databaseId> -n <artifact-name>`. JUnit XML is more reliable than log text because each `<testcase>` carries its own `<failure>` element.
4. For every run, record: SHA, pass or fail of `test_id` (not of the whole job), UTC start time, runner OS image, and the test command line as printed in the log.
5. Do NOT count a job failure as a test failure. A job that failed on install, lint or another test says nothing about `test_id`.

### Output
A table of runs: SHA, test outcome, UTC time, runner, command.

### Quality Gate
- Every row names an outcome for `test_id` itself, found by searching the log or XML for the test name.
- The command line used by CI is copied verbatim into the notes (later flows reuse it).

---

## Phase 2: Prove Flakiness

### Entry Criteria
- Run table from Phase 1 has at least one failing row for `test_id`.

### Actions
1. Group rows by SHA. A SHA with at least one pass and at least one fail of `test_id` is a mixed-outcome SHA.
2. Apply this rule:

| Mixed-outcome SHAs found | Test fails on every run since one SHA | Verdict |
|---|---|---|
| 1 or more | any | `is_flaky: true` |
| 0 | yes | `is_flaky: false`; this is a deterministic regression. Use git bisect, not this chain. |
| 0 | no (only one or two failures, all on different SHAs) | Rerun locally: check out one failing SHA and run the CI command at the count from `flk-run-count-derive`. A pass and a fail on that SHA makes it `true`. |

3. Compute `ci_flake_rate_estimate = failures_seen / runs_seen` counting only runs where `test_id` actually executed. Write the numerator and denominator, not only the ratio.
4. Do NOT re-trigger CI with "rerun failed jobs" and call a green rerun a fix. A green rerun is one more sample of the same flaky test.

### Output
`is_flaky`, `mixed_outcome_shas`, `ci_flake_rate_estimate` with its counts.

### Quality Gate
- `is_flaky: true` is backed by at least one SHA listed with both a pass and a fail, or by a local rerun log on one SHA.
- The rate is written as `failures/runs`, for example `4/212`.

---

## Phase 3: Group Failure Signatures

### Entry Criteria
- `is_flaky: true`.

### Actions
1. From each failing run, copy the first assertion or exception line and the top project frame of the stack trace.
2. Normalize volatile parts before grouping: replace hex addresses, ports, temp paths (`/tmp/pytest-of-runner/pytest-12/`), UUIDs and timestamps with placeholders.
3. Group identical normalized lines into `signatures` with a count each. Two or more signatures for one test is normal and important: it often means two root causes.
4. Record runner facts from the log header: OS image, CPU architecture, Python, Node or Go version, and parallelism flags (`-n auto`, `--maxWorkers`, `-p`, `-parallel`).
5. Record each failure's UTC timestamp. Note if failures cluster near 00:00 UTC, near a month end, or on a DST change date; the classifier uses this.
6. Emit `flake_evidence`.

### Output
`flake_evidence`.

### Quality Gate
- Every signature has a count and one verbatim log excerpt.
- Sum of signature counts equals `failures_seen`.

---

## Worked Example

Illustrative. `test_id` = `tests/api/test_orders.py::test_refund_total`, `stack` = `python`, GitHub Actions.

- Phase 1: `gh run list --workflow ci.yml --limit 200 --json databaseId,headSha,conclusion,createdAt` returns 200 runs; the test executed in 188 of them. `gh run view 9123456789 --log-failed` shows `FAILED tests/api/test_orders.py::test_refund_total - AssertionError: assert Decimal('9.99') == Decimal('10.00')`.
- Phase 2: SHA `4be1c07` has 3 passes and 1 fail of the test. `is_flaky: true`. `ci_flake_rate_estimate` = 5/188.
- Phase 3: two signatures. `AssertionError: assert Decimal('9.99') == Decimal('10.00')` (4) and `sqlite3.OperationalError: database is locked` (1). Runner `ubuntu-24.04`, Python 3.12.4, `pytest -n auto`. All 4 assertion failures started between 23:41 and 00:07 UTC.

---

## Exit Criteria

DONE when `flake_evidence` names at least one mixed-outcome SHA (or a local same-SHA pass and fail), the rate as counts, and every failure grouped under a signature with an excerpt.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `gh` not authenticated | **Stop**: run `gh auth status`; ask the user to run `gh auth login`. Do not scrape the web UI. |
| Phase 1 | CI logs expired (retention passed) | **Adjust**: use local reruns on the latest failing SHA as the only evidence and say so in `flake_evidence`. |
| Phase 2 | No mixed-outcome SHA and test fails every run | **Return**: report `is_flaky: false`; this is a regression, not a flake. |
| Phase 3 | Log truncated, no stack trace | **Adjust**: rerun locally with full output (`pytest -vv --tb=long`, `jest --verbose`, `go test -v`) to capture one complete failure. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
