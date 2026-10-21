# C++ Floating Point Determinism Across Builds

**One-line description:** Pins the C++ floating point build policy (no `-ffast-math`, explicit `-ffp-contract=off`, SSE math on x86, MSVC `/fp:precise` or `/fp:strict`), audits `compile_commands.json` to prove it, removes parallel float reductions and unpinned transcendental calls from the decision path, and compares outputs bit for bit across x86_64 and aarch64 builds.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root with a CMake build.
- `target_platforms` (string[], optional): Platforms that must agree bit for bit, for example `["x86_64-linux-gnu", "aarch64-linux-gnu"]`. Default: the host platform only, and record that cross-platform agreement was not checked.

---

## Outputs

- `float_policy` (object): The compiler flags, math library choice and banned constructs, with the evidence command for each.
- `cross_platform_diff_report` (object[]): Per platform pair: build ids, input file, `cmp` result, and the first differing value printed in hex float form.

---

## Phase 1: Pin and Audit Compiler Flags

### Entry Criteria
- `cmake -S . -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON` succeeds.

### Actions
1. Search the build files: `rg -n 'ffast-math|Ofast|funsafe-math|ffinite-math|fassociative-math|fp:fast' CMakeLists.txt cmake/ src/`. Any hit on a decision target is removed. `-Ofast` implies `-ffast-math`, which allows reassociation and assumes no NaN or infinity, so results change with optimization and inlining.
2. Add explicit flags on the decision targets with `target_compile_options`:
   - GCC and Clang: `-ffp-contract=off`. Without it, the compiler may fuse `a*b+c` into one FMA instruction with a single rounding. aarch64 has FMA in the base ISA, so an unfused x86_64 build and a fused aarch64 build differ in the last bits. GCC and Clang have different defaults for this flag, so set it explicitly rather than rely on either.
   - x86 32-bit only: `-mfpmath=sse -msse2` to avoid x87 80-bit intermediates.
   - MSVC: `/fp:precise` (the default) or `/fp:strict`; never `/fp:fast`.
3. Reconfigure and build, then audit every compile line for decision sources: `jq -r '.[] | select(.file | test("src/decision")) | .command // (.arguments | join(" "))' build/compile_commands.json | rg -c -- '-ffp-contract=off'` must equal the count of decision translation units, and the same query piped to `rg -c 'ffast-math'` must print nothing.
4. Flush-to-zero: linking with `-ffast-math` on GCC can pull in `crtfastmath.o`, which sets FTZ and DAZ in MXCSR at startup for the whole process. Confirm the final link line has no `-ffast-math`.

### Output
Draft `float_policy` with flags and audit commands.

### Quality Gate
- The `jq` audit count equals the number of decision translation units.
- The `ffast-math` audit prints zero matches.

---

## Phase 2: Remove Order-Dependent and Library-Dependent Math

### Entry Criteria
- Flags pinned.

### Actions
1. Find parallel reductions: `rg -n 'std::reduce|std::transform_reduce|execution::par|#pragma omp.*reduction' src/decision`. Floating point addition is not associative; these combine partial results in an unspecified order. Replace with a sequential `std::accumulate` in a fixed order, or a fixed-size chunked sum combined in index order.
2. Find transcendental calls: `rg -n '\b(std::)?(sin|cos|tan|exp|log|pow|atan2|sqrt)\(' src/decision`. IEEE 754 requires correct rounding for `sqrt`, but `sin`, `exp`, `log` and `pow` results from the system math library are not required to be correctly rounded and differ between glibc versions, musl, Apple libm and MSVC. Decision table:

| Situation | Action |
|---|---|
| Only one platform and one pinned toolchain image ships | Record the libm version (`ldd --version` for glibc) in `float_policy`; accept |
| Two or more platforms must agree bit for bit | Link one correctly rounded math library on all platforms (for example CORE-MATH), or vendor one implementation compiled with the pinned flags |
| The value only feeds a comparison against a limit | Prefer rewriting the comparison to avoid the function (for example compare squared distances instead of `sqrt`) |

3. Edit one function at a time; rebuild and run `ctest --test-dir build --output-on-failure` after each.

### Output
Decision path free of unordered reductions; transcendental policy recorded.

### Quality Gate
- The `std::reduce|execution::par|omp.*reduction` search on decision sources returns zero hits.
- `ctest` passed count is not lower than before the phase.

---

## Phase 3: Cross-Platform Bit Comparison

### Entry Criteria
- `target_platforms` has two or more entries, or skip to Exit with the report noting host only.

### Actions
1. Build the same commit for each platform with the same compiler family and major version (record `c++ --version`). Cross-compile with a toolchain file, or build natively on each platform, or run the aarch64 binary under `qemu-aarch64` (QEMU user mode emulates the guest FP instructions, which is acceptable for bit comparison but record that it was emulated).
2. Run the replay harness, or the decision binary, on the same input on each platform, writing outputs with doubles serialized as their exact bits: `std::printf("%a", x)` or `std::bit_cast<std::uint64_t>(x)` in hex.
3. `cmp out_x86_64 out_aarch64`. On a difference, print the first differing value from both files in `%a` form and record it.
4. Classify the cause with this table:

| Difference pattern | Likely cause |
|---|---|
| Last 1 to 2 bits differ after a multiply-add | FMA contraction still active somewhere; recheck flags on that TU |
| Difference only after a `sin`, `exp`, `log` or `pow` | libm differences |
| Difference grows with thread count | Parallel reduction left in path |
| `-0.0` versus `0.0`, or NaN payload differs | Serialization canonicalization; decide whether sign of zero matters and canonicalize NaN in the serializer |

### Output
`cross_platform_diff_report`, final `float_policy`.

### Quality Gate
- Every platform pair has a `cmp` exit status recorded.
- Every difference row has a cause from the table or an open question.

---

## Worked Example

Illustrative only. `target_platforms=["x86_64-linux-gnu","aarch64-linux-gnu"]`.

Phase 1: audit prints `14` for 14 decision TUs. Phase 3: `cmp` prints `out_x86 out_arm differ: byte 4411, line 88`. Values: `0x1.3333333333334p-2` versus `0x1.3333333333333p-2` in `brake_margin`. The TU `margin.cpp` was in a second target missing the flag; fixed, rebuilt, `cmp` exits 0.

---

## Exit Criteria

DONE when the flag audit proves the policy on every decision TU, unordered reductions are gone, the math library policy is recorded, and every platform pair compares identical or has a classified open item.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `compile_commands.json` missing | **Adjust**: the generator may not support it (Visual Studio generators do not); use Ninja or Makefiles. |
| Phase 2 | Replacing a reduction slows the control loop past its deadline | **Return**: report measured timing; choose a fixed chunked order rather than reintroducing unordered reduction. |
| Phase 3 | Platforms differ and the cause is not in the table | **Stop**: bisect by dumping intermediate values per function; do not loosen the comparison to a tolerance. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
