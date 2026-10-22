# Scan Chain Architecture

Insert scan chains into the design, converting flip-flops to scan flip-flops and partitioning into chains for controllability and observability during manufacturing test.

## Inputs

- `gate-level-netlist`: Synthesized netlist with flip-flop instances
- `test-requirements`: Fault coverage target, number of scan chains, test clock frequency

## Outputs

- `scan-inserted-netlist`: Netlist with scan flip-flops connected into chains
- `scan-chain-report`: Number of chains, chain lengths, scan-in/scan-out pin assignments

## Process

1. Replace all non-scan flip-flops with scan equivalents: the scan flip-flop adds a multiplexer at the data input, selecting between functional data (in normal mode) and scan-in data (in test mode). Area overhead is approximately 10-15% for the mux addition.
2. Determine the number of scan chains: more chains means shorter shift time (parallel loading) but more I/O pins. If pins are limited, use test compression (handled in a later step) to reduce the number of physical scan-in/scan-out pins. Typical: 4-32 physical chains without compression, 200-2000 internal chains with compression.
3. Chain balancing: distribute flip-flops evenly across chains so all chains have approximately the same length. Unbalanced chains waste shift cycles (the longest chain determines the shift count). Also consider physical proximity: chain flip-flops near each other to minimize routing congestion of the scan chain wiring.
4. Handle special flip-flops: clock gating cells (ICGs) need special scan treatment (test mode bypasses the gate). Multi-bit flip-flops are stitched as a group. Reset flip-flops need their reset controlled during scan mode to prevent corruption.
5. Lockup latches: if a scan chain crosses clock domains or has timing issues between stages (the scan shift path does not meet hold timing), insert lockup latches (transparent latches) at the domain boundary to prevent race conditions during shift.
6. Verify scan connectivity: run a scan chain trace to confirm all flip-flops are in chains, no flip-flops are missing, and the chains shift correctly (shift-in a known pattern, shift-out and compare). This is done in simulation before ATPG.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
