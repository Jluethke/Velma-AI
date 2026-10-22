# Functional Test Strategy

Analyze the board circuit to define the test strategy: which functions to test, what stimuli to apply, what responses to measure, and which test points to access.

## Inputs

- `board-schematic`: Board schematic and bill of materials
- `board-specification`: Board functional specification with performance parameters and tolerances

## Outputs

- `test-strategy-document`: Test approach for each functional block: stimulus type, measurement point, expected response, pass/fail criteria
- `test-point-list`: Required test point locations with signal name, expected voltage or current range, and measurement type (DC, AC, frequency, digital)
- `coverage-analysis`: Estimated fault coverage by functional block, untestable areas identified with justification

## Process

1. Decompose the board into functional blocks: power supply, digital processor, memory, analog front-end, communication interfaces, sensors, actuator drivers. For each block, identify the key performance parameters from the specification.
2. For each functional block, define the test approach. Power supplies: measure output voltage, current limit, ripple. Digital: write/read test patterns to verify data paths. Analog: apply known input and measure output accuracy, gain, offset, linearity. Communication: loopback test where possible, or protocol-level verification with external test equipment.
3. Identify test points needed for each measurement. Prefer existing component pads and connector pins. Where additional access is needed, request test points in the next board revision. For high-density boards (BGA-heavy), prioritize boundary scan for digital nets and limit physical test points to analog and power measurements.
4. Estimate fault coverage: for each component on the BOM, assess whether the functional test would detect a solder fault (open or short) on each pin. Components in the signal path of a tested function are typically covered. Components in untested functions (unused I/O, unloaded configuration options) may need supplementary testing (boundary scan, visual inspection, or flying probe).
5. Define the test priority: test power first (if power is wrong, nothing else works), then digital communication (verify the processor boots and communicates), then analog performance, then peripheral functions. This sequence isolates failures quickly and prevents damage from testing a board with a power fault.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
