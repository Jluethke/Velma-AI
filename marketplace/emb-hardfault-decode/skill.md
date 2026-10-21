# Cortex-M HardFault Decode

**One-line description:** Decodes a Cortex-M HardFault from the fault status registers (CFSR, HFSR, MMFAR, BFAR) and the stacked exception frame, picks the right stack from EXC_RETURN, maps the faulting PC and LR to source lines with `addr2line`, and names the fault class with a bit-by-bit table.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `elf_path` (string, required): The exact ELF that was running when the fault happened (same build; a rebuilt ELF gives wrong lines).
- `debug_probe` (string, required): Probe attached to the halted target (`stlink`, `jlink`, `cmsis-dap`), used through OpenOCD or pyOCD with GDB.

---

## Outputs

- `fault_report` (object): Register values, decoded fault bits, stacked registers, faulting PC and LR with source lines, fault class, and the next debugging step.

---

## Phase 1: Capture Registers

### Entry Criteria
- Target halted in the HardFault handler (set `break HardFault_Handler` and reproduce), connected through GDB.
- Core is Armv7-M or Armv8-M Mainline (M3, M4, M7, M33, M55). Armv6-M (M0/M0+) and Armv8-M Baseline (M23) have no CFSR; on those, only Phase 2 applies.

### Actions
1. Read the fault registers in GDB (System Control Block addresses from the Armv7-M Architecture Reference Manual):
   - `x/1xw 0xE000ED28` CFSR (MMFSR byte 0, BFSR byte 1, UFSR halfword 2)
   - `x/1xw 0xE000ED2C` HFSR
   - `x/1xw 0xE000ED34` MMFAR
   - `x/1xw 0xE000ED38` BFAR
2. Read `p/x $lr` at the very first instruction of the handler: this is EXC_RETURN. Read `p/x $msp` and `p/x $psp`.
3. Record all values before resuming or resetting; a reset clears them.

### Output
Raw register values.

### Quality Gate
- CFSR, HFSR, EXC_RETURN, MSP and PSP values are copied from GDB output.

---

## Phase 2: Find the Stacked Frame

### Entry Criteria
- EXC_RETURN recorded.

### Actions
1. EXC_RETURN bit 2: 0 means the frame is on MSP, 1 means PSP (RTOS tasks run on PSP).
2. Dump the frame: `x/8xw <sp>`. Layout (basic frame): offset 0x00 R0, 0x04 R1, 0x08 R2, 0x0C R3, 0x10 R12, 0x14 LR, 0x18 PC (return address), 0x1C xPSR.
3. EXC_RETURN bit 4 = 0 means an extended FPU frame was stacked; the basic eight words are still at the start.
4. Map to source: `arm-none-eabi-addr2line -e <elf_path> -f -C -i <stacked PC> <stacked LR>`. `-f` prints function names, `-i` shows inlined callers.
5. Disassemble around the PC: `arm-none-eabi-objdump -d -S <elf_path> --start-address=<PC-16> --stop-address=<PC+16>`.

### Output
Stacked registers and source lines.

### Quality Gate
- The stack choice cites EXC_RETURN bit 2.
- `addr2line` output for PC and LR is recorded.

---

## Phase 3: Decode the Class

### Entry Criteria
- CFSR available (Mainline cores).

### Actions
1. Decode CFSR bits:

| Bit (CFSR) | Name | Meaning | First check |
|---|---|---|---|
| 0 | IACCVIOL | Instruction fetch from a no-execute or MPU-denied region | Jump through a corrupted pointer |
| 1 | DACCVIOL | Data access violates MPU | MMFAR if MMARVALID |
| 7 | MMARVALID | MMFAR holds the faulting address | Read MMFAR |
| 8 | IBUSERR | Bus error on instruction fetch | PC outside flash |
| 9 | PRECISERR | Precise data bus error | BFAR if BFARVALID: address accessed |
| 10 | IMPRECISERR | Imprecise data bus error; stacked PC is after the real access | See step 2 |
| 15 | BFARVALID | BFAR holds the faulting address | Read BFAR (peripheral clock off, unmapped address) |
| 16 | UNDEFINSTR | Undefined instruction | Corrupted code or data executed |
| 17 | INVSTATE | Thumb bit cleared | Function pointer with bit 0 = 0 |
| 18 | INVPC | Bad EXC_RETURN | Stack corruption in a handler |
| 19 | NOCP | Coprocessor (FPU) access with FPU disabled | CPACR not set before float code |
| 20 | STKOF | Stack limit violation (Armv8-M Mainline) | Run stack overflow flow |
| 24 | UNALIGNED | Unaligned access with trap enabled | Packed struct access |
| 25 | DIVBYZERO | Divide by zero with `CCR.DIV_0_TRP` set | Divisor |

2. IMPRECISERR: for debugging only, make bus faults precise by setting `DISDEFWBUF` in `ACTLR` (0xE000E008) on Cortex-M3/M4 (read the core Technical Reference Manual; Cortex-M7 differs). Reproduce, decode again, then remove the setting.
3. HFSR bit 30 FORCED means a configurable fault escalated because its handler is disabled; enable MemManage, BusFault and UsageFault handlers in `SCB->SHCSR` to get direct faults next time. HFSR bit 1 VECTTBL means a vector table read failed.
4. Write `fault_report` with class, evidence, and next step. Do not "fix" by adding a catch-all handler that resumes.

### Output
`fault_report`.

### Quality Gate
- Every set CFSR bit is named from the table with its evidence.
- Fault address (MMFAR or BFAR) is reported only when its VALID bit is set.

---

## Worked Example

Illustrative. Cortex-M4, FreeRTOS, fault in the `sensor` task.

- Phase 1: CFSR = 0x00008200, HFSR = 0x40000000, BFAR = 0x40008000, EXC_RETURN = 0xFFFFFFFD.
- Phase 2: bit 2 = 1, so PSP. `x/8xw $psp` shows PC = 0x08003a5c. `addr2line -e app.elf -f -C -i 0x08003a5c` prints `i2c_read_reg` at `drivers/i2c.c:88`.
- Phase 3: PRECISERR + BFARVALID, BFAR 0x40008000, which the reference manual memory map lists as reserved; the driver used a peripheral base pointer from the wrong instance table. HFSR FORCED. Next step: fix the base address against the memory map; enable BusFault in SHCSR.

---

## Exit Criteria

DONE when the stacked PC and LR are mapped to source, every set fault bit is decoded with evidence, and the next debugging step is named.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Target reset before registers were read | **Retry**: break on `HardFault_Handler` and reproduce. |
| Phase 2 | `addr2line` prints `??:0` | **Stop**: the ELF does not match the running image; reflash from this ELF and reproduce. |
| Phase 2 | Stacked SP points outside RAM | **Adjust**: the stack itself overflowed; run the stack overflow detection flow. |
| Phase 3 | IMPRECISERR only | **Adjust**: apply the debug-only precise setting and reproduce. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
