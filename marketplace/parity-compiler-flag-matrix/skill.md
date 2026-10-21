# Parity Compiler and Flag Matrix

**One-line description:** Builds and runs the parity harness across a matrix of compilers, compiler versions, optimization levels, and instruction-set targets with the floating-point flags held fixed, so any cell that disagrees with the goldens exposes a hidden dependency on code generation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `port_repo` (string, required): Path to the C++ port.
- `fp_flags` (string[], required): Output of `parity-fp-flag-baseline`.
- `golden_manifest` (string, required): Output of `parity-golden-manifest-lock`.
- `comparison_policy` (object, required): Output of `parity-ulp-tolerance-policy`.

---

## Outputs

- `matrix_results` (object[]): One row per matrix cell: compiler and version, optimization level, ISA target, mismatch count, and max ULP distance.

---

## Phase 1: Define the Matrix

### Entry Criteria
- The harness passes the golden comparison in the production configuration.

### Actions
1. Choose axes. The values are user inputs; this table lists what each axis tests:

| Axis | Example values | What a failure in only some cells means |
|---|---|---|
| Compiler | `gcc`, `clang` | contraction default or a compiler-specific optimization |
| Version | each version used in production | changed defaults or code generation |
| Optimization | `-O0`, `-O2`, `-O3` | excess precision, contraction, or undefined behavior |
| ISA (x86_64) | `-march=x86-64`, `-march=x86-64-v3` | FMA becomes available at `x86-64-v3`; failure here means contraction is still on somewhere |

2. Keep `fp_flags` identical in every cell. The matrix tests whether the port is independent of everything else.
3. Write the matrix as CMake presets in `CMakePresets.json`, one `configurePresets` entry per cell, each with its own `binaryDir`, setting `CMAKE_CXX_COMPILER`, `CMAKE_BUILD_TYPE`, and `CMAKE_CXX_FLAGS`.

### Output
`CMakePresets.json` with one preset per cell.

### Quality Gate
- `cmake --list-presets` prints one preset per cell.
- Every preset's `CMAKE_CXX_FLAGS` contains every entry of `fp_flags`.

---

## Phase 2: Run Every Cell

### Entry Criteria
- Presets defined.

### Actions
1. For each preset: `cmake --preset <cell> && cmake --build --preset <cell> --target parity_harness`.
2. Run the harness on all goldens and compare with `parity-ulp-compare` using `comparison_policy`.
3. Record mismatch count and max ULP per cell. Do not stop at the first failing cell; run all of them so the pattern is visible.
4. Read the pattern with this table:

| Pattern | Likely cause | Next flow |
|---|---|---|
| Fails at `-O2`/`-O3`, passes at `-O0` | contraction, uninitialized read, or UB | `parity-gcc-fp-contract` or `parity-clang-fp-contract`, then `parity-cpp-sanitizer-sweep` |
| Fails only at `-march=x86-64-v3` | FMA contraction | compiler contraction flow |
| Fails on one compiler only | that compiler's default or a pragma | that compiler's contraction flow |
| Fails on every cell | algorithm or reduction order | `parity-reduction-order`, `parity-divergence-triage` |

5. Emit `matrix_results`.

### Output
`matrix_results`.

### Quality Gate
- `matrix_results` has one row per preset with a numeric mismatch count.
- Every failing cell names a next flow from the pattern table.

---

## Worked Example

Illustrative.

```
cell                 mismatches  max_ulp
gcc13-O0-x86-64      0           0
gcc13-O2-x86-64      0           0
gcc13-O2-x86-64-v3   214         1
clang18-O2-x86-64-v3 0           0
```

Only GCC at `x86-64-v3` fails: GCC's contraction is still on for one TU. The fast-math audit finds a vendored target that overrides the flag.

---

## Exit Criteria

DONE when every matrix cell is built, run, and recorded, and every failing cell has a named next flow.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A compiler version is not installed | **Adjust**: run that cell in a container image with that compiler, recorded by image digest. |
| Phase 2 | A cell fails to build | **Return**: record the build error as the cell result; do not drop the cell. |
| Phase 2 | Tempted to widen the tolerance for one cell | **Stop**: the policy is per field, not per cell; route the cell to triage. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
