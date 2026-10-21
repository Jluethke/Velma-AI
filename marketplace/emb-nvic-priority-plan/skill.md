# NVIC Interrupt Priority Plan

**One-line description:** Builds a Cortex-M interrupt priority table from the implemented priority bits, priority grouping and (when FreeRTOS is used) the max-syscall priority boundary, then reads the NVIC priority registers back from the running target to prove the configuration matches the plan.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `elf_path` (string, required): Firmware image to inspect.
- `irq_list` (object[], required): Every enabled IRQ with its source, the deadline or reason it needs its priority, and whether its handler calls RTOS APIs.
- `rtos_in_use` (string, required): `freertos`, `zephyr`, or `none`.

---

## Outputs

- `priority_table` (object[]): IRQ name, IRQn number, preempt priority, subpriority, register byte value expected, register byte value read back.
- `priority_defects` (object[]): Each mismatch or rule violation with evidence. Empty when none.

---

## Phase 1: Read the Hardware Facts

### Entry Criteria
- Core is Cortex-M (ESP chips use a different interrupt controller; **Return**).

### Actions
1. Find the implemented priority bits: `grep -rn "__NVIC_PRIO_BITS" <device header dir>`. Common values: 2 on Cortex-M0/M0+, 3 or 4 on many M3/M4/M7 parts. Use the header value, not a guess.
2. Rules (Armv7-M and Armv8-M Architecture Reference Manuals):
   - Lower numeric priority means higher urgency. 0 is the most urgent configurable priority.
   - Only the top `__NVIC_PRIO_BITS` bits of each 8-bit priority byte are implemented. CMSIS `NVIC_SetPriority(IRQn, prio)` takes the unshifted value 0 .. 2^bits - 1 and shifts it for you.
   - All IRQs reset to priority 0.
3. Priority grouping splits the implemented bits into preempt and subpriority (`NVIC_SetPriorityGrouping`). Only the preempt part decides preemption. Armv6-M (M0/M0+) has no grouping and no BASEPRI.
4. If `rtos_in_use` == `freertos`, open `FreeRTOSConfig.h` and record `configPRIO_BITS`, `configLIBRARY_LOWEST_INTERRUPT_PRIORITY`, `configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY`, `configKERNEL_INTERRUPT_PRIORITY` and `configMAX_SYSCALL_INTERRUPT_PRIORITY`. The FreeRTOS "Running the RTOS on a ARM Cortex-M Core" page requires all priority bits assigned to preempt priority (STM32 HAL: `HAL_NVIC_SetPriorityGrouping(NVIC_PRIORITYGROUP_4)`).
5. If `rtos_in_use` == `zephyr`, read the Zephyr docs on zero-latency interrupts (`CONFIG_ZERO_LATENCY_IRQS`) and the `IRQ_CONNECT` priority argument for your release.

### Output
Priority bits, grouping, RTOS boundary.

### Quality Gate
- `__NVIC_PRIO_BITS` value is quoted with the file and line.
- For FreeRTOS, `configPRIO_BITS` equals `__NVIC_PRIO_BITS`.

---

## Phase 2: Assign Priorities

### Entry Criteria
- Hardware facts recorded.

### Actions
1. Sort `irq_list` by required urgency.
2. Apply these rules in order:

| Rule | Check |
|---|---|
| Handler calls any FreeRTOS `...FromISR` API | Numeric priority >= `configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY` (logically equal or less urgent) |
| Handler must never be delayed by RTOS critical sections | Numeric priority < `configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY`, and it calls no RTOS API |
| Two IRQs share data | Either same preempt priority or the shared data is protected (see the ISR shared data audit flow) |
| PendSV and SysTick under FreeRTOS | Left at the lowest priority the port sets; do not change |

3. Write each `NVIC_SetPriority` (or `HAL_NVIC_SetPriority`) call before the matching `NVIC_EnableIRQ`. Enabling first runs the ISR at priority 0 if the interrupt is already pending.
4. Make sure `configASSERT` is defined. The Cortex-M ports then check the running ISR priority in `vPortValidateInterruptPriority` and stop in the assert on a violation.

### Output
Planned `priority_table`.

### Quality Gate
- Every IRQ in `irq_list` has a row.
- Every handler that calls an RTOS API satisfies the first rule, shown with numbers.

---

## Phase 3: Read Back from the Target

### Entry Criteria
- Firmware with the plan is flashed and halted after initialization (break after the last `NVIC_EnableIRQ`).

### Actions
1. The NVIC priority registers start at 0xE000E400, one byte per IRQn. In GDB: `x/<n>xb 0xE000E400` where n = highest IRQn + 1.
2. Expected byte = priority << (8 - `__NVIC_PRIO_BITS`). Compare each byte to the plan.
3. System handler priorities (PendSV, SysTick) are in SHPR3 at 0xE000ED20: `x/1xw 0xE000ED20`; PendSV is byte 2, SysTick byte 3.
4. Read the grouping from AIRCR (0xE000ED0C) PRIGROUP field on Armv7-M/Armv8-M Mainline.
5. Record every mismatch in `priority_defects`.

### Output
`priority_table` with read-back column, `priority_defects`.

### Quality Gate
- Every row has an expected byte and a read-back byte copied from GDB output.
- Zero mismatches, or each mismatch is in `priority_defects`.

---

## Worked Example

Illustrative. STM32F407, `__NVIC_PRIO_BITS` = 4, FreeRTOS with `configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY` = 5.

- Phase 1: header `stm32f407xx.h` line shows `#define __NVIC_PRIO_BITS 4U`; grouping 4 (all preempt).
- Phase 2: motor encoder capture TIM1_CC (no RTOS calls) at 2; USART2 (calls `xQueueSendFromISR`) at 6; DMA2_Stream0 ADC (calls `vTaskNotifyGiveFromISR`) at 5.
- Phase 3: `x/64xb 0xE000E400` shows byte 38 (USART2) = 0x60 and byte 27 (TIM1_CC) = 0x20, matching 6<<4 and 2<<4. SysTick byte in SHPR3 = 0xF0.

---

## Exit Criteria

DONE when every enabled IRQ has a priority that satisfies the rules, and the target's priority registers read back exactly as planned.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `configPRIO_BITS` differs from `__NVIC_PRIO_BITS` | **Adjust**: set `configPRIO_BITS` to the header value. |
| Phase 2 | An RTOS-calling ISR must be more urgent than the boundary | **Adjust**: move the RTOS call out (set a flag or use a lower-priority software interrupt); never call RTOS APIs above the boundary. |
| Phase 3 | Read-back byte is 0 for a configured IRQ | **Adjust**: the priority call ran after enable or never ran; fix the order and recheck. |
| Phase 3 | Assert in `vPortValidateInterruptPriority` | **Return**: read the active IRQ number from IPSR (`p/x $xpsr & 0x1ff`), fix that IRQ's priority. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
