# Requirements Traceability Matrix

**One-line description:** Builds a requirement-to-code-to-test-to-result matrix by parsing requirement IDs out of the JUnit report, public suite results, interop report and differential log, plus `REQ-` tags in source code, then lists every requirement with no test, no passing result, or no implementing code as a coverage gap.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `requirements_table` (object[], required): From `s2i-requirements-table`.
- `junit_report` (string, required): Path to the JUnit XML from the stack conformance flow (`s2i-py-pytest-conformance`, `s2i-node-test-conformance`, `s2i-go-test-conformance`, or `s2i-rust-cargo-conformance`); default `reports/conformance-junit.xml`.
- `suite_results` (object[], optional): From `s2i-public-test-suite-run`.
- `interop_report` (object[], optional): From `s2i-interop-reference-impl`.
- `divergence_log` (object[], optional): From `s2i-differential-reference-lib`.
- `ambiguity_log` (object[], required): From `s2i-ambiguity-log`.
- `project_dir` (string, required): Repository root.

---

## Outputs

- `traceability_matrix` (object[]): Rows `{ "req_id", "level", "applies", "code_refs": [], "tests": [{"name","result","source"}], "status" }`, written to `reports/traceability.csv` and `.md`.
- `coverage_gaps` (object[]): Rows `{ "req_id", "gap": "NO_TEST|NO_PASS|NO_CODE_REF|ONLY_SKIPPED", "detail" }`.

---

## Phase 1: Collect Evidence by Requirement ID

### Entry Criteria
- `junit_report` file exists.

### Actions
1. Pull IDs from the JUnit report. Requirement IDs sit in different places per stack:

   | Stack flow | Where the ID is |
   |---|---|
   | pytest | `<property name="req_ids" value="REQ-5.1-02"/>` inside each `<testcase>` |
   | node:test | `[REQ-...]` inside the `name` attribute |
   | go test via gotestsum | `REQ-...` inside the `name` attribute (subtest path) |
   | cargo-nextest | `req_5_1_02` in the `name`; convert `req_` + underscores back to `REQ-5.1-02` using the requirements table as the lookup |

2. Parse with a script (Python standard library `xml.etree.ElementTree`): for each `<testcase>`, result is `failed` if it has a `<failure>` or `<error>` child, `skipped` if `<skipped>`, else `passed`. Never infer a result from the test name.
3. Add rows from `suite_results.failures`, `interop_report`, and `divergence_log` (class `OUR_BUG` counts as a failure for its requirement) when those inputs are present.
4. Find code references: `rg -n --no-heading 'REQ-[0-9A-Za-z.]+-[0-9]{2}[a-z]?' src/ lib/ internal/ 2>/dev/null` (adjust directories to the repo; exclude test directories). Implementation code should carry a comment like `// REQ-5.1-02: close on unmasked frame` at the enforcing line.

### Output
Evidence lists keyed by requirement ID.

### Quality Gate
- Number of `<testcase>` elements parsed equals `grep -c '<testcase' <junit_report>`.
- Every ID found in evidence exists in `requirements_table` (print unknown IDs; the list must be empty or each unknown ID fixed at its source).

---

## Phase 2: Compute Status

### Entry Criteria
- Evidence lists.

### Actions
1. For each requirement row, set `status` with the first matching rule:

   | Condition | `status` |
   |---|---|
   | `testability` = review_only | `REVIEW` (needs a checklist entry with evidence) |
   | no tests at all | `UNTESTED` |
   | any linked test failed | `FAILING` |
   | all linked tests skipped | `SKIPPED_ONLY` |
   | at least one passed, none failed | `PASSING` |

2. Add a coverage gap row for: `UNTESTED` (`NO_TEST`), `FAILING` (`NO_PASS`), `SKIPPED_ONLY` (`ONLY_SKIPPED`), and any `applies` = yes requirement with no code reference (`NO_CODE_REF`, lower priority).
3. Requirements with `applies` = no and no detection duty are listed with status `N/A`, not as gaps.
4. Link each ambiguity: a requirement whose behavior depends on an `ambiguity_log` decision gets the `AMB-` ID in its row.

### Output
Matrix with status and gaps.

### Quality Gate
- Every row of `requirements_table` appears exactly once in the matrix (row counts equal).
- Every `status` comes from the table above.

---

## Phase 3: Publish

### Entry Criteria
- Statuses computed.

### Actions
1. Write `reports/traceability.csv` with columns `req_id,level,applies,status,tests,code_refs,amb_ids`.
2. Write `reports/traceability.md` with a summary block: counts per status for MUST/MUST_NOT, SHOULD/SHOULD_NOT and MAY separately (MUST failures matter most).
3. Write `coverage_gaps` to `reports/coverage_gaps.json`, sorted: `NO_PASS` on MUST rows first, then `NO_TEST` on MUST rows, then the rest.
4. Do not mark a requirement `PASSING` by hand. Every status comes from the script run in Phase 1 and 2; rerun the script after any test change.

### Output
`traceability_matrix`, `coverage_gaps`.

### Quality Gate
- The summary counts in `traceability.md` add up to the requirement count.
- The script that produced the matrix is committed (for example `tools/trace.py`) and rerunning it produces an identical CSV (`git diff --exit-code reports/traceability.csv`).

---

## Worked Example

Illustrative. RFC 6455 server, Go stack.

Phase 1:
```
$ grep -c '<testcase' reports/conformance-junit.xml
63
$ rg -n --no-heading 'REQ-[0-9A-Za-z.]+-[0-9]{2}[a-z]?' internal/
internal/ws/frame.go:88:// REQ-5.1-02: close on unmasked client frame
```
Phase 2:
```
req_id,level,applies,status,tests,code_refs,amb_ids
REQ-5.1-02,MUST,yes,PASSING,"TestSec5_1/T-5.1-02-01/REQ-5.1-02;autobahn:1.x",internal/ws/frame.go:88,
REQ-5.5.1-03,MUST,yes,FAILING,"TestSec5_5/T-AMB-004-01/REQ-5.5.1-03",internal/ws/close.go:41,AMB-004
REQ-7.4.1-02,SHOULD,yes,UNTESTED,,,
```
Phase 3: Summary: MUST 41 PASSING, 1 FAILING, 0 UNTESTED; SHOULD 9 PASSING, 1 UNTESTED. `coverage_gaps` starts with REQ-5.5.1-03 `NO_PASS`.

---

## Exit Criteria

DONE when every requirement has exactly one matrix row with a script-derived status, code references and linked tests, and every gap is listed in priority order.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | JUnit report has no IDs | **Return** to the stack conformance flow; tests are missing their ID tags. |
| Phase 1 | Unknown IDs in evidence | **Adjust**: fix typos in tests or code tags; never add rows to the requirements table to absorb typos. |
| Phase 2 | Requirement covered only by a public suite case | **Adjust**: count it as tested and cite the suite case in `tests`. |
| Phase 3 | Rerun produces a different CSV | **Stop**: the script is non-deterministic (unsorted output); sort rows by `req_id`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
