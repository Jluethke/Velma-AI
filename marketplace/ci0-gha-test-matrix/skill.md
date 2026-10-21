# GitHub Actions Test Matrix for Versions and Operating Systems

**One-line description:** Adds a `strategy.matrix` over language versions and runner operating systems to the test job, with `fail-fast: false`, `include`/`exclude` for uneven combinations, and the exact generated check names that branch protection must require.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `gha_workflow_path` (string, required): Workflow file from `ci0-gha-workflow-baseline`.
- `matrix_versions` (string[], required): Language versions the project supports, supplied by the user or taken from the project's declared support range (for example `requires-python`, `engines.node`, classifiers). Never invented.
- `matrix_os` (string[], optional): Runner labels, for example `ubuntu-latest`, `windows-latest`, `macos-latest`. Default: `["ubuntu-latest"]`.

---

## Outputs

- `gha_matrix_diff` (object): `{diff, job_count, run_id, per_cell_results[]}`.
- `check_run_names` (string[]): The exact check names produced by the matrix, as shown by the GitHub API.

---

## Phase 1: Derive the Matrix

### Entry Criteria
- `matrix_versions` is non-empty and each value appears in the project's declared support range, or the user confirmed it.

### Actions
1. Cross-check versions against the declaration: Python `grep -n 'requires-python' pyproject.toml`; Node `node -p "require('./package.json').engines"`; Go `grep '^go ' go.mod` (minimum); Java `<maven.compiler.release>`. If a requested version is outside the declared range, report it; do not widen the declaration.
2. Count cells: `len(matrix_versions) * len(matrix_os)`. GitHub documents a limit of 256 jobs per matrix per workflow run.
3. Decide uneven combinations with these rules:
   - If a version is unavailable for an OS image (setup action fails to find it), add an `exclude:` entry for that pair.
   - If only one extra cell is wanted (for example newest version on Windows only), use `include:` with that single combination instead of adding Windows to `os` for every version.
4. Use `fail-fast: false`. The default `true` cancels all other cells when one fails, which hides whether the failure is version-specific.

### Output
Matrix definition.

### Quality Gate
- Every version cites a declaration line or user confirmation.
- Cell count is computed and recorded as `job_count`.

---

## Phase 2: Edit the Test Job

### Entry Criteria
- Matrix derived.

### Actions
1. Edit only the `test` job in `gha_workflow_path`:
```yaml
  test:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest]
        python-version: ["3.11", "3.12", "3.13"]
    runs-on: ${{ matrix.os }}
```
2. Replace the fixed version in the setup step with the matrix value (`python-version: ${{ matrix.python-version }}`, `node-version: ${{ matrix.node-version }}`, `go-version: ${{ matrix.go-version }}`, `java-version: ${{ matrix.java }}`). Remove the `*-version-file` input from that step so the two do not conflict.
3. Quote versions as strings in YAML. `3.10` unquoted is the number 3.1.
4. Windows runners default to PowerShell for `run:`. Add `defaults: run: shell: bash` to the job if commands use POSIX syntax.
5. If cache keys exist (from `ci0-gha-dependency-cache`) and use raw `actions/cache`, add `${{ matrix.os }}` and the version to the key. Setup action built-in caches already include OS and version.
6. Make every uploaded artifact name unique per cell, for example `name: junit-${{ matrix.os }}-${{ matrix.python-version }}`; `actions/upload-artifact` v4 fails when two jobs upload the same name.
7. Run `actionlint <gha_workflow_path>`.

### Output
Edited workflow.

### Quality Gate
- `actionlint` prints nothing.
- `grep -n 'fail-fast: false' <gha_workflow_path>` prints one line in the test job.

---

## Phase 3: Run and Read the Check Names

### Entry Criteria
- Workflow edited and pushed to a PR branch.

### Actions
1. Wait: `gh run watch --exit-status`.
2. Read per-cell results: `gh run view <run_id> --json jobs --jq '.jobs[] | [.name, .conclusion] | @tsv'`.
3. Read the exact check names on the commit: `gh api repos/{owner}/{repo}/commits/<sha>/check-runs --jq '.check_runs[].name'`. Matrix job names follow the pattern `<job id or name> (<value1>, <value2>)`, for example `test (ubuntu-latest, 3.12)`. Use the API output, not this pattern, as the source of truth.
4. Record all names in `check_run_names`. A matrix change renames checks, so required checks must be updated after any matrix edit.
5. If one cell fails and others pass, report the failing cell with its log: `gh run view --job <job_id> --log-failed`. Do not remove the failing cell to get green.

### Output
`gha_matrix_diff`, `check_run_names`.

### Quality Gate
- `check_run_names` count equals `job_count` plus the non-matrix jobs.
- Every failing cell is reported with a log excerpt, and no cell was removed after a failure.

---

## Worked Example

Illustrative only. `matrix_versions=["3.11","3.12","3.13"]`, `matrix_os=["ubuntu-latest","windows-latest"]`; `requires-python = ">=3.11"`.

Phase 1: 3 x 2 = 6 cells.
Phase 3:
```
$ gh run view 9911 --json jobs --jq '.jobs[] | [.name,.conclusion] | @tsv'
lint                              success
test (ubuntu-latest, 3.11)        success
test (ubuntu-latest, 3.12)        success
test (ubuntu-latest, 3.13)        success
test (windows-latest, 3.11)       failure
test (windows-latest, 3.12)       failure
test (windows-latest, 3.13)       failure
```
`--log-failed` shows `FileNotFoundError: '/tmp/fixtures'`: a hard-coded POSIX path in a test fixture, reported to the user as a real Windows bug. Check names recorded (7).

---

## Exit Criteria

DONE when the matrix runs every declared cell with `fail-fast: false`, failing cells are reported with logs, and `check_run_names` lists the API names.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Requested version outside declared support | **Return**: ask the user whether to change the declaration or drop the version. |
| Phase 2 | Setup action cannot find a version on an OS | **Adjust**: add an `exclude` entry for that pair and record why. |
| Phase 3 | All Windows cells fail on path or shell syntax | **Return**: report as a portability defect; do not drop Windows without the user. |
| Phase 3 | Check names differ from those previously required | **Return**: pass the new `check_run_names` to `ci0-gha-required-checks`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
