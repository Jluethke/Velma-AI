# Synthesis Constraint Setup

Translate RTL timing requirements into synthesis constraints (SDC) and configure the synthesis tool for the target PPA (performance, power, area).

## Inputs

- `rtl-design`: Verified RTL code (Verilog/VHDL)
- `timing-requirements`: Clock frequency, I/O timing, multicycle paths, false paths
- `target-library`: Standard cell library for the target process and voltage corner

## Outputs

- `synthesis-constraints-sdc`: SDC file with clocks, I/O delays, exceptions, and design rule constraints
- `synthesized-netlist`: Gate-level netlist meeting timing constraints

## Process

1. Define clocks in SDC: create_clock with period, waveform edges, and uncertainty. Clock uncertainty at synthesis should include estimated post-layout skew plus jitter. Typical pre-layout uncertainty: 200-500 ps depending on clock frequency and methodology.
2. Set input and output delays: set_input_delay and set_output_delay define when data arrives at input ports and when it must be stable at output ports relative to the clock. These come from the interface timing budget (board-level or chip-to-chip).
3. Define timing exceptions: set_false_path for paths that never propagate functionally (e.g., between asynchronous clock domains, test-only paths). set_multicycle_path for paths allowed more than one clock cycle (gray-code logic, pipelined buses with valid signals).
4. Set area and power constraints: set_max_area as a target (synthesis will optimize to meet timing first, then area). Power intent through UPF: define power domains, isolation cells, level shifters, retention registers if the design has multiple power states.
5. Run synthesis: the tool maps RTL to standard cells, optimizes for timing (meet setup at worst corner), applies design rule fixes (max fanout, max transition, max capacitance). Use multi-corner multi-mode (MCMM): optimize simultaneously for setup at slow corner and hold at fast corner.
6. Review synthesis results: check timing slack at all corners (positive slack means timing met), area utilization (target 70-80% for routability), power estimate (toggle-rate-based), and cell count. If timing is negative, review the critical path and consider micro-architectural changes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
