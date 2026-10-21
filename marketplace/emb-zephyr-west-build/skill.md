# Zephyr West Workspace and Build

**One-line description:** Creates a Zephyr workspace with west pinned to a release tag, installs the Zephyr SDK, builds an application for the exact board target, and reads the final devicetree, Kconfig and ROM/RAM reports from the build directory.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Directory for the west workspace and the application.
- `target_mcu` (string, required): Exact microcontroller part number; used to choose the Zephyr board target.

---

## Outputs

- `build_command` (string): The exact `west build` command that produced the image.
- `elf_path` (string): `build/zephyr/zephyr.elf`.
- `map_path` (string): `build/zephyr/zephyr.map`.

---

## Phase 1: Create the Workspace

### Entry Criteria
- Python 3, CMake, Ninja and the device tree compiler (`dtc`, except on Windows where it is optional per the Zephyr Getting Started Guide) are installed.

### Actions
1. Create and activate a Python virtual environment inside `project_dir` (`python -m venv .venv`).
2. `python -m pip install west`, then `west --version`.
3. Pick a Zephyr release tag from the Zephyr releases page (for example an LTS tag). Record it. Do not track `main` for product firmware.
4. `west init -m https://github.com/zephyrproject-rtos/zephyr --mr <release tag> <workspace>` then `cd <workspace>` and `west update`.
5. `west zephyr-export`, then install Python requirements with the command the Getting Started Guide for your release gives (`west packages pip --install` on recent releases; `pip install -r zephyr/scripts/requirements.txt` on older ones).
6. Install the Zephyr SDK version that the release documents, and run its `setup.sh` (or `setup.cmd` on Windows) to register it.

### Output
West workspace pinned to a release tag, SDK registered.

### Quality Gate
- `west list` shows `zephyr` at the recorded tag's revision.
- `west --version` prints a version.

---

## Phase 2: Choose the Board Target

### Entry Criteria
- Workspace exists.

### Actions
1. List boards: `west boards | grep -i <family>`. Recent releases use qualified targets such as `nucleo_f411re` or `<board>/<soc>/<cpucluster>`; use the exact string `west boards` prints.
2. Decision table:

| Situation | Action |
|---|---|
| Your physical board is listed | Use that target. |
| Same MCU on a different board | Start from that board, add `boards/<board>.overlay` in the app to change pins and peripherals. |
| MCU not supported in this release | **Stop** and report; do not port a SoC as part of this flow. |

3. Build the reference sample first: `west build -b <board> -p always zephyr/samples/hello_world`.

### Output
Board target string and a successful sample build.

### Quality Gate
- The board string appears verbatim in `west boards` output.
- The sample build ends with a memory region table and exit code 0.

---

## Phase 3: Build the Application and Read the Results

### Entry Criteria
- Sample build passed.

### Actions
1. Build your application: `west build -b <board> -p always <app dir>`. Use `-p always` whenever the board, overlay or `prj.conf` changes; stale build directories keep old devicetree output.
2. Read the generated final devicetree `build/zephyr/zephyr.dts`; confirm each node you enabled has `status = "okay"`.
3. Read `build/zephyr/.config`; for every symbol you set in `prj.conf`, confirm the final value. Kconfig prints "warning: ... was assigned the value ... but got the value ..." when a dependency is missing; treat every such warning as a defect.
4. Run `west build -t rom_report` and `west build -t ram_report` and record the top entries.
5. Confirm `build/zephyr/zephyr.elf` and `build/zephyr/zephyr.map` exist.

### Output
`build_command`, `elf_path`, `map_path`.

### Quality Gate
- Zero Kconfig "but got the value" warnings in the build log.
- `zephyr.dts` shows `status = "okay"` for each enabled peripheral node.
- ELF and map files exist.

---

## Worked Example

Illustrative. `target_mcu` = STM32F411RET6 on a NUCLEO-F411RE.

- Phase 1: workspace pinned to the chosen LTS tag; `west list` shows `zephyr ... v<tag>`.
- Phase 2: `west boards | grep f411` prints `nucleo_f411re`. `west build -b nucleo_f411re -p always zephyr/samples/hello_world` succeeds.
- Phase 3: app build log ends with
  ```
  Memory region         Used Size  Region Size  %age Used
             FLASH:       22140 B       512 KB      4.22%
               RAM:        5736 B       128 KB      4.38%
  ```
  `build/zephyr/.config` shows `CONFIG_SERIAL=y`; no Kconfig value warnings.

---

## Exit Criteria

DONE when the application builds for the exact board target from a pinned workspace with no Kconfig value warnings, and the ELF and map paths are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | "Could not find a package configuration file provided by Zephyr-sdk" | **Adjust**: run the SDK `setup` script and `west zephyr-export`, then rebuild. |
| Phase 2 | Board not found | **Return**: re-read `west boards`; qualified names changed in recent releases. |
| Phase 3 | Devicetree error "undefined node label" | **Adjust**: read the board's `.dts` for the real label names, fix the overlay, build with `-p always`. |
| Phase 3 | Kconfig value warning | **Adjust**: enable the dependency symbol named in `menuconfig` (`west build -t menuconfig`), rebuild. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
