# C++: Checked Integer Arithmetic and Conversions

**One-line description:** Replaces unchecked C++ arithmetic and narrowing at range-risk sites with checked helpers built on __builtin_*_overflow, std::in_range and std::cmp_* comparisons, or C++26 saturation functions where the standard library provides them, with tests at every boundary.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `codebase_dir` (string, required): Source tree root of the C++ code base.
- `type_audit` (object, required): From `sccpp-fixed-width-types`; arithmetic and conversion sites that can exceed their range.

---

## Outputs

- `cpp_overflow_fixes` (object[]): Per site: file, line, operation, operand ranges and source, chosen handling, the helper used, and the boundary tests added.

---

## Phase 1: Confirm Available Facilities

### Entry Criteria
- `type_audit` lists sites (empty list means emit empty output and stop).
- The `-std=` value of the build is known.

### Actions
1. Check what the toolchain provides with a test translation unit compiled by the project compiler:
   - `std::in_range`, `std::cmp_less` and friends in `<utility>`: C++20; check `__cpp_lib_integer_comparison_functions`.
   - Saturation functions `std::add_sat`, `std::sub_sat`, `std::mul_sat`, `std::saturate_cast` in `<numeric>`: C++26; check `__cpp_lib_saturation_arithmetic`.
   - `__builtin_add_overflow`, `__builtin_sub_overflow`, `__builtin_mul_overflow`: GCC and Clang, any standard mode.
2. Compile the check: `printf '#include <utility>\n#include <numeric>\n#ifdef __cpp_lib_saturation_arithmetic\n#warning sat_yes\n#endif\n' | g++ -std=<std> -x c++ -fsyntax-only -` and read whether the warning prints. Repeat for each macro.
3. Record which facilities exist. Never call a function the check did not confirm.

### Output
Facility table.

### Quality Gate
- Facility table entries each cite the compile check output.

---

## Phase 2: Write One Checked Helper Set

### Entry Criteria
- Facility table exists.

### Actions
1. Create a single header (for example `include/checked_int.hpp`) with `constexpr` helpers so every site uses the same code:
   - `[[nodiscard]] constexpr bool checked_add(T a, T b, T& out) noexcept { return !__builtin_add_overflow(a, b, &out); }` (and sub, mul).
   - `template <class To, class From> [[nodiscard]] constexpr bool checked_narrow(From v, To& out) noexcept` using `std::in_range<To>(v)` when available, else an explicit comparison against `std::numeric_limits<To>::min()` and `max()` done in a type wide enough for both.
   - Saturating forms only if the requirement asks for saturation; wrap `std::add_sat` when available, else build from `checked_add`.
2. Add `static_assert(std::is_integral_v<T>)` in each template.
3. Unit test the helper itself first at minimum, maximum and one past for `int8_t`, `uint8_t`, `int32_t`, `uint32_t`, `int64_t`.

### Output
Helper header with passing tests.

### Quality Gate
- Helper tests pass: `ctest --test-dir build/host-test -R checked_int` exits 0.
- The helper header compiles with `-Wall -Wextra -Wconversion -Wsign-conversion -Werror`.

---

## Phase 3: Apply at Each Site

### Entry Criteria
- Helper tested.

### Actions
1. For each site pick handling from the requirement (saturate, error status, intended wrap). If the requirement is silent, record an open question.
2. Replace the expression with the helper; handle the `false` return explicitly. Because helpers are `[[nodiscard]]`, ignoring the result is a compile warning.
3. Replace narrowing `static_cast<uint8_t>(x)` with `checked_narrow` unless the range is already proven at that line; record the proof when keeping the cast.
4. Replace signed and unsigned comparisons (`if (i < v.size())` with signed `i`) with `std::cmp_less(i, v.size())` when available.
5. Add the five boundary tests per site; run them in the sanitizer profile with `-fsanitize=undefined -fno-sanitize-recover=all`.
6. One file at a time; rebuild and test after each.

### Output
`cpp_overflow_fixes`.

### Quality Gate
- `ctest --test-dir build/sanitizer` exits 0 with no `runtime error:` lines.
- `grep -rn "static_cast<u\?int[0-9]*_t>" <changed files>` hits each have a recorded range proof.

---

## Worked Example

Illustrative only. Fuel level filter in C++17 (no `std::in_range`, no saturation functions per the Phase 1 check).

```
src/fuel_filter.cpp:47:  level_pct_ = static_cast<uint8_t>(sum / count);
```

`sum / count` can reach 255 only if inputs exceed 100; the requirement defines a sensor fault for that case. Replaced with `if (!checked_narrow(sum / count, level_pct_)) { status = FuelStatus::kRangeFault; }`. Tests at 99, 100, 101, 255, 256 pass under UBSan.

---

## Exit Criteria

DONE when every site uses the tested helper or has a recorded range proof, every handling traces to a requirement or an open question, and boundary tests pass under UBSan.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Compiler is not GCC or Clang and lacks builtins | **Adjust**: implement helpers with explicit precondition comparisons; test identically. |
| Phase 2 | Helper template instantiation fails for `bool` or `char` types | **Adjust**: exclude them with `static_assert` and handle those sites by hand. |
| Phase 3 | Range unknown | **Stop**: record an open question. |
| Phase 3 | Many sites in one file | **Adjust**: still change and test one function at a time. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
