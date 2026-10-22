# Rtos Task Decomposition

Decompose system requirements into RTOS tasks by identifying periodic, aperiodic, and sporadic workloads, then assigning each a rate and worst-case execution time.

## Inputs

- `system-requirements`: Functional and timing requirements for the embedded system
- `hardware-platform`: Target MCU/MPU with clock speed, interrupt controller type, and available peripherals

## Outputs

- `task-list`: Each task with name, type (periodic/aperiodic/sporadic), period or minimum inter-arrival time in ms, and measured or estimated WCET
- `isr-list`: Each interrupt source with worst-case execution time and triggering frequency

## Process

1. List every stimulus the system must respond to: sensor reads, communication frames, user inputs, timer expirations, and actuator updates.
2. Classify each stimulus as periodic (fixed interval), sporadic (minimum inter-arrival time known), or aperiodic (no guaranteed minimum interval). Aperiodic stimuli need a server task (polling or deferrable server).
3. For each periodic stimulus, record the period T in ms. For sporadic, record the minimum inter-arrival time. These become the task periods.
4. Measure or estimate worst-case execution time (WCET) for each task on the target hardware. Use instrumented code with GPIO toggling and an oscilloscope for measurement. For estimates, count instructions in the longest path and divide by clock cycles per instruction.
5. Group related stimuli into a single task only when they share the same period and can tolerate the combined WCET. Otherwise keep them separate.
6. List hardware interrupts separately. Each ISR should do minimal work: read the hardware register, clear the flag, post to a queue or set an event flag, then return. The deferred processing goes in a task.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
