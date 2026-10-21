# ESP-IDF Project Setup

**One-line description:** Installs a pinned ESP-IDF release, sets the exact chip target, builds a project with `idf.py`, and reads the size, partition table and panic decoding setup, noting which Cortex-M specific flows do not apply to Xtensa and RISC-V chips.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): ESP-IDF project directory (contains top-level `CMakeLists.txt` and `main/`).
- `target_mcu` (string, required): Exact chip or module, for example ESP32-S3-WROOM-1 (chip ESP32-S3).

---

## Outputs

- `build_command` (string): The exact `idf.py` commands that built the image.
- `elf_path` (string): `build/<project_name>.elf`.
- `map_path` (string): `build/<project_name>.map`.

---

## Phase 1: Install a Pinned ESP-IDF

### Entry Criteria
- `target_mcu` maps to one chip name in the ESP-IDF "Get Started" target list (esp32, esp32s2, esp32s3, esp32c3, esp32c6, esp32h2 and others listed for your release).

### Actions
1. Clone a release branch or tag, not master: `git clone -b <release tag> --recursive https://github.com/espressif/esp-idf.git`. On Windows the ESP-IDF Tools Installer offers the same versions.
2. Run `./install.sh <chip>` (Windows: `install.bat <chip>`), then in every new shell `. ./export.sh` (Windows: `export.bat`).
3. Verify: `idf.py --version`.
4. Record the core architecture from the chip datasheet: Xtensa (ESP32, S2, S3) or RISC-V (C3, C6, H2). Flows in this domain that read Cortex-M registers (NVIC, HardFault CFSR, SWO/ITM, vector table) do not apply; ESP-IDF has its own panic handler and interrupt allocator (`esp_intr_alloc`).

### Output
ESP-IDF version and chip architecture.

### Quality Gate
- `idf.py --version` prints the recorded release.
- The architecture line cites the chip datasheet.

---

## Phase 2: Set Target and Configure

### Entry Criteria
- ESP-IDF exported in the current shell.

### Actions
1. `idf.py set-target <chip>`. This deletes `build/` and regenerates `sdkconfig`; run it once, before you customize configuration.
2. Put every non-default option in `sdkconfig.defaults` (commit it) rather than relying on a hand-edited `sdkconfig`. Open `idf.py menuconfig` to find symbol names.
3. If the project needs OTA, a filesystem, or more app space, create `partitions.csv` and set `CONFIG_PARTITION_TABLE_CUSTOM=y` and `CONFIG_PARTITION_TABLE_CUSTOM_FILENAME="partitions.csv"` in `sdkconfig.defaults`. Each app partition offset must be 64 KB aligned per the ESP-IDF partition table documentation.
4. Set the flash size option (`CONFIG_ESPTOOLPY_FLASHSIZE_...`) to the module datasheet value.

### Output
Committed `sdkconfig.defaults` and optional `partitions.csv`.

### Quality Gate
- `git diff --stat` shows `sdkconfig.defaults` (and `partitions.csv` if used) committed.
- The flash size symbol equals the module datasheet value.

---

## Phase 3: Build and Read Results

### Entry Criteria
- Target set.

### Actions
1. `idf.py build`. Confirm `build/<project_name>.elf`, `.map` and `.bin` exist.
2. `idf.py size` and `idf.py size-components`; record total image size and the largest components.
3. `idf.py partition-table` prints the table; confirm the app binary is smaller than its partition.
4. Flash and watch: `idf.py -p <port> flash monitor`. The monitor decodes panic backtraces ("Guru Meditation Error") to source lines using the ELF; keep the matching ELF for every released binary.
5. Record the commands as `build_command`.

### Output
`build_command`, `elf_path`, `map_path`.

### Quality Gate
- `idf.py build` exits 0.
- App `.bin` size is less than its partition size from `idf.py partition-table`.
- Monitor shows the app's first log line after flashing.

---

## Worked Example

Illustrative. `target_mcu` = ESP32-S3-WROOM-1-N8R2.

- Phase 1: `idf.py --version` prints `ESP-IDF v5.x.y`. Architecture: Xtensa LX7 (datasheet section 1).
- Phase 2: `idf.py set-target esp32s3`; `sdkconfig.defaults` sets `CONFIG_ESPTOOLPY_FLASHSIZE_8MB=y`.
- Phase 3: `idf.py size` prints `Total image size: 212480 bytes (.bin may be padded larger)`; factory partition is 1 MB, so the app fits.

---

## Exit Criteria

DONE when a pinned ESP-IDF builds the project for the exact chip, the image fits its partition, and the build commands and ELF path are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `idf.py` not found | **Adjust**: source `export.sh` (or run `export.bat`) in this shell. |
| Phase 2 | Settings lost after `set-target` | **Adjust**: move them into `sdkconfig.defaults`, run `idf.py fullclean`, rebuild. |
| Phase 3 | "app partition is too small for binary" | **Adjust**: enlarge the app partition in `partitions.csv` within the flash size; do not delete other partitions without listing what they hold. |
| Phase 3 | Monitor prints undecoded addresses | **Adjust**: run the monitor from the same build directory so it finds the matching ELF. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
