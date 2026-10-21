# PCB Assembly Files

**One-line description:** Produces the BOM and component placement (CPL) files in the fab's exact column format, rechecks stock for every part at export time, and corrects part rotations against the fab's placement preview.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `kicad_pcb` (string, required): DRC-clean board.
- `bom` (object[], required): BOM with fab part numbers and recorded alternates.
- `board_spec` (object, required): Fab target and assembly service.

---

## Outputs

- `assembly_files` (object): Paths to the BOM and CPL files, the stock check result per line with date, and every rotation correction applied.

---

## Phase 1: Export BOM and Placement

### Entry Criteria
- Assembly is in scope for the fab target.

### Actions
1. Write the BOM with the fab's required columns (for JLCPCB: Comment, Designator, Footprint, LCSC part number), grouping identical parts.
2. Run `kicad-cli pcb export pos` and convert to the fab's placement columns (for JLCPCB: Designator, Mid X, Mid Y, Layer, Rotation) in millimeters.
3. Re-check stock for every fab part number by searching the fab's parts library; swap any out-of-stock line to its recorded pin-compatible alternate.

### Output
BOM and CPL files with stock record.

### Quality Gate
- Every BOM line has an in-stock fab part number at export, with the date.
- Every placed part on the board appears in the CPL.

---

## Phase 2: Rotation Check

### Entry Criteria
- Files uploaded to the fab's quote tool.

### Actions
1. Inspect the fab's placement preview for every part.
2. Correct any part whose orientation differs between the KiCad footprint and the fab's library model; record each correction in degrees.
3. Confirm polarized parts (diodes, electrolytics, ICs) show pin 1 or cathode on the marked pad.

### Output
`assembly_files` with corrections.

### Quality Gate
- Every part's rotation is confirmed against the preview.
- Every correction is recorded.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Produce BOM and placement files in the fab's exact columns, recheck stock at exp, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when BOM and CPL match the fab format, every part is in stock at export, and every rotation is confirmed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Out of stock with no alternate | **Stop**: return to `pcb-stock-sourcing` with the line. |
| Phase 1 | Assembly not in scope | **Skip**: output the BOM only for hand assembly. |
| Phase 2 | Polarized part reversed in preview | **Adjust**: rotate 180 degrees in the CPL, record it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
