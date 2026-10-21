# Stack Overflow Detection

**One-line description:** Sizes and guards task and main stacks with GCC `-fstack-usage` static data, FreeRTOS overflow checking and high-water marks, stack painting for the main stack, and a hardware guard (Armv8-M stack limit registers or an MPU guard region), then proves the guard fires with a deliberate overflow test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `elf_path` (string, required): Firmware image.
- `freertos_config` (object, required): FreeRTOS configuration values from the tasks flow; pass an empty object for bare-metal firmware, and Phase 2 then records "not applicable".

---

## Outputs

- `stack_report` (object): Per stack (each task and the main stack): allocated size, static worst-case estimate where available, measured high-water mark, guard mechanism, and the overflow test result.

---

## Phase 1: Static Stack Usage

### Entry Criteria
- Build system accepts extra compiler flags.

### Actions
1. Add `-fstack-usage` to the compile flags and rebuild. GCC writes a `.su` file next to each object: lines of `file:line:col:function  bytes  qualifier` where the qualifier is `static`, `dynamic` or `dynamic,bounded`.
2. List the largest frames: `cat $(find build -name "*.su") | sort -k2 -n -r | head -n 20` (adjust for the column layout of your output).
3. Optional warning: add `-Wstack-usage=<bytes>` with a byte limit chosen by the user from the stack sizes; GCC warns for any function above it.
4. Static numbers are per function. A worst-case total needs the call graph (GCC 10 or newer: `-fcallgraph-info=su` writes `.ci` files). Recursion, function pointers and `dynamic` frames (alloca, variable-length arrays) make the static total incomplete; list each such function.

### Output
Largest frames and incomplete-analysis list.

### Quality Gate
- `.su` files exist (count recorded) and the 20 largest frames are listed.
- Every `dynamic` frame and recursive function is listed by name.

---

## Phase 2: RTOS Task Stacks

### Entry Criteria
- `freertos_config` is not empty. Otherwise record "not applicable" and go to Phase 3.

### Actions
1. Confirm `configCHECK_FOR_STACK_OVERFLOW` is 2. Method 1 checks the stack pointer at context switch; method 2 also checks that a fill pattern at the stack limit is intact (FreeRTOS "Stack Usage and Stack Overflow Checking" page). Neither catches every overflow; an overflow can corrupt memory before the switch.
2. Implement `void vApplicationStackOverflowHook(TaskHandle_t xTask, char *pcTaskName)` to disable interrupts, record `pcTaskName`, and halt or reset. Do not continue running.
3. After a representative workload, read `uxTaskGetStackHighWaterMark(handle)` for each task (returns the minimum free stack in words since the task started).
4. Record allocated depth, high-water mark, and used = allocated - high-water mark.

### Output
Per-task stack figures.

### Quality Gate
- Every task has allocated and high-water figures copied from target output.

---

## Phase 3: Main Stack and Hardware Guard

### Entry Criteria
- Phase 1 done.

### Actions
1. Main stack painting: in startup code, before `main`, fill the stack region from its bottom to just below the current stack pointer with a fixed pattern word. After a workload, in GDB find the lowest overwritten address (`find /w <stack bottom>, <stack top>, <pattern>` shows where the pattern begins, or dump with `x/64wx <stack bottom>`). Used = top - lowest overwritten address.
2. Hardware guard, by core:

| Core | Guard |
|---|---|
| Armv8-M (Cortex-M23, M33, M55) | Set `MSPLIM` and `PSPLIM` (CMSIS `__set_MSPLIM`, `__set_PSPLIM`); overflow raises a UsageFault with STKOF (Mainline) |
| Armv7-M with MPU (M3, M4, M7) | MPU region with no access at the bottom of each stack; overflow raises MemManage |
| No MPU, no limit registers | Place the main stack at the lowest RAM address so overflow runs off the start of RAM into an unmapped address and faults instead of corrupting `.bss` |

3. FreeRTOS ports for Armv8-M set PSPLIM per task; check your port's documentation.
4. Overflow test (test build only): add a function that recurses with a large local array; call it from one task; confirm the hook or fault fires and names that task. Remove the test before release.

### Output
`stack_report`.

### Quality Gate
- The overflow test result shows the hook name or fault status register value (for example CFSR) captured in GDB.
- The main stack's measured use is recorded from the paint test.

---

## Worked Example

Illustrative. Cortex-M33 (STM32U5), FreeRTOS, 4 tasks.

- Phase 1: 214 `.su` files; largest `parse_json` 1296 static, `log_printf` 312 dynamic,bounded. `cli_eval` is recursive and listed.
- Phase 2: `net` task allocated 1024 words, high-water mark 88 words: 936 used.
- Phase 3: main stack 4 KB, paint shows 1.3 KB used. `MSPLIM` set to stack bottom. Overflow test in `net` triggers UsageFault; GDB `x/1xw 0xE000ED28` shows CFSR = 0x00100000 (STKOF).

---

## Exit Criteria

DONE when every stack has allocated size, measured use and a guard, and a deliberate overflow was caught by the hook or a fault.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `.su` files produced | **Adjust**: confirm the flag reaches every compile line (`cmake --build build -v`). |
| Phase 2 | Hook never fires in the overflow test | **Adjust**: confirm method 2, and that the hook is linked (not a weak empty default). |
| Phase 3 | Overflow corrupts data without a fault | **Adjust**: add the hardware guard for the core from the table. |
| Phase 3 | High-water mark near zero | **Return**: raise that task's stack depth in the design and rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
