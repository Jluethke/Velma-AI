# C++ Range and Rate Checker

**One-line description:** Implements a header-plus-source C++17 range and rate-of-change checker with `std::isfinite` guards and no clamping, builds it with CMake and GoogleTest through `FetchContent`, and runs the tests a second time under AddressSanitizer and UndefinedBehaviorSanitizer.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `operating_envelope` (object[], required): Output of `rmon-envelope-from-requirements`.
- `repo_dir` (string, required): Monitor repository root with a top-level `CMakeLists.txt` or an empty directory.

---

## Outputs

- `cpp_range_rate_checker` (object): Paths (`include/monitor/range_rate.hpp`, `src/range_rate.cpp`, `tests/range_rate_test.cpp`), the `ctest` summary for the plain and sanitizer builds, compiler and version.

---

## Phase 1: Implement

### Entry Criteria
- `cmake --version` prints 3.14 or newer (needed for `FetchContent_MakeAvailable`).
- A C++17 compiler: `g++ --version` or `clang++ --version`.

### Actions
1. Create `include/monitor/range_rate.hpp`:
   ```cpp
   #pragma once
   #include <cstdint>
   #include <optional>
   namespace monitor {
   enum class Verdict { Pass, Fail, InvalidInput };
   struct Bound { double lo; double hi; std::optional<double> max_rate_per_s; };
   class RangeRateChecker {
    public:
     explicit RangeRateChecker(Bound b) : b_(b) {}
     Verdict check(double value, std::int64_t t_ns);
    private:
     Bound b_;
     bool has_prev_ = false;
     double prev_v_ = 0.0;
     std::int64_t prev_t_ = 0;
   };
   }  // namespace monitor
   ```
2. Create `src/range_rate.cpp`:
   ```cpp
   #include "monitor/range_rate.hpp"
   #include <cmath>
   namespace monitor {
   Verdict RangeRateChecker::check(double v, std::int64_t t_ns) {
     if (!std::isfinite(v)) return Verdict::InvalidInput;
     if (has_prev_ && t_ns <= prev_t_) return Verdict::InvalidInput;
     Verdict out = (v < b_.lo || v > b_.hi) ? Verdict::Fail : Verdict::Pass;
     if (out == Verdict::Pass && b_.max_rate_per_s && has_prev_) {
       const double dt = static_cast<double>(t_ns - prev_t_) * 1e-9;
       if (std::fabs(v - prev_v_) / dt > *b_.max_rate_per_s) out = Verdict::Fail;
     }
     has_prev_ = true; prev_v_ = v; prev_t_ = t_ns;
     return out;
   }
   }  // namespace monitor
   ```
3. Bounds are loaded at startup from `operating_envelope.json` (for example with nlohmann/json) or generated into a header by a build step from that file. Never type bound numbers into C++ source by hand.
4. Note on `-ffast-math`: it lets the compiler assume no NaN, which can delete the `std::isfinite` check. Do not use `-ffast-math` or `-Ofast` for monitor code.

### Output
Header and source files.

### Quality Gate
- `rg -n "ffast-math|Ofast" CMakeLists.txt` returns nothing.
- `rg -n "isfinite" src/range_rate.cpp` returns one line.

---

## Phase 2: GoogleTest Build

### Entry Criteria
- Files exist.

### Actions
1. Add to `CMakeLists.txt`:
   ```cmake
   cmake_minimum_required(VERSION 3.14)
   project(monitor CXX)
   set(CMAKE_CXX_STANDARD 17)
   set(CMAKE_CXX_STANDARD_REQUIRED ON)
   add_library(monitor src/range_rate.cpp)
   target_include_directories(monitor PUBLIC include)
   target_compile_options(monitor PRIVATE -Wall -Wextra -Wpedantic -Wconversion)
   include(FetchContent)
   FetchContent_Declare(googletest URL https://github.com/google/googletest/archive/refs/tags/v1.14.0.zip)
   FetchContent_MakeAvailable(googletest)
   enable_testing()
   add_executable(range_rate_test tests/range_rate_test.cpp)
   target_link_libraries(range_rate_test monitor GTest::gtest_main)
   include(GoogleTest)
   gtest_discover_tests(range_rate_test)
   ```
   Pin whichever GoogleTest release your project uses; the tag above is one published release.
2. Write tests: `lo` and `hi` pass; `std::nextafter(hi, INFINITY)` fails; `std::numeric_limits<double>::quiet_NaN()` and `infinity()` give `InvalidInput`; equal timestamps give `InvalidInput`; a rate step exactly at the limit passes and one `nextafter` above fails.
3. Build and run:
   ```
   cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
   cmake --build build -j
   ctest --test-dir build --output-on-failure
   ```

### Output
Passing plain build.

### Quality Gate
- `ctest` prints `100% tests passed`.
- The build log has zero warnings from `src/`: `cmake --build build 2>&1 | rg "src/.*warning"` returns nothing.

---

## Phase 3: Sanitizer Build

### Entry Criteria
- Plain build passes.

### Actions
1. Configure a second build directory:
   ```
   cmake -S . -B build-san -DCMAKE_BUILD_TYPE=Debug -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined -fno-omit-frame-pointer -fno-sanitize-recover=undefined"
   cmake --build build-san -j
   ctest --test-dir build-san --output-on-failure
   ```
2. `-fno-sanitize-recover=undefined` turns any UB report into a test failure instead of a printed warning.
3. On MSVC, AddressSanitizer is `/fsanitize=address` and UBSan is not available; record that the UB check was not run on that toolchain.

### Output
`cpp_range_rate_checker`.

### Quality Gate
- `ctest --test-dir build-san` prints `100% tests passed`.
- The sanitizer test output contains no `runtime error:` and no `ERROR: AddressSanitizer` lines.

---

## Worked Example

Illustrative only.
```
$ ctest --test-dir build --output-on-failure
    Start 1: RangeRate.PassesAtUpperBound
1/8 Test #1: RangeRate.PassesAtUpperBound .....   Passed    0.00 sec
...
100% tests passed, 0 tests failed out of 8
$ ctest --test-dir build-san --output-on-failure
100% tests passed, 0 tests failed out of 8
```

---

## Exit Criteria

DONE when the checker rejects non-finite input, never clamps, takes bounds only from the envelope file, and passes both the plain and sanitizer test runs.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `FetchContent` cannot download (offline) | **Adjust**: install the distro package (`libgtest-dev`) and use `find_package(GTest REQUIRED)`. |
| Phase 2 | `-Wconversion` warnings | **Retry**: fix with explicit `static_cast`; do not remove the flag. |
| Phase 3 | UBSan reports signed overflow on `t_ns - prev_t_` | **Retry**: validate monotonic time before subtracting. |

**Do not:** use `-ffast-math`, clamp values, silence sanitizer reports with suppressions, or delete failing tests.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
