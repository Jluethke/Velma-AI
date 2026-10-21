# Linker Script and Map File Audit

**One-line description:** Reads a GNU ld linker script, the map file and the ELF section headers to confirm every section sits in the right memory region with the right load address, finds the largest symbols, and reports placement defects such as uncopied `.data`, region overflow and misplaced stacks.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `elf_path` (string, required): Linked ELF from the toolchain flow.
- `map_path` (string, required): Linker map file from the same build.
- `linker_script` (string, required): Path of the `.ld` file used for that build.

---

## Outputs

- `memory_usage_report` (object): Per region (FLASH, RAM and any others): origin, length, used bytes; per output section: VMA, LMA, size; the 20 largest symbols.
- `placement_defects` (object[]): Each defect with the section or symbol, the evidence line from the tool output, and the fix. Empty when none.

---

## Phase 1: Check the MEMORY Block Against the Datasheet

### Entry Criteria
- `elf_path`, `map_path` and `linker_script` come from the same build (map file timestamp is not older than the ELF).

### Actions
1. Open `linker_script` and copy the `MEMORY { ... }` block: each region name, attributes (`rx`, `rwx`), `ORIGIN`, `LENGTH`.
2. Open the reference manual "Memory map" section for the part. For each region confirm ORIGIN equals the documented base address (for example on STM32F4 flash at 0x08000000, SRAM at 0x20000000) and LENGTH does not exceed the documented size.
3. Note special regions: CCM RAM, DTCM, ITCM, backup SRAM. Record which bus masters can reach each (bus matrix figure in the reference manual). DMA buffers must not go in a region the DMA cannot reach.
4. If a bootloader occupies the start of flash, ORIGIN must equal the application slot start, not the flash base.

### Output
Verified region table.

### Quality Gate
- Every region's ORIGIN and LENGTH cites a reference manual section.
- No LENGTH exceeds the documented memory size.

---

## Phase 2: Read Section Placement

### Entry Criteria
- Region table verified.

### Actions
1. Run `arm-none-eabi-objdump -h <elf_path>`. Columns are Idx, Name, Size, VMA, LMA, File off, Algn, then flags.
2. Apply this decision table to each section:

| Section | Expected | Defect if |
|---|---|---|
| `.isr_vector` | VMA at the start of the image region | VMA not at region start, or flags lack `LOAD` |
| `.text`, `.rodata` | VMA = LMA, inside FLASH | VMA in RAM without a copy routine |
| `.data` | VMA in RAM, LMA in FLASH | VMA = LMA (initial values never copied) |
| `.bss` | VMA in RAM, flags `ALLOC` without `LOAD` | flags contain `LOAD` (bloats the binary) |
| heap/stack reservation | VMA in RAM, ALLOC only | missing; the startup code then uses unreserved RAM |

3. Run `arm-none-eabi-readelf -l <elf_path>` and confirm each `LOAD` segment PhysAddr lies in a flash region.
4. Find the stack top symbol: `arm-none-eabi-nm <elf_path> | grep -i estack` (name varies: `_estack`, `__StackTop`). Confirm it equals the RAM ORIGIN + LENGTH, or the documented end of the region you chose.
5. In the map file, read the "Memory Configuration" table and the "Linker script and memory map" body. Search for `*fill*` lines larger than the section alignment; they show wasted padding.

### Output
Section placement table and draft defects.

### Quality Gate
- Every section in `objdump -h` output has a row with VMA, LMA and a verdict from the table.
- The stack top symbol value is recorded and compared to the region end.

---

## Phase 3: Find What Uses the Space

### Entry Criteria
- Placement checked.

### Actions
1. `arm-none-eabi-size -A -x <elf_path>` for per-section sizes.
2. `arm-none-eabi-nm -S --size-sort -C <elf_path> | tail -n 20` lists the 20 largest symbols with size (second column, hex) and type letter (`T`/`t` code, `D`/`d` initialized data, `B`/`b` zero-initialized data, `R`/`r` read-only data).
3. For each large symbol, find which object pulled it in: search the map file for the symbol name; the line above shows the archive and object (for example `libc_nano.a(lib_a-vfprintf.o)`).
4. Common findings: `_printf_float` pulled in by `-u _printf_float`; `__aeabi_d*` double-precision soft-float routines on a single-precision FPU (a `double` literal or `math.h` double function); C++ exception tables (`.ARM.exidx`).
5. Write `memory_usage_report` and `placement_defects`. Do not change the linker script in this flow; each defect names the fix for the owner to apply.

### Output
`memory_usage_report`, `placement_defects`.

### Quality Gate
- The 20 largest symbols are listed with sizes copied from `nm` output.
- Each defect quotes the tool output line that shows it.

---

## Worked Example

Illustrative. STM32F411 build, `app.elf`.

- Phase 1: script has `FLASH (rx) : ORIGIN = 0x08000000, LENGTH = 512K` and `RAM (xrw) : ORIGIN = 0x20000000, LENGTH = 128K`, matching the reference manual memory map.
- Phase 2: `objdump -h` shows
  ```
    6 .data   0000010c  20000000  08004a38  00020000  2**2  CONTENTS, ALLOC, LOAD, DATA
    7 .bss    00000e48  2000010c  2000010c  0002010c  2**2  ALLOC
  ```
  `.data` VMA in RAM, LMA in flash: correct. `_estack` = 0x20020000 = RAM end.
- Phase 3: `nm -S --size-sort` tail shows `00000c30 T _svfprintf_r`; the map file traces it to `libc_nano.a(lib_a-svfprintf.o)` through `snprintf` in `log.c`. Reported as a size item, not a defect.

---

## Exit Criteria

DONE when every region and section has a verdict, the largest symbols are traced to their objects, and every defect quotes its evidence.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Map file older than ELF | **Stop**: rebuild so both come from one link. |
| Phase 1 | Region larger than the datasheet | **Return**: record as a defect; never trust a LENGTH beyond documented memory. |
| Phase 2 | `objdump` reports "file format not recognized" | **Adjust**: use the toolchain matching the target (`arm-none-eabi-` for Arm; `xtensa-...` or `riscv32-...` for ESP chips). |
| Phase 3 | Symbol not found in map | **Adjust**: search for the mangled name; rerun `nm` without `-C`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
