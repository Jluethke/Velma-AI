# Cdc Signal Inventory

Identify every signal that crosses between clock domains and classify each by type (single-bit control, multi-bit bus, pulse, gray-coded counter) to determine the required synchronization method.

## Inputs

- `design-rtl`: RTL source code or netlist of the design
- `clock-domain-map`: List of all clock domains with their frequencies and phase relationships

## Outputs

- `cdc-signal-list`: Every signal crossing clock domains, classified by type: single-bit level, single-bit pulse, multi-bit bus, gray-coded bus, handshake group, or asynchronous reset
- `crossing-risk-assessment`: Risk level for each crossing based on frequency ratio, data rate, and consequences of metastable failure

## Process

1. Enumerate every register-to-register path where the source and destination are in different clock domains. The source domain is defined by the clock that drives the source register; the destination domain by the clock driving the destination register.
2. Classify each crossing signal: (a) single-bit level signal that changes slowly relative to the destination clock, (b) single-bit pulse that is high for exactly one source clock cycle, (c) multi-bit data bus that must be captured atomically, (d) address or counter value suitable for gray-code encoding, (e) group of signals that form a transaction and must be captured coherently, (f) asynchronous reset that fans out to multiple domains.
3. For each crossing, calculate the metastability risk. MTBF = 1 / (f_dest * f_data * T_resolve), where T_resolve is the metastability resolution time constant for the target technology. For a two-flop synchronizer in a modern FPGA, MTBF is typically decades for data rates below 10% of the destination clock frequency. If the calculated MTBF is below the system's required operating lifetime, add synchronizer stages.
4. Identify which crossings the design already synchronizes and which are raw unsynchronized crossings. Raw crossings are immediate metastability hazards.
5. Assess the consequence of failure for each crossing: a metastable control signal may cause one wrong decision, while a metastable address pointer in a FIFO can corrupt an entire data stream.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
