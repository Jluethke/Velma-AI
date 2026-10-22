# Memory Bist Design

Design built-in self-test for embedded memories using March algorithms, with repair analysis for redundancy allocation.

## Inputs

- `memory-instances`: List of embedded SRAMs/ROMs with sizes, types, and locations
- `test-requirements`: Memory fault coverage targets and test time constraints

## Outputs

- `bist-controller-design`: MBIST controller with selected March algorithm and configuration
- `repair-analysis`: Redundancy allocation (spare rows/columns) and expected repair yield improvement

## Process

1. Embedded SRAM faults: stuck-at faults in cells, address decoder faults, coupling faults between adjacent cells (a write to cell A flips cell B), transition faults (cell cannot transition from 0 to 1 or vice versa), and data retention faults.
2. March algorithm selection: March C- detects all stuck-at and transition faults with 10N operations (where N is the number of cells). March SS adds coupling fault detection with 22N operations. For most production testing, March C- is sufficient. March algorithms apply a sequence of read/write operations in ascending and descending address order.
3. MBIST controller design: the controller generates the address sequence, data patterns (all-0, all-1, checkerboard, inverse checkerboard), and the march element sequence. It compares read data against expected data and flags failures with the failing address and data bit. One controller can test multiple memories by multiplexing.
4. For large SoCs with hundreds of memory instances: use a hierarchical BIST architecture. A top-level controller manages multiple local BIST controllers. Memories are grouped by type and size for efficient testing. Test scheduling runs independent memories in parallel to reduce total test time.
5. Redundancy and repair: SRAM compilers include spare rows and spare columns. If a cell fails, the row or column containing it is replaced by the spare. The MBIST controller logs failing addresses, and a repair analysis algorithm determines the optimal spare allocation. Typical repair: 1-4 spare rows and 1-4 spare columns per memory block.
6. Calculate the yield improvement from redundancy: without repair, yield = (1 - p_fail)^N_cells. With repair, yield improves by the probability that all failures can be covered by the available spares. For a 256KB SRAM with 4 spare rows and 4 spare columns, yield improvement is typically 5-15% absolute.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
