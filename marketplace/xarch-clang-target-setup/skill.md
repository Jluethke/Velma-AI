# Configure Clang to Cross-Compile for aarch64

**One-line description:** Builds the Clang flag set for an aarch64 Linux target using `--target`, `--sysroot` and `--gcc-toolchain`, so Clang uses its own front end but the GNU binutils and runtime from the cross toolchain, then verifies the flags produce an aarch64 object.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `compiler` (string, required): Selected compiler. This flow runs when it is `clang`.
- `target_triple` (string, required): Output of `xarch-target-triple-select`, for example `aarch64-linux-gnu`.
- `sysroot` (object, required): Output of `xarch-sysroot-from-image`, holding the sysroot path.
- `gcc_toolchain_path` (string, optional): Root of the GNU cross toolchain (the dir whose `bin/` holds `aarch64-linux-gnu-ld`). If absent, Clang searches PATH for the GNU tools.

---

## Outputs

- `clang_flags` (object): The ordered flag list for compile and link, and the chosen linker.
- `clang_report` (object): The Clang version, the resolved target, and the probe verification result.

---

## Phase 1: Assemble the Flags

### Entry Criteria
- `compiler` is `clang`.
- `target_triple` and `sysroot.path` are present.

### Actions
1. Start the flag list with the target: `--target=<target_triple>`. Clang is a single cross compiler, so the target is a flag, not a separate binary. Do not look for an `aarch64-clang`; it does not exist.
2. Add the sysroot: `--sysroot=<sysroot.path>`.
3. If `gcc_toolchain_path` is set, add `--gcc-toolchain=<gcc_toolchain_path>` so Clang finds `crtbegin.o`, `libgcc` and the GNU assembler and linker. Without it, Clang often fails at link with `unable to find library -lgcc` on a cross host.
4. Choose the linker. Prefer LLD: add `-fuse-ld=lld` if `ld.lld` is installed. Otherwise add `-fuse-ld=<gcc_toolchain_path>/bin/aarch64-linux-gnu-ld`. Record which linker you chose.
5. If the target CPU is known from the triple report, add `-mcpu=<cpu>`. Do not add `-march=native`; it reads the build host.

### Output
The assembled `clang_flags` list.

### Quality Gate
- The flag list contains `--target=<target_triple>` and `--sysroot=<sysroot.path>`.
- Exactly one `-fuse-ld=` entry is present.

---

## Phase 2: Verify the Target Resolves and Links

### Entry Criteria
- `clang_flags` is assembled.

### Actions
1. Print the effective target: `clang ${clang_flags} -print-target-triple`. It must print an `aarch64` triple.
2. Compile and link a probe: `echo 'int main(void){return 0;}' > /tmp/p.c && clang ${clang_flags} /tmp/p.c -o /tmp/p`. A link error here, not a compile error, almost always means `--gcc-toolchain` or the sysroot is wrong.
3. Read the machine: `readelf -h /tmp/p | grep Machine` must print `AArch64`.
4. Record `clang --version`, the resolved triple, and the gate results in `clang_report`.
5. Do not drop `--sysroot` to make the link succeed; that links the probe against host libraries and produces a binary that will not run on the target.

### Output
`clang_flags`, `clang_report`.

### Quality Gate
- `clang ${clang_flags} -print-target-triple` prints an `aarch64-*` triple.
- `readelf -h /tmp/p` shows `Machine: AArch64`.

---

## Worked Example

Illustrative. `compiler` = `clang`, `target_triple` = `aarch64-linux-gnu`, `sysroot.path` = `/opt/sysroots/aarch64-bookworm`, `gcc_toolchain_path` = `/usr`.

```
$ clang --target=aarch64-linux-gnu --sysroot=/opt/sysroots/aarch64-bookworm --gcc-toolchain=/usr -fuse-ld=lld -print-target-triple
aarch64-unknown-linux-gnu
$ clang --target=aarch64-linux-gnu --sysroot=/opt/sysroots/aarch64-bookworm --gcc-toolchain=/usr -fuse-ld=lld /tmp/p.c -o /tmp/p
$ readelf -h /tmp/p | grep Machine
  Machine:                           AArch64
```

`clang_flags` = `["--target=aarch64-linux-gnu", "--sysroot=/opt/sysroots/aarch64-bookworm", "--gcc-toolchain=/usr", "-fuse-ld=lld"]`.

---

## Exit Criteria

DONE when `-print-target-triple` reports aarch64 and a probe compiles and links to an `AArch64` ELF with the assembled flags.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `compiler` is not `clang` | **Skip**: this flow does not apply; emit empty outputs. |
| Phase 1 | `ld.lld` not installed | **Adjust**: install `lld` or set `-fuse-ld=` to the GNU cross `ld`. |
| Phase 2 | Link fails with `cannot find crtbegin.o` | **Adjust**: set or correct `--gcc-toolchain` so Clang finds the GCC runtime objects. |
| Phase 2 | Compile fails with missing headers | **Adjust**: the sysroot lacks `/usr/include`; return to `xarch-sysroot-from-image`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
