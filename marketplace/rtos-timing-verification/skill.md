# Rtos Timing Verification

Verify the RTOS design meets all timing requirements through instrumented measurement, logic analyzer capture, and systematic deadline compliance testing.

## Inputs

- `stack-allocation-table`: Finalized stack allocations
- `schedulability-result`: Theoretical analysis results to compare against measured values

## Outputs

- `timing-report`: Measured vs theoretical response times, worst-case latencies, jitter measurements, and pass/fail per requirement
- `rtos-configuration`: Final RTOS config: tick rate, priority levels used, kernel objects, memory pool sizes, and configuration macros

## Process

1. Instrument each task: toggle a GPIO pin high at task entry, low at task exit. Capture with a logic analyzer over a long run (hours). Measure maximum execution time, period jitter, and response time from stimulus to completion.
2. Compare measured WCET against the values used in schedulability analysis. If measured WCET exceeds the estimate, rerun the response time analysis with corrected values.
3. Select the RTOS tick rate. Common choices: 1 kHz (1 ms resolution) for most systems, 10 kHz for sub-ms timing needs. Higher tick rates increase ISR overhead. The tick ISR itself must be the shortest ISR in the system.
4. Test corner cases: simultaneous arrival of all periodic tasks (critical instant), maximum burst of sporadic events, all queues at capacity. These stress tests reveal failures that normal operation hides.
5. Measure interrupt latency: time from interrupt assertion to first ISR instruction. On Cortex-M with zero-latency interrupts, this is 12 clock cycles minimum. RTOS critical sections add to this. Verify the measured value meets the hardware timing requirements.
6. Document the final configuration: RTOS version, tick rate, number of priority levels, each kernel object (tasks, queues, mutexes, semaphores, event groups, timers) with its parameters. This becomes the RTOS design record for the project.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
