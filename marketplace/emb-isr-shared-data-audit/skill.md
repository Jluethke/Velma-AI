# ISR Shared Data, volatile and Critical Section Audit

**One-line description:** Finds every variable shared between interrupt handlers and thread code, classifies each access with a decision table (volatile alone, critical section, atomic, or single-producer ring buffer), and proves the fix in the compiler's disassembly.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Firmware source tree.
- `elf_path` (string, required): Image built with the release optimization level (for example `-O2` or `-Os`), with `-g`.

---

## Outputs

- `shared_data_audit` (object[]): Per shared variable: name, type and width, writers, readers, current protection, required protection, fix applied, and disassembly evidence.

---

## Phase 1: Find Shared Variables

### Entry Criteria
- The image builds at the release optimization level. Bugs in this class often appear only with optimization on.

### Actions
1. List handlers: `arm-none-eabi-nm <elf_path> | grep -E "_IRQHandler|_Handler$"` plus any callbacks the HAL calls from interrupt context (for STM32 HAL: `HAL_*_Callback`).
2. For each handler, list the file-scope and global variables it reads or writes. Use `grep -n` on the handler's source file; follow calls one level deep.
3. For each variable, search for uses outside interrupt context: `grep -rn "<name>" <project_dir>/src`.
4. A variable is shared when at least one access is in an interrupt and one is in thread code (or two interrupts at different preempt priorities).

### Output
List of shared variables with access sites.

### Quality Gate
- Every handler from `nm` output appears in the list with zero or more variables.
- Each shared variable lists file and line of every access.

---

## Phase 2: Classify and Fix

### Entry Criteria
- Shared list complete.

### Actions
1. Classify each variable:

| Pattern | Required protection |
|---|---|
| Flag or value of 8, 16 or 32 bits, naturally aligned, written by one side, read by the other | `volatile` |
| 64-bit value, struct, or multiple related variables | Critical section on the thread side, or a lock-free copy protocol |
| Read-modify-write (`count++`, `flags |= x`) on both sides | Critical section, or C11 atomic (`atomic_fetch_add` from `<stdatomic.h>`) on cores with LDREX/STREX (Armv7-M, Armv8-M Mainline). Armv6-M (M0/M0+) lacks LDREX/STREX; use a critical section |
| Single-producer single-consumer ring buffer | `volatile` (or atomic) head and tail; producer writes only head, consumer writes only tail; on Cortex-M7 add `__DMB()` between data write and index update |

2. `volatile` forces each access to happen; it does NOT make `x++` atomic. Never mark a fix done by only adding `volatile` to a read-modify-write.
3. Bare-metal critical section that nests correctly:
   ```c
   uint32_t primask = __get_PRIMASK();
   __disable_irq();
   /* short access */
   __set_PRIMASK(primask);
   ```
   Do not use a bare `__enable_irq()` at the end; it re-enables interrupts inside an outer critical section.
4. Under FreeRTOS use `taskENTER_CRITICAL()` / `taskEXIT_CRITICAL()` in tasks and `uxSavedStatus = taskENTER_CRITICAL_FROM_ISR()` / `taskEXIT_CRITICAL_FROM_ISR(uxSavedStatus)` in ISRs.
5. Keep critical sections to the access only; no loops, no blocking calls, no printf.
6. Edit one variable's access sites at a time, rebuild, and move on. Do not rewrite many files in one pass.

### Output
Fixes applied with classification.

### Quality Gate
- Every shared variable has a classification row and the protection now in the code (file and line).
- The build at release optimization exits 0 after the fixes.

---

## Phase 3: Prove It in Disassembly

### Entry Criteria
- Fixes built.

### Actions
1. Dump the thread-side function: `arm-none-eabi-objdump -d -S <elf_path> --disassemble=<function>` (needs binutils 2.32 or newer; otherwise dump all and search).
2. For a polling loop on a `volatile` flag, confirm the `ldr` of the flag address is inside the loop body (the branch target precedes it). If the load is above the loop, the compiler cached it: the variable is not `volatile` at that site.
3. For a critical section, confirm `cpsid i` (or `mrs`/`msr basepri` under FreeRTOS) before the access and the restore after.
4. Copy the relevant instruction lines into `shared_data_audit`.

### Output
`shared_data_audit`.

### Quality Gate
- Each row has disassembly lines showing the load inside the loop or the interrupt mask around the access.

---

## Worked Example

Illustrative. `uart_rx_count` (uint32_t) incremented in `USART2_IRQHandler` and decremented in `main` loop; `tick_ms` 64-bit read in `main`.

- Phase 1: two shared variables found: `uart_rx_count` (isr.c:41, main.c:88), `tick_ms` (isr.c:12, main.c:120).
- Phase 2: `uart_rx_count` is read-modify-write on both sides on a Cortex-M4: changed to `atomic_uint` with `atomic_fetch_add`/`atomic_fetch_sub`. `tick_ms` is 64-bit: thread read wrapped in the PRIMASK save/restore block.
- Phase 3: `objdump --disassemble=main` shows `ldrex r3, [r2]` ... `strex r1, r3, [r2]` loop for the counter, and `cpsid i` / `msr PRIMASK, r0` around the 64-bit read.

---

## Exit Criteria

DONE when every shared variable has a classification, the required protection in code, and disassembly evidence.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Handler calls through a function pointer | **Adjust**: list every possible target from the table that fills the pointer. |
| Phase 2 | `stdatomic.h` operation links to `__atomic_*` library call | **Adjust**: the core lacks the instruction (Armv6-M); use a critical section instead. |
| Phase 3 | Load still hoisted out of the loop | **Retry**: check that the declaration seen by that file carries `volatile` (extern declarations must match). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
