# Isr Design Patterns

Implement ISR handlers following minimal-work design rules: hardware register access, flag clearing, data transfer, and deferred processing via RTOS notifications.

## Inputs

- `priority-assignment`: Interrupt priorities and nesting configuration
- `interrupt-inventory`: Each interrupt with its required actions

## Outputs

- `isr-implementations`: ISR code patterns for each interrupt type: register access sequence, flag clearing order, data movement, and RTOS notification method
- `shared-resource-protocol`: Rules for accessing shared data from ISR context: which mechanisms are safe (atomic operations, lock-free queues) and which are not (mutexes, malloc)

## Process

1. Follow the minimal-ISR rule: read the status register to identify the cause, clear the interrupt flag immediately (before processing for edge-triggered, after for level-triggered), move data to a buffer or queue, signal a task, return. Processing happens in the task, not the ISR.
2. For UART RX: read the data register (this clears the flag on most MCUs), write to a ring buffer, increment the write pointer using an atomic operation, signal the processing task via a semaphore or task notification. The ring buffer must be sized for worst-case burst at the baud rate.
3. For ADC end-of-conversion: read the data register, store to a DMA-like sample buffer, increment the sample counter. If the buffer is full, signal the processing task and swap to a second buffer (ping-pong pattern).
4. For timer overflow (periodic processing): use the ISR only to post a semaphore or set an event flag. The actual periodic work runs in a task at the appropriate priority. This keeps the ISR deterministic.
5. Never call functions that block or allocate memory from ISR context. Banned operations inside ISRs: mutex lock, memory allocation (malloc/new), printf/logging, queue send with a non-zero timeout. Use the 'FromISR' variants of RTOS API calls that never block.
6. For shared data between an ISR and a task: use atomic operations for single-word reads/writes, lock-free ring buffers for streaming data, or disable the specific interrupt briefly (not global interrupt disable) for multi-word structures.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
