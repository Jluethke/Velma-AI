# Function To Technology Mapping

Map each system function to its optimal process node, considering performance, power, area, and cost trade-offs.

## Inputs

- `system-architecture`: Block-level architecture with compute, memory, I/O, analog, and RF functions
- `process-options`: Available process nodes with PPA characteristics and wafer costs

## Outputs

- `technology-map`: Assignment of each function to a process node with rationale
- `die-definitions`: Preliminary chiplet definitions: function, area estimate, process node, I/O count

## Process

1. Analyze each function. Digital logic (CPU, GPU, accelerator): benefits most from leading-edge node (density, speed, power). I/O (SerDes, DDR PHY): often better on N-1 or N-2 node (analog performance, thick metals for inductors, lower cost). Analog/RF: may require specialized process (SiGe BiCMOS, GaAs, SOI).
2. Calculate PPA for each function on each candidate node. Transistor density scales ~2x per node, but analog area often does not shrink proportionally. High-voltage I/O may require thick-oxide transistors only available on mature nodes.
3. Cost analysis per function: for a given area on a given node, cost = (wafer_cost / dies_per_wafer) * (1/yield). Leading edge (3nm): $20-30K per wafer, mature (28nm): $2-3K. A large analog block on 3nm wastes expensive silicon.
4. Identify functions that can share a die (physically adjacent, same process) to minimize chiplet count. Each additional chiplet adds die-to-die interface overhead, assembly cost, and yield risk.
5. Document the technology map: which functions on which node, which functions grouped into which chiplets, and which interfaces cross chiplet boundaries (these become die-to-die links).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
