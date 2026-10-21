# Install and Verify the aarch64 GCC Cross Toolchain

**One-line description:** Installs the `gcc-aarch64-linux-gnu` cross toolchain for the selected triple, confirms the compiler, binutils and the C++ variant are on PATH, and verifies they emit aarch64 objects by compiling a one-line probe and reading `file` and `readelf`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `host_distro` (string, required): Build host distribution, for example `ubuntu-22.04`, `debian-12`, `fedora-40`, or `arch`.
- `target_triple` (string, required): Output of `xarch-target-triple-select`, for example `aarch64-linux-gnu`.

---

## Outputs

- `toolchain_prefix` (string): The binary prefix, for example `aarch64-linux-gnu-`, so callers build `${toolchain_prefix}gcc`.
- `toolchain_report` (object): Installed package names, compiler version, the GCC multiarch dir, and the probe verification result.

---

## Phase 1: Install the Packages

### Entry Criteria
- `host_distro` and `target_triple` are present.
- You have sudo or root on the build host.

### Actions
1. Set `toolchain_prefix` = `target_triple` + `-`, for example `aarch64-linux-gnu-`.
2. Install by distribution using this table. Do not build GCC from source first; a distribution cross package is faster and correct for most work.

| `host_distro` family | Install command |
|---|---|
| debian, ubuntu | `sudo apt-get update && sudo apt-get install -y gcc-aarch64-linux-gnu g++-aarch64-linux-gnu binutils-aarch64-linux-gnu` |
| fedora, rhel | `sudo dnf install -y gcc-aarch64-linux-gnu gcc-c++-aarch64-linux-gnu binutils-aarch64-linux-gnu` |
| arch | `sudo pacman -S aarch64-linux-gnu-gcc aarch64-linux-gnu-binutils` |

3. Do not install only `gcc-aarch64-linux-gnu` when the project is C++. The C++ cross compiler is a separate package (`g++-aarch64-linux-gnu`); omitting it is why `CMAKE_CXX_COMPILER` is later not found.

### Output
Installed packages and `toolchain_prefix`.

### Quality Gate
- `which ${toolchain_prefix}gcc` prints a path with exit code 0.
- For a C++ project, `which ${toolchain_prefix}g++` also prints a path.

---

## Phase 2: Verify the Compiler Emits aarch64

### Entry Criteria
- The cross compiler is on PATH.

### Actions
1. Print the target the compiler was built for: `${toolchain_prefix}gcc -dumpmachine`. It must print `target_triple`.
2. Compile a probe: `echo 'int main(void){return 0;}' > /tmp/probe.c && ${toolchain_prefix}gcc /tmp/probe.c -o /tmp/probe`.
3. Read the machine field: `file /tmp/probe` must say `ELF 64-bit LSB ... ARM aarch64`. Confirm with `readelf -h /tmp/probe | grep Machine`, which must print `AArch64`.
4. Record the version (`${toolchain_prefix}gcc --version`) and the multiarch sysroot stub dir (`${toolchain_prefix}gcc -print-sysroot`) in `toolchain_report`.
5. Do not run `/tmp/probe` on the build host; it is an aarch64 binary and will fail with `Exec format error` unless binfmt is set up. That is expected, not a toolchain fault.

### Output
`toolchain_report`.

### Quality Gate
- `${toolchain_prefix}gcc -dumpmachine` prints exactly `target_triple`.
- `readelf -h /tmp/probe` shows `Machine: AArch64`.

---

## Worked Example

Illustrative. `host_distro` = `ubuntu-22.04`, `target_triple` = `aarch64-linux-gnu`.

```
$ sudo apt-get install -y gcc-aarch64-linux-gnu g++-aarch64-linux-gnu binutils-aarch64-linux-gnu
$ aarch64-linux-gnu-gcc -dumpmachine
aarch64-linux-gnu
$ aarch64-linux-gnu-gcc /tmp/probe.c -o /tmp/probe
$ readelf -h /tmp/probe | grep Machine
  Machine:                           AArch64
```

`toolchain_prefix` = `aarch64-linux-gnu-`. `toolchain_report` records GCC 11.4, dumpmachine match true, Machine AArch64 true.

---

## Exit Criteria

DONE when `${toolchain_prefix}gcc` and (for C++) `${toolchain_prefix}g++` resolve on PATH, `-dumpmachine` equals `target_triple`, and a probe compiles to an `AArch64` ELF.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Package not found | **Adjust**: enable the universe or multiverse repo (Ubuntu) or the crosstool repo; re-run update. |
| Phase 1 | No distribution cross package exists | **Return**: use a prebuilt toolchain (Arm GNU Toolchain) and set `toolchain_prefix` to its `bin/aarch64-none-linux-gnu-`. |
| Phase 2 | `-dumpmachine` prints the host triple | **Stop**: you installed the native gcc, not the cross package; remove it from PATH and reinstall the cross package. |
| Phase 2 | `file` says `x86-64` | **Stop**: the wrong compiler is first on PATH; print `type ${toolchain_prefix}gcc` and fix PATH. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
