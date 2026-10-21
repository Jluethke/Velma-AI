# FreeRTOS Tasks and Queues

**One-line description:** Turns a task list into FreeRTOS tasks and queues with a checked `FreeRTOSConfig.h`, correct ISR-to-task signaling with `...FromISR` and `portYIELD_FROM_ISR`, and a runtime check of task states, stack high-water marks and free heap.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Firmware source tree with the FreeRTOS kernel (or a vendor package that includes it).
- `task_list` (object[], required): Each task's job, trigger (period or event), data it receives and sends, and deadline.

---

## Outputs

- `rtos_design` (object): Task table (name, priority, trigger, stack depth in words, queues used) and queue table (name, item type, length, producers, consumers).
- `freertos_config` (object): Final values of the `FreeRTOSConfig.h` keys used by this flow and the downstream stack and priority flows.

---

## Phase 1: Design Tasks and Queues

### Entry Criteria
- `task_list` gives a trigger and deadline for every task.

### Actions
1. Assign priorities: shorter deadline gets higher number (FreeRTOS task priority: higher number = higher priority, 0 is idle). Equal priorities time-slice when `configUSE_TIME_SLICING` is 1.
2. One queue per data flow. Item = a struct copied by value; queue length = largest burst the producer can create before the consumer runs, derived from the task list rates. If it cannot be derived, record it as an open question.
3. Initial stack depth per task in words (`xTaskCreate` takes words, not bytes, on the standard ports). Start from `configMINIMAL_STACK_SIZE` plus the task's known large locals, then correct with the measured high-water mark in Phase 3.

### Output
Draft `rtos_design`.

### Quality Gate
- Every task in `task_list` has a priority, trigger, stack depth and queue list.

---

## Phase 2: Configure and Code

### Entry Criteria
- Design drafted.

### Actions
1. In `FreeRTOSConfig.h` set and record: `configUSE_PREEMPTION 1`, `configTICK_RATE_HZ`, `configMAX_PRIORITIES` (greater than the highest priority used), `configMINIMAL_STACK_SIZE`, `configTOTAL_HEAP_SIZE`, `configUSE_MUTEXES 1`, `configCHECK_FOR_STACK_OVERFLOW 2`, `configUSE_MALLOC_FAILED_HOOK 1`, `configUSE_TRACE_FACILITY 1`, `configUSE_STATS_FORMATTING_FUNCTIONS 1` (debug builds), and a `configASSERT` definition that halts (for example disable interrupts and loop).
2. Pick one heap implementation file (`heap_4.c` is the common general choice; read the FreeRTOS "Memory Management" page for the differences) and compile only that one.
3. Create objects and check every return: `xTaskCreate(...) == pdPASS`; `xQueueCreate(len, sizeof(item)) != NULL`.
4. Periodic tasks use `vTaskDelayUntil` (or `xTaskDelayUntil` on kernels that provide it; check your kernel version) with a `TickType_t` last-wake variable, not `vTaskDelay`, so the period does not drift.
5. ISR to task: `BaseType_t woken = pdFALSE; xQueueSendFromISR(q, &item, &woken); portYIELD_FROM_ISR(woken);`. Never call a non-FromISR API from an interrupt.
6. STM32 HAL with FreeRTOS: move the HAL time base off SysTick to a spare timer (CubeMX "Timebase Source"); FreeRTOS owns SysTick.
7. Implement `vApplicationMallocFailedHook` and `vApplicationStackOverflowHook` to halt with a recognizable breakpoint.

### Output
Building firmware with tasks and queues.

### Quality Gate
- `grep -n "configCHECK_FOR_STACK_OVERFLOW\|configASSERT\|configUSE_MALLOC_FAILED_HOOK" FreeRTOSConfig.h` shows all three set.
- Every `xTaskCreate` and `xQueueCreate` call site has a return check (grep output recorded).
- Build exits 0.

---

## Phase 3: Runtime Check

### Entry Criteria
- Firmware runs on target.

### Actions
1. After the system has run its normal workload for a period chosen by the user, call `vTaskList(buf)` and print `buf` over UART or RTT. Columns: name, state, priority, stack high-water mark (words), task number.
2. Call `xPortGetFreeHeapSize()` and `xPortGetMinimumEverFreeHeapSize()` (heap_4 and heap_5) and print them.
3. If `vTaskStartScheduler()` returns, the heap was too small to create the idle or timer task; increase `configTOTAL_HEAP_SIZE`.
4. Record final `freertos_config` and update `rtos_design` with measured high-water marks.

### Output
`rtos_design`, `freertos_config`.

### Quality Gate
- `vTaskList` output copied into the record shows every designed task.
- Minimum-ever free heap value recorded and greater than zero.

---

## Worked Example

Illustrative. Tasks: sensor read every 10 ms, logger on queue, UART command parser from ISR.

- Phase 1: `sensor` prio 3, `cmd` prio 2, `logger` prio 1; queue `q_samples` (struct sample, length 8), `q_rx` (uint8_t, length 64).
- Phase 2: `USART2_IRQHandler` uses `xQueueSendFromISR(q_rx, &byte, &woken); portYIELD_FROM_ISR(woken);`. HAL time base moved to TIM6.
- Phase 3: `vTaskList` prints
  ```
  sensor   X  3  212  2
  cmd      B  2  180  3
  logger   B  1  96   4
  IDLE     R  0  110  5
  ```
  minimum-ever free heap 5240 bytes.

---

## Exit Criteria

DONE when all tasks and queues are created with checked returns, ISR signaling uses FromISR APIs, and task list and heap figures are recorded from the running target.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Queue length cannot be derived | **Return**: record as open question; do not pick a number without a basis. |
| Phase 2 | `xTaskCreate` returns `errCOULD_NOT_ALLOCATE_REQUIRED_MEMORY` | **Adjust**: raise `configTOTAL_HEAP_SIZE` within RAM limits from the map audit. |
| Phase 3 | Assert in `vPortValidateInterruptPriority` | **Return**: run the NVIC priority plan flow. |
| Phase 3 | Stack overflow hook fires | **Return**: run the stack overflow detection flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
