# OpenOCD and GDB Debug Session

**One-line description:** Connects OpenOCD to a Cortex-M target through an ST-Link, J-Link or CMSIS-DAP probe, flashes and verifies the ELF, and runs a GDB session with breakpoints, backtrace and memory reads, including connect-under-reset recovery.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `elf_path` (string, required): ELF built with `-g`.
- `target_mcu` (string, required): Exact part number; selects the OpenOCD target config.
- `debug_probe` (string, required): One of `stlink`, `jlink`, `cmsis-dap`.

---

## Outputs

- `debug_session_record` (object): OpenOCD command line, probe and target config files, detected IDCODE line, flash verify result, and the GDB commands that worked.

---

## Phase 1: Connect

### Entry Criteria
- Board powered; probe SWDIO, SWCLK, GND and (for connect-under-reset) NRST wired.
- `openocd --version` prints a version.

### Actions
1. Find config files under the OpenOCD `scripts` directory (`openocd` prints the search path with `-d`, or look in `share/openocd/scripts`). Choose the interface file by probe:

| `debug_probe` | Interface file |
|---|---|
| stlink | `interface/stlink.cfg` (older releases: `interface/stlink-v2.cfg` or `stlink-v2-1.cfg`) |
| jlink | `interface/jlink.cfg` |
| cmsis-dap | `interface/cmsis-dap.cfg` |

2. Choose the target file matching the family, for example `target/stm32f4x.cfg`, `target/nrf52.cfg`, `target/rp2040.cfg`. The file must exist in `scripts/target/`; do not invent one.
3. Run `openocd -f interface/<probe>.cfg -f target/<family>.cfg`.
4. Read the output. Success shows a line with the debug port IDCODE ("SWD DPIDR 0x...") and "Listening on port 3333 for gdb connections". Port 4444 is telnet, 6666 is Tcl.
5. If it fails with "init mode failed" or "unable to connect to the target", the firmware may disable SWD pins or sleep. Retry with `-c "reset_config srst_only srst_nogate connect_assert_srst"` added before the target is initialized (place after the interface `-f`; check the OpenOCD manual section "reset_config" for your release).

### Output
Working OpenOCD command line.

### Quality Gate
- OpenOCD output contains a DPIDR line and "Listening on port 3333".

---

## Phase 2: Flash and Verify

### Entry Criteria
- OpenOCD connects.

### Actions
1. One-shot flash: `openocd -f interface/<probe>.cfg -f target/<family>.cfg -c "program <elf_path> verify reset exit"`.
2. Read the output: "** Programming Finished **" then "** Verified OK **". Any "Verify Failed" means flash content differs from the ELF.
3. If flash is write-protected or read-protected, OpenOCD reports an error from the flash driver; read the family's flash driver section in the OpenOCD manual (for STM32: `stm32f2x unlock 0` and the option byte procedure). Removing read protection mass erases flash; ask the owner before doing it.

### Output
Verified flash.

### Quality Gate
- Output contains "Verified OK".

---

## Phase 3: GDB Session

### Entry Criteria
- OpenOCD running and listening on 3333.

### Actions
1. Start GDB: `arm-none-eabi-gdb <elf_path>` (or `gdb-multiarch`).
2. In GDB:
   - `target extended-remote localhost:3333`
   - `monitor reset halt`
   - `load` (writes the ELF; skip if Phase 2 flashed this exact build)
   - `break main` then `continue`
   - `bt` for the backtrace, `info registers` for core registers, `p <variable>`, `x/8wx <address>` for raw memory
   - `monitor reg` lists registers from OpenOCD's view.
3. Breakpoints in flash use the core's hardware breakpoint unit, which has a small fixed number of comparators (read the core's Technical Reference Manual for the count). If GDB reports "Cannot insert hardware breakpoint", delete unused ones (`info breakpoints`, `delete <n>`).
4. Build with `-Og -g` for debugging. At `-O2` variables show as `<optimized out>`; that is expected, not a debugger fault.
5. Never write to peripheral registers from GDB while a motor, valve or other actuator is connected unless the bench has an independent hardware emergency stop.

### Output
`debug_session_record`.

### Quality Gate
- `break main` then `continue` stops with "Breakpoint 1, main ()" in GDB output.
- `bt` prints at least frame #0.

---

## Worked Example

Illustrative. STM32F411 Black Pill, ST-Link V2.

- Phase 1: `openocd -f interface/stlink.cfg -f target/stm32f4x.cfg` prints `Info : STLINK V2J45S7 (API v2) VID:PID 0483:3748`, `Info : [stm32f4x.cpu] Cortex-M4 r0p1 processor detected`, `Info : Listening on port 3333 for gdb connections`.
- Phase 2: `-c "program build/app.elf verify reset exit"` ends with `** Verified OK **`.
- Phase 3: GDB `break main`, `continue` prints `Breakpoint 1, main () at src/main.c:42`.

---

## Exit Criteria

DONE when OpenOCD connects with a reported IDCODE, the image flashes with "Verified OK", and GDB stops at `main`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | "LIBUSB_ERROR_ACCESS" or "open failed" | **Adjust**: install the udev rules shipped with OpenOCD (Linux) or the WinUSB driver (Windows, for example with Zadig for CMSIS-DAP and J-Link in OpenOCD mode). |
| Phase 1 | "unable to connect to the target" | **Retry**: add connect-under-reset with NRST wired. |
| Phase 2 | "Verify Failed" | **Retry**: lower `adapter speed` (check the manual for the command in your release), reflash once; if it fails again **Stop** and check power and wiring. |
| Phase 3 | GDB "Remote 'g' packet reply is too long" | **Adjust**: use a GDB built for Arm (`arm-none-eabi-gdb` or `gdb-multiarch`). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
