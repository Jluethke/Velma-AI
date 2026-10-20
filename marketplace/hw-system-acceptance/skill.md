# Hardware System Acceptance

**One-line description:** Runs final acceptance on the assembled product: harness continuity executed, board fitted in its enclosure, and every interface exercised against its real far end, with ACCEPTED only when every item passes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `bringup_log` (object[], required): Must show the board passed every bring-up step.
- `flash_log` (object, optional): Present when the product has firmware; must be PASS.
- `fit_report` (object, optional): Present when the product needs an enclosure; must be PASS.
- `continuity_test_plan` (object[], optional): Present when the product needs a harness.
- `board_spec` (object, required): Interfaces to exercise against real far ends.

---

## Outputs

- `acceptance_report` (object[]): Per item: what was checked, the measured result, PASS or FAIL.
- `acceptance_verdict` (string): "ACCEPTED" when every item passes, otherwise "REJECTED" with the failing items named.

---

## Phase 1: Prerequisites

### Entry Criteria
- `bringup_log` present.

### Actions
1. Confirm `bringup_log` ends with every step PASS.
2. If `flash_log` is present, confirm PASS. If `fit_report` is present, confirm PASS.
3. Record each optional input absent because its branch is out of scope, so absence is never mistaken for a pass.

### Output
Prerequisite entries.

### Quality Gate
- Every present prerequisite shows PASS.
- Every absent optional input is recorded as out of scope.

---

## Phase 2: Harness and Assembly

### Entry Criteria
- Prerequisites pass.

### Actions
1. If `continuity_test_plan` is present, have the person execute it on each built harness and record every reading against expected.
2. If an enclosure exists, assemble the board into it and confirm every connector mates fully with its real plug and every indicator is visible.

### Output
Harness and assembly entries.

### Quality Gate
- Every continuity, isolation, and shield test passes.
- Every connector mates fully in the assembled enclosure.

---

## Phase 3: Real-System Interfaces

### Entry Criteria
- Phase 2 passes.

### Actions
1. Connect the product to the real system through its harness.
2. Exercise each interface in `board_spec` against its real far end at its specified rate, and record the result (e.g., bus frames received with zero error frames over 10 minutes).
3. Repeat one emergency stop or interlock test in the real installation to confirm the safe state there.
4. Set `acceptance_verdict`.

### Output
`acceptance_report`, `acceptance_verdict`.

### Quality Gate
- Every interface in `board_spec` is exercised against its real far end.
- ACCEPTED only when every item passes.

---

## Exit Criteria

DONE when every interface works against its real far end, every in-scope branch (firmware, enclosure, harness) has passed, and the verdict reflects every item.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Prerequisite not PASS | **Stop**: return to its owning flow. |
| Phase 2 | Harness test fails | **Return**: to `harness-pinout-wiring` or rework the harness, then retest. |
| Phase 3 | Interface errors against the real far end | **Return**: record the failure to `hw-interface-spec` or the owning driver flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
