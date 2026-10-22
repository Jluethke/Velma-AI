# Interconnect Test Pattern Generation

Generate and execute boundary scan interconnect tests to detect opens, shorts, and stuck-at faults on nets connecting JTAG-accessible pins.

## Inputs

- `chain-topology`: Verified chain configuration with all devices recognized
- `board-netlist`: Net connectivity for all testable nets

## Outputs

- `interconnect-test-results`: Net-by-net pass/fail with fault type (open, short-to-net, short-to-power, short-to-ground, stuck-at-0, stuck-at-1)
- `test-coverage-report`: Percentage of nets tested, untestable nets with reasons (non-JTAG devices, bidirectional buses requiring external stimulus)
- `fault-diagnosis`: For each failure: suspected physical location (component pin, via, trace segment) based on netlist analysis

## Process

1. Extract the testable net list from the netlist: a net is testable if at least one pin is a JTAG-controllable output (driver) and at least one pin is a JTAG-observable input (sensor). Nets with only non-JTAG devices on them are not testable by boundary scan alone.
2. Generate walking-ones test patterns: for each group of driver cells, drive one high while all others are low, then observe all sensor cells. This detects shorts between any two nets in the group. Follow with walking-zeros (one low, all others high) to detect shorts to power.
3. For each net, test for stuck-at faults: drive the net high and observe, then drive low and observe. A stuck-at-0 fault shows low regardless of driver state. A stuck-at-1 shows high regardless. An open net may float to an indeterminate state that reads inconsistently.
4. Handle bidirectional and tristate buses: for buses with multiple drivers, test each driver individually while tristating all others. Verify the bus pull-up or pull-down resistor holds the correct default state when all drivers are tristated.
5. Analyze failures to isolate the physical fault. A short between two nets suggests a solder bridge between adjacent pins or traces. An open on a BGA pin suggests a non-wetted solder ball. Cross-reference failure patterns: if multiple pins on the same BGA row fail open, suspect a reflow profile issue on that side of the package.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
