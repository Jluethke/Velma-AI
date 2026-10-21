# Audit an aarch64 Binary's Shared Library Dependencies

**One-line description:** Reads the `DT_NEEDED` entries and the interpreter from a cross-built aarch64 binary with `readelf`, resolves each one against the sysroot (never the build host, which has x86-64 libraries), and reports every dependency that is missing from the sysroot so it can be installed before deploy.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `binary_path` (string, required): Path to the cross-built aarch64 binary or shared object to audit.
- `sysroot` (object, required): Output of `xarch-sysroot-from-image`, holding the sysroot path the binary will run against.
- `toolchain_prefix` (string, required): Output of `xarch-gcc-toolchain-select`, for example `aarch64-linux-gnu-`.

---

## Outputs

- `deps_report` (object): The interpreter, the `DT_NEEDED` list, and the resolved sysroot path for each found library.
- `missing_libs` (object[]): Each `DT_NEEDED` entry not found in the sysroot, with the SONAME and the paths searched. Empty when all resolve.

---

## Phase 1: Read NEEDED and the Interpreter

### Entry Criteria
- `binary_path` exists and is an ELF file.
- `sysroot.path` is present.

### Actions
1. Confirm the file is aarch64: `readelf -h "$binary_path" | grep Machine` must print `AArch64`. If it prints `X86-64`, stop; this is a host binary and the audit is meaningless.
2. List the dynamic dependencies: `readelf -d "$binary_path" | grep NEEDED`. Each line names one SONAME, for example `libstdc++.so.6`.
3. Read the program interpreter: `readelf -l "$binary_path" | grep interpreter`. For glibc aarch64 it is `/lib/ld-linux-aarch64.so.1`; for musl it is `/lib/ld-musl-aarch64.so.1`. A mismatch with the sysroot libc is a defect.
4. Do not run `ldd "$binary_path"` on the build host. Host `ldd` resolves against host x86-64 libraries and either errors or reports the wrong paths. Resolution is done against the sysroot in Phase 2.

### Output
The `DT_NEEDED` list and the interpreter path.

### Quality Gate
- `readelf -h "$binary_path"` shows `Machine: AArch64`.
- At least the interpreter line and zero or more NEEDED lines are captured.

---

## Phase 2: Resolve Each NEEDED Against the Sysroot

### Entry Criteria
- The NEEDED list and interpreter are captured.

### Actions
1. For each SONAME, search the sysroot library dirs in order: `<sysroot>/lib/<triple>`, `<sysroot>/usr/lib/<triple>`, `<sysroot>/lib`, `<sysroot>/usr/lib`. Derive `<triple>` by stripping the trailing `-` from `toolchain_prefix`.
2. Record a match as the first path that exists. If none exists, add an entry to `missing_libs` with the SONAME and the searched paths.
3. Optionally cross-check with the sysroot-aware resolver if present: `${toolchain_prefix}ldd` or `readelf` on each `.so` to walk transitive NEEDED. Record transitive misses too.
4. Confirm the interpreter file exists in the sysroot at the exact path from Phase 1. A missing interpreter means the binary will fail to start on the target with `No such file or directory` even though the file is present.
5. Do not clear a missing entry by copying the host x86-64 library of the same name into the sysroot; the SONAME would match but the architecture would not.

### Output
`deps_report`, `missing_libs`.

### Quality Gate
- Every SONAME in the NEEDED list appears in `deps_report` as either resolved with a sysroot path or listed in `missing_libs`.
- The interpreter path from Phase 1 is confirmed present in the sysroot or listed in `missing_libs`.

---

## Worked Example

Illustrative. `binary_path` = `build/app`, `toolchain_prefix` = `aarch64-linux-gnu-`, `sysroot.path` = `/opt/sysroots/aarch64-bookworm`.

```
$ readelf -h build/app | grep Machine
  Machine:                           AArch64
$ readelf -d build/app | grep NEEDED
 0x0000000000000001 (NEEDED)  Shared library: [libstdc++.so.6]
 0x0000000000000001 (NEEDED)  Shared library: [libc.so.6]
$ ls /opt/sysroots/aarch64-bookworm/usr/lib/aarch64-linux-gnu/libstdc++.so.6
(no such file)
```

`missing_libs` = `[{ "soname": "libstdc++.so.6", "searched": ["/opt/.../lib/aarch64-linux-gnu", "/opt/.../usr/lib/aarch64-linux-gnu"] }]`. Fix: install `libstdc++6` into the sysroot, then re-run.

---

## Exit Criteria

DONE when every `DT_NEEDED` entry and the interpreter are either resolved to a sysroot path or listed in `missing_libs`, with nothing resolved against the build host.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | File is not ELF | **Stop**: `file "$binary_path"`; the input is a script or archive, not a binary. |
| Phase 1 | Machine is X86-64 | **Stop**: this is a host binary; return to the build flow, the cross compiler was not used. |
| Phase 2 | Interpreter missing from sysroot | **Return**: to `xarch-sysroot-from-image`; the loader package was not copied. |
| Phase 2 | A NEEDED library is missing | **Adjust**: install the target `-dev` or runtime package into the sysroot, then re-run Phase 2. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
