# PCB Power Input Review

**One-line description:** Reviews a board's power-input protection at worst case against datasheets: reverse polarity, transient suppression standoff and clamp, and fusing, producing PASS or FAIL findings with the numbers behind each.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `skidl_source` (string, required): Path to the SKiDL design file.
- `bom` (object[], required): BOM with datasheet URLs.
- `board_spec` (object, required): Environment transient profile and power tree.
- `critical_circuits` (object[], required): Critical circuits with survival requirements; this flow covers the power-input entries.

---

## Outputs

- `power_input_findings` (object[]): Per check: the requirement, the worst case analyzed, the computed numbers, the datasheet lines relied on, and PASS or FAIL with the exact schematic change for each FAIL.

---

## Phase 1: Map the Input Path

### Entry Criteria
- All inputs present.

### Actions
1. In the SKiDL source, trace the path from the power connector to the first regulator: fuse or current limit, reverse protection, transient suppressor, bulk capacitance, then each regulator input.
2. List each part on the path with its BOM datasheet.
3. If any protection function required by `critical_circuits` or the environment profile has no part on the path, record a FAIL naming the missing function.

### Output
Ordered input path with parts and datasheets.

### Quality Gate
- Every part between the connector and the first regulator is listed in current-flow order.
- Every required protection function maps to a part or carries a FAIL.

---

## Phase 2: Reverse Polarity

### Entry Criteria
- Input path mapped.

### Actions
1. Apply the input reversed indefinitely and trace current through the path.
2. Confirm no downstream part sees reverse voltage beyond its absolute maximum rating. Quote the rating line.
3. Compute dissipation in the protection device in normal forward operation (diode: Vf x I; MOSFET: I^2 x Rds(on) at the hot temperature from the datasheet curve) and confirm it stays within the device's rating at the board's ambient.
4. Record forward loss in watts so the efficiency stages can compare protection topologies.

### Output
Reverse polarity entries in `power_input_findings`.

### Quality Gate
- The reversed case states the voltage each downstream part sees with the rating it is compared to.
- Forward dissipation is computed with a cited datasheet value.

---

## Phase 3: Transients and Fusing

### Entry Criteria
- Phase 2 complete.

### Actions
1. Confirm the TVS standoff voltage sits above the highest sustained input in the environment profile (for 12V vehicle systems, jump start near 24V), so it never conducts in normal service.
2. For the environment's worst pulse, read the clamp voltage at peak pulse current from the TVS datasheet curve and confirm every downstream absolute maximum exceeds it.
3. Confirm a fuse or current limit sits upstream of everything, rated above worst-case load from the power tree and below the rating of the trace and connector it protects.

### Output
Transient and fusing entries in `power_input_findings`.

### Quality Gate
- Standoff is above max sustained input, with both numbers stated.
- Clamp at peak pulse current is below every downstream absolute maximum, with the datasheet line quoted.
- Fuse rating sits between load current and conductor rating.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Review power-input protection at worst case against datasheets: reverse polarity, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when every power-input requirement has a PASS or FAIL with numbers and datasheet citations, and every FAIL names the exact part, value, or topology change.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No protection on the input path | **FAIL**: require fuse, reverse protection, and TVS per the environment. |
| Phase 3 | TVS datasheet lacks a clamp curve | **Adjust**: use the stated maximum clamp at rated peak pulse current; if absent, FAIL and require a part that publishes it. |
| Phase 3 | Environment profile missing | **Adjust**: apply the harshest profile the input voltage implies and record the assumption. |

---

## Reference Section

### Reverse Protection Topologies and Forward Loss
- Series Schottky: loss = Vf x I (about 0.4 to 0.5 V).
- P-channel MOSFET: loss = I^2 x Rds(on).
- Ideal diode controller with N-channel MOSFETs: loss = I^2 x Rds(on), also blocks reverse current during input dips.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
