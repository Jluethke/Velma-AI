# PCB Part Selection

**One-line description:** Realizes the selected architecture with parts chosen from their datasheets, each with quoted ratings that meet voltage and current margins, preferring higher efficiency and smaller packages among qualifying parts, and applying any required review changes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `board_spec` (object, required): From `hw-spec-consolidate`.
- `critical_circuits` (object[], required): From `hw-critical-circuit-flagging`.
- `selected_architecture` (object, required): From `hw-architecture-scoring`.
- `review_changes` (object[], optional): Required changes from `pcb-review-verdict` on a prior pass. Default: empty (first pass).

---

## Outputs

- `part_candidates` (object[]): One entry per function: chosen manufacturer part number, quoted datasheet rating lines with page references, computed margin against the worst-case condition, efficiency or loss at the operating point where relevant, package, and the review change applied if any.

---

## Phase 1: Choose Parts per Block

### Entry Criteria
- `selected_architecture` and `board_spec` present.

### Actions
1. For each block, start from the parts named in `selected_architecture` and confirm them against the block's worst-case conditions from `board_spec`.
2. Open each datasheet and quote the lines for absolute maximum voltage, rated current, and operating temperature. Never select from memory alone.
3. Compute margins: voltage rating at least 1.5x the worst transient that reaches the part after protection; current rating at least 1.25x worst-case continuous; ceramic capacitors in power paths rated at least 2x the rail for DC bias derating.
4. Among parts that meet margins, prefer the higher efficiency or lower loss at the operating point, then the smaller package, then the lower price.

### Output
Draft `part_candidates`.

### Quality Gate
- Every function has a part with quoted rating lines and page references.
- Every margin meets the stated multipliers.

---

## Phase 2: Apply Review Changes

### Entry Criteria
- Draft exists.

### Actions
1. For each entry in `review_changes`, apply the exact change (part, value, or topology) and mark it applied with the review finding it answers.
2. Recheck margins on every changed part.

### Output
`part_candidates`.

### Quality Gate
- Every `review_changes` entry is marked applied.
- Changed parts still meet all margins.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Realize the selected architecture with datasheet-justified parts meeting voltage, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when every function in the selected architecture has a datasheet-justified part meeting margins, and every prior review change is applied.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Named part fails a margin | **Adjust**: choose a higher-rated part in the same function; record the substitution. |
| Phase 1 | Datasheet unavailable | **Reject**: choose a part whose datasheet is public. |
| Phase 2 | Review change conflicts with selected architecture | **Escalate**: report the conflict; safety change wins over the architecture. |

---

## Reference Section

### Margins
- Voltage: 1.5x the worst post-protection transient.
- Current: 1.25x worst-case continuous.
- Ceramic capacitors in power paths: rated at least 2x the rail.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
