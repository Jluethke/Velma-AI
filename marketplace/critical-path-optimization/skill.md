# Critical Path Optimization

Systematically reduce delay on failing timing paths through RTL restructuring, retiming, pipelining, logic optimization, and physical constraints.

## Inputs

- `timing-summary`: Setup and hold timing results across corners
- `critical-path-list`: Failing paths with detailed delay breakdowns

## Outputs

- `optimization-changes`: Specific RTL, constraint, or physical changes applied to each failing path with before/after slack
- `post-optimization-timing`: Updated timing summary after all changes, confirming closure or identifying remaining failures

## Process

1. For logic-dominated paths (many LUT levels), identify the deepest combinational chain. Options: (a) insert a pipeline register to split the path across two cycles (requires protocol awareness for latency change), (b) restructure the logic tree to reduce depth (e.g., convert a priority chain to a parallel comparison with a final mux), (c) use DSP blocks for arithmetic-heavy paths.
2. For routing-dominated paths, apply physical constraints: floorplan related logic into the same region (Pblock in Vivado, LogicLock in Quartus), use register duplication (retiming) to move registers closer to the fanout endpoints, or constrain placement with RLOC or LOC attributes.
3. For hold violations, add delay to the data path. In FPGA, this means inserting buffer registers or using IDELAY primitives. Never fix hold by adding routing delay via tool directives; it is not process-corner-safe.
4. For paths failing due to clock skew between domains, consider moving to a single clock domain, adding a synchronization structure (FIFO or handshake), or adjusting PLL phase relationships if both clocks are derived from the same source.
5. Apply register balancing (retiming) where the tool supports it: allow the synthesis tool to move registers forward or backward through combinational logic to equalize path delays. Verify that retiming does not change the functional behavior (check reset values, enable signals, and pipeline depth assumptions).
6. After each change, re-run STA incrementally. Track slack improvement per change. If a change improves one path but worsens another (due to resource contention or routing congestion), evaluate the net effect before committing.
7. Document every optimization with its rationale. A future designer must understand why a pipeline stage exists or why logic was restructured, because removing it will reintroduce the timing failure.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
