# Verify an Artifact Is a Valid aarch64 ELF

**One-line description:** Confirms a build artifact is a 64-bit little-endian AArch64 ELF with the expected interpreter and bit width by reading `file` and the `readelf -h` header fields, catching the common case where the host compiler silently produced an x86-64 binary.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `binary_path` (string, required): Path to the executable, shared object, or archive member to verify.

---

## Outputs

- `arch_verdict` (string): One of `aarch64-ok`, `wrong-arch`, or `not-elf`.
- `elf_report` (object): The `Class`, `Data`, `Machine`, `Type` and interpreter fields read from the header.

---

## Phase 1: Read the ELF Header

### Entry Criteria
- `binary_path` exists.

### Actions
1. Classify the file: `file "$binary_path"`. If it does not say `ELF`, set `arch_verdict` to `not-elf` and stop; the input is a script, a static archive member needing extraction, or an object wrapper.
2. Read the header: `readelf -h "$binary_path"`. Record four fields:

| Field | Expected for aarch64 |
|---|---|
| `Class` | `ELF64` |
| `Data` | `2's complement, little endian` |
| `Machine` | `AArch64` |
| `Type` | `EXEC`, `DYN` (PIE or shared object), or `REL` (object file) |

3. The decisive field is `Machine`. `AArch64` is correct; `Advanced Micro Devices X86-64` means the host compiler was used; `ARM` (without 64) means a 32-bit ARM build, which is the wrong target.
4. Do not judge the arch from the file name or a path segment like `aarch64/`; a wrong binary can sit in a right-named dir. Read the header.

### Output
The four header fields.

### Quality Gate
- `readelf -h` succeeded and the four fields are captured.
- The `Machine` field value is recorded verbatim.

---

## Phase 2: Decide the Verdict

### Entry Criteria
- The header fields are captured.

### Actions
1. Set `arch_verdict` to `aarch64-ok` only if `Class` is `ELF64`, `Data` is little endian, and `Machine` is `AArch64`. Otherwise set `wrong-arch` and record which field failed.
2. For an executable or shared object, read the interpreter: `readelf -l "$binary_path" | grep -i interp`. For glibc it should be `/lib/ld-linux-aarch64.so.1`; for musl `/lib/ld-musl-aarch64.so.1`. A static binary has no interpreter, which is expected. Record the interpreter in `elf_report`.
3. If `Machine` is `AArch64` but the interpreter is an x86-64 path, the file was linked with a mismatched dynamic section; set `wrong-arch`.
4. Do not pass a `wrong-arch` verdict downstream as acceptable. Verification exists to stop a host binary from being deployed; a failed check is a stop, not a warning.

### Output
`arch_verdict`, `elf_report`.

### Quality Gate
- `arch_verdict` is `aarch64-ok` only when Class, Data and Machine all match.
- `elf_report` records the interpreter (or notes the binary is static).

---

## Worked Example

Illustrative. `binary_path` = `build-aarch64/app`.

```
$ file build-aarch64/app
build-aarch64/app: ELF 64-bit LSB pie executable, ARM aarch64, dynamically linked,
  interpreter /lib/ld-linux-aarch64.so.1, ...
$ readelf -h build-aarch64/app | egrep 'Class|Data|Machine|Type'
  Class:                             ELF64
  Data:                              2's complement, little endian
  Type:                              DYN (Position-Independent Executable file)
  Machine:                           AArch64
```

`arch_verdict` = `aarch64-ok`. `elf_report` records interpreter `/lib/ld-linux-aarch64.so.1`.

---

## Exit Criteria

DONE when `arch_verdict` is set from the actual header fields, and `elf_report` records Class, Data, Machine, Type and the interpreter.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `file` says not ELF | **Return**: set `not-elf`; if it is a `.a` archive, extract a member and verify that. |
| Phase 1 | `readelf` reports a corrupt header | **Stop**: the file is truncated; rebuild it. |
| Phase 2 | `Machine` is X86-64 | **Stop**: the host compiler was used; return to the build flow. |
| Phase 2 | Interpreter path is x86-64 | **Stop**: mismatched dynamic section; rebuild with the cross toolchain and sysroot. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
