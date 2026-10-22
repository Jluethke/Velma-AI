# Mpu Configuration Design

Configure the Memory Protection Unit to enforce access permissions, prevent stack overflow corruption, and isolate DMA buffers from application code.

## Inputs

- `stack-size-calculation`: Stack sizes and locations for MPU guard regions
- `memory-map`: Memory regions with required access attributes

## Outputs

- `mpu-region-table`: Each MPU region with: base address, size, access permissions (privileged/unprivileged, read/write/execute), memory attributes (cacheable, bufferable, shareable), and sub-region disable mask
- `fault-handler-design`: Memory management fault handler that reports the faulting address, access type, and which MPU rule was violated

## Process

1. ARM Cortex-M MPU has 8 or 16 regions (check the core revision). Each region must be a power-of-2 size, naturally aligned. Plan regions from most to least restrictive, using region priority (higher-numbered regions override lower).
2. Region 0: full flash as read-only, execute-allowed. This is the default background for code. Region 1: RAM as read-write, no-execute. This prevents code execution from RAM (a basic exploit mitigation).
3. Place a guard region (no access) at the bottom of each task stack. Size it to one MPU minimum region size (32 bytes on ARMv7-M, 256 bytes practical minimum due to alignment). A stack overflow triggers a MemManage fault instead of silently corrupting adjacent memory.
4. Mark DMA buffer regions as non-cacheable and shareable. On Cortex-M7 with cache, this is critical: TEX=001, C=0, B=1 (device shareable) or TEX=000, C=0, B=0 (strongly ordered). Without this, cached writes may not reach the DMA controller.
5. If running with unprivileged tasks (RTOS with MPU integration), configure per-task MPU regions to limit each task's access to only its own stack and designated shared regions. The RTOS context switch reconfigures the MPU for each task.
6. Implement the MemManage fault handler to capture MMFAR (faulting address), MMFSR (fault status), and the stacked PC (the instruction that caused the fault). Log these values and trigger a controlled error response.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
