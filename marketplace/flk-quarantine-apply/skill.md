# Flaky Test Quarantine Apply

**One-line description:** Moves a confirmed flaky test out of the blocking CI job into a non-blocking quarantine job where it still runs on every pipeline, using the stack's real selection mechanism (pytest marker, Jest name tag, Go `-skip`), with an owner, tracking issue and expiry date recorded next to the test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flake_evidence` (object, required): Proof of flakiness (mixed-outcome SHAs).
- `flake_class` (string, required): From `flk-classify-root-cause`.
- `baseline_rate` (object, required): Measured rate, written into the issue.
- `stack` (string, required): `python`, `node` or `go`.
- `repo_path` (string, required): Repository root.
- `quarantine_owner` (string, optional): Person or team that owns the fix. Required before Phase 2 runs; ask the user if absent.
- `quarantine_expiry` (string, optional): ISO date after which the quarantine must be resolved. Set by the user's team policy; do not invent one.
- `quarantine_now` (boolean, required): True when the user wants the test unblocked from CI before the fix lands.

---

## Outputs

- `quarantine_record` (object): `{status: "quarantined"|"not_quarantined", test_id, issue_url, owner, expiry, mechanism, blocking_job_change, quarantine_job_change, baseline_rate}`.

---

## Phase 1: Policy Check

### Entry Criteria
- `quarantine_now` is true. If false, emit `status: "not_quarantined"` and stop.

### Actions
1. Confirm all of these are true; any false is a **Stop**:
   - `flake_evidence.is_flaky` is true (a deterministic failure is a bug, not a flake; it must not be quarantined).
   - `quarantine_owner` is a named person or team.
   - `quarantine_expiry` is a date given by the user.
2. Search for an existing quarantine convention before inventing one: `grep -rn -i "quarantine" --include=*.py --include=*.ini --include=*.toml --include=*.cfg --include=*.ts --include=*.js --include=*.json --include=*.go --include=*.yml --include=*.yaml <repo_path>`. If one exists, use it exactly and skip the stack table in Phase 2.
3. Open a tracking issue: `gh issue create --title "Flaky: <test_id>" --body "<rate, class, mixed SHAs, owner, expiry>" --label flaky` (create the label first with `gh label create flaky` if `gh label list` does not show it). Record `issue_url`.

### Output
Policy facts and `issue_url`.

### Quality Gate
- `issue_url` opens and its body contains `baseline_rate` counts and at least one mixed-outcome SHA.

---

## Phase 2: Apply The Mechanism

### Entry Criteria
- Policy check passed.

### Actions
1. Change one test only. Use the stack row:

| Stack | Mark the test | Blocking job runs | Quarantine job runs |
|---|---|---|---|
| python | Register the marker in the existing config file (`pytest.ini` `[pytest]`, or `pyproject.toml` `[tool.pytest.ini_options]`): `markers = quarantine: known flaky test, see linked issue`. Add `@pytest.mark.quarantine` above the test plus a comment `# quarantined <date>, owner <owner>, expires <expiry>, <issue_url>`. | `pytest -m "not quarantine"` | `pytest -m quarantine` |
| node (Jest) | Append ` [quarantine]` to the test title: `test('applies coupon once [quarantine]', ...)` plus the same comment. | `jest --testNamePattern '^(?!.*\[quarantine\]).*$'` | `jest --testNamePattern '\[quarantine\]'` |
| go | Add the comment above the test function. Do not add `t.Skip`. | `go test ./... -skip '^TestInvoiceRounding$'` (Go 1.20 added `-skip`) | `go test ./internal/billing -run '^TestInvoiceRounding$'` |

2. Python: run with `--strict-markers` once to prove the marker is registered: `python -m pytest --strict-markers -m quarantine --co -q` lists exactly the one test.
3. Node: `npx jest --listTests` lists files, not tests, so it cannot prove this. Run `npx jest <file> --testNamePattern '\[quarantine\]' --ci` and confirm `Tests: 1 passed` or `1 failed` with the rest skipped.
4. Go: `go test ./internal/billing -skip '^TestInvoiceRounding$' -v -count=1 | grep -c "=== RUN   TestInvoiceRounding$"` prints `0`.

### Output
Test marked; selection commands proven.

### Quality Gate
- The selection command outputs above are recorded and show the test excluded from blocking and included in quarantine.

---

## Phase 3: Wire CI

### Entry Criteria
- Mechanism proven locally.

### Actions
1. Edit the blocking job's test command to add the exclusion from the table. Change nothing else in that job.
2. Add a quarantine job that runs the inclusion command on every pipeline and cannot fail the pipeline:
   - GitHub Actions: a job with `continue-on-error: true`, uploading its JUnit report with `actions/upload-artifact`.
   - GitLab CI: a job with `allow_failure: true` and `artifacts: reports: junit: report.xml`.
3. Do NOT delete the test, comment it out, wrap its body in `try/except`, add `pytest.mark.skip`, `test.skip`, or `t.Skip`. A skipped test produces no data, so nobody can tell when it is fixed.
4. Do NOT enable retries (`pytest-rerunfailures`, `jest.retryTimes`, `gotestsum --rerun-fails`) as the quarantine. Retries keep the test blocking and hide the rate.
5. Validate the CI file: GitHub `actionlint` if installed; GitLab `glab ci lint`.
6. Fill `quarantine_record` with `status: "quarantined"`.

### Output
`quarantine_record`.

### Quality Gate
- A pipeline on the branch shows the blocking job green without the test and the quarantine job executing it (its JUnit report lists the test).

---

## Worked Example

Illustrative. Python, `tests/api/test_orders.py::test_refund_total`, owner `payments-team`, expiry `2026-11-30` given by the user.

- Phase 1: no existing convention found. `gh issue create --title "Flaky: tests/api/test_orders.py::test_refund_total" ...` returns `https://github.com/acme/shop/issues/812`.
- Phase 2: marker registered in `pyproject.toml`; `python -m pytest --strict-markers -m quarantine --co -q` prints `tests/api/test_orders.py::test_refund_total` and `1/530 tests collected (529 deselected)`.
- Phase 3: blocking job runs `pytest -m "not quarantine" -n auto`; new `quarantine` job with `continue-on-error: true`. Pipeline: blocking green, quarantine job ran 1 test, failed once in 3 pushes.

---

## Exit Criteria

DONE when the test is excluded from the blocking job, still runs in a non-blocking job on every pipeline, and the record holds owner, issue, expiry and baseline rate.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Owner or expiry missing | **Stop**: ask the user; a quarantine without owner and expiry becomes permanent. |
| Phase 1 | Test is not flaky (deterministic failure) | **Stop**: refuse to quarantine; route to a bug fix. |
| Phase 2 | Jest regex negative lookahead not matching | **Adjust**: test the pattern in `node -e "console.log(/^(?!.*\[quarantine\]).*$/.test('x [quarantine]'))"` which must print `false`. |
| Phase 3 | CI lint fails | **Retry**: fix the YAML and lint again before pushing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
