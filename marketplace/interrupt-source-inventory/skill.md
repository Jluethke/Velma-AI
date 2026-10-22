# Interrupt Source Inventory

Inventory all interrupt sources in the system, classify them by urgency, and establish latency budgets for each.

## Inputs

- `peripheral-list`: All peripherals in the system with their interrupt capabilities
- `timing-requirements`: Maximum allowable latency from event to response for each interrupt source

## Outputs

- `interrupt-inventory`: Each interrupt source with: peripheral, trigger type (edge/level), frequency, required latency, and estimated ISR execution time
- `latency-budget`: For each interrupt: total budget breakdown into hardware latency, ISR entry overhead, processing time, and margin

## Process

1. List every interrupt source from the MCU reference manual: peripheral interrupts (UART RX, SPI complete, ADC end-of-conversion, timer overflow, GPIO edge), DMA transfer complete, fault interrupts (hard fault, bus fault, usage fault, memory management fault).
2. For each source, record the trigger type. Edge-triggered interrupts can be missed if the flag is not cleared before the next edge. Level-triggered interrupts keep asserting until the cause is serviced. Choose edge for pulses, level for status conditions.
3. Establish the latency budget for each interrupt. The total latency is: hardware stacking time + ISR entry (vector fetch, pipeline flush) + any higher-priority ISR preemption + ISR processing time. On Cortex-M, hardware stacking takes 12 cycles minimum.
4. Estimate ISR execution time by counting the operations needed: read status register, clear flag, transfer data (or start DMA), signal the task. Multiply instruction count by cycles-per-instruction for the target core.
5. Identify interrupts that can share a vector (e.g., multiple GPIO pins on the same port). Shared vectors add dispatching overhead: read the flag register to determine which pin triggered, then branch.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
