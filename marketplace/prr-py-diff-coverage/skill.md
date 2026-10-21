# Python Changed-Line Coverage with coverage.py and diff-cover

**One-line description:** Measures line and branch coverage of only the lines the PR changed by running pytest under coverage.py with branch tracking, feeding the Cobertura XML to diff-cover against the merge base, and turning every uncovered changed line in production code into a finding tied to the behavior it implements.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Local clone with the PR head checked out.
- `base_branch` (string, required): PR target branch.
- `coverage_package` (string, required): Import package or source directory to measure, for example `billing` or `src/billing`.
- `findings_dir` (string, required): Findings directory.
- `min_diff_coverage` (integer, optional): The team's required percentage for changed lines. If absent, report the number without a pass/fail verdict; do not pick a threshold.

---

## Outputs

- `diff_coverage_report` (object): diff-cover totals: total changed lines, missing lines per file, percentage, and pass/fail against `min_diff_coverage` when given.
- `coverage_findings` (object[]): One finding per uncovered changed block, written to `<findings_dir>/prr-py-diff-coverage.json`.

---

## Phase 1: Produce a Branch Coverage XML

### Entry Criteria
- `pytest`, `pytest-cov` (or `coverage`) and `diff-cover` are importable: `python -m pytest --version`, `python -m coverage --version`, `diff-cover --version`.

### Actions
1. Check for existing config in `pyproject.toml` `[tool.coverage.run]`, `.coveragerc`, or `setup.cfg` `[coverage:run]`. Do not change it.
2. Run the suite with branch coverage and Cobertura XML output:
   `python -m pytest --cov=<coverage_package> --cov-branch --cov-report=xml:coverage.xml -q`
   Equivalent without pytest-cov: `python -m coverage run --branch -m pytest -q` then `python -m coverage xml -o coverage.xml`.
3. If tests run in parallel with `pytest-xdist` (`-n`), pytest-cov combines data automatically; with plain coverage use `parallel = true` in config and run `coverage combine` before `coverage xml`.
4. Confirm the XML paths match repository paths: `grep -m3 'filename=' coverage.xml`. If filenames are relative to a `<source>` directory that diff-cover cannot map, set `relative_files = true` in a temporary copy of the config passed with `--cov-config=<tmpfile>`, never in the author's committed file.

### Output
`coverage.xml` with branch data.

### Quality Gate
- pytest exited 0 (a failing suite makes coverage meaningless; see Error Handling).
- `grep -c 'branch="true"' coverage.xml` is greater than 0, proving branch data was recorded.

---

## Phase 2: Run diff-cover Against the Merge Base

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Run diff-cover comparing against the remote base (it diffs against the merge base by default):
   `diff-cover coverage.xml --compare-branch=origin/<base_branch>`
2. Add a machine-readable report. The flag differs by version, so run `diff-cover --help` first: recent releases accept `--format json:diff-cover.json`, older ones accept `--json-report diff-cover.json`. Use whichever the help lists.
3. If `min_diff_coverage` was supplied, add `--fail-under=<min_diff_coverage>`; diff-cover exits non-zero when coverage is below it.
4. Read the console report: it lists each changed file with its percentage and `Missing lines 14,22-25`. Lines listed as missing were changed in the PR and never executed by any test.

### Output
`diff_coverage_report`.

### Quality Gate
- diff-cover's printed "Total" line count is greater than 0 (0 means the paths did not match; see Error Handling).
- The exit code is recorded, and when `min_diff_coverage` is set it matches the pass/fail verdict.

---

## Phase 3: Turn Missing Lines into Findings

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. For each missing line range, open the code and name the behavior it implements (for example "the `except TimeoutError` branch that retries").
2. Label with this table:

| Uncovered changed code | Label |
|---|---|
| Error handling, validation rejection, or security check | blocking: these paths fail silently in production when untested |
| Business logic branch named in an acceptance criterion | blocking |
| Logging, `__repr__`, defensive `raise` for impossible states | nit |
| Code excluded by a `# pragma: no cover` the PR added | question: ask why it cannot be tested |

3. Remember that covered is not tested: a covered line may have no assertion on its effect. That is checked by `prr-test-revert-check` and `prr-py-mutmut-check`; do not mark a line as verified because it is covered.
4. Write `<findings_dir>/prr-py-diff-coverage.json` (fields `flow`, `category`="tests", `file`, `line`, `evidence` = the diff-cover missing-lines text, `proposed_label`, `fix` = the test case to add) and validate with `python -m json.tool`.

### Output
`coverage_findings`.

### Quality Gate
- Every missing range from diff-cover appears in exactly one finding.
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. `coverage_package=billing`, `min_diff_coverage` not supplied.

- Phase 1: `python -m pytest --cov=billing --cov-branch --cov-report=xml:coverage.xml -q` prints `41 passed`; `grep -c 'branch="true"' coverage.xml` prints 37.
- Phase 2: `diff-cover coverage.xml --compare-branch=origin/main` prints:
  ```
  billing/tax.py (77.8%): Missing lines 44-47
  billing/invoice.py (100%)
  Total:   28 lines
  Missing: 4 lines
  Coverage: 85%
  ```
- Phase 3: lines 44-47 are `except InvalidOperation: raise TaxError(...)`. Finding: blocking, fix "add a test passing `Decimal('NaN')` and asserting `TaxError`". No pass/fail verdict because no threshold was supplied.

---

## Exit Criteria

DONE when coverage with branch data was collected from a passing suite, diff-cover reported changed-line coverage against the merge base, and every missing range is a labeled finding with the test to add.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Test suite fails | **Stop**: report the failing tests as blocking; coverage from a failing run is not reported. |
| Phase 2 | diff-cover reports "No lines with coverage information in this diff" | **Retry**: path mismatch; regenerate XML with `relative_files = true` in a temporary config and rerun. |
| Phase 2 | `--compare-branch` ref not found | **Adjust**: run `git fetch origin <base_branch>` first. |
| Phase 3 | `min_diff_coverage` missing and the user asks for pass/fail | **Return**: ask for the team threshold; do not invent one. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
