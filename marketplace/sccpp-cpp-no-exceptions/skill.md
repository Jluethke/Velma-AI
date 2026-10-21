# C++: Error Handling Without Exceptions

**One-line description:** Builds C++ ECU code with -fno-exceptions, finds every standard library call that would otherwise throw and now terminates, and moves error reporting to [[nodiscard]] status or result types (std::expected where C++23 is available) with tested error paths.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `codebase_dir` (string, required): Source tree root of the C++ code base.
- `build_profiles` (object, required): From `sccpp-cmake-build-profiles`; target and host-test flags.
- `check_classification` (object[], required): From `sccpp-defensive-vs-assert`; the release defensive checks whose reactions return errors.

---

## Outputs

- `cpp_error_report` (object): Exception policy recorded for the project, throw and try sites removed, standard library calls that terminate on error and their replacements, the result type adopted, and the build and test results.

---

## Phase 1: Record the Policy and Find Exception Use

### Entry Criteria
- C++ code base builds in host-test.

### Actions
1. Read the project decision on exceptions. MISRA C++:2023 and AUTOSAR C++14 permit exceptions under rules; disabling them is a project choice. If no decision exists, record an open question and continue only after the user confirms "no exceptions".
2. Check the target flags: `grep -c -- "-fno-exceptions" build/target/compile_commands.json`.
3. Find uses: `grep -rnE "\bthrow\b|\btry\b|\bcatch\b|noexcept\(false\)" src include`.
4. Find standard library calls that report errors by throwing: `.at(`, `std::stoi`, `std::stol`, `std::stoul`, `std::stof`, `new` (non-nothrow), `std::bad_optional_access` via `.value()` on `std::optional`, `std::get` on `std::variant`. `grep -rnE "\.at\(|std::sto[a-z]+|\.value\(\)|std::get<" src`.
5. With `-fno-exceptions`, GCC's libstdc++ calls `std::abort()` (through its throw helpers) where it would throw; the error is no longer recoverable by the caller. Record each such call as needing replacement.

### Output
Policy record and site list.

### Quality Gate
- Policy is recorded with the user's confirmation text, or as an open question.
- All three searches have saved output.

---

## Phase 2: Choose the Result Type

### Entry Criteria
- Policy is "no exceptions".

### Actions
1. Select with this table:

| Build standard | Library support (`__cpp_lib_expected`) | Result type |
|---|---|---|
| C++23 or later | defined | `std::expected<T, ErrorCode>` |
| C++17 or C++20 | not defined | Project `Result<T, E>` class with `[[nodiscard]]` on the class, or status enum plus output reference |
| Any | Project already has a result type | Keep it |

2. Mark the result type and all status-returning functions `[[nodiscard]]` (C++17). Build with `-Werror=unused-result`; Clang reports ignored `[[nodiscard]]` under `-Wunused-result` too.
3. Error code type: a scoped enum `enum class WssError : uint8_t { kRange, kTimeout, kParam };`.
4. Mark functions that cannot fail `noexcept`.

### Output
Chosen type and header changes.

### Quality Gate
- `__cpp_lib_expected` check output is recorded (compile a file with `#include <expected>` and `#ifdef __cpp_lib_expected`).

---

## Phase 3: Convert and Test

### Entry Criteria
- Result type chosen.

### Actions
1. Replace each `throw` with returning an error value; remove `try`/`catch` blocks by checking results at the call.
2. Replace terminating library calls: `.at(i)` becomes an explicit index check then `operator[]`; `std::stoi` becomes `std::from_chars` (C++17, `<charconv>`, returns `std::from_chars_result` with an `ec` member, never throws); `optional.value()` becomes `has_value()` check then `*opt`; `std::get<T>(v)` becomes `std::get_if<T>(&v)`.
3. Add `-fno-exceptions` to host-test as well, so tests exercise the same behavior as the target.
4. For each converted function add tests for every error code value.
5. One file at a time; rebuild and test after each.

### Output
`cpp_error_report`.

### Quality Gate
- `grep -rnE "\bthrow\b|\btry\b|\bcatch\b" src include` returns 0 lines.
- Host-test build with `-fno-exceptions -Werror=unused-result` exits 0 and `ctest` passes.
- `arm-none-eabi-nm -C build/target/app.elf | grep -c "__cxa_throw"` is 0, or each remaining reference is traced to a library call listed in the report.

---

## Worked Example

Illustrative only. Tire pressure decoder in C++17 parsing a calibration string.

```
src/tpms_cal.cpp:31:  int thr = std::stoi(field);   // throws std::invalid_argument
```

Replaced with `std::from_chars(field.data(), field.data() + field.size(), thr)`; on `ec != std::errc{}` the function returns `TpmsError::kCalFormat`. Tests for empty string, non-digit and out-of-range input each check the returned error. `nm -C` on the target image shows no `__cxa_throw`.

---

## Exit Criteria

DONE when the no-exceptions policy is recorded, no throw, try or catch remains, terminating library calls are replaced, every error path returns a checked value, and tests pass with -fno-exceptions.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Project keeps exceptions | **Return**: this flow does not apply; record the policy and skip. |
| Phase 2 | No C++23 library | **Adjust**: use the project `Result` row of the table. |
| Phase 3 | Third-party library throws | **Adjust**: wrap calls behind a boundary built with exceptions enabled in a separate unit, or replace the library; record the choice as an open question if neither is possible. |
| Phase 3 | `__cxa_throw` still linked | **Adjust**: find the caller with the linker map `--cref` and replace it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
