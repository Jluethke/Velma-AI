# Stack Heap Sizing Analysis

Determine stack and heap sizes using static call graph analysis, compiler-generated stack usage data, and runtime verification.

## Inputs

- `linker-script`: Current linker script with stack and heap size symbols
- `startup-requirements`: Startup code requirements affecting initial stack usage

## Outputs

- `stack-size-calculation`: Per-task stack requirement with breakdown: deepest call path, local variable sum, interrupt preemption overhead, FPU context, and safety margin
- `heap-elimination-plan`: Strategy to eliminate or minimize heap usage through static allocation, memory pools, and stack-allocated buffers

## Process

1. Compile with -fstack-usage (GCC) to generate .su files showing stack usage per function. Parse these to find the function with the deepest total stack path: sum from main() (or task entry) through the deepest call chain.
2. Account for call-stack overhead: each function call pushes the return address (4 bytes on ARM) plus any callee-saved registers the function uses (up to 32 bytes for all callee-saved regs). The -fstack-usage output includes this.
3. Add interrupt preemption overhead: on Cortex-M, an interrupt pushes 8 registers (32 bytes) automatically. With FPU in use and lazy stacking enabled, an additional 72 bytes are reserved (but only used if the ISR uses floating point). If RTOS is used, the ISR stack is separate (MSP), so this adds to the ISR stack, not the task stack.
4. For heap: the safest approach in embedded systems is to eliminate it. Replace malloc with static buffers sized at compile time, memory pools for fixed-size allocations, and stack-allocated arrays for temporary buffers. If heap is unavoidable, define the minimum heap size as the peak concurrent allocation measured during testing.
5. Verify at runtime: fill the stack region with a canary pattern (0xDEADBEEF) at startup. Periodically check the canary from the bottom up. The first non-canary byte is the high-water mark. The margin between high-water mark and stack bottom should be at least 15% of the total stack.
6. Record the final sizes in the linker script as _Min_Stack_Size and _Min_Heap_Size. These symbols are used by the ASSERT to catch RAM overflow at link time.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
