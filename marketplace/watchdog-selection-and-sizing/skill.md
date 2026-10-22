# Watchdog Selection And Sizing

Select between independent and windowed watchdog, calculate the timeout from worst-case execution paths, and configure the reload strategy.

## Inputs

- `system-timing`: Worst-case task execution times, interrupt latencies, and the maximum acceptable time from fault to system response
- `safety-requirements`: Target safety integrity level (SIL 1-4 or ASIL A-D), required diagnostic coverage, and safe state definition

## Outputs

- `watchdog-config`: Watchdog type (independent/windowed/external), timeout value, window bounds (for windowed), clock source, and reload point in code
- `fault-detection-time`: Maximum time from software fault to watchdog reset, including worst-case feed-just-before-fault scenario

## Process

1. Choose watchdog type. Independent watchdog (IWDG on STM32): simple timeout, clocked from a separate low-speed oscillator (independent of system clock failures). Windowed watchdog (WWDG): must be fed within a specific window (not too early, not too late), detects both stuck and timing faults. External watchdog IC: highest integrity, completely independent of the MCU.
2. Calculate the timeout. The watchdog timeout must be: longer than the worst-case task cycle (so normal operation never triggers it) but shorter than the maximum time to reach the safe state after a fault. Typical rule: timeout = 2x to 3x the longest normal task cycle. For a 100 ms main loop, a 200 ms to 300 ms timeout.
3. For windowed watchdog, set the early boundary to reject feeds that come too quickly (indicating a task is spinning without doing its work) and the late boundary to catch tasks that are stuck. Window = [earliest_normal_feed + margin, timeout - margin].
4. The worst-case fault detection time equals the timeout period: a fault could occur immediately after a successful watchdog feed. To reduce this, feed the watchdog more frequently and only from the correct execution path (not from a simple timer interrupt, which would still run even if the application is stuck).
5. For SIL 3 or ASIL C/D, an external watchdog IC with Q&A (question-and-answer) capability is required. The MCU must compute a correct response to the watchdog's challenge within the timeout. A stuck MCU cannot produce correct answers. This achieves higher diagnostic coverage than an internal watchdog alone.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
