# Linker Script Design

Write the linker script (GNU LD or equivalent) that implements the memory map, placing each section in the correct region with proper alignment and initialization.

## Inputs

- `memory-map`: Memory regions with contents and attributes
- `region-allocation-table`: Section assignments and alignment requirements

## Outputs

- `linker-script`: Complete linker script with MEMORY definitions, SECTIONS placements, symbol definitions for startup code (.data copy, .bss zero, stack pointer), and alignment directives
- `startup-requirements`: What the startup code must do based on the linker script: copy .data from flash to RAM, zero .bss, set MSP, call constructors, branch to main

## Process

1. Define the MEMORY block: each physical memory region with origin and length. Name them clearly: FLASH, SRAM, CCM, BACKUP_SRAM. The origin and length must match the MCU datasheet exactly.
2. Define the SECTIONS block. Place .isr_vector first in FLASH (the vector table must be at the flash base for the default VTOR). Follow with .text (code), .rodata (constants), .ARM.extab and .ARM.exidx (exception handling tables if C++ is used).
3. The .data section is loaded in FLASH but runs from RAM. Use the AT> directive: '.data : { *(.data*) } > SRAM AT> FLASH'. Define _sidata (load address in flash), _sdata (start in RAM), _edata (end in RAM) symbols for the startup code to copy.
4. The .bss section is zero-initialized and lives only in RAM. Define _sbss and _ebss symbols. The startup code zeroes this region before calling main.
5. Place the stack at the top of SRAM (or CCM) with a defined size symbol. The first word of the vector table is the initial MSP value, which the linker script provides: _estack = ORIGIN(SRAM) + LENGTH(SRAM). Alternatively, reserve a fixed-size stack section.
6. Add ASSERT statements to catch overflows at link time: ASSERT((_edata - _sdata) + (_ebss - _sbss) + _Min_Heap_Size + _Min_Stack_Size <= LENGTH(SRAM), 'RAM overflow'). This prevents silent memory corruption from a build that compiles but does not fit.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
