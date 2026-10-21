# Verification Evidence Summary

**One-line description:** Collects the guideline plan, triaged findings, deviation records, sanitizer results, coverage gaps and compiler output review into one evidence index with per-item status and open questions, structured like a MISRA Compliance:2020 guideline compliance summary, without claiming compliance or certification.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `guideline_plan` (object, required): From `sccpp-standard-select`.
- `triaged_findings` (object[], required): From `sccpp-findings-triage`.
- `deviation_records` (object[], required): From `sccpp-deviation-record`.
- `sanitizer_report` (object, required): From `sccpp-sanitizer-test-build`.
- `coverage_gaps` (object[], required): From `sccpp-mcdc-gap-closure`.
- `asm_review` (object, required): From `sccpp-compiler-output-review`.

---

## Outputs

- `evidence_summary` (object): Per guideline: category, enforcement method, status (no violations found by the listed methods, deviated with record ID, open defect, not checked), plus sections for sanitizer, coverage and machine code review status, every open question, and the tool versions and commands used.

---

## Phase 1: Build the Guideline Status Table

### Entry Criteria
- All six inputs present. If one is missing, list the missing flow and stop.

### Actions
1. For each guideline in `guideline_plan`, assign a status with this table:

| Evidence | Status |
|---|---|
| A defect in `triaged_findings` for this guideline is not yet fixed | open defect |
| Violations exist and every one has a record in `deviation_records` | deviated (list record IDs) |
| Tools listed in the plan ran and reported nothing, and the guideline is decidable | no violations found by listed methods |
| Guideline is undecidable or manual review only, and the review record exists | reviewed (cite record) |
| No tool ran and no review exists | not checked |

2. Use the exact status words. Never write "compliant" or "certified".

### Output
Guideline status table.

### Quality Gate
- Row count equals the guideline count in `guideline_plan`.
- Every "deviated" row lists record IDs found in `deviation_records`.

---

## Phase 2: Add Test, Coverage and Review Status

### Entry Criteria
- Guideline table complete.

### Actions
1. Sanitizer: copy the final run result and command from `sanitizer_report`; status "zero reports" only if its final grep count is 0.
2. Coverage: copy the measured percentages per module and every entry in `coverage_gaps` with its class.
3. Machine code review: list each critical function with "checklist complete" or its open items from `asm_review`.
4. Tool versions: collect every tool version and command recorded by the inputs.

### Output
Complete draft `evidence_summary`.

### Quality Gate
- Every number in the summary is copied from an input, with the input named.

---

## Phase 3: Open Questions and Handover

### Entry Criteria
- Draft complete.

### Actions
1. Collect every open question from all inputs into one numbered list with owner and source flow.
2. Add a statement: "This summary records engineering verification evidence. It is not a claim of compliance with MISRA, AUTOSAR, ISO 26262 or any other standard."
3. Save as `safety/evidence_summary.json` and a readable `safety/evidence_summary.md` in the project (not in the marketplace).
4. Approvals of deviation records remain "pending approval" unless the user supplies the approver.

### Output
`evidence_summary`.

### Quality Gate
- `python -c "import json;json.load(open('safety/evidence_summary.json'))"` exits 0.
- `grep -ciE "\bcompliant\b|certified" safety/evidence_summary.md` prints 0 except inside the disclaimer sentence (check the line).

---

## Worked Example

Illustrative only. Body controller, MISRA C:2012.

| Guideline | Category | Status |
|---|---|---|
| Rule 17.2 | Required | no violations found by listed methods (misc-no-recursion, misra-c2012-17.2) plus manual review of 3 function pointer sites |
| Rule 11.4 | Advisory | deviated (DEV-R11.4-001, pending approval) |
| Rule 10.3 | Required | open defect (src/heat.c:41) |

Sanitizer: zero reports (`ctest --test-dir build/sanitizer`). Coverage: wss.c MC/DC 100.00 percent; 1 defensive gap justified. Open questions: 4, including pool size for the DTC queue.

---

## Exit Criteria

DONE when every guideline has a status from the fixed table, test, coverage and machine code status are copied from their inputs, all open questions are listed, and the disclaimer is present.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | An input flow was skipped | **Stop**: list the missing flow; the summary is incomplete without it. |
| Phase 1 | Deviation record ID referenced but not found | **Return**: send back to `sccpp-deviation-record`. |
| Phase 2 | Numbers disagree between inputs | **Adjust**: quote both with sources and add an open question. |
| Phase 3 | User asks for a "compliance certificate" | **Return**: explain the summary is evidence only; an assessment is done by the project's assessor. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
