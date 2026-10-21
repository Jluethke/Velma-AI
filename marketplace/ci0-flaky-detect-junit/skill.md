# Detect Flaky Tests From CI JUnit History and Reruns

**One-line description:** Finds flaky tests by mining CI history for tests that failed and passed on the same commit, confirms each candidate with a fixed number of isolated reruns, and records failure evidence so quarantine is based on proof rather than suspicion.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ci_platform` (string, required): `github` or `gitlab`.
- `repo_slug` (string, optional): `owner/repo` for GitHub.
- `gitlab_project_path` (string, optional): Project path for GitLab.
- `junit_report_globs` (string[], required): Where each job writes JUnit XML; also the artifact names to download.
- `rerun_count` (integer, required): How many isolated reruns confirm a candidate, chosen by the user.

---

## Outputs

- `flaky_tests` (object[]): `{test_id, file, failure_messages[], same_sha_evidence[], rerun_passes, rerun_failures, confirmed}`.

---

## Phase 1: Same-Commit Pass and Fail From History

### Entry Criteria
- JUnit reports are uploaded as artifacts on failure (see `ci0-gha-junit-artifacts` or `ci0-gitlab-junit-reports`).

### Actions
1. A test is a flaky candidate only when the same commit SHA has at least one failing and one passing result for it. Different SHAs prove nothing: the code changed.
2. GitHub: list runs with attempts: `gh run list --repo <repo_slug> --limit <user number> --json databaseId,headSha,conclusion,attempt`. For runs whose `attempt` is greater than 1, download each attempt's report: `gh api repos/<repo_slug>/actions/runs/<id>/attempts/<n>/jobs` to find jobs, and `gh run download <id> -n <artifact name> -D att-<n>` (downloads latest attempt; for earlier attempts use the artifacts API filtered by the attempt's jobs, and record if earlier artifacts are unavailable).
3. GitLab: retried jobs share the pipeline; list all jobs including retried ones: `glab api "projects/<enc_path>/pipelines/<pid>/jobs?include_retried=true"`, then download each job's artifacts.
4. Parse each report for failed cases: `python3 -c "import sys,xml.etree.ElementTree as E;[print(c.get('classname')+'::'+c.get('name')) for c in E.parse(sys.argv[1]).getroot().iter('testcase') if c.find('failure') is not None or c.find('error') is not None]" <file>`.
5. Build a table keyed by (SHA, test_id) with pass and fail counts. Candidates have both counts above zero.
6. Maven Surefire with `-Dsurefire.rerunFailingTestsCount=<n>` already marks flakes inside the XML as `<flakyFailure>` or `<flakyError>` elements; `grep -l '<flakyFailure' -r <reports>` finds them directly.

### Output
Candidate list with same-SHA evidence.

### Quality Gate
- Every candidate has at least one failing and one passing result on one SHA, quoted in `same_sha_evidence[]`.
- The parse command and input files are saved.

---

## Phase 2: Confirm by Isolated Reruns

### Entry Criteria
- Candidates exist.

### Actions
1. Rerun each candidate `rerun_count` times alone, on a clean checkout of the SHA where it flaked, with the stack's command:

| Stack | Isolated rerun command |
|---|---|
| Python | `pytest "<file>::<test>" -p no:randomly --count=<rerun_count>` (needs pytest-repeat) or a shell loop `for i in $(seq <rerun_count>); do pytest "<file>::<test>" -q || echo FAIL; done` |
| Node Jest | `for i in $(seq <rerun_count>); do npx jest <file> -t "<test name>" --ci || echo FAIL; done` |
| Node Vitest | `for i in $(seq <rerun_count>); do npx vitest run <file> -t "<test name>" || echo FAIL; done` |
| Go | `go test -run '^<TestName>$' -count=<rerun_count> -race ./<pkg>` |
| Maven | `./mvnw -B -ntp test -Dtest='<Class>#<method>' -Dsurefire.rerunFailingTestsCount=0` in a loop |
| Gradle | `./gradlew test --tests '<Class>.<method>' --rerun` in a loop (confirm `--rerun` with `./gradlew help --task test`) |

2. If the test never fails alone but fails in the full suite, record "order-dependent" and rerun with the full file or package instead.
3. Count passes and failures. `confirmed` is true when both are above zero across history plus reruns.
4. Copy the failure message and the first stack frame for each failure into `failure_messages[]`.
5. Do not edit the test while confirming. Do not mark anything as flaky that failed every time: that is a real failure.

### Output
`flaky_tests`.

### Quality Gate
- Each entry has `rerun_passes + rerun_failures == rerun_count` (or the loop count actually run, recorded).
- A test with zero passes is not in `flaky_tests`; it is reported as a consistent failure.

---

## Worked Example

Illustrative only. GitHub, Python, `rerun_count=50`.

Phase 1: run 70122 attempt 1 failed, attempt 2 passed on SHA `a41c9e0`. Attempt 1 report lists `tests.test_export::test_csv_timestamp_rounding` as failed: `AssertionError: '2026-03-01T00:00:00' != '2026-02-28T23:59:59'`.
Phase 2:
```
$ pytest "tests/test_export.py::test_csv_timestamp_rounding" -p no:randomly --count=50 -q
3 failed, 47 passed in 9.12s
```
Entry: `confirmed: true`, `rerun_passes: 47`, `rerun_failures: 3`, failure message recorded (time-of-day dependent rounding).

---

## Exit Criteria

DONE when every candidate has same-SHA history evidence and isolated rerun counts, and only tests with both passes and failures are marked confirmed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No reruns on the same SHA in history | **Adjust**: rerun the latest default-branch run (`gh run rerun <id>` or `glab ci retry`) to create evidence. |
| Phase 1 | Earlier attempt artifacts expired | **Adjust**: rely on Phase 2 reruns and record the gap. |
| Phase 2 | Test needs services (database) to run alone | **Adjust**: start them as CI does (same image or service container) before rerunning. |
| Phase 2 | Test fails every rerun | **Return**: it is broken, not flaky; send it to normal bug handling. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
