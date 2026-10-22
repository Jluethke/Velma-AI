# Trace And Profiling Method

Use ARM CoreSight trace capabilities (ITM, DWT, ETM) for instrumented tracing, cycle-accurate profiling, and non-intrusive program flow monitoring.

## Inputs

- `debug-setup`: Working debug connection with trace port availability (SWO for ITM, or trace pins for ETM)
- `debug-strategy`: The specific information needed: execution timing, function call profile, data value trace, or interrupt timeline

## Outputs

- `trace-configuration`: ITM channels configured, DWT comparators set, SWO baud rate, and trace decoder settings
- `profiling-results`: Function execution times, interrupt latencies, CPU utilization breakdown, and cache hit rates (if applicable)

## Process

1. Configure ITM (Instrumentation Trace Macrocell) for printf-style debug output without halting the CPU. Write to the ITM stimulus port registers; the data streams out the SWO pin at the configured baud rate. This replaces UART printf debugging with near-zero overhead (1 cycle per word written).
2. Use DWT (Data Watchpoint and Trace) cycle counter for precise timing. Enable CYCCNT (cycle counter) at DWT_CTRL. Read DWT_CYCCNT before and after a code section. The difference divided by the clock frequency gives execution time with single-cycle precision. This is faster and more precise than GPIO toggling.
3. Configure DWT comparators for data trace: when a specific variable is written, DWT generates a trace packet containing the new value and timestamp. This captures the history of a variable without breakpoints and without stopping execution. Limited to 4 comparators.
4. For full program flow trace, configure ETM (Embedded Trace Macrocell) if the target supports it and a trace probe with the bandwidth is available. ETM captures every instruction execution and branches, allowing full reconstruction of the program flow. This requires a trace port (4-bit TPIU) and a high-bandwidth probe.
5. Statistical profiling: sample the PC (program counter) periodically using DWT PC sampling. The distribution of PC values shows where the CPU spends its time. This is the embedded equivalent of a sampling profiler. Identify hot functions for optimization.
6. Decode the trace data using the IDE's trace viewer or a command-line tool. Map PC values to source code using the ELF file's debug symbols. Present the results as: function-level execution time breakdown, interrupt latency histogram, and timeline view of task switches.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
