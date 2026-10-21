# PCB SKiDL Capture

**One-line description:** Writes the board's schematic as SKiDL source in the user's project, one subcircuit per function, with named inter-subcircuit nets, every datasheet-required decoupling capacitor, and explicit no-connects.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `bom` (object[], required): From `pcb-stock-sourcing`.
- `board_spec` (object, required): From `hw-spec-consolidate`.
- `critical_circuits` (object[], required): From `hw-critical-circuit-flagging`.
- `project_dir` (string, required): User project directory. The SKiDL file is the board's design source there, never a file inside this flow.

---

## Outputs

- `skidl_source` (string): Path to the SKiDL design file in `project_dir`.

---

## Phase 1: Structure the Design File

### Entry Criteria
- `bom` complete.

### Actions
1. Create the SKiDL file in `project_dir` and set the tool to KiCad 9.
2. Define each BOM part with its library symbol, value, footprint, and fab part number as a field.
3. Create one subcircuit per function: power input and protection, each rail, each interface, each critical circuit, so each is reviewable alone.

### Output
Skeleton `skidl_source`.

### Quality Gate
- Every BOM line has a part definition with footprint and fab part number.
- Every critical circuit has its own subcircuit.

---

## Phase 2: Connect

### Entry Criteria
- Skeleton exists.

### Actions
1. Wire each subcircuit per the datasheet typical application and the selected architecture.
2. Name every net that leaves a subcircuit: upper case, function first, then index (`VBAT_RAW`, `VIN_PROT`, `V3V3`, `CAN1_H`, `ESTOP_LOOP`).
3. Place every decoupling and bulk capacitor each datasheet calls for, per pin, at the stated value.
4. Mark every unused pin as no-connect explicitly.

### Output
`skidl_source`.

### Quality Gate
- Every part in `bom` appears in the source and nothing absent from `bom` does.
- Every datasheet-required decoupling capacitor is present.
- Every inter-subcircuit net is named; every unused pin is marked.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Write the board schematic as SKiDL source with one subcircuit per function, name, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when the SKiDL file contains every BOM part, connected per datasheets, with named interfaces between subcircuits.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Library symbol missing in KiCad 9 | **Adjust**: define the part in SKiDL from the datasheet pin table; cite the table. |
| Phase 2 | Decoupling value not stated in datasheet | **Adjust**: use 100 nF per supply pin plus one bulk capacitor per rail; record the default. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
