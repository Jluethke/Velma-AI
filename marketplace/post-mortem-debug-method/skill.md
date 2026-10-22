# Post Mortem Debug Method

Implement post-mortem debugging for field-deployed devices: core dump to flash, stack unwinding from saved context, and remote diagnostic data retrieval.

## Inputs

- `fault-handler-implementation`: Fault handler that captures diagnostic data
- `fault-analysis-procedure`: Register and stack analysis procedure to apply to captured data

## Outputs

- `core-dump-implementation`: Code that saves registers, stack, and key memory regions to a dedicated flash sector on fault, with corruption protection and extraction interface
- `debug-methodology-document`: Complete debugging guide: probe setup, trace configuration, fault analysis, post-mortem, and a decision tree for which technique to use based on the symptom

## Process

1. Reserve a flash sector for the core dump. Size it for: stacked registers (32 bytes), fault status registers (12 bytes), full task stack contents (stack size, typically 1 KB to 4 KB), and selected global variables (application state, firmware version, uptime counter). Add a header with magic number, timestamp, and CRC for integrity.
2. In the fault handler: disable interrupts, write the header, write all captured registers, copy the active stack contents from the stack pointer to the stack base, write selected global state variables, compute and write the CRC, then enter the safe state (reset or halt).
3. Use the flash programming routines carefully in the fault handler: the flash driver itself may be corrupted if the fault was caused by code corruption. Use a minimal, self-contained flash write function that does not depend on any global state. Place it in a protected flash region.
4. Provide an extraction interface: at the next boot, the bootloader or application checks for a valid core dump in the reserved sector. If found, it can be read out via UART, USB, or a diagnostic protocol. Include the ELF file's build ID in the dump so the correct symbol file can be matched for analysis.
5. Analyze the extracted dump offline: load the registers and stack into GDB using the 'restore' command or a custom script. Use 'info frame' and 'backtrace' to reconstruct the call stack. Map the faulting PC to source code. Correlate the application state variables with the fault to determine the triggering condition.
6. Document the complete debug methodology: a decision tree starting from the symptom (crash, hang, wrong output, timing violation) through the appropriate technique (breakpoints, watchpoints, trace, post-mortem) to the root cause. Include worked examples of each common fault type.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
