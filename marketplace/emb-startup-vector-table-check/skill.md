# Cortex-M Startup Code and Vector Table Check

**One-line description:** Verifies a Cortex-M image's vector table (initial stack pointer, Thumb-bit reset vector, IRQ count and handler names) against the reference manual, and walks the reset handler's `.data` copy, `.bss` zero, FPU enable and VTOR relocation in order.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `elf_path` (string, required): Linked ELF.
- `startup_file` (string, required): Path of the startup source (`startup_<part>.s` or `startup.c`).
- `reference_manual` (string, required): Path or URL of the MCU reference manual (vector table and VTOR sections).

---

## Outputs

- `vector_table_report` (object): Word 0 value, word 1 value, count of entries, and each IRQ handler name mapped to its position.
- `startup_defects` (object[]): Each defect with evidence and fix. Empty when none.

---

## Phase 1: Read the Vector Table from the ELF

### Entry Criteria
- Target core is Cortex-M (for ESP chips this flow does not apply; **Return**).

### Actions
1. Find the table section: `arm-none-eabi-objdump -h <elf_path> | grep -i vector` (often `.isr_vector`).
2. Dump the first words: `arm-none-eabi-objdump -s -j .isr_vector <elf_path> | head -n 6`. Words are little-endian.
3. Word 0 is the initial main stack pointer. Compare it to the stack top symbol from `arm-none-eabi-nm <elf_path> | grep -i estack`. They must be equal.
4. Word 1 is the reset vector. Compare to `arm-none-eabi-nm <elf_path> | grep Reset_Handler`. Word 1 must equal that address plus 1 (Thumb bit set). An even reset vector causes a fault on the first instruction (INVSTATE).
5. Count entries: section size from `objdump -h` divided by 4. Expected count = 16 system exception entries + the number of IRQ lines in the reference manual vector table.

### Output
Word 0, word 1, entry count.

### Quality Gate
- Word 0 equals the stack top symbol (both values recorded).
- Word 1 is odd and equals `Reset_Handler` + 1.
- Entry count equals 16 + the reference manual IRQ count (cite the table).

---

## Phase 2: Match Handler Names

### Entry Criteria
- Table read.

### Actions
1. List weak handlers in `startup_file`: `grep -n "weak" <startup_file>`. Each IRQ name is aliased to `Default_Handler` unless the application defines it.
2. List what the application defines: `arm-none-eabi-nm <elf_path> | grep -E "_IRQHandler|_Handler"` and note which resolve to the same address as `Default_Handler`.
3. For every ISR the application intends to use, confirm its address differs from `Default_Handler`. A one-letter mismatch (`USART2_IRQhandler`) compiles cleanly but leaves the vector on `Default_Handler`, which loops forever.
4. In C++ files, ISRs must be declared `extern "C"` or the mangled name will not match.

### Output
Handler map.

### Quality Gate
- Every intended ISR resolves to an address other than `Default_Handler` in `nm` output.

---

## Phase 3: Walk the Reset Handler

### Entry Criteria
- Handler names checked.

### Actions
1. Read `Reset_Handler` in `startup_file` and confirm this order:
   1. Copy `.data` initial values from the load address symbol (`_sidata` or `__etext`) to `_sdata`.. `_edata`.
   2. Zero `.bss` from `_sbss` to `_ebss`.
   3. Call `SystemInit` (clock and, on parts with an FPU, FPU enable).
   4. Call `__libc_init_array` (static constructors).
   5. Call `main`.
2. FPU: if the build uses `-mfloat-abi=hard` or `softfp`, confirm CPACR bits 20 to 23 are set (CMSIS `SCB->CPACR |= (0xFUL << 20)`) before the first floating-point instruction, followed by `__DSB(); __ISB();`. If any code before that point uses floats, it faults with NOCP.
3. VTOR: if the table is not at address 0 alias (bootloader layout or RAM table), confirm code writes `SCB->VTOR` with the table address. Read the alignment requirement in the Armv7-M or Armv8-M Architecture Reference Manual (VTOR section) and the core's implemented bits; check `table address % required alignment == 0`. Cortex-M0 has no VTOR; Cortex-M0+ has it only when the vendor implements it.
4. Confirm in a debugger: `break Reset_Handler`, `stepi` through, then `x/4wx &_sdata` after the copy loop equals the values at the load address.

### Output
`vector_table_report`, `startup_defects`.

### Quality Gate
- Each of the five steps is found in source with its line number.
- FPU enable precedes the first float instruction (line numbers recorded) or the build is soft-float.
- VTOR value is aligned per the cited architecture manual rule.

---

## Worked Example

Illustrative. STM32F411, `app.elf`.

- Phase 1: `objdump -s -j .isr_vector` prints `8000000 00000220 c5180008 ...` so word 0 = 0x20020000 (equals `_estack`), word 1 = 0x080018c5; `nm` shows `080018c4 T Reset_Handler`. Section size 0x198 = 408 bytes = 102 entries = 16 + 86 IRQs, matching the reference manual table.
- Phase 2: `USART2_IRQHandler` resolves to 0x08002a10, distinct from `Default_Handler` 0x08001914.
- Phase 3: `SystemInit` sets CPACR before `main`; no VTOR relocation in this image.

---

## Exit Criteria

DONE when stack pointer, reset vector, IRQ count and handler names are verified, and the reset sequence order, FPU enable and VTOR alignment are confirmed with line numbers.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No vector section found | **Adjust**: search the map file for `KEEP(*(.isr_vector))`; if missing, record a defect (gc-sections removed the table). |
| Phase 1 | Entry count mismatch | **Return**: record a defect; the startup file is for a different part variant. |
| Phase 2 | ISR resolves to `Default_Handler` | **Adjust**: correct the name to the exact spelling in the startup file, rebuild, recheck `nm`. |
| Phase 3 | UsageFault NOCP at boot | **Adjust**: move the CPACR write earlier, before any float code. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
