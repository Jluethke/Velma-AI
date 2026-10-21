# GitLab CI JUnit Test Reports and Coverage Reports

**One-line description:** Adds `artifacts:reports:junit` with `when: always` so failed tests appear in the merge request widget and pipeline Tests tab, adds a Cobertura coverage report and `coverage` regex where the stack produces one, and proves the widget shows a deliberately failing test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `gitlab_ci_path` (string, required): Pipeline file from `ci0-gitlab-ci-baseline`.
- `junit_report_globs` (string[], required): From `ci0-clean-room-command-check`.

---

## Outputs

- `gitlab_report_diff` (object): `{diff, expire_in, test_report_summary, probe_pipeline_id}`.

---

## Phase 1: Report Artifacts

### Entry Criteria
- Each glob in `junit_report_globs` matched files in the clean-room run.

### Actions
1. Add to every test job:
```yaml
  artifacts:
    when: always
    expire_in: <user value>
    paths: [reports/]
    reports:
      junit: reports/junit.xml
```
   `when: always` uploads on failure; the default `on_success` skips the upload exactly when you need the report. `reports:junit` accepts a glob (for example `"**/target/surefire-reports/TEST-*.xml"`).
2. `expire_in`: use the user's value. If none, omit it so the instance default applies and raise an open question.
3. Coverage report, only when the test command already produces Cobertura XML:

| Stack | Producer | `coverage_report` path |
|---|---|---|
| Python | `pytest --cov=<pkg> --cov-report=xml:reports/coverage.xml` (pytest-cov) | `reports/coverage.xml` |
| Node Jest | `--coverage --coverageReporters=cobertura` | `coverage/cobertura-coverage.xml` |
| Go | `gocover-cobertura < coverage.out > coverage.xml` (extra tool) | `coverage.xml` |
| JVM | JaCoCo XML needs conversion; report as open question | none |

   Add:
```yaml
    reports:
      coverage_report:
        coverage_format: cobertura
        path: reports/coverage.xml
```
4. Job-level `coverage:` regex extracts the percentage for badges and the MR widget. Use the regex for the tool's own summary line, for example pytest-cov: `coverage: '/TOTAL.*? (100(?:\.0+)?\%|[1-9]?\d(?:\.\d+)?\%)$/'`. Check the regex against a real log line with `grep -E`.
5. Do not add coverage thresholds in this flow; a threshold is a user decision.

### Output
Report artifacts per job.

### Quality Gate
- Every test job has `artifacts:when: always` and `reports:junit`.
- `glab ci lint` prints `CI/CD YAML is valid!`.

---

## Phase 2: Prove With a Failing Probe

### Entry Criteria
- Edits on a branch with an open draft MR.

### Actions
1. Add one temporary failing test on a throwaway branch, push, and let the pipeline fail.
2. Read the pipeline test report summary: `glab api "projects/:id/pipelines/<pid>/test_report_summary" | jq '.total'`. Fields include `count`, `success`, `failed`, `skipped`, `error`.
3. Read failing cases: `glab api "projects/:id/pipelines/<pid>/test_report" | jq -r '.test_suites[].test_cases[] | select(.status=="failed") | .name'`. The probe test name must appear.
4. Open the MR and confirm the Test summary widget lists the failed probe.
5. Delete the throwaway branch. Do not merge the probe.

### Output
`gitlab_report_diff`.

### Quality Gate
- `test_report_summary.total.failed` is at least 1 for the probe pipeline.
- The probe test name appears in the `test_report` output.

---

## Worked Example

Illustrative only. Maven project, `junit_report_globs=["**/target/surefire-reports/TEST-*.xml"]`, user `expire_in: 1 week`.

Phase 1:
```yaml
test:
  artifacts:
    when: always
    expire_in: 1 week
    reports:
      junit: "**/target/surefire-reports/TEST-*.xml"
```
Phase 2: probe `ProbeTest.alwaysFails`. `test_report_summary` shows `"total": {"count": 507, "success": 502, "failed": 1, "skipped": 4, "error": 0}`; `test_report` lists `alwaysFails`. Branch deleted.

---

## Exit Criteria

DONE when every test job uploads JUnit reports on failure, the pipeline test report API shows a deliberately failing probe, and the probe never reaches the default branch.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Trace shows `WARNING: reports/junit.xml: no matching files` | **Adjust**: compare the path to the test command's output path and job working dir. |
| Phase 1 | Coverage regex never matches | **Adjust**: test it with `grep -E` against the job trace line; fix the regex. |
| Phase 2 | Summary shows 0 tests | **Stop**: the XML is empty or malformed; fix the reporter flags. |
| Phase 2 | Report too large to parse | **Return**: quote the GitLab message; split reports per module. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
