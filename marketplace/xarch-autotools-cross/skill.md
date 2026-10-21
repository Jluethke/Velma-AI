# Cross-Compile an Autotools Project for aarch64

**One-line description:** Configures and builds a GNU Autotools project for aarch64 by passing `--host=aarch64-linux-gnu` with the cross compiler and sysroot in the environment, handles `configure` cache variables that cannot be probed when cross-compiling, and verifies the built binary.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_triple` (string, required): Output of `xarch-target-triple-select`, for example `aarch64-linux-gnu`.
- `toolchain_prefix` (string, required): Output of `xarch-gcc-toolchain-select`, for example `aarch64-linux-gnu-`.
- `sysroot` (object, required): Output of `xarch-sysroot-from-image`, holding the sysroot path.
- `project_dir` (string, required): Path to the project root that holds `configure` or `configure.ac`.

---

## Outputs

- `autotools_build` (object): The configure line used, the built binaries, and the verified machine field.
- `autotools_report` (object): Any cross cache variables set and the build result.

---

## Phase 1: Configure with --host

### Entry Criteria
- `project_dir` holds a `configure` script (or `autoreconf -i` can generate one).
- The cross compiler `${toolchain_prefix}gcc` is on PATH.

### Actions
1. If only `configure.ac` exists, generate the script: `autoreconf -i` in `project_dir`.
2. Configure out of tree. Pass `--host`, which is the key flag; it tells Autotools the output runs on aarch64 and makes it use the prefixed tools:

```
mkdir build-aarch64 && cd build-aarch64
../configure \
  --host=aarch64-linux-gnu \
  --prefix=/usr \
  CC=aarch64-linux-gnu-gcc \
  CXX=aarch64-linux-gnu-g++ \
  CFLAGS="--sysroot=/opt/sysroots/aarch64-bookworm" \
  LDFLAGS="--sysroot=/opt/sysroots/aarch64-bookworm" \
  PKG_CONFIG_LIBDIR=/opt/sysroots/aarch64-bookworm/usr/lib/aarch64-linux-gnu/pkgconfig
```

Substitute `target_triple`, `toolchain_prefix` and `sysroot.path`.
3. Do not set `--build` to the target. `--build` is the machine running configure (the host), `--host` is where the output runs. Setting `--build` wrong makes Autotools think it is a native build and skip cross logic.
4. Watch the configure log for `checking whether we are cross compiling... yes`. If it says `no`, the compiler is the host one; re-check `CC`.

### Output
The configured build dir.

### Quality Gate
- The configure log prints `checking whether we are cross compiling... yes`.
- `configure` exits 0 and writes a `Makefile` in the build dir.

---

## Phase 2: Handle Run-Time Checks and Build

### Entry Criteria
- `configure` succeeded.

### Actions
1. If `configure` stops with `cannot run test program while cross compiling`, a check wants to run a target binary. Supply the answer as a cache variable instead, for example `ac_cv_file__dev_zero=yes` or `ac_cv_func_malloc_0_nonnull=yes`, passed on the configure line. Record every cache variable you set and why, because a wrong value silently misconfigures the build.
2. Build: `make -j"$(nproc)"`.
3. Verify a binary: `readelf -h <binary> | grep Machine` must print `AArch64`. Also run `file` on it.
4. Do not run `make check` on the build host; its test binaries are aarch64 and need qemu-user or the real target. Route tests through `xarch-qemu-user-run-tests`.
5. Do not patch `configure` by hand to skip a failing run-time check; set the documented `ac_cv_*` cache variable, which is the supported mechanism.

### Output
`autotools_build`, `autotools_report`.

### Quality Gate
- `make` exits 0.
- `readelf -h` on a built binary shows `Machine: AArch64`.

---

## Worked Example

Illustrative. `project_dir` = `~/src/libfoo`, target `aarch64-linux-gnu`.

```
$ ../configure --host=aarch64-linux-gnu --prefix=/usr CC=aarch64-linux-gnu-gcc CFLAGS="--sysroot=/opt/sysroots/aarch64-bookworm"
checking whether we are cross compiling... yes
configure: creating ./config.status
$ make -j8
$ readelf -h src/foo | grep Machine
  Machine:                           AArch64
```

`autotools_report` records `ac_cv_func_malloc_0_nonnull=yes` was set to answer a run-time malloc check.

---

## Exit Criteria

DONE when configure reports cross compiling yes, make exits 0, and a built binary is an `AArch64` ELF, with any cross cache variables recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `checking cross compiling... no` | **Adjust**: `CC` resolved to the host gcc; set `CC` to the prefixed cross compiler and re-run. |
| Phase 1 | `configure.ac` only, no script | **Adjust**: run `autoreconf -i` first. |
| Phase 2 | `cannot run test program while cross compiling` | **Adjust**: set the named `ac_cv_*` cache variable on the configure line and record it. |
| Phase 2 | A header is not found | **Return**: add the target `-dev` package to the sysroot via `xarch-sysroot-from-image`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
