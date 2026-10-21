# PlatformIO Project Setup

**One-line description:** Creates a reproducible PlatformIO firmware project for a named microcontroller board, with the platform version pinned in `platformio.ini`, a map file enabled, and the ELF location and size confirmed from the build output.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Directory that will hold `platformio.ini`.
- `target_mcu` (string, required): Exact microcontroller part number on the board.

---

## Outputs

- `build_command` (string): The exact `pio run` command line that built the image.
- `elf_path` (string): Path of the ELF, `.pio/build/<env>/firmware.elf`.
- `map_path` (string): Path of the map file enabled in Phase 2.

---

## Phase 1: Install and Find the Board

### Entry Criteria
- Python 3 is installed (`python --version` prints a version).

### Actions
1. Install PlatformIO Core: `python -m pip install -U platformio`. Verify with `pio --version`.
2. List candidate boards: `pio boards <family keyword>` (for example `pio boards stm32f411`). The output columns are ID, MCU, Frequency, Flash, RAM, Name.
3. Pick the row whose MCU column equals `target_mcu` (case-insensitive). Use this decision table:

| Situation | Action |
|---|---|
| Exactly one board ID with that MCU | Use it. |
| Several board IDs with that MCU | Use the one matching the physical board name; record the others as rejected. |
| No board ID with that MCU | Use a board with the same MCU family, then override `board_build.mcu`, `board_build.f_cpu` and `board_build.ldscript` in Phase 2, citing the datasheet for each value. |

4. Do not invent a board ID; it must appear in the `pio boards` output.

### Output
Chosen board ID and framework.

### Quality Gate
- The chosen board ID appears verbatim in `pio boards` output, and its MCU column is recorded.

---

## Phase 2: Initialize and Pin

### Entry Criteria
- Board ID chosen.

### Actions
1. From `project_dir` run `pio project init --board <board_id>`. Check `pio project init --help` for the option that sets the framework (`--project-option "framework=<name>"`).
2. Edit `platformio.ini` so the environment section has:
   - `platform = <platform>@<exact version>`: take the version from `pio pkg list` after the first build. Unpinned platforms change toolchain versions between machines.
   - `board = <board_id>`
   - `framework = <framework>` (for example `stm32cube`, `arduino`, `zephyr`, `espidf`, or omit for bare register code)
   - `build_flags = -Wl,-Map,${BUILD_DIR}/firmware.map`
   - `upload_protocol` and `debug_tool` set to the probe you own (for example `stlink`, `jlink`, `cmsis-dap`).
3. Commit `platformio.ini`. Do not commit the `.pio/` directory.

### Output
Pinned `platformio.ini`.

### Quality Gate
- `grep -n "^platform" platformio.ini` shows an `@` version.
- `git status --short` does not list `.pio/`.

---

## Phase 3: Build and Locate Outputs

### Entry Criteria
- `platformio.ini` committed.

### Actions
1. Run `pio run -e <env>`. Read the end of the output: the "RAM:" and "Flash:" lines report used bytes and percentage.
2. Confirm the ELF exists: `.pio/build/<env>/firmware.elf`.
3. Confirm the map file exists at `.pio/build/<env>/firmware.map`.
4. Find the toolchain PlatformIO used: `pio pkg list -e <env>` lists `toolchain-...` with its version. Use that toolchain's `size` tool to cross-check (`~/.platformio/packages/toolchain-gccarmnoneeabi/bin/arm-none-eabi-size` for Arm).
5. Record the command from step 1 as `build_command`.

### Output
`build_command`, `elf_path`, `map_path`.

### Quality Gate
- `pio run -e <env>` ends with `[SUCCESS]`.
- Both the ELF and map paths exist (`ls -l` shows nonzero size).
- The "RAM:" and "Flash:" lines are recorded verbatim.

---

## Worked Example

Illustrative. `target_mcu` = STM32F411CEU6, Black Pill board.

- Phase 1: `pio boards stm32f411` lists `blackpill_f411ce  STM32F411CEU6  100MHz  512KB  128KB  WeAct Studio BlackPill V2.0`. Chosen: `blackpill_f411ce`.
- Phase 2: `platformio.ini` gets `platform = ststm32@<version from pio pkg list>`, `framework = stm32cube`, `debug_tool = stlink`.
- Phase 3: `pio run -e blackpill_f411ce` ends with
  ```
  RAM:   [          ]   2.1% (used 2768 bytes from 131072 bytes)
  Flash: [          ]   1.6% (used 8412 bytes from 524288 bytes)
  ========================= [SUCCESS] Took 6.12 seconds =========================
  ```

---

## Exit Criteria

DONE when the pinned project builds with `[SUCCESS]`, and the ELF and map paths are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `pio` not found after install | **Adjust**: run `python -m platformio --version`; add the Python scripts directory to PATH. |
| Phase 2 | Unknown board ID error | **Return**: go back to Phase 1 and pick an ID from `pio boards` output. |
| Phase 3 | Map file missing | **Adjust**: confirm the `build_flags` line is in the active `[env:...]` section, run `pio run -t clean`, rebuild. |
| Phase 3 | Package download fails | **Retry**: rerun once; if it fails again, **Stop** and report the exact error line. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
