# Fpga Clock And Logic Power Reduction

Reduce dynamic power by gating clocks to idle blocks, reducing toggle rates through encoding, and selecting lower-power implementation options.

## Inputs

- `power-breakdown`: Per-component power consumption analysis
- `power-budget-assessment`: Power budget vs thermal capacity comparison

## Outputs

- `power-optimization-changes`: Specific RTL and constraint changes applied: clock enables, encoding changes, resource substitutions, and their power impact
- `post-optimization-power`: Updated power estimate after optimizations, with verification that functionality is preserved

## Process

1. Implement clock enable gating. FPGAs do not have standard clock gates like ASICs; instead, use the CE (clock enable) input on register primitives. When a block is idle, deassert its clock enable. The registers hold their state but consume no dynamic power (no switching). Identify blocks with known idle periods: unused processing channels, inactive protocol engines, completed transaction buffers.
2. Reduce clock frequency where possible. If a block can operate at half the system clock, drive it from a divided clock. Power scales linearly with frequency: halving the clock halves the dynamic power of that block. Use a clock enable (toggle every other cycle) rather than a divided clock if the phase relationship matters.
3. Reduce toggle rates through Gray coding on buses that drive high-capacitance routes. Binary counting toggles many bits simultaneously (all bits toggle at 111->000). Gray coding toggles exactly one bit per increment. For address buses to BRAM or external memory, Gray coding reduces the bus switching activity by approximately 50%.
4. Select lower-power memory primitives. Distributed RAM (LUT-based) consumes less power than BRAM for shallow memories because BRAM has a fixed clock-driven power even when not accessed. For read-mostly memories, use ROM inference (which maps to LUTs) instead of BRAM.
5. Reduce DSP block dynamic power by disabling unused pipeline stages and using smaller operand widths. A DSP48 consuming an 18x18 multiply uses less switching power than a 27x18 multiply because fewer internal nodes toggle.
6. After each change, re-run power analysis to verify the reduction. Also re-run functional simulation to verify the clock enable logic does not cause data corruption (a classic bug: deasserting CE while a write is in progress).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
