# Timing Constraint Specification

Define all timing constraints for the design: clock definitions, generated clocks, input/output delays, and timing exceptions (false paths, multicycle paths, max delay overrides).

## Inputs

- `design-netlist`: Synthesized design netlist or RTL with target device
- `interface-timing-specs`: Timing requirements for every external interface (setup/hold at pins, clock-to-output, propagation delays from datasheets)
- `clock-architecture`: All clock sources, PLLs, clock dividers, and derived clocks with their frequency and phase relationships

## Outputs

- `constraint-file`: SDC or XDC constraint file with all clock definitions, I/O delays, false paths, multicycle paths, and max/min delay exceptions
- `constraint-coverage-report`: List of every clock domain and I/O port showing which constraints cover them and which remain unconstrained

## Process

1. Define every primary clock with create_clock: period derived from frequency, waveform edges for non-50% duty cycle, source pin at the clock input pad or oscillator output.
2. Define generated clocks with create_generated_clock for every PLL output, clock divider, and clock mux output. Specify the master clock, division/multiplication factor, and source pin. Do not let the tool auto-derive these: explicit generated clocks prevent incorrect timing paths.
3. Specify input delays (set_input_delay) for every input port relative to its capturing clock. Use both -max (setup) and -min (hold) values derived from the upstream device's Tco and board trace delay.
4. Specify output delays (set_output_delay) for every output port relative to its launching clock. Derive from the downstream device's Tsu and Th, plus board trace delay.
5. Identify and constrain false paths: paths that are structurally present but functionally impossible (mux select lines that prevent both paths from being active, test-only paths, asynchronous reset fanout). Use set_false_path with -from/-to/-through to be as specific as possible. Overly broad false paths hide real failures.
6. Identify multicycle paths: paths where data is stable for more than one clock cycle before being captured (enable-gated registers, multi-cycle arithmetic). Use set_multicycle_path with the correct multiplier and -hold adjustment (multiplier minus 1 for same-edge, multiplier for different-edge).
7. Run a constraint coverage check: verify every clock domain has constraints, every I/O port has input or output delay, and no ports are unconstrained. Unconstrained paths are untimed and will silently fail in hardware.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
