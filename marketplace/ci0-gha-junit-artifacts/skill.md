# GitHub Actions JUnit Reports and Artifacts

**One-line description:** Uploads JUnit XML and other test outputs from every job with `actions/upload-artifact` under `if: always()`, publishes a readable failure summary to `$GITHUB_STEP_SUMMARY`, and verifies the artifacts download and parse after a deliberately failing run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `gha_workflow_path` (string, required): Workflow file from `ci0-gha-workflow-baseline`.
- `junit_report_globs` (string[], required): Report patterns from `ci0-clean-room-command-check`.

---

## Outputs

- `gha_report_diff` (object): `{diff, artifact_names[], retention_days, failing_run_id, summary_excerpt}`.

---

## Phase 1: Upload Step

### Entry Criteria
- Every entry in `junit_report_globs` produced files in the clean-room run.

### Actions
1. Add this step at the end of each job that runs tests:
```yaml
      - name: upload test reports
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with:
          name: junit-${{ github.job }}-${{ strategy.job-index }}
          path: reports/
          if-no-files-found: error
          retention-days: <user value>
```
2. Condition choice: `if: always()` also runs when the workflow was cancelled; `if: ${{ !cancelled() }}` runs on success and failure but not on cancel. Use `!cancelled()` unless the user wants reports from cancelled runs. Never leave the default (`success()`), which skips the upload exactly when tests fail.
3. `name` must be unique within the run in upload-artifact v4; the `github.job` plus `strategy.job-index` pair is unique across matrix cells.
4. `if-no-files-found: error` makes a broken reporter fail loudly instead of uploading nothing.
5. `retention-days`: use the user's value. If none is given, omit the key so the repository setting applies, and report it as an open question. Do not invent a number.
6. upload-artifact v4.4 and later exclude hidden files (names starting with `.`) by default. If a report path is hidden, set `include-hidden-files: true` and say why in a comment.
7. Read `action.yml` of the version you pin to confirm each input exists.

### Output
Upload step in every test job.

### Quality Gate
- Every test job has exactly one upload step with an `if:` that is not `success()`.
- `actionlint <gha_workflow_path>` prints nothing.

---

## Phase 2: Failure Summary on the Run Page

### Entry Criteria
- Upload step added.

### Actions
1. Add a step after the tests, also under `if: ${{ !cancelled() }}`, that writes failing test names to the job summary with tools already present on the runner (Python is preinstalled on GitHub-hosted Ubuntu images):
```yaml
      - name: summarize failures
        if: ${{ !cancelled() }}
        shell: bash
        run: |
          python3 - <<'PY' >> "$GITHUB_STEP_SUMMARY"
          import glob, xml.etree.ElementTree as E
          rows = []
          for f in glob.glob("reports/**/*.xml", recursive=True):
              for c in E.parse(f).getroot().iter("testcase"):
                  if c.find("failure") is not None or c.find("error") is not None:
                      rows.append(f"| {c.get('classname')} | {c.get('name')} |")
          print("### Failed tests\n\n| class | test |\n|---|---|")
          print("\n".join(rows) if rows else "| none | none |")
          PY
```
2. This is inline workflow YAML, not a file in this flow. If the user prefers a marketplace action (for example `dorny/test-reporter` or `mikepenz/action-junit-report`), note that these need `checks: write` permission on the job and must be pinned by SHA.
3. Do not set `continue-on-error: true` on the test step to make the summary step run; the `if:` condition already handles that.

### Output
Summary step.

### Quality Gate
- The test step has no `continue-on-error`.
- actionlint is clean after the edit.

---

## Phase 3: Prove It With a Failing Run

### Entry Criteria
- Workflow edited on a PR branch.

### Actions
1. On a throwaway branch, add one temporary failing test (for example `def test_ci_report_probe(): assert False`). Push it.
2. Wait: `gh run watch` (the run is expected to fail).
3. List artifacts: `gh api repos/{owner}/{repo}/actions/runs/<run_id>/artifacts --jq '.artifacts[] | [.name,.size_in_bytes,.expires_at] | @tsv'`.
4. Download and parse: `gh run download <run_id> --dir dl && grep -l 'test_ci_report_probe' -r dl`.
5. Read the summary: open the run page, or `gh run view <run_id>` and confirm the probe test is named under "Failed tests".
6. Delete the throwaway branch (`git push origin --delete <branch>`). Do not merge the probe test.

### Output
`gha_report_diff`.

### Quality Gate
- The failing run lists one artifact per test job.
- `grep -l test_ci_report_probe -r dl` prints at least one file.
- The probe test exists on no branch other than the deleted throwaway.

---

## Worked Example

Illustrative only. Jobs `test` (matrix of 3) and `lint`; `junit_report_globs=["reports/junit.xml"]`; user retention 14 days.

Phase 3:
```
$ gh api repos/acme/invoice-api/actions/runs/7421/artifacts --jq '.artifacts[] | [.name,.size_in_bytes] | @tsv'
junit-test-0   18233
junit-test-1   18240
junit-test-2   18311
$ gh run download 7421 --dir dl && grep -l test_ci_report_probe -r dl
dl/junit-test-0/junit.xml
dl/junit-test-1/junit.xml
dl/junit-test-2/junit.xml
```
Job summary shows `| tests.test_probe | test_ci_report_probe |`. Branch `ci/report-probe` deleted.

---

## Exit Criteria

DONE when a failing run uploads one uniquely named report artifact per test job, the artifacts contain the failing case, and the job summary names it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Conflict: an artifact with this name already exists` | **Adjust**: add the matrix values or `strategy.job-index` to `name`. |
| Phase 1 | `No files were found with the provided path` | **Adjust**: compare `path` to `junit_report_globs` and the job's working directory. |
| Phase 2 | Summary step crashes on malformed XML | **Return**: report the file; the reporter flag in the test command is wrong. |
| Phase 3 | No artifact on the failing run | **Adjust**: the `if:` condition is missing or is `success()`; fix and rerun the probe. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
