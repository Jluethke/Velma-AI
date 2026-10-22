# Jtag Chain Setup And Verification

Verify the JTAG scan chain by confirming BSDL files, testing chain integrity, and running infrastructure tests to ensure the test access port communicates correctly with all devices.

## Inputs

- `board-netlist`: Board schematic netlist with JTAG chain order and device identification
- `bsdl-file-set`: BSDL (Boundary Scan Description Language) files for each device in the chain, sourced from component manufacturers

## Outputs

- `chain-verification-result`: Pass/fail for each device: IDCODE match, instruction register length, bypass register functionality
- `chain-topology`: Verified chain order with device names, instruction register lengths, and total scan chain length
- `infrastructure-test-result`: Results from testing internal JTAG infrastructure of each device (instruction decode, data register selection)

## Process

1. Verify each BSDL file matches the target device revision. Check the IDCODE in the BSDL against the device datasheet. Load all BSDL files into the boundary scan test tool and configure the chain order to match the board schematic.
2. Run chain integrity test: shift a known pattern through the combined instruction registers of all devices and verify the output matches. If the chain fails, isolate by testing each device individually: check TDI-TDO continuity, verify TCK and TMS reach each device, and confirm each device's TRST pin is not held active.
3. Run infrastructure test: shift each device to BYPASS mode and verify its single-bit bypass register passes data with one clock delay. Then shift each device to IDCODE and verify the 32-bit IDCODE matches the BSDL. This confirms that instruction decoding works in each device.
4. Document the scan chain timing: measure the TCK frequency limit (typically 10-33MHz for boundary scan, limited by the slowest device in the chain). Calculate the total scan chain length in bits (sum of all boundary register cell counts) to estimate test time per pattern.
5. If any device uses JTAG for both boundary scan and in-system debug (ARM CoreSight, for example), verify that debug mode and boundary scan mode do not interfere. Some devices require specific initialization sequences before boundary scan works correctly.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
