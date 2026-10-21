# GitLab CI parallel and parallel:matrix Test Splitting

**One-line description:** Runs one test job as N parallel shards using `parallel: N` with `CI_NODE_INDEX`/`CI_NODE_TOTAL`, and across language versions with `parallel:matrix`, then proves the shards together ran every test exactly once.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `gitlab_ci_path` (string, required): Pipeline file from `ci0-gitlab-ci-baseline`.
- `stack_profile` (object, required): From `ci0-detect-stack` (test runner).
- `shard_count` (integer, required): Number of shards, chosen by the user.
- `matrix_versions` (string[], optional): Language versions to test, from the project's declared support range or the user.

---

## Outputs

- `gitlab_parallel_diff` (object): `{diff, shard_command, baseline_case_count, shard_case_counts[], matrix_job_names[], pipeline_id}`.

---

## Phase 1: Shard Command From GitLab Variables

### Entry Criteria
- A green unsharded pipeline with a JUnit report exists; record its case count with `grep -c '<testcase' <report>`.

### Actions
1. `parallel: N` creates N copies of the job named `test 1/N` to `test N/N`, each with `CI_NODE_INDEX` (1-based) and `CI_NODE_TOTAL` (equal to N).
2. Map to the runner's shard flag:

| Runner | Script line |
|---|---|
| pytest with pytest-split | `pytest --splits $CI_NODE_TOTAL --group $CI_NODE_INDEX --junitxml=reports/junit.xml` |
| Jest 28 or later | `npx jest --ci --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL` |
| Vitest | `npx vitest run --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL` |
| Playwright | `npx playwright test --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL` |
| Go | `go test -race -count=1 $(go list ./... | awk -v n=$CI_NODE_TOTAL -v i=$CI_NODE_INDEX 'NR % n == i % n')` |
| Maven or Gradle | No built-in flag; split by module or report as open question |

3. Confirm the flag with the tool's `--help` before writing it.
4. Do not combine `parallel: N` with a runner-side split that also reads its own index from another variable; one source of truth only.

### Output
Shard script line.

### Quality Gate
- The chosen flag is quoted from the tool's `--help` output.
- The baseline case count is recorded.

---

## Phase 2: Edit the Job

### Entry Criteria
- Shard line chosen.

### Actions
1. Shards only:
```yaml
test:
  stage: test
  parallel: 4
  script:
    - <install command>
    - <shard script line>
  artifacts:
    when: always
    reports:
      junit: reports/junit.xml
```
2. Versions with `parallel:matrix` (if `matrix_versions` is given):
```yaml
test:
  image: python:$PYTHON_VERSION
  parallel:
    matrix:
      - PYTHON_VERSION: ["3.11", "3.12", "3.13"]
```
   Generated job names look like `test: [3.12]`. When an image is set from a matrix variable, pin by digest is not possible inline; record that the image tags are unpinned and ask the user to accept it or list digest-pinned images per version.
3. `parallel: N` and `parallel:matrix` cannot be combined in one job. If both shards and versions are wanted, either shard only on one version, or define one matrix entry per (version, shard) pair with a `SHARD` variable and use it in the script. The GitLab docs state a limit of 200 jobs per `parallel:matrix`.
4. Run `glab ci lint`.

### Output
Edited job.

### Quality Gate
- CI Lint valid.
- The job does not contain both `parallel: <number>` and `parallel: matrix:`.

---

## Phase 3: Prove Completeness

### Entry Criteria
- Sharded pipeline finished.

### Actions
1. List shard jobs: `glab api "projects/:id/pipelines/<pid>/jobs?per_page=100" | jq -r '.[] | select(.name|startswith("test")) | [.id,.name,.status,.duration] | @tsv'`.
2. Download each report: `glab api "projects/:id/jobs/<job_id>/artifacts/reports/junit.xml" > shard-<n>.xml` (artifact path as stored). If that path does not resolve, download the archive with `glab api "projects/:id/jobs/<job_id>/artifacts" > a.zip && unzip a.zip`.
3. Count and compare: `for f in shard-*.xml; do grep -c '<testcase' "$f"; done | paste -sd+ | bc` must equal the baseline count.
4. Check duplicates: `grep -ho 'classname="[^"]*" name="[^"]*"' shard-*.xml | sort | uniq -d` prints nothing.
5. Do not report a speedup without comparing the slowest shard's `duration` with the baseline job's `duration`.

### Output
`gitlab_parallel_diff`.

### Quality Gate
- Summed case count equals the baseline.
- The duplicate check prints nothing.

---

## Worked Example

Illustrative only. Jest suite with 2,412 cases, `shard_count=3`.

Phase 1: `npx jest --help | grep -A2 -- --shard` shows `--shard  Shard tests and execute only the selected shard, specify in the form "current/all"`.
Phase 3:
```
812  test 1/3  success  241.3
803  test 2/3  success  236.0
797  test 3/3  success  229.8
```
Counts 812 + 803 + 797 = 2,412, equal to baseline; duplicates none.

---

## Exit Criteria

DONE when the sharded or matrix job passes, summed shard cases equal the baseline with no duplicates, and generated job names are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Runner lacks shard support | **Return**: report the open question; do not write a splitter. |
| Phase 2 | Lint error about `parallel` | **Adjust**: check you did not combine number and matrix forms. |
| Phase 3 | Sum lower than baseline | **Stop**: index off by one or a shard reported no file; fix before merging. |
| Phase 3 | Shard fails only when split | **Return**: report as an order-dependent test; do not reorder or delete. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
