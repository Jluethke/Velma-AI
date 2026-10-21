# Parity Floating-Point Flag Baseline

**One-line description:** Sets the compiler flags a port must build with so its floating-point evaluation matches a strict IEEE 754 reference: no expression contraction, no fast-math, SSE2 instead of x87 on 32-bit x86, with one decision table per compiler.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `port_repo` (string, required): Path to the port.
- `compiler` (string, required): One of `gcc`, `clang`, `msvc`.
- `target_arch` (string, required): One of `x86_64`, `aarch64`, `i686`.

---

## Outputs

- `fp_flags` (string[]): The exact floating-point flags to add to every port translation unit, in order.

---

## Phase 1: Pick Flags from the Table

### Entry Criteria
- `compiler` and `target_arch` are known.

### Actions
1. Read the row for your `compiler`. The reference is CPython, which evaluates each `float` operation separately and rounds every result to `float64` with no fusion.

| compiler | Contraction off | Fast-math off | Notes |
|---|---|---|---|
| `gcc` | `-ffp-contract=off` | do not pass `-ffast-math`, `-Ofast`, `-funsafe-math-optimizations`, `-ffinite-math-only`, `-fassociative-math`, `-freciprocal-math` | GCC documents `-ffp-contract=fast` as its default outside ISO C modes; set `off` explicitly on every TU. |
| `clang` | `-ffp-contract=off` | same list as `gcc`; also not `-ffp-model=fast` | Clang documents `on` (fuse within one statement) as its default for C and C++. |
| `msvc` | `/fp:precise` and no `/fp:contract` | do not pass `/fp:fast` | Check the Microsoft `/fp` documentation for your Visual Studio version on whether `/fp:precise` contracts. |

2. Add the row for your `target_arch`:

| target_arch | Extra flags |
|---|---|
| `x86_64` | none required; SSE2 is the baseline and `FLT_EVAL_METHOD` is 0 |
| `aarch64` | none beyond contraction off; FMA instructions are always available on this architecture, so contraction is the main risk here |
| `i686` with `gcc` or `clang` | `-msse2 -mfpmath=sse`; see `parity-x87-excess-precision` |
| `i686` with `msvc` | `/arch:SSE2` |

3. Write `fp_flags` as the union, in the order: contraction flag, arch flags.
4. Do NOT add flags you have not looked up in the compiler's `--help` or documentation. If a flag is rejected by the compiler, remove it and record why.

### Output
Draft `fp_flags`.

### Quality Gate
- `fp_flags` contains the contraction flag for the chosen `compiler`.
- No fast-math flag from the table is in `fp_flags`.

---

## Phase 2: Apply and Prove

### Entry Criteria
- Draft `fp_flags` exists.

### Actions
1. Apply the flags to the port target in CMake with `target_compile_options(<target> PRIVATE <flags>)`. Do not set them only in `CMAKE_CXX_FLAGS_RELEASE`; a Debug or RelWithDebInfo build would miss them.
2. Reconfigure with `-DCMAKE_EXPORT_COMPILE_COMMANDS=ON` and build.
3. Confirm each flag reached each TU: `grep -c -- "-ffp-contract=off" build/compile_commands.json` must equal the number of port source entries in that file.
4. Confirm the flags are accepted: the build log has no `unrecognized command-line option` (GCC), `unknown argument` (Clang), or `D9002` (MSVC) warning.

### Output
`fp_flags`.

### Quality Gate
- The count from step 3 equals the number of port TUs.
- Zero unrecognized-flag warnings in the build log.

---

## Worked Example

Illustrative. `compiler = clang`, `target_arch = aarch64`.

Phase 1 gives `fp_flags = ["-ffp-contract=off"]`.

```
$ grep -c '"file": ".*src/.*\.cpp"' build/compile_commands.json
12
$ grep -c -- "-ffp-contract=off" build/compile_commands.json
12
```

All twelve port TUs carry the flag.

---

## Exit Criteria

DONE when `fp_flags` is applied to every port TU and the compiler accepted every flag.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `compiler` not in the table (for example ICX or NVCC) | **Return**: ask the user for that compiler's documented contraction and fast-math flags; do not guess. |
| Phase 2 | Flag count lower than TU count | **Adjust**: find TUs from another target or a third-party subproject and apply the flags there too. |
| Phase 2 | Flag rejected by an old compiler | **Stop**: record the compiler version; contraction cannot be proven off without a supported flag or pragma. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
