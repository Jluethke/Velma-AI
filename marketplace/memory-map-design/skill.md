# Memory Map Design

Design the system memory map by assigning flash and RAM regions to bootloader, application, data, and peripheral access, based on MCU memory architecture.

## Inputs

- `mcu-memory-spec`: MCU memory regions (flash base/size, SRAM banks, CCM RAM if present, backup SRAM, peripheral base), and any memory-mapped external memories
- `application-requirements`: Code size estimate, static data size, dynamic memory needs, DMA requirements, and any special memory needs (tightly-coupled, non-cacheable)

## Outputs

- `memory-map`: Each memory region with: base address, size, contents (code, rodata, data, bss, heap, stacks, DMA buffers, config/NVM), and access attributes (read/write/execute, cacheable, shareable)
- `region-allocation-table`: Detailed allocation within each region: section names, sizes, alignment requirements, and growth direction

## Process

1. Start from the MCU memory map in the reference manual. ARM Cortex-M defines: 0x00000000 to 0x1FFFFFFF for code (flash maps here), 0x20000000 to 0x3FFFFFFF for SRAM, 0x40000000 to 0x5FFFFFFF for peripherals, 0xE0000000 for system control (NVIC, SysTick, debug).
2. Partition flash: bootloader at base, application code after bootloader end (sector-aligned), read-only data (const, strings, lookup tables) adjacent to code, configuration/calibration data in the last flash sector(s) for independent erase.
3. Partition SRAM: .data and .bss at SRAM base, stacks growing downward from a defined boundary, heap growing upward from .bss end (if heap is used), DMA buffers at specific addresses required by DMA controller alignment. On STM32 with multiple SRAM banks, place DMA buffers in SRAM1/SRAM2 accessible by the DMA controller.
4. If the MCU has CCM (core-coupled memory), use it for stack and frequently accessed variables because it has zero-wait-state access. CCM is not DMA-accessible on most STM32, so DMA buffers must go in main SRAM.
5. For systems with data cache (Cortex-M7), mark DMA buffer regions as non-cacheable to prevent coherence issues. Alternatively, use cache maintenance operations (clean/invalidate) around DMA transfers, but the non-cacheable approach is simpler and less error-prone.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
