# Arm GCC CMake Toolchain Setup

**One-line description:** Sets up a bare-metal Cortex-M build with the Arm GNU Toolchain (arm-none-eabi-gcc), a CMake toolchain file and Ninja, with CPU and float ABI flags matched to the target core, and proves the build by reading the ELF header, the memory usage table and the map file.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Root directory of the firmware project (contains or will contain `CMakeLists.txt`).
- `target_mcu` (string, required): Exact microcontroller part number, for example STM32F411CEU6. The core (Cortex-M0+, M3, M4F, M7, M33) is read from its datasheet.

---

## Outputs

- `build_command` (string): The exact configure and build commands that produce the image, copied from a successful run.
- `elf_path` (string): Path of the linked ELF with debug info, for example `build/app.elf`.
- `map_path` (string): Path of the linker map file, for example `build/app.map`.

---

## Phase 1: Install and Verify the Tools

### Entry Criteria
- `project_dir` exists and is under version control (so every change can be diffed).
- `target_mcu` is a full part number, not a family name.

### Actions
1. Install the Arm GNU Toolchain from developer.arm.com (package name "AArch32 bare-metal target (arm-none-eabi)"), CMake, and Ninja. Do not use a distribution `gcc-arm-none-eabi` package older than the one your vendor SDK documents.
2. Run each check and record the first line of output:
   - `arm-none-eabi-gcc --version`
   - `cmake --version`
   - `ninja --version`
3. Open the `target_mcu` datasheet and record the core name and whether it has an FPU, and which FPU (single or double precision).
4. Pick the flags from this table. Do not guess a row; if the core is not listed, read the GCC manual section "ARM Options" for `-mcpu` and `-mfpu` values.

| Core | Compile and link flags |
|---|---|
| Cortex-M0 / M0+ | `-mcpu=cortex-m0plus -mthumb` (use `cortex-m0` for M0) |
| Cortex-M3 | `-mcpu=cortex-m3 -mthumb` |
| Cortex-M4 with FPU | `-mcpu=cortex-m4 -mthumb -mfpu=fpv4-sp-d16 -mfloat-abi=hard` |
| Cortex-M7 single-precision FPU | `-mcpu=cortex-m7 -mthumb -mfpu=fpv5-sp-d16 -mfloat-abi=hard` |
| Cortex-M7 double-precision FPU | `-mcpu=cortex-m7 -mthumb -mfpu=fpv5-d16 -mfloat-abi=hard` |
| Cortex-M33 with FPU | `-mcpu=cortex-m33 -mthumb -mfpu=fpv5-sp-d16 -mfloat-abi=hard` |

### Output
Tool versions and the chosen CPU flag set.

### Quality Gate
- All three version commands print a version line (no "command not found").
- The chosen flag row cites the datasheet section that names the core and FPU.

---

## Phase 2: Write the Toolchain File and Flags

### Entry Criteria
- Tools verified, CPU flags chosen.

### Actions
1. Create `cmake/arm-none-eabi.cmake` containing:
   - `set(CMAKE_SYSTEM_NAME Generic)`
   - `set(CMAKE_SYSTEM_PROCESSOR arm)`
   - `set(CMAKE_C_COMPILER arm-none-eabi-gcc)`, `set(CMAKE_ASM_COMPILER arm-none-eabi-gcc)`, `set(CMAKE_CXX_COMPILER arm-none-eabi-g++)`
   - `set(CMAKE_OBJCOPY arm-none-eabi-objcopy)` and `set(CMAKE_SIZE arm-none-eabi-size)`
   - `set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)` so the compiler check does not try to link a hosted executable.
2. In `CMakeLists.txt`, apply the CPU flags to BOTH compile and link (`target_compile_options` and `target_link_options`). A mismatch causes the link error "uses VFP register arguments, ... does not".
3. Add compile options `-ffunction-sections -fdata-sections -g` and link options `-T${CMAKE_SOURCE_DIR}/<linker script>.ld -Wl,-Map=${CMAKE_BINARY_DIR}/app.map -Wl,--gc-sections -Wl,--print-memory-usage --specs=nano.specs --specs=nosys.specs`.
4. Set the target suffix so the output is `app.elf` (`set_target_properties(app PROPERTIES SUFFIX .elf)`).
5. Add a post-build step that runs `${CMAKE_SIZE} app.elf` and `${CMAKE_OBJCOPY} -O ihex app.elf app.hex`.

Do NOT copy flags from a different core's example project. Do NOT drop `-mthumb`; Cortex-M executes only Thumb code.

### Output
Toolchain file and CMake flags committed.

### Quality Gate
- `git diff --stat` shows only `cmake/arm-none-eabi.cmake` and `CMakeLists.txt` changed in this phase.
- `grep -n "mfloat-abi" CMakeLists.txt` shows the same ABI on the compile and link lines.

---

## Phase 3: Build and Read the Result

### Entry Criteria
- Toolchain file present.

### Actions
1. Configure and build from a clean directory:
   - `cmake -S . -B build -G Ninja -DCMAKE_TOOLCHAIN_FILE=cmake/arm-none-eabi.cmake -DCMAKE_BUILD_TYPE=Debug`
   - `cmake --build build`
2. Read the `--print-memory-usage` table printed at link time (columns: Memory region, Used Size, Region Size, %age Used). Record the FLASH and RAM rows.
3. Run `arm-none-eabi-readelf -h build/app.elf`. Confirm `Machine: ARM` and that `Flags` contains "hard-float ABI" when you chose `-mfloat-abi=hard` (or "soft-float ABI" otherwise).
4. Confirm `build/app.map` exists and contains the heading "Memory Configuration".
5. If you also need a raw `.bin`, run `arm-none-eabi-objcopy -O binary build/app.elf build/app.bin` and check its size with `ls -l`. A `.bin` far larger than the FLASH "Used Size" means a loadable section sits at a distant address (often a RAM section without `NOLOAD`); fix the linker script, do not truncate the file.
6. Record the two commands from step 1 as `build_command`.

### Output
`build_command`, `elf_path`, `map_path`.

### Quality Gate
- `cmake --build build` exits 0 with zero errors.
- `readelf -h` output shows `Machine: ARM` and the expected float ABI flag.
- The FLASH and RAM rows of the memory usage table are recorded with numbers copied from the output.

---

## Worked Example

Illustrative. Input: `target_mcu` = STM32F411CEU6 (datasheet: Cortex-M4 with single-precision FPU).

- Phase 1: `arm-none-eabi-gcc --version` prints `arm-none-eabi-gcc (Arm GNU Toolchain 13.3.Rel1 ...) 13.3.1`. Row chosen: Cortex-M4 with FPU.
- Phase 2: toolchain file written; compile and link both carry `-mcpu=cortex-m4 -mthumb -mfpu=fpv4-sp-d16 -mfloat-abi=hard`.
- Phase 3: link prints
  ```
  Memory region         Used Size  Region Size  %age Used
             FLASH:       18432 B       512 KB      3.52%
               RAM:        4120 B       128 KB      3.14%
  ```
  `readelf -h build/app.elf` shows `Flags: 0x5000400, Version5 EABI, hard-float ABI`.

---

## Exit Criteria

DONE when a clean configure and build produces `app.elf` and `app.map`, the ELF header matches the core's float ABI, and the exact commands are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `arm-none-eabi-gcc` not on PATH | **Adjust**: add the toolchain `bin` directory to PATH and rerun the version check. |
| Phase 2 | CMake compiler check fails trying to link | **Adjust**: confirm `CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY` is set in the toolchain file, delete `build/`, reconfigure. |
| Phase 3 | "uses VFP register arguments" link error | **Adjust**: make the float ABI identical on every object and library, then rebuild from clean. |
| Phase 3 | "region `FLASH' overflowed by N bytes" | **Return**: hand the map file to the linker map audit flow; do not raise LENGTH beyond the datasheet size. |
| Phase 3 | Undefined reference to `_sbrk` or `_write` | **Adjust**: confirm `--specs=nosys.specs` is on the link line or provide the syscall stubs your project documents. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
