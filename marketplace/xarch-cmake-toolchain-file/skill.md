# Write a CMake Toolchain File for aarch64

**One-line description:** Writes a CMake toolchain file that sets `CMAKE_SYSTEM_NAME`, `CMAKE_SYSTEM_PROCESSOR`, the cross compilers, the sysroot and the four `CMAKE_FIND_ROOT_PATH_MODE_*` variables, so `find_package` and `find_library` search the sysroot for targets and the host only for programs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_triple` (string, required): Output of `xarch-target-triple-select`, for example `aarch64-linux-gnu`.
- `toolchain_prefix` (string, required): Output of `xarch-gcc-toolchain-select`, for example `aarch64-linux-gnu-`.
- `sysroot` (object, required): Output of `xarch-sysroot-from-image`, holding the sysroot path.

---

## Outputs

- `cmake_toolchain_file` (string): Path to the written `.cmake` toolchain file.
- `toolchain_file_report` (object): The variables set and the result of a probe configure that confirms the cross compiler was selected.

---

## Phase 1: Write the Toolchain File

### Entry Criteria
- `target_triple`, `toolchain_prefix` and `sysroot.path` are present.

### Actions
1. Write `aarch64-toolchain.cmake` with these lines. Setting `CMAKE_SYSTEM_NAME` is what turns on cross mode and defines `CMAKE_CROSSCOMPILING`:

```
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR aarch64)
set(CMAKE_C_COMPILER   aarch64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER aarch64-linux-gnu-g++)
set(CMAKE_SYSROOT /opt/sysroots/aarch64-bookworm)
set(CMAKE_FIND_ROOT_PATH /opt/sysroots/aarch64-bookworm)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)
```

Substitute `aarch64-linux-gnu-` with `toolchain_prefix` and the sysroot path with `sysroot.path`. Set `CMAKE_SYSTEM_PROCESSOR` to `aarch64` (CMake's value for AArch64).
2. The four `FIND_ROOT_PATH_MODE_*` lines are the crux. `PROGRAM NEVER` lets `find_program` still find host tools like `pkg-config`. `LIBRARY`, `INCLUDE` and `PACKAGE` set to `ONLY` force those searches into the sysroot so a host library is never linked.
3. Do not set `CMAKE_C_COMPILER` to a bare `gcc`. Use the prefixed cross compiler, or an absolute path to it, so the host compiler cannot be picked.
4. Do not put these settings in `CMakeLists.txt`. A toolchain file is passed on the command line and must not be edited per build; keeping it separate keeps the build tree reusable.

### Output
`cmake_toolchain_file` path.

### Quality Gate
- The file contains `CMAKE_SYSTEM_NAME`, both compiler variables, `CMAKE_SYSROOT`, and all four `CMAKE_FIND_ROOT_PATH_MODE_*` lines.
- `grep CMAKE_C_COMPILER "$cmake_toolchain_file"` shows the prefixed cross compiler, not a bare `gcc`.

---

## Phase 2: Probe Configure

### Entry Criteria
- `cmake_toolchain_file` is written.

### Actions
1. Make a throwaway project: a one-file `CMakeLists.txt` with `cmake_minimum_required(VERSION 3.16)`, `project(probe C)`, `add_executable(probe probe.c)`, and a `probe.c` with an empty `main`.
2. Configure with the toolchain file: `cmake -S . -B build-probe -DCMAKE_TOOLCHAIN_FILE=$(realpath "$cmake_toolchain_file")`. Pass an absolute path; a relative path is resolved against the build dir and often not found.
3. Read the configure log: the compiler check line must name the cross compiler, and the summary must show `CMAKE_CROSSCOMPILING` is true. Confirm with `grep CMAKE_CROSSCOMPILING build-probe/CMakeCache.txt`.
4. Build and read the ELF: `cmake --build build-probe && readelf -h build-probe/probe | grep Machine` must print `AArch64`.
5. Do not add `-DCMAKE_C_COMPILER=...` on the command line to override a wrong toolchain file; fix the file so every build is consistent.

### Output
`cmake_toolchain_file`, `toolchain_file_report`.

### Quality Gate
- `CMakeCache.txt` shows `CMAKE_CROSSCOMPILING:... =TRUE` (or the internal equivalent).
- `readelf -h build-probe/probe` shows `Machine: AArch64`.

---

## Worked Example

Illustrative. `target_triple` = `aarch64-linux-gnu`, `toolchain_prefix` = `aarch64-linux-gnu-`, `sysroot.path` = `/opt/sysroots/aarch64-bookworm`.

```
$ cmake -S . -B build-probe -DCMAKE_TOOLCHAIN_FILE=$(realpath aarch64-toolchain.cmake)
-- The C compiler identification is GNU 11.4.0
-- Check for working C compiler: /usr/bin/aarch64-linux-gnu-gcc - works
$ grep CMAKE_CROSSCOMPILING build-probe/CMakeCache.txt
CMAKE_CROSSCOMPILING:INTERNAL=TRUE
$ cmake --build build-probe && readelf -h build-probe/probe | grep Machine
  Machine:                           AArch64
```

---

## Exit Criteria

DONE when the toolchain file sets all required variables, the probe configures with `CMAKE_CROSSCOMPILING` true, and the probe binary is `AArch64`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Unsure whether `aarch64` is the right processor value | **Adjust**: `aarch64` is CMake's AArch64 value; confirm in the official cmake-toolchains docs rather than guessing `arm64`. |
| Phase 2 | Configure picks the host gcc | **Adjust**: the toolchain file was not passed with an absolute path, or `CMAKE_C_COMPILER` is a bare name; fix both. |
| Phase 2 | `find_package` finds a host package | **Adjust**: `CMAKE_FIND_ROOT_PATH_MODE_PACKAGE` is not `ONLY`; set it and re-configure a clean build dir. |
| Phase 2 | Probe is X86-64 | **Stop**: the cross compiler is not being used; re-read the compiler check line in the configure log. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
