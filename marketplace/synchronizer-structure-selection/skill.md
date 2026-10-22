# Synchronizer Structure Selection

Select and implement the correct synchronization structure for each CDC signal type: two-flop for single bits, gray-code for counters, handshake for buses, and async FIFO for streaming data.

## Inputs

- `cdc-signal-list`: Classified crossing signals with their types
- `crossing-risk-assessment`: Risk level and MTBF calculations for each crossing

## Outputs

- `synchronizer-design`: Specific synchronizer structure for each crossing: schematic, RTL implementation, and timing constraints required
- `synchronizer-latency-budget`: Latency (in destination clock cycles) introduced by each synchronizer, for system-level timing analysis

## Process

1. For single-bit level signals (enables, status flags, mode selects): implement a two-flop synchronizer. Both flops must be in the destination clock domain, placed physically close (same slice in FPGA), with no combinational logic between them. Constrain with set_max_delay (typically one destination clock period) between the source register and the first synchronizer flop. The signal must be stable for at least one full destination clock period plus the setup time of the first flop.
2. For single-bit pulses that are high for exactly one source clock cycle: use a toggle synchronizer (pulse-to-toggle in source domain, two-flop synchronizer on the toggle signal, toggle-to-pulse in destination domain) when the source clock is faster than the destination. When the destination is faster, a two-flop synchronizer on the pulse works if the pulse width exceeds the destination clock period plus setup time.
3. For multi-bit data buses where all bits must be captured coherently: use a handshake protocol. The source presents the data and asserts a request signal. The request is synchronized to the destination domain (two-flop). The destination captures the data (which is stable because the source holds it until acknowledged) and asserts an acknowledge. The acknowledge is synchronized back to the source. The source can then change the data. Throughput is limited to one transfer per approximately 4-6 clock cycles of the slower domain.
4. For counters (FIFO pointers, address generators): convert to gray code in the source domain before crossing. Gray code changes only one bit per increment, so a two-flop synchronizer on each bit captures a value that is at most one count stale, never corrupted. Constrain all bits of the gray-coded bus to arrive within one destination clock cycle of each other (set_max_delay with -datapath_only).
5. For streaming data that must cross domains continuously at high throughput: use an asynchronous FIFO. The write port operates in the source clock domain; the read port in the destination domain. Pointers are gray-coded and synchronized as above. FIFO depth must absorb the burst rate mismatch plus the synchronization latency.
6. For asynchronous resets: use an asynchronous assert, synchronous deassert pattern. The reset assertion is immediate (no synchronizer delay). The reset deassertion passes through a two-flop synchronizer clocked by the destination domain, ensuring all registers in that domain release reset on the same clock edge.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
