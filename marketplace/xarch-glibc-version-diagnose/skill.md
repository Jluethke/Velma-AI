# Diagnose a GLIBC Version Mismatch on aarch64

**One-line description:** Diagnoses the `version GLIBC_2.XX not found` class of runtime failure on an aarch64 target by reading the glibc symbol versions the binary requires with `readelf` and `objdump`, comparing them to the target's actual glibc, and naming the specific fix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `binary_path` (string, required): The aarch64 binary that fails on the target with a version error.
- `sysroot` (object, required): Output of `xarch-sysroot-from-image`. The sysroot represents the target's glibc, so the comparison is against the real deployment floor.

---

## Outputs

- `glibc_report` (object): The highest `GLIBC_` and `GLIBCXX_`/`CXXABI_` versions required, the target's glibc version, and the verdict.
- `required_versions` (object[]): Each versioned symbol the binary needs above the target's glibc, with the symbol name and the version tag.

---

## Phase 1: Read the Required Symbol Versions

### Entry Criteria
- `binary_path` is an aarch64 ELF.
- `sysroot.path` holds the target `libc.so.6`.

### Actions
1. List the glibc version tags the binary references: `readelf -V "$binary_path"` (the `.gnu.version_r` section), or more directly `objdump -T "$binary_path" | grep -o 'GLIBC_[0-9.]*' | sort -uV | tail`. The last line is the highest glibc the binary demands.
2. For C++ also read the libstdc++ ABI tags: `objdump -T "$binary_path" | grep -oE '(GLIBCXX|CXXABI)_[0-9.]*' | sort -uV | tail`. A `GLIBCXX_3.4.30 not found` error is the libstdc++ version, a separate axis from glibc.
3. Read the target's glibc version from the sysroot: `strings "$sysroot.path"/lib/aarch64-linux-gnu/libc.so.6 | grep -m1 'GNU C Library'` or run the sysroot loader if a target is reachable (`ld-linux-aarch64.so.1 --version`).
4. Do not read the build host's glibc; the comparison that matters is the binary's requirement versus the target's glibc, both aarch64.

### Output
The highest required `GLIBC_` and `GLIBCXX_`/`CXXABI_` tags and the target glibc version.

### Quality Gate
- A highest `GLIBC_` version is recorded from the binary.
- The target's glibc version is recorded from the sysroot.

---

## Phase 2: Compare and Name the Fix

### Entry Criteria
- The required and available versions are recorded.

### Actions
1. Compare with version sort. If the binary's highest `GLIBC_` tag is greater than the target glibc, every symbol at that tag will fail at load. List those symbols in `required_versions` (from the `objdump -T` output filtered to the offending tags).
2. Set the verdict and name a fix from this table:

| Situation | Fix |
|---|---|
| Binary needs newer glibc than target has | Build against a sysroot whose glibc matches the target (return to `xarch-sysroot-from-image`), or build in a manylinux image with a low glibc floor |
| Binary needs newer `GLIBCXX_`/`CXXABI_` | Link libstdc++ statically with `-static-libstdc++`, or ship the matching libstdc++, or build with the target's g++ version |
| Target cannot be upgraded and sysroot cannot be lowered | Statically link with musl via `xarch-musl-static-link` |

3. Record the exact symbol-and-version pairs so the fix can be verified: after the fix, the highest required tag must be at or below the target glibc.
4. Do not copy a newer `libc.so.6` onto the target to satisfy the binary; replacing the system libc breaks every other program and is not a valid fix.

### Output
`glibc_report`, `required_versions`.

### Quality Gate
- `glibc_report` states whether the binary's highest required glibc is at or below the target's glibc.
- `required_versions` lists every symbol above the target floor, or is empty when the binary fits.

---

## Worked Example

Illustrative. `binary_path` = `app`, target sysroot glibc 2.31.

```
$ objdump -T app | grep -o 'GLIBC_[0-9.]*' | sort -uV | tail -3
GLIBC_2.33
GLIBC_2.34
GLIBC_2.38
$ strings /opt/sysroots/aarch64-focal/lib/aarch64-linux-gnu/libc.so.6 | grep -m1 'GNU C Library'
GNU C Library (Ubuntu GLIBC 2.31-0ubuntu9) ...
```

Binary needs 2.38, target has 2.31. `required_versions` lists the 2.34 and 2.38 symbols (for example `pthread_cond_signal@GLIBC_2.34`). Fix: rebuild against a 2.31 sysroot, or static musl.

---

## Exit Criteria

DONE when `glibc_report` compares the binary's highest required glibc to the target's glibc, lists every symbol above the floor, and names a concrete fix.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `objdump` not present | **Adjust**: use `readelf -V` or the cross `${prefix}objdump`. |
| Phase 1 | Cannot read target glibc | **Return**: confirm the sysroot holds `libc.so.6` via `xarch-sysroot-from-image`. |
| Phase 2 | Error is `GLIBCXX_` not `GLIBC_` | **Adjust**: diagnose the libstdc++ ABI axis; fix with `-static-libstdc++` or the matching g++ version. |
| Phase 2 | Binary fits but still fails at load | **Return**: the failure is a missing library, not a version; run `xarch-ldd-shared-deps-audit`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
