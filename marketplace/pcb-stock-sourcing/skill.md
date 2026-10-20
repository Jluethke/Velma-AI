# PCB Stock Sourcing

**One-line description:** Confirms every selected part is in stock at the fab's parts library, records a pin-compatible alternate for each, chooses KiCad 9 footprints that match the datasheet land patterns, and emits the BOM.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `part_candidates` (object[], required): From `pcb-part-selection`.
- `board_spec` (object, required): For the fab target and assembly plan.

---

## Outputs

- `bom` (object[]): Reference designator prefix, value, quantity, manufacturer part number, fab part number (LCSC for JLCPCB), stock and date checked, library tier (basic or extended), pin-compatible alternate with its fab part number, KiCad footprint (library:name) or custom footprint task with datasheet drawing page, datasheet URL.

---

## Phase 1: Confirm Stock

### Entry Criteria
- `part_candidates` present.

### Actions
1. Search the fab's parts library by manufacturer part number for each part and record the fab part number, stock count, and date.
2. When assembly is planned, prefer basic-library parts; record the tier.
3. For each part, find a pin-compatible alternate with equal or better ratings and record it with its fab part number and stock.
4. Compute each part's required quantity: build quantity times quantity per board, plus the fab's published assembly attrition for that package type (cite the fab's page). Replace any part whose stock is below its required quantity by its alternate and recheck its margins against `part_candidates`. If the user gave a planned production volume, flag every part whose stock covers less than that volume; if not, record the volume as an open question.

### Output
Stock-confirmed part list.

### Quality Gate
- Every part has a fab part number, stock, and date.
- Every part has a recorded alternate.

---

## Phase 2: Assign Footprints

### Entry Criteria
- Stock confirmed.

### Actions
1. For each part, compare the datasheet land pattern to KiCad 9 standard library footprints and choose an exact match.
2. When none matches, record a custom footprint task citing the datasheet drawing page.
3. Emit the `bom`.

### Output
`bom`.

### Quality Gate
- Every BOM line has a footprint or a custom footprint task with a cited drawing page.
- Every BOM line has a datasheet URL.

---

## Exit Criteria

DONE when every part is in stock with a recorded alternate and every line has a datasheet-matched footprint.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Part and alternate both out of stock | **Escalate**: return the function to `pcb-part-selection`. |
| Phase 2 | Footprint dimensions ambiguous in datasheet | **Adjust**: use the manufacturer's recommended land pattern drawing or IPC-7351 nominal; record the source. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
