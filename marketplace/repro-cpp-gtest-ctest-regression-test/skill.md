# C/C++ Failing Regression Test with GoogleTest or Catch2 under CTest

**One-line description:** Converts the minimal repro into one failing C or C++ test in the repo's framework (GoogleTest, Catch2 or a plain CTest executable), builds it with AddressSanitizer and UndefinedBehaviorSanitizer when the bug is memory or UB related, and confirms the red run with `ctest -R` and `--gtest_filter`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `minimal_repro` (object, required): Output of `repro-ddmin-minimize`.
- `minimal_input` (object, required): Output of `repro-ddmin-minimize`.
- `repo_path` (string, required): Absolute path to the local clone.

---

## Outputs

- `cpp_regression_test` (object): Test source path, test name, CMake changes (if any), configure, build and run commands with sanitizer flags, and the red run output. Empty when `stack` is not cpp.

---

## Phase 1: Identify Framework and Build

### Entry Criteria
- The project configures: `cmake -S . -B build-repro -DCMAKE_BUILD_TYPE=Debug` exits 0 (or the repo's documented configure command).

### Actions
1. Framework by evidence: `find_package(GTest` or `FetchContent_Declare(googletest` means GoogleTest; `Catch2` in CMake means Catch2; `add_test(` with plain executables means bare CTest; `meson.build` with `test(` means Meson (run with `meson test`).
2. Find the existing test target that covers the failing source file: search `CMakeLists.txt` under `test/` or `tests/` for the source's library target name.
3. Decide sanitizers from the bug:

| Symptom | Build flags (GCC/Clang) |
|---|---|
| SIGSEGV, heap corruption, `free(): invalid pointer`, wrong values that change between runs | `-fsanitize=address -fno-omit-frame-pointer -g` |
| Signed overflow, shift out of range, misaligned access, null deref suspicion | `-fsanitize=undefined -fno-sanitize-recover=undefined -g` (the second flag makes UB abort so the test fails instead of printing and continuing) |
| Data race | `-fsanitize=thread -g` (cannot combine with address) |
| Uninitialized read (Clang only) | `-fsanitize=memory -fno-omit-frame-pointer -g` (all linked code must be instrumented) |
| Plain logic error | No sanitizer |
| MSVC | `/fsanitize=address` only (Visual Studio 2019 16.9+) |

4. Pass flags at configure time without editing `CMakeLists.txt`: `cmake -S . -B build-repro -DCMAKE_BUILD_TYPE=Debug -DCMAKE_CXX_FLAGS="<flags>" -DCMAKE_C_FLAGS="<flags>" -DCMAKE_EXE_LINKER_FLAGS="<sanitize flags>"`.

### Output
Framework, target, sanitizer flags.

### Quality Gate
- `cmake --build build-repro --target <test target>` exits 0 before adding the test.

---

## Phase 2: Write the Test

### Entry Criteria
- Target known.

### Actions
1. Add the test to the existing test source for that unit. If a new source file is required, add it to the existing `add_executable` or `target_sources` list of the test target, which is the only build file change allowed.
2. GoogleTest: `TEST(CsvReader, ReadsHeaderWithBom) { ... }`; use `EXPECT_EQ(actual, expected)` for values, `ASSERT_*` when later lines would crash on failure, `EXPECT_THROW(stmt, ExcType)` for exceptions, `EXPECT_DEATH(stmt, "regex")` only for intended aborts. Catch2: `TEST_CASE("reads header with BOM", "[csv]") { REQUIRE(...); }`.
3. A crash is a valid red state: a test that segfaults or that ASan aborts fails under CTest. Do not wrap the call in a signal handler or `EXPECT_DEATH` to make it "fail cleanly"; the fix must make the plain call succeed.
4. Input data: inline as a string literal or `std::array<unsigned char, N>`; files via `std::filesystem::temp_directory_path()`.
5. Do not disable the test with a `DISABLED_` prefix or Catch2 `[.]` hidden tag.

### Output
Test source.

### Quality Gate
- `git diff --stat` lists only test sources and, at most, one line in the test target's source list.

---

## Phase 3: Confirm the Red Run

### Entry Criteria
- Test written.

### Actions
1. Build: `cmake --build build-repro --target <test target> -j`.
2. Run the single test:
   - GoogleTest directly: `./build-repro/<path>/<test binary> --gtest_filter='CsvReader.ReadsHeaderWithBom'`.
   - Through CTest: `ctest --test-dir build-repro -R 'ReadsHeaderWithBom' --output-on-failure` (works when tests are registered with `gtest_discover_tests`; `--test-dir` needs CMake 3.20+).
   - Catch2: `./build-repro/<binary> "reads header with BOM"`.
3. Set sanitizer options so reports are complete: `ASAN_OPTIONS=detect_leaks=1:abort_on_error=1`, `UBSAN_OPTIONS=print_stacktrace=1:halt_on_error=1`.
4. Read the output:
   - GoogleTest prints `[  FAILED  ] CsvReader.ReadsHeaderWithBom`.
   - ASan prints `ERROR: AddressSanitizer: heap-buffer-overflow on address ...` then `READ of size N` and a stack with file:line, then `SUMMARY: AddressSanitizer: ...`.
   - UBSan prints `runtime error: signed integer overflow: ...` with file:line.
   - CTest prints `0% tests passed, 1 tests failed` with `(Failed)`, `(SEGFAULT)` or `(Subprocess aborted)`.
5. The first in-project frame of the sanitizer report or crash must match the frame in `error_signature`, or show where the reported wrong value originates.

### Output
`cpp_regression_test` with red output.

### Quality Gate
- The run output contains `[  FAILED  ]`, a sanitizer `ERROR:` / `runtime error:` line, or CTest `1 tests failed`, for the new test only.
- No compiler or linker error appears in the build output.

---

## Worked Example

Illustrative only. GoogleTest, ASan.

```cpp
TEST(RingBuffer, PushPastCapacityWraps) {
  RingBuffer<int> rb(4);
  for (int i = 0; i < 5; ++i) rb.push(i);
  EXPECT_EQ(rb.front(), 1);
}
```

`cmake -S . -B build-repro -DCMAKE_BUILD_TYPE=Debug -DCMAKE_CXX_FLAGS="-fsanitize=address -fno-omit-frame-pointer -g" -DCMAKE_EXE_LINKER_FLAGS="-fsanitize=address"`, then `ctest --test-dir build-repro -R PushPastCapacityWraps --output-on-failure`:

```
==31337==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x602000000020
WRITE of size 4 at 0x602000000020 thread T0
    #0 0x55d1 in RingBuffer<int>::push(int const&) src/ring_buffer.hpp:41
0% tests passed, 1 tests failed out of 1
```

Red confirmed at the reported frame.

---

## Exit Criteria

DONE when one test fails (assertion, crash or sanitizer abort) at the reported location, built with the sanitizer that matches the symptom, and only test sources changed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Sanitizer link errors on Windows MinGW | **Adjust**: use Clang or MSVC `/fsanitize=address`, or a Linux container from `repro-container-env-replica`. |
| Phase 2 | Test needs a private member | **Adjust**: test through the public API with the minimal input; do not add `#define private public`. |
| Phase 3 | Test passes in Debug but bug is Release-only | **Adjust**: rebuild with `-DCMAKE_BUILD_TYPE=RelWithDebInfo` plus UBSan; optimization exposes UB that Debug hides. |
| Phase 3 | ctest prints `No tests were found` | **Retry**: rerun CMake configure so `gtest_discover_tests` registers the new test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
