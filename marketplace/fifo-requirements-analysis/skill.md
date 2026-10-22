# Fifo Requirements Analysis

Derive FIFO depth, width, and type (synchronous vs asynchronous) from the system data rates, burst lengths, and clock relationships.

## Inputs

- `data-interface-spec`: Write-side and read-side data widths, clock frequencies, and burst characteristics (max burst length, average data rate, peak data rate)
- `system-latency-budget`: Maximum allowable latency from write to read, and any flow-control signaling requirements (backpressure, almost-full thresholds)

## Outputs

- `fifo-specification`: FIFO type (sync/async), data width, depth (power of two), empty/full generation method, and required status signals (almost-full, almost-empty, fill level)
- `depth-calculation-worksheet`: Step-by-step depth derivation showing worst-case fill scenario, with margin for synchronization latency in async FIFOs

## Process

1. Determine if the FIFO is synchronous (single clock domain) or asynchronous (write and read clocks are independent). If both sides share a clock or have a known phase relationship, use synchronous. If clocks are unrelated, use asynchronous.
2. Calculate minimum depth for a synchronous FIFO: depth >= (burst_length * write_rate / read_rate) when write_rate > read_rate during bursts. The FIFO must absorb the peak-to-average rate mismatch. If both rates are equal, depth equals the maximum burst length.
3. For an asynchronous FIFO, add synchronization latency overhead: the write pointer takes 2-3 destination clock cycles to propagate to the read side (and vice versa). During this latency, the full/empty flags are conservative (may indicate full when not quite full). Add enough depth to absorb data written during this latency: extra_depth = sync_latency_cycles * write_rate.
4. Round depth up to the next power of two. Binary and gray-code pointer arithmetic require power-of-two depth for correct wrap-around behavior.
5. Define status signals: empty (read side, prevents underflow), full (write side, prevents overflow), almost-full (write side, triggers upstream backpressure N entries before full), almost-empty (read side, signals downstream to prepare for stall), programmable-full/empty thresholds if configurable, fill-level count for monitoring.
6. Verify the depth is sufficient by modeling the worst-case scenario: maximum-length burst at peak write rate with minimum read rate, including synchronization delay. If the FIFO overflows in this scenario, increase depth.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
