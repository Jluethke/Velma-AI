# Quarantine Flaky pytest Tests With a Marker and a Non-Blocking Job

**One-line description:** Moves confirmed flaky pytest tests behind a registered `quarantine` marker, excludes them from the blocking CI job with `-m "not quarantine"`, runs them in a separate non-blocking job that still reports, and links each one to a tracking issue so it comes back out.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository checkout.
- `flaky_tests` (object[], required): From `ci0-flaky-detect-junit`; only entries with `confirmed: true` are used.
- `ci_platform` (string, required): `github` or `gitlab`.

---

## Outputs

- `quarantine_record` (object): `{marked_tests: [{test_id, issue_url}], blocking_job_case_count_before, blocking_job_case_count_after, quarantine_job_name, diff}`.

---

## Phase 1: Register the Marker

### Entry Criteria
- At least one `flaky_tests` entry has `confirmed: true`.

### Actions
1. Check for existing marker config: `grep -nE 'markers|strict-markers|quarantine' pyproject.toml pytest.ini setup.cfg tox.ini 2>/dev/null`.
2. Register the marker in the file that holds pytest config. For `pyproject.toml`:
```toml
[tool.pytest.ini_options]
markers = [
    "quarantine: known flaky test, excluded from the blocking CI job; see linked issue",
]
```
   Merge into an existing `markers` list; do not replace it.
3. If `--strict-markers` is in `addopts`, an unregistered marker is an error, which is good: it catches typos. Do not remove `--strict-markers`.
4. Run `pytest --markers | grep quarantine` to confirm registration.

### Output
Registered marker.

### Quality Gate
- `pytest --markers` prints the `quarantine` line.
- Existing markers in the config are all still present (compare before and after with `git diff`).

---

## Phase 2: Mark Each Test

### Entry Criteria
- Marker registered.

### Actions
1. For each confirmed test, ask the user for (or create with approval) a tracking issue: `gh issue create --title "Flaky: <test_id>" --body "<failure messages and rerun counts>"` or `glab issue create`.
2. Add the marker directly above the test function, with the issue URL in a comment:
```python
# Quarantined: https://github.com/acme/invoice-api/issues/412
@pytest.mark.quarantine
def test_csv_timestamp_rounding():
```
   For a parametrized case only, use `pytest.param(..., marks=pytest.mark.quarantine)`.
3. Edit one test file at a time and run `pytest --collect-only -q -m quarantine` after each; the count must grow by exactly the number of tests you marked.
4. Do not use `@pytest.mark.skip`, `xfail`, or delete the test. Skip and delete stop the test from running at all; `xfail` turns a fix into a surprise failure under `xfail_strict`. Quarantine keeps it running, non-blocking.
5. Do not add `@pytest.mark.flaky(reruns=...)` (pytest-rerunfailures) as a substitute; automatic reruns hide flakiness in the blocking job. That is a separate policy the user may choose.

### Output
Marked tests.

### Quality Gate
- `pytest --collect-only -q -m quarantine | tail -1` reports exactly the number of confirmed tests.
- Every marked test has an issue URL comment directly above the marker.

---

## Phase 3: Split the CI Jobs

### Entry Criteria
- Tests marked.

### Actions
1. Record the blocking job's case count before: `pytest --collect-only -q | tail -1`.
2. Change the blocking test command by adding `-m "not quarantine"`. If the project already passes `-m`, combine expressions: `-m "not slow and not quarantine"`.
3. Add a quarantine job that runs `pytest -m quarantine --junitxml=reports/quarantine.xml` and cannot fail the pipeline:

| Platform | Non-blocking setting |
|---|---|
| github | job-level `continue-on-error: true`; do not list it in the aggregate required check's `needs` |
| gitlab | `allow_failure: true` on the job |

4. Upload its report like other jobs, so flake rates stay visible.
5. Lint the CI file (`actionlint` or `glab ci lint`), push, run.

### Output
`quarantine_record`.

### Quality Gate
- Blocking-job count after + quarantine count == count before (from `--collect-only`).
- The quarantine job ran and uploaded `reports/quarantine.xml` in the CI run.

---

## Worked Example

Illustrative only. One confirmed test `tests/test_export.py::test_csv_timestamp_rounding`; GitHub.

Phase 1: `pytest --markers` prints `@pytest.mark.quarantine: known flaky test, ...`.
Phase 2: issue #412 created; marker added. `pytest --collect-only -q -m quarantine` ends `1/1188 tests collected (1187 deselected)`.
Phase 3: before 1,188; blocking after `1187/1188 tests collected (1 deselected)`; quarantine 1. Sum matches. CI run shows `test success`, `quarantine success` (test passed this time; it still runs).

---

## Exit Criteria

DONE when every confirmed flaky test carries the registered marker and an issue link, the blocking job excludes exactly those tests, and a non-blocking quarantine job still runs and reports them.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Config is split across several files | **Adjust**: pytest reads only the first config file it finds (`rootdir` line in pytest output); edit that one. |
| Phase 2 | User declines to create issues | **Return**: quarantine without a tracking link is not allowed; ask for an alternative tracker. |
| Phase 3 | Counts do not add up | **Stop**: an `-m` expression also deselects other tests; fix the expression. |
| Phase 3 | Quarantine job fails the pipeline | **Adjust**: `continue-on-error` or `allow_failure` is missing or on the wrong level. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
