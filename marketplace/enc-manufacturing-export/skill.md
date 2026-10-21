# Enclosure Manufacturing Export

**One-line description:** Exports a fit-checked enclosure as STEP and STL per part with print or machining notes for the chosen process, and a hardware BOM of screws, inserts, and gaskets with manufacturer part numbers.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `enclosure_source` (string, required): build123d model.
- `fit_report` (object, required): Must carry an overall PASS.
- `enclosure_process` (string, optional): "fdm", "sla", "cnc", or "injection". Default: "fdm".

---

## Outputs

- `enclosure_files` (object): Paths to STEP and STL for each part, plus the process notes file.
- `enclosure_hardware_bom` (object[]): Each fastener, insert, gasket, light pipe, and foot with quantity, manufacturer part number, and datasheet URL.

---

## Phase 1: Export Parts

### Entry Criteria
- `fit_report` verdict is PASS.

### Actions
1. Regenerate the model and export each part as STEP (for machining or quoting) and STL (for printing).
2. Re-import each STL and confirm it is a closed manifold.
3. Write process notes: for FDM, print orientation per part (opening facing up, no supports inside connector cutouts), layer height 0.2 mm, material (PETG or ASA for heat, PLA only for bench use); for SLA, resin and post-cure; for CNC, material, finish, and tolerance callouts on mating features; for injection, draft and gate notes for the molder.

### Output
`enclosure_files`.

### Quality Gate
- One STEP and one STL per part.
- Every STL is a closed manifold.
- Material choice matches the environment's temperature range from `board_spec` if known.

---

## Phase 2: Hardware BOM

### Entry Criteria
- Parts exported.

### Actions
1. List every fastener the model calls for with thread, length, and head, and every heat-set insert sized to the bore in the model.
2. Add gaskets for sealed designs, light pipes for LED windows, and feet.
3. For each item, record a manufacturer part number and datasheet URL, and confirm the insert's bore and length match the model.

### Output
`enclosure_hardware_bom`.

### Quality Gate
- Every fastener feature in the model has a BOM line.
- Every insert's specified bore matches the modeled bore.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Export a fit-checked enclosure as STEP and STL per part with process notes, and , the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when every part has manufacturable files with process notes and every piece of hardware the model calls for is in the BOM with a real part number.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `fit_report` not PASS | **Stop**: return to `enc-fit-check`. |
| Phase 1 | STL not manifold | **Return**: report the part to `enc-parametric-model`. |
| Phase 2 | Insert bore mismatches model | **Return**: report the required bore to `enc-parametric-model`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
