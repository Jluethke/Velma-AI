# Fpga Prototype Validation

Validate the FPGA selection by implementing a representative subset of the design on the target device and verifying resource utilization, timing, and power.

## Inputs

- `device-shortlist`: Candidate FPGA devices with comparison data
- `vendor-comparison-matrix`: Feature and cost comparison across candidates

## Outputs

- `prototype-results`: Actual resource utilization, achieved clock frequency, and measured power for the representative design on the target device
- `device-selection-decision`: Final FPGA device selection with rationale, including risk assessment for resource margin and any operating restrictions

## Process

1. Select the most critical functional block for prototyping: the one with the highest resource uncertainty or the tightest timing constraint. Implement it on the candidate device using the vendor's tools. This validates the resource estimate and the tool's synthesis quality for the design's coding style.
2. Run implementation (synthesis, place, route) and check: (a) actual LUT, register, BRAM, DSP utilization vs estimate, (b) achieved clock frequency vs target, (c) routing congestion (a design that fits in resources but causes routing congestion will fail timing). If utilization exceeds 80% on any resource type, the full design is at risk.
3. Run power analysis on the prototype implementation. Extrapolate to the full design by scaling proportionally. Verify the extrapolated power fits within the thermal budget.
4. If the prototype reveals the candidate device is insufficient (timing fails, resources exceeded), re-evaluate: move to a larger device in the same family, increase the speed grade, or redesign the most resource-intensive block.
5. Make the final selection. Document: device part number, package, speed grade, temperature grade, resource utilization (estimated with margins), timing margin, power estimate, unit price, and the risk assessment (what happens if the design grows beyond the estimate).
6. Order development boards and engineering samples. Begin the PCB design with the selected FPGA package. Lock the device selection as a design baseline; changing the FPGA after PCB design starts is extremely expensive.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
