# PCB ERC and Netlist

**One-line description:** Runs SKiDL's electrical rules check to zero errors with justified waivers only, generates the KiCad netlist, and confirms the netlist part count equals the BOM quantity.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `skidl_source` (string, required): From `pcb-skidl-capture`.
- `bom` (object[], required): From `pcb-stock-sourcing`.

---

## Outputs

- `netlist` (string): Path to the generated KiCad netlist.
- `erc_report` (object): Error count (zero), warnings, and each waived warning with its written reason.

---

## Phase 1: Run ERC to Zero

### Entry Criteria
- `skidl_source` exists.

### Actions
1. Run the SKiDL file with ERC enabled.
2. Fix every error at its source in the SKiDL file.
3. Waive a warning only with a written reason (example: "pin driven through a jumper").
4. Rerun until zero errors.

### Output
`erc_report`.

### Quality Gate
- ERC reports zero errors.
- Every waived warning has a written reason.

---

## Phase 2: Generate and Check the Netlist

### Entry Criteria
- ERC at zero errors.

### Actions
1. Generate the KiCad netlist from the SKiDL file and record its path.
2. Count parts in the netlist and compare with the BOM quantity total.

### Output
`netlist`.

### Quality Gate
- Netlist part count equals BOM quantity total.

---

## Exit Criteria

DONE when the netlist regenerates from source with zero ERC errors and matches the BOM count.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Error cannot be resolved in source | **Escalate**: report net, pins, and conflict; never waive an error. |
| Phase 2 | Count mismatch | **Adjust**: list the missing or extra parts and return to `pcb-skidl-capture`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
