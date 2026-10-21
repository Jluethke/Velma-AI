# Firmware Pin Map

**One-line description:** Derives the exact pin map for a board's programmable device from its netlist, with every pin's peripheral function confirmed against the datasheet and a safe reset state, and reports any pin-function conflict as a schematic defect.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `netlist` (string, required): Path to the board's KiCad netlist.
- `bom` (object[], required): BOM with manufacturer part numbers and datasheet URLs.
- `review_verdict` (string, required): Verdict from `pcb-review-verdict`. Must be "PASS", so the pin map is built from the reviewed schematic and never goes stale when the review changes it.

---

## Outputs

- `pin_map` (object[]): Every device pin on a named net: pin number, pin name, net name, peripheral function, direction, pull (internal or external), and state at reset.
- `schematic_defects` (object[]): Every pin whose net needs a function the pin cannot provide, or whose reset state can energize a load, with the net, pin, and the datasheet table that shows the conflict. Empty when none.

---

## Phase 1: Locate Device Pins

### Entry Criteria
- `review_verdict` == "PASS".
- `netlist` and `bom` are present.

### Actions
1. Find every programmable device in the netlist (microcontroller, FPGA, programmable PMIC) by matching its reference to the BOM.
2. List every pin of each device connected to a named net, and every pin left unconnected or marked no-connect.
3. Open the device datasheet from the BOM URL and locate its pin function (alternate function) table and its reset state table.

### Output
Raw pin list per device with the datasheet tables located.

### Quality Gate
- Every pin on a named net appears in the list.
- The datasheet pin function table and reset state section are cited by page or section.

---

## Phase 2: Assign Functions

### Entry Criteria
- Raw pin list exists.

### Actions
1. For each net, determine the peripheral it needs from the device on the other end: a CAN transceiver TXD/RXD net needs the device's CAN controller pins, an I2C net needs an I2C-capable pair, a UART net needs TX/RX of one UART instance, an analog sense net needs an ADC input.
2. Confirm the pin supports that function from the alternate function table. Cite the table row.
3. When two nets need the same peripheral instance or a pin lacks the function, record a schematic defect naming both nets and the instance in conflict.
4. Set direction and pull for each pin. Prefer an external pull already in the schematic; note internal pulls the firmware must enable.

### Output
Function-assigned pin list and draft `schematic_defects`.

### Quality Gate
- Every assigned function cites its alternate function table row.
- Zero pins share a single-instance peripheral without a recorded defect.

---

## Phase 3: Fix Reset States

### Entry Criteria
- Functions assigned.

### Actions
1. For every output that drives a relay, MOSFET gate, regulator enable, motor driver, or transceiver standby pin, read the device's state for that pin from reset release until firmware configures it (commonly a floating input).
2. Confirm the schematic holds that net at the de-energized level during that window with an external pull resistor. Firmware cannot protect the board before it runs.
3. Record a schematic defect for any load-driving net that floats or defaults to the energized level at reset.
4. Emit the final `pin_map`.

### Output
`pin_map`, `schematic_defects`.

### Quality Gate
- Every load-driving output is held de-energized by hardware during reset, or appears in `schematic_defects`.
- Every row in `pin_map` has a function, direction, pull, and reset state.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Derive the pin map for a board's programmable device from its netlist, with data, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when every device pin on a named net has a datasheet-confirmed function and a safe reset state, and every conflict is recorded as a schematic defect for the schematic flow to fix.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `review_verdict` is not PASS | **Stop**: wait for the review loop to pass; a pre-review netlist goes stale. |
| Phase 1 | No programmable device in the netlist | **Skip**: report that the board needs no firmware; emit empty outputs. |
| Phase 1 | Datasheet lacks an alternate function table | **Adjust**: use the device reference manual from the same vendor, cited. |
| Phase 2 | Pin lacks required function | **Record defect**: return it to `pcb-skidl-capture`; do not remap in firmware around a wrong schematic. |
| Phase 3 | Reset state undocumented | **Record defect**: require an external pull to the de-energized level. |

---

## Reference Section

### Safe Reset States
Outputs driving relays, MOSFET gates, enables, or transceiver standby pins boot in the state that keeps loads off and buses silent. A pull resistor on the board sets that state before firmware runs.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
