# Parity Fast-Math Audit

**One-line description:** Finds every way fast-math semantics enter a port build, including flags hidden in build presets, third-party targets, and linked runtime objects that flush denormals for the whole process, and lists each one with its source.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `port_repo` (string, required): Path to the port with a configured build.
- `fp_flags` (string[], required): Output of `parity-fp-flag-baseline`.

---

## Outputs

- `fast_math_findings` (object[]): Each place fast-math or a component of it is enabled: file, line or compile entry, the flag, and its effect.

---

## Phase 1: Sweep Compile Lines

### Entry Criteria
- `build/compile_commands.json` exists.

### Actions
1. Search every compile command, not a filtered subset, for these flags: `-ffast-math`, `-Ofast`, `-funsafe-math-optimizations`, `-ffinite-math-only`, `-fno-signed-zeros`, `-fassociative-math`, `-freciprocal-math`, `-fno-trapping-math`, `-ffp-model=fast`, `-fcx-limited-range`, `/fp:fast`. Command: `grep -oE -- "-ffast-math|-Ofast|-funsafe-math-optimizations|-ffinite-math-only|-fno-signed-zeros|-fassociative-math|-freciprocal-math|-ffp-model=fast|/fp:fast" build/compile_commands.json | sort | uniq -c`.
2. Search the source tree for in-code switches: `grep -rnE "#pragma GCC optimize|__attribute__\(\(optimize|#pragma float_control|#pragma fp_contract|#pragma clang fp|#pragma STDC FP_CONTRACT" <port_repo>`.
3. Search the build files: `grep -rnE "fast-math|Ofast|fp:fast" --include=CMakeLists.txt --include=*.cmake --include=CMakePresets.json --include=meson.build --include=Makefile <port_repo>`.
4. Record each hit with its file and line. A hit inside a third-party subdirectory still counts if that code is linked into the port.

### Output
Compile-time findings.

### Quality Gate
- The grep in step 1 ran over the whole `compile_commands.json` file.
- Each finding has a file and line or a compile entry.

---

## Phase 2: Check Link and Runtime Effects

### Entry Criteria
- Compile-time findings recorded.

### Actions
1. Check the link line (from `build/CMakeFiles/<target>.dir/link.txt` for Makefile generators, or `ninja -t commands <target>` for Ninja) for `-ffast-math` or `-Ofast`. With GCC on x86, linking an executable with these flags can pull in `crtfastmath.o`, which sets the flush-to-zero and denormals-are-zero bits at startup for the whole process. Confirm on your GCC version with `g++ -ffast-math -### main.o 2>&1 | grep crtfastmath`.
2. For each shared library the port or its Python binding loads, check whether it was built with fast-math (`strings libX.so | grep -i fast-math` finds only recorded command lines from `-frecord-gcc-switches`; when absent, ask the library's build owner). A single fast-math shared library loaded into a Python process can change denormal handling for that whole process.
3. If the port is called from Python through a binding, check that Python side for fast-math too: `grep -rn "fastmath=True" <python_dir>` (Numba).
4. Write the effect of each flag found, from the GCC or Clang manual: `-ffinite-math-only` lets the compiler assume no NaN or infinity so `std::isnan` checks can be removed; `-fno-signed-zeros` lets `x + 0.0` be folded so `-0.0` turns into `+0.0`; `-fassociative-math` reorders sums and deletes Kahan compensation terms; `-freciprocal-math` turns `x / y` into `x * (1 / y)`.
5. Emit `fast_math_findings`.

### Output
`fast_math_findings`.

### Quality Gate
- Every finding carries one effect from step 4 or a cited manual line.
- `fast_math_findings` is an empty list only if every grep in Phase 1 and the link check returned no hits.

---

## Worked Example

Illustrative.

```
$ grep -oE -- "-ffast-math|-Ofast|-fassociative-math" build/compile_commands.json | sort | uniq -c
      3 -ffast-math
$ grep -n "ffast-math" third_party/kissfft/CMakeLists.txt
22:  target_compile_options(kissfft PRIVATE -ffast-math)
```

Finding: `third_party/kissfft/CMakeLists.txt:22`, `-ffast-math` on three TUs linked into the port; effects include reordered sums and assumed-finite math. Fix goes to `parity-compiler-flag-matrix` and the build owner; this flow only reports.

---

## Exit Criteria

DONE when every compile line, source pragma, build file, link line, and loaded shared library has been checked and each hit is recorded with its effect.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Fast-math found in a vendored library | **Return**: report it; do not edit vendored build files without the user's approval. |
| Phase 2 | Cannot tell how a prebuilt shared library was compiled | **Adjust**: measure its effect instead with `parity-denormal-ftz-daz` after loading it. |
| Phase 2 | Weak model tempted to remove `isnan` checks that "never fire" | **Stop**: those checks fire only without `-ffinite-math-only`; removing them hides the defect. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
