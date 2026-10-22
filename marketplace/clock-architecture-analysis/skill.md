# Clock Architecture Analysis

Define and analyze the clock architecture: all clock domains, their relationships (synchronous, asynchronous, phase-shifted), clock generation resources (PLLs, buffers), and jitter budgets.

## Inputs

- `design-specification`: Top-level block diagram with all clock domains, their frequencies, and the interfaces between domains
- `fpga-target`: Target FPGA device family and speed grade, with its PLL specifications, clock routing resources, and timing model

## Outputs

- `clock-tree-specification`: Complete clock tree: PLL configuration (input frequency, output frequencies, feedback mode), global vs regional clock buffer assignment, clock enable usage for gated clocks
- `clock-domain-crossing-map`: Matrix of all clock domain crossings in the design, classified as: same-source synchronous (safe with constraints), asynchronous (requires synchronizer), or rate-related (requires FIFO or handshake)

## Process

1. List every clock in the design. For each: source (pin, PLL output, divided from another clock), frequency, duty cycle, and jitter. Group clocks by source: clocks from the same PLL output or derived by integer division are synchronous. Clocks from different sources (different PLLs, different input pins) are asynchronous.
2. Map the PLL configuration. Use the FPGA vendor's PLL wizard to configure each PLL: input reference clock, VCO frequency (must fall within the PLL VCO range), output dividers for each clock domain. Minimize the number of PLLs (each PLL has lock time and consumes resources). Lock signal: use it to hold the design in reset until PLLs are locked.
3. Identify all clock domain crossings. For each crossing: single-bit signals need a 2-register synchronizer. Multi-bit buses need either a FIFO (for streaming data), a handshake protocol (for control/status), or gray-code encoding (for counters). Document each crossing with its type, data width, and throughput requirement.
4. Jitter budget. The total jitter from input pin through PLL to the flip-flop clock input must leave enough margin for setup and hold times. Tclk_period - Tsetup - Thold - Tjitter_total = timing margin. If jitter consumes too much margin, reduce clock frequency or use a cleaner reference clock.
5. Clock enable vs multiple clocks. Using clock enables (CE) instead of separate slow clocks keeps everything on the same clock domain and avoids CDC issues. A 100MHz clock with a CE that pulses every 4th cycle behaves like a 25MHz clock but with no domain crossing. Use this wherever possible to simplify the design.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
