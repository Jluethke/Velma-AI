# Rtos Stack Sizing

Determine stack size for each RTOS task and the ISR stack using call graph analysis, local variable accounting, and runtime painting verification.

## Inputs

- `ipc-architecture`: IPC objects and their memory requirements
- `priority-table`: Tasks with priorities for preemption analysis

## Outputs

- `stack-allocation-table`: Each task's stack size in bytes with breakdown: call depth, locals, RTOS overhead, safety margin
- `memory-budget`: Total RAM usage: task stacks, ISR stack, RTOS kernel objects, message queue buffers, and heap (if used)

## Process

1. For each task, build the call graph from the task entry function. Tools like GCC's -fstack-usage flag produce per-function stack usage. Sum the stack usage along the deepest call path.
2. Add the RTOS context save overhead: for ARM Cortex-M, this is 32 bytes for the hardware-stacked registers plus whatever the RTOS pushes (typically 32 to 64 more bytes for software context).
3. Add ISR preemption overhead. When an ISR preempts a task, the hardware stacks 8 registers (32 bytes on Cortex-M). Nested interrupts stack again. The ISR stack (separate on Cortex-M with RTOS support via MSP/PSP split) handles this.
4. Size the ISR stack: sum the worst-case nesting depth times the per-interrupt frame size. Most systems allow 2 to 4 levels of nesting.
5. Add a safety margin of 25% to each calculated stack. This covers compiler optimizations that change call depth, floating point context (additional 72 bytes on Cortex-M4F), and library functions with stack-heavy implementations.
6. Verify at runtime using stack painting: fill each stack with a known pattern (0xDEADBEEF) at startup, then periodically check how much of the pattern remains. The high-water mark should stay at least 15% below the allocated size. If not, increase the stack.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
