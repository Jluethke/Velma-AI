# Select the aarch64 Target Triple and ABI

**One-line description:** Picks the exact target triple and ABI for an aarch64 Linux target from a decision table keyed on the C library, and lists the toolchain package or target identifier the chosen build stack needs, including the different triple spellings GCC, Rust and Go use.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `stack` (string, required): Build system in use. One of `cmake`, `meson`, `autotools`, `rust`, `go`, `conan`, `python`.
- `target_libc` (string, required): Target C library. One of `gnu` or `musl`.
- `target_cpu` (string, optional): Target CPU for `-mcpu`, for example `cortex-a72`. If absent, the triple stays generic (`armv8-a`) and no `-mcpu` is emitted.

---

## Outputs

- `target_triple` (string): The selected triple, for example `aarch64-linux-gnu` or `aarch64-linux-musl`.
- `triple_report` (object): The triple, the ABI note, the `-mcpu`/`-march` value, and the exact package name or target identifier the stack needs.

---

## Phase 1: Choose the Triple

### Entry Criteria
- `stack` and `target_libc` are present.
- `target_libc` is exactly `gnu` or `musl`.

### Actions
1. Select the triple from this table by `target_libc`:

| `target_libc` | `target_triple` | ABI |
|---|---|---|
| gnu | `aarch64-linux-gnu` | LP64, little-endian, hard-float (AArch64 has no soft-float ABI) |
| musl | `aarch64-linux-musl` | LP64, little-endian, static-friendly musl libc |

2. AArch64 is 64-bit only. Do not use `arm-linux-gnueabihf`; that is 32-bit ARMv7 and links the wrong libc. If the target is a 32-bit userspace on a 64-bit chip, stop and confirm with the user, because the triple and packages are different.
3. If `target_cpu` is set, record `-mcpu=<target_cpu>`. If absent, record `-march=armv8-a` and emit no `-mcpu`. Do not invent a CPU name; `-mcpu=native` is wrong for cross builds because it reads the build host.

### Output
`target_triple` as a single string.

### Quality Gate
- `target_triple` matches the regex `^aarch64-linux-(gnu|musl)$`.
- The segment after the second hyphen equals `target_libc`.

---

## Phase 2: Map the Triple to Toolchain Identifiers

### Entry Criteria
- `target_triple` is set.

### Actions
1. Map `stack` to its identifier with this table. The spelling differs by tool, which is the most common first mistake:

| `stack` | Identifier to record | Note |
|---|---|---|
| cmake, meson, autotools, conan, python | `gcc-aarch64-linux-gnu`, `g++-aarch64-linux-gnu` (apt) | binary prefix is `aarch64-linux-gnu-` |
| rust | rustup target `aarch64-unknown-linux-gnu` (or `-musl`) | vendor field is `unknown`, not the GNU spelling |
| go | `GOARCH=arm64 GOOS=linux` | Go says `arm64`, never `aarch64` |

2. For `musl` targets with a GCC-based stack, record the musl cross prefix `aarch64-linux-musl-` (from a musl.cc or distro musl-cross toolchain), not `aarch64-linux-gnu-`.
3. Write `triple_report` with the triple, ABI note, the `-mcpu`/`-march` value from Phase 1, and the recorded identifier.

### Output
`triple_report`.

### Quality Gate
- `triple_report` names one concrete package or target identifier string for the given `stack`.
- The `go` row, if selected, uses `arm64`; the `rust` row, if selected, uses the `aarch64-unknown-linux-*` spelling.

---

## Worked Example

Illustrative. `stack` = `cmake`, `target_libc` = `gnu`, `target_cpu` = `cortex-a72`.

- Phase 1 selects `target_triple` = `aarch64-linux-gnu`, records `-mcpu=cortex-a72`. Gate: the string matches the regex and ends in `gnu`.
- Phase 2 records `triple_report` = `{ "triple": "aarch64-linux-gnu", "abi": "LP64 little-endian", "mcpu": "cortex-a72", "packages": ["gcc-aarch64-linux-gnu", "g++-aarch64-linux-gnu"], "binary_prefix": "aarch64-linux-gnu-" }`.

A second run with `stack` = `go` instead records `{ "GOARCH": "arm64", "GOOS": "linux" }` and no apt package.

---

## Exit Criteria

DONE when `target_triple` matches the regex, the libc segment equals `target_libc`, and `triple_report` lists the stack's exact identifier with the correct spelling.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `target_libc` is neither gnu nor musl | **Stop**: ask the user which C library the target image uses (`ls /lib/ld-linux-aarch64.so.1` for glibc, `ls /lib/ld-musl-aarch64.so.1` for musl). |
| Phase 1 | User wants 32-bit ARM | **Stop**: this flow is aarch64 only; the 32-bit triple and packages differ. |
| Phase 2 | Unknown `stack` value | **Return**: ask the user to name the build system; do not guess an identifier. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
