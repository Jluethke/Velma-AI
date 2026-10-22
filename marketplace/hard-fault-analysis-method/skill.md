# Hard Fault Analysis Method

Analyze ARM Cortex-M hard faults by reading stacked registers, fault status registers, and reconstructing the call stack to identify the faulting instruction and root cause.

## Inputs

- `trace-configuration`: Available trace output for fault logging
- `debug-setup`: Debug connection for post-fault inspection

## Outputs

- `fault-analysis-procedure`: Step-by-step procedure to decode any hard fault: read registers, identify fault type, find faulting address, and determine root cause
- `fault-handler-implementation`: Hard fault handler code that captures all diagnostic information and either logs it or halts for debugger inspection

## Process

1. Implement a hard fault handler that captures the stacked register frame. On Cortex-M, the hardware pushes R0-R3, R12, LR, PC, and xPSR to the stack on exception entry. The stacked PC is the address of the faulting instruction (or the next instruction for some fault types). Read the MSP or PSP (check bit 2 of LR to determine which stack was active).
2. Read the fault status registers: HFSR (HardFault Status Register) tells if the fault was forced (escalated from another fault) or due to a vector table read error. CFSR (Configurable Fault Status Register) is split into MMFSR (memory management), BFSR (bus fault), and UFSR (usage fault) with specific bits for each fault cause.
3. Decode common fault causes: UFSR bit UNDEFINSTR = undefined instruction (corrupted code or branching to data). UFSR bit INVSTATE = attempt to execute ARM instructions on a Thumb-only core (function pointer without bit 0 set). BFSR bit PRECISERR + BFAR = bus error at the address in BFAR (reading unmapped memory). MMFSR bit DACCVIOL + MMFAR = MPU access violation at MMFAR.
4. Reconstruct the call stack from the fault context. Starting from the stacked LR (return address), walk the stack frame by frame. Each frame's LR points to the caller. Map addresses to function names using the ELF file: addr2line -e firmware.elf <address>. This shows the call chain that led to the fault.
5. In the fault handler, either halt for debugger inspection (infinite loop with the diagnostic data in registers/memory for the debugger to read) or log the fault data to a reserved RAM region / flash sector for post-mortem analysis. The choice depends on whether a debugger is attached (check the CoreDebug->DHCSR C_DEBUGEN bit).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
