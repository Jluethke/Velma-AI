# PCB Review Verdict

**One-line description:** Collects the power-input, isolation, and interlock findings into one review report, writes the exact schematic change for every failure, and sets the verdict that either releases the design to layout or loops it back to part selection.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `power_input_findings` (object[], required): From `pcb-power-input-review`.
- `isolation_findings` (object[], required): From `pcb-isolation-review`.
- `interlock_findings` (object[], required): From `pcb-interlock-fault-review`.
- `creepage_constraints` (object[], required): From `pcb-isolation-review`, passed through to layout.

---

## Outputs

- `review_report` (object[]): Every finding from all three reviews with PASS or FAIL, plus the creepage constraints layout must honor.
- `review_changes` (object[]): For each FAIL, the part, value, or topology change and the requirement it fixes. Empty when everything passes.
- `review_verdict` (string): "PASS" when `review_changes` is empty, otherwise "CHANGES_REQUIRED".

---

## Phase 1: Collect

### Entry Criteria
- All three finding sets present (an empty set with a note counts as present).

### Actions
1. Merge all findings into `review_report`, keeping each finding's numbers and datasheet citations.
2. Attach `creepage_constraints` to the report.
3. Track the pass number of this review loop; the first run is pass 1.

### Output
Merged `review_report`.

### Quality Gate
- Every finding from every input appears in the report unchanged.

---

## Phase 2: Decide

### Entry Criteria
- Report merged.

### Actions
1. Copy each FAIL into `review_changes` as an actionable change: the part to swap, the value to change, or the topology to add, with the failed requirement.
2. Merge duplicate changes that fix the same root cause.
3. Set `review_verdict`. On CHANGES_REQUIRED the chain returns to `pcb-part-selection` with `review_changes`, then repeats the reviews.
4. If this is pass 3 and changes remain, stop and escalate with the requirement that keeps failing and the tradeoff blocking it.

### Output
`review_changes`, `review_verdict`.

### Quality Gate
- Each change names a concrete part, value, or topology and the requirement it fixes.
- PASS only when zero FAILs remain.
- The loop never exceeds 3 passes.

---

## Exit Criteria

DONE at PASS, with a complete report and creepage constraints for layout, or at an escalation after pass 3. Layout never starts without PASS.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A finding set is missing | **Stop**: rerun the review that produces it. |
| Phase 2 | A FAIL has no actionable change | **Adjust**: derive the change from the failed requirement; if none exists, escalate. |
| Phase 2 | Pass 3 still has changes | **Escalate**: report the persistent failure and its tradeoff. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
