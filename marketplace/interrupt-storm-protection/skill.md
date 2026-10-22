# Interrupt Storm Protection

Design protection against interrupt storms that can starve task execution: rate limiting, disabling and re-enabling strategies, and watchdog-based recovery.

## Inputs

- `dma-configuration`: DMA setup reducing normal interrupt load
- `revised-interrupt-load`: Expected interrupt rates under normal and worst-case conditions

## Outputs

- `storm-protection-design`: Rate limiting thresholds, disable/re-enable timers, escalation actions, and watchdog integration for each interrupt source
- `interrupt-architecture-document`: Complete interrupt design: priority map, ISR implementations, DMA integration, storm protection, and verification checklist

## Process

1. Define the storm threshold for each interrupt: the rate above which the system cannot maintain task scheduling. For a 1 kHz tick rate, if any ISR consumes more than 50% of each tick period, tasks will miss deadlines.
2. Implement ISR rate monitoring: maintain a counter per interrupt source, reset every tick. If the count exceeds the threshold, disable the interrupt and start a re-enable timer. Log the event for diagnostics.
3. For level-triggered interrupts, a stuck peripheral can cause a storm immediately. The ISR must check if the interrupt source is still asserted after clearing. If so, disable the interrupt and flag a hardware error.
4. Configure the watchdog timer with a timeout shorter than the longest acceptable task starvation period. If an interrupt storm prevents the watchdog-feeding task from running, the watchdog fires and resets the system.
5. Document the complete interrupt architecture: a table of all interrupts with priority, ISR pattern, DMA usage, storm threshold, and the verification method (logic analyzer capture showing worst-case latency and nesting). This document is the reference for code reviews and future modifications.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
