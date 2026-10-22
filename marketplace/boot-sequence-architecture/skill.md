# Boot Sequence Architecture

Design the multi-stage boot sequence from power-on reset through application entry, defining responsibilities at each stage.

## Inputs

- `mcu-platform`: MCU family, flash size, RAM size, boot ROM capabilities, and clock configuration requirements
- `security-requirements`: Whether secure boot is required, firmware encryption needs, and anti-rollback requirements

## Outputs

- `boot-stage-design`: Each boot stage with: entry conditions, responsibilities, memory location, size budget, and handoff mechanism
- `flash-partition-map`: Flash memory layout: bootloader region, application A slot, application B slot (if A/B), configuration/NVM region, factory image region

## Process

1. Define the boot stages. Stage 0: ROM bootloader (built into silicon, not modifiable). Stage 1: first-stage bootloader in protected flash (performs hardware init, validates stage 2). Stage 2: second-stage bootloader (full update logic, validates application). Stage 3: application.
2. The ROM bootloader (stage 0) is fixed by the silicon vendor. Understand its capabilities: which interfaces it can boot from (UART, USB, SPI), whether it checks signatures, and how it selects between boot sources (boot pins, option bytes).
3. Design the flash partition map. Place the bootloader at the base of flash (address 0x08000000 on STM32). Size it conservatively: 32 KB to 64 KB for most systems. The application starts at the next flash sector boundary after the bootloader. If using A/B update, split remaining flash into two equal application slots plus a configuration sector.
4. Define the vector table relocation mechanism. The bootloader must set VTOR (Vector Table Offset Register) to point to the application's vector table before jumping. The application's linker script must place its vector table at the slot base address.
5. Design the bootloader-to-application handoff: set the MSP to the value at the application's vector table base address, then branch to the reset handler address stored at vector table base + 4. Verify the MSP value is within valid RAM range before jumping (a simple integrity check).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
