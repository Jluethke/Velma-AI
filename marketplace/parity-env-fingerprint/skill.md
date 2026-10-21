# Parity Environment Fingerprint

**One-line description:** Captures every environment fact that can change floating-point results on a parity run machine: compiler and version, effective flags, C library and libm version, CPU architecture and features, and Python and NumPy builds.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `port_repo` (string, required): Path to the port with a configured build directory.
- `compiler` (string, required): One of `gcc`, `clang`, `msvc`.
- `target_arch` (string, required): One of `x86_64`, `aarch64`, `i686`.

---

## Outputs

- `env_fingerprint` (object): JSON record of toolchain, flags, C library, CPU, and Python facts for one machine.

---

## Phase 1: Toolchain and Flags

### Entry Criteria
- The port is configured with CMake or another build system that can export compile commands.

### Actions
1. Record the compiler: `g++ --version` and `g++ -dumpmachine` for `gcc`; `clang++ --version` for `clang`; `cl` with no arguments prints the version banner for `msvc`.
2. Export the real compile lines. For CMake configure with `-DCMAKE_EXPORT_COMPILE_COMMANDS=ON` and read `build/compile_commands.json`. Record the full `command` for each port source file. Do not record the flags you think are set; record the ones in that file.
3. Record `CMAKE_BUILD_TYPE` and `CMAKE_CXX_FLAGS*` from `build/CMakeCache.txt`.
4. For `gcc` or `clang`, record predefined macros that reveal float behavior: `g++ <flags> -dM -E -x c++ /dev/null | grep -E "__FAST_MATH__|__FINITE_MATH_ONLY__|__FLT_EVAL_METHOD__|__FP_FAST_FMA"`, using the exact flags from step 2.

### Output
Toolchain section.

### Quality Gate
- The fingerprint contains the compile command for every port source file listed in `compile_commands.json`.
- The macro list was produced with the flags from `compile_commands.json`, not defaults.

---

## Phase 2: Libraries, CPU, Python

### Entry Criteria
- Toolchain section recorded.

### Actions
1. C library: on glibc run `getconf GNU_LIBC_VERSION` or `ldd --version`. On musl run `ldd` with no arguments (it prints the musl version). On macOS record `sw_vers`. On Windows record the UCRT version from the Windows build number (`ver`).
2. CPU: on Linux record `uname -m` and the `flags` (x86) or `Features` (aarch64) line from `/proc/cpuinfo`. On macOS `sysctl -a | grep machdep.cpu`.
3. Python: `python -c "import sys,platform; print(sys.version, platform.machine(), sys.float_info)"`.
4. NumPy: `python -c "import numpy; print(numpy.__version__); numpy.show_config()"`. NumPy 1.24 and later also has `numpy.show_runtime()`, which lists the SIMD extensions in use and the BLAS library; record it when available.
5. Record environment variables that change numerics if set: `OMP_NUM_THREADS`, `OPENBLAS_NUM_THREADS`, `MKL_NUM_THREADS`, `MKL_CBWR`, `NPY_DISABLE_CPU_FEATURES`.
6. Emit `env_fingerprint` as JSON with a SHA-256 of its own sorted content so two runs can be compared by one hash.

### Output
`env_fingerprint`.

### Quality Gate
- The JSON contains non-empty `compiler`, `compile_commands`, `libc`, `cpu`, `python`, and `numpy` keys.
- Running the flow twice on the same machine with no changes yields the same hash.

---

## Worked Example

Illustrative, Ubuntu 24.04 on aarch64 with GCC.

```
$ g++ --version | head -1
g++ (Ubuntu 13.2.0-23ubuntu4) 13.2.0
$ getconf GNU_LIBC_VERSION
glibc 2.39
$ g++ -O2 -std=c++20 -dM -E -x c++ /dev/null | grep -E "__FP_FAST_FMA|__FLT_EVAL_METHOD__"
#define __FLT_EVAL_METHOD__ 0
#define __FP_FAST_FMA 1
```

`__FP_FAST_FMA 1` tells the reader the target has a fused multiply-add instruction, so contraction can change results. The fingerprint stores it.

---

## Exit Criteria

DONE when one JSON record per machine holds every listed fact and its own content hash.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `compile_commands.json` | **Adjust**: reconfigure with `-DCMAKE_EXPORT_COMPILE_COMMANDS=ON`; for non-CMake builds use `bear -- make` to capture compile lines. |
| Phase 1 | `msvc` selected and no `-dM` equivalent | **Adjust**: record `/fp:` and `/arch:` flags from the compile lines instead of macros. |
| Phase 2 | `show_runtime` missing | **Adjust**: record `show_config()` only and note the NumPy version is older than 1.24. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
