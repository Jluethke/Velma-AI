# Configure and Build a CMake Project for aarch64

**One-line description:** Runs a clean CMake configure and build for an aarch64 target using the toolchain file and the cross pkg-config environment, catches the common `find_package` cross failures, and confirms every built artifact is an aarch64 ELF.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cmake_toolchain_file` (string, required): Output of `xarch-cmake-toolchain-file`, the path to the `.cmake` file.
- `project_dir` (string, required): Path to the project root that holds the top-level `CMakeLists.txt`.
- `pkgconfig_env` (object, required): Output of `xarch-pkgconfig-cross`, the three pkg-config environment variables.

---

## Outputs

- `cmake_build` (object): The build directory, the configure flags, and the list of built executables and libraries with their verified machine field.
- `cmake_build_report` (object): The configure summary, any unresolved `find_package` items, and the build result.

---

## Phase 1: Clean Configure

### Entry Criteria
- `cmake_toolchain_file` exists and `project_dir` holds a top-level `CMakeLists.txt`.
- The `pkgconfig_env` variables are known.

### Actions
1. Use a fresh build dir so no host cache leaks in: `rm -rf "$project_dir/build-aarch64"`. CMake caches the compiler on first configure; reusing a host build dir keeps the host compiler.
2. Export the pkg-config environment from `pkgconfig_env` (`PKG_CONFIG_LIBDIR`, `PKG_CONFIG_SYSROOT_DIR`, `PKG_CONFIG_PATH`) in the same shell.
3. Configure: `cmake -S "$project_dir" -B "$project_dir/build-aarch64" -DCMAKE_TOOLCHAIN_FILE=$(realpath "$cmake_toolchain_file") -DCMAKE_BUILD_TYPE=Release`.
4. Read the configure output for `find_package` and `find_library` lines. A line like `Could NOT find Foo` means the package config is not in the sysroot. Add the target `-dev` package to the sysroot and re-configure; do not set the `Foo_DIR` to a host path.
5. Do not pass `-DCMAKE_C_COMPILER` here; the toolchain file owns the compiler choice.

### Output
The configured build dir.

### Quality Gate
- Configure ends with `Generating done` and a nonzero number of targets.
- No `Could NOT find` line remains for a required package (optional packages may be absent).

---

## Phase 2: Build

### Entry Criteria
- Configure succeeded.

### Actions
1. Build with all cores: `cmake --build "$project_dir/build-aarch64" -j"$(nproc)"`.
2. If the build fails with `skipping incompatible .../libfoo.so` followed by `cannot find -lfoo`, the linker found a host library first. This means a `-L` points at the host; re-check that `find_library` used the sysroot (the toolchain file's `FIND_ROOT_PATH_MODE_LIBRARY ONLY`).
3. List the built artifacts: executables and shared objects under the build dir. For each, run `readelf -h <artifact> | grep Machine` and require `AArch64`.
4. Do not disable the failing target or delete a test to get a green build. If one target cannot cross-build, record it and return to the relevant stack flow.

### Output
`cmake_build`, `cmake_build_report`.

### Quality Gate
- `cmake --build` exits 0.
- Every executable and shared object listed in `cmake_build` shows `Machine: AArch64`.

---

## Worked Example

Illustrative. `project_dir` = `~/src/app`, `cmake_toolchain_file` = `aarch64-toolchain.cmake`.

```
$ rm -rf ~/src/app/build-aarch64
$ export PKG_CONFIG_LIBDIR=... PKG_CONFIG_SYSROOT_DIR=/opt/sysroots/aarch64-bookworm
$ cmake -S ~/src/app -B ~/src/app/build-aarch64 -DCMAKE_TOOLCHAIN_FILE=$(realpath aarch64-toolchain.cmake) -DCMAKE_BUILD_TYPE=Release
-- Found ZLIB: /opt/sysroots/aarch64-bookworm/usr/lib/aarch64-linux-gnu/libz.so (found version "1.2.13")
-- Generating done
$ cmake --build ~/src/app/build-aarch64 -j8
$ readelf -h ~/src/app/build-aarch64/app | grep Machine
  Machine:                           AArch64
```

`cmake_build` = `{ "build_dir": "~/src/app/build-aarch64", "artifacts": [{"path": ".../app", "machine": "AArch64"}] }`.

---

## Exit Criteria

DONE when configure resolves all required packages from the sysroot, the build exits 0, and every artifact is an `AArch64` ELF.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `find_package` finds a host package | **Adjust**: set `CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY` in the toolchain file and re-configure a clean build dir. |
| Phase 1 | `Could NOT find` a required dependency | **Return**: install the target `-dev` package into the sysroot via `xarch-sysroot-from-image`, then re-configure. |
| Phase 2 | `skipping incompatible` then `cannot find -lfoo` | **Adjust**: a host `-L` leaked in; confirm the dependency path is under the sysroot. |
| Phase 2 | An artifact is X86-64 | **Stop**: a sub-target used an `add_custom_command` with the host compiler; find it and point it at the cross compiler. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
