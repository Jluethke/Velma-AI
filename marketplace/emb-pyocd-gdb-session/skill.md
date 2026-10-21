# pyOCD and GDB Debug Session

**One-line description:** Uses pyOCD with a CMSIS-DAP, ST-Link or J-Link probe to install the target's CMSIS pack, flash and verify an ELF, read core and fault registers in pyOCD commander, and serve a GDB session.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `elf_path` (string, required): ELF built with `-g`.
- `target_mcu` (string, required): Exact part number; mapped to a pyOCD target name.
- `debug_probe` (string, required): One of `stlink`, `jlink`, `cmsis-dap`.

---

## Outputs

- `debug_session_record` (object): pyOCD version, probe unique ID, target name, flash result, and the GDB commands that worked.

---

## Phase 1: Install and Identify Target

### Entry Criteria
- Python 3 installed.

### Actions
1. `python -m pip install -U pyocd`, then `pyocd --version`.
2. `pyocd list` shows connected probes with a unique ID. With more than one probe, pass `-u <unique id>` to every command.
3. Find the target name: `pyocd list --targets` for built-in targets. If the part is not built in, `pyocd pack find <part keyword>` then `pyocd pack install <part>`.
4. Probe notes: CMSIS-DAP works natively. ST-Link needs ST-Link firmware recent enough for pyOCD (pyOCD prints a warning otherwise). J-Link needs the SEGGER J-Link software installed and the `pylink-square` package (check the pyOCD docs page "J-Link" for the current requirement).

### Output
Probe ID and target name.

### Quality Gate
- `pyocd list` shows the probe.
- The target name appears in `pyocd list --targets` or was installed by `pyocd pack install` (command output recorded).

---

## Phase 2: Flash and Inspect

### Entry Criteria
- Target name known.

### Actions
1. Flash: `pyocd load -t <target> <elf_path>` (older releases: `pyocd flash`). Read the output for the programmed byte count and speed.
2. Open the commander: `pyocd commander -t <target>`. Useful commands:
   - `halt`, `reg` (core registers), `reset halt`
   - `read32 0xE000ED28` reads the Cortex-M CFSR (Armv7-M and Armv8-M Mainline only)
   - `read32 <addr> <len>` for a memory range
   - `go` to resume, `exit` to leave.
3. Persist options in `pyocd.yaml` in the project root (for example `target_override: <target>` and `frequency`). Check the pyOCD "Configuration" docs for key names.
4. If the target will not connect because firmware disables SWD or sleeps, use `--connect under-reset` with NRST wired (check `pyocd load --help` for the option name in your release).

### Output
Flashed image and register dump.

### Quality Gate
- `pyocd load` exits 0 and reports programmed bytes.
- `reg` in commander prints `pc` with a value inside the flash region.

---

## Phase 3: GDB Server

### Entry Criteria
- Flash succeeded.

### Actions
1. `pyocd gdbserver -t <target> --persist`. It listens on port 3333 by default (check `--help` for the port option).
2. `arm-none-eabi-gdb <elf_path>` then `target remote localhost:3333`, `monitor reset halt`, `break main`, `continue`, `bt`.
3. `monitor` passes commands to pyOCD (for example `monitor reset`); see the pyOCD GDB docs for the supported list.
4. Do not modify peripheral registers from the debugger while actuators are connected unless an independent hardware emergency stop is in place.

### Output
`debug_session_record`.

### Quality Gate
- GDB stops at `main` with "Breakpoint 1, main ()".

---

## Worked Example

Illustrative. nRF52840 board with an onboard CMSIS-DAP probe.

- Phase 1: `pyocd list` prints `0 | ... CMSIS-DAP | 000000000001`. `pyocd list --targets | grep nrf52840` shows `nrf52840`.
- Phase 2: `pyocd load -t nrf52840 build/app.elf` prints `[==================================================] 100%` and `Loaded 41 kB in 1.8s`. Commander `reg` shows `pc: 0x00001a2c`.
- Phase 3: GDB reports `Breakpoint 1, main () at src/main.c:30`.

---

## Exit Criteria

DONE when pyOCD flashes the image, commander reads registers, and GDB stops at `main`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | "No available debug probes" | **Adjust**: check USB cable and driver; on Linux install pyOCD's udev rules. |
| Phase 1 | Target not found | **Adjust**: install the CMSIS pack with `pyocd pack install`; do not use a different part's target name. |
| Phase 2 | Connect fails | **Retry**: use connect-under-reset with NRST wired. |
| Phase 3 | Port in use | **Adjust**: stop the other GDB server or choose another port with the documented option. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
