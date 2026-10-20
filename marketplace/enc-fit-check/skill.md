# Enclosure Fit Check

**One-line description:** Proves an enclosure fits its board before anything is made: zero interference volume between board and enclosure, clearance above the tallest part, every connector's mating plug clearing its cutout, and every wall and feature meeting the process minimums.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `enclosure_source` (string, required): build123d model from `enc-parametric-model`.
- `board_step` (string, required): Board STEP model with components.
- `board_envelope` (object, required): Connector mating plug envelopes and clearances.

---

## Outputs

- `fit_report` (object): Interference volume, minimum clearance per side, per-connector plug clearance, minimum wall and feature measured, and PASS or FAIL per check with the overall verdict.

---

## Phase 1: Interference

### Entry Criteria
- Model and STEP present.

### Actions
1. Regenerate the enclosure from `enclosure_source` and import `board_step` into the same build123d session, placed on the standoffs.
2. Compute the Boolean intersection volume between the board assembly and each enclosure part.
3. Measure the minimum distance from the board assembly to the enclosure on top, bottom, and each side.

### Output
Interference volume and clearances.

### Quality Gate
- Intersection volume is 0 mm3 for every part.
- Each clearance meets the value set in the model's parameter block.

---

## Phase 2: Mating Access

### Entry Criteria
- Phase 1 passes.

### Actions
1. For each connector, build a solid from its datasheet mating plug envelope at full insertion depth.
2. Intersect each plug solid with the enclosure; the volume must be 0 mm3.
3. Confirm finger or tool access for latching connectors: 5 mm clear around each latch.

### Output
Per-connector access results.

### Quality Gate
- Every plug solid has zero interference at full insertion.
- Every latch has 5 mm clearance.

---

## Phase 3: Manufacturability

### Entry Criteria
- Phase 2 passes.

### Actions
1. Measure the thinnest wall and smallest feature in each part.
2. Compare against the process minimums in the model's parameter block.
3. Set the verdict PASS only when every check passes.

### Output
`fit_report`.

### Quality Gate
- Thinnest wall and smallest feature meet the process minimums.
- Verdict is PASS only with every check passing.

---

## Exit Criteria

DONE when the report shows zero interference, full mating access, and process-compliant geometry, or names each failing check with its measurement.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Interference found | **Return**: report location and volume to `enc-parametric-model`. |
| Phase 2 | Plug collides with cutout | **Return**: report the connector and overlap to `enc-parametric-model`. |
| Phase 3 | Wall below minimum | **Return**: report part and thickness to `enc-parametric-model`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
