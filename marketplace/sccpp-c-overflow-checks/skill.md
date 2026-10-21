# C: Integer Overflow, Wrap and Division Checks

**One-line description:** Adds explicit overflow handling to C arithmetic that can exceed its type range, using precondition checks, the GCC and Clang __builtin_*_overflow functions or C23 ckd_* macros, with a defined result (saturate or error status) chosen from the requirement.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `codebase_dir` (string, required): Source tree root of the C code base.
- `type_audit` (object, required): From `sccpp-fixed-width-types`; the arithmetic sites that can exceed their range.

---

## Outputs

- `c_overflow_fixes` (object[]): Per site: file, line, operation, operand ranges and their source, the chosen handling (saturate, error status, wrap is intended), the code change, and the boundary tests added.

---

## Phase 1: Classify Each Site

### Entry Criteria
- `type_audit` lists arithmetic sites (empty list means emit empty output and stop).

### Actions
1. For each site, record the operand types and the operand ranges with their source (signal definition, requirement, previous check in the same function).
2. Classify the risk with the CERT C rules:

| Operation | Type | Risk | CERT C rule |
|---|---|---|---|
| `+ - *` | signed | Overflow is undefined behavior; the compiler may delete checks written after the fact | INT32-C |
| `+ - *` | unsigned | Wraps modulo 2^N (defined) but usually a logic error in physical quantities | INT30-C |
| `/ %` | any | Division by zero; also `INT_MIN / -1` for signed | INT33-C, INT32-C |
| `<< >>` | any | Shift by negative or by width or more is undefined; left shift of negative signed value | INT34-C |
| conversion | narrowing | Value change on store | INT31-C |

3. If the ranges prove the operation cannot exceed the type (for example two `uint8_t` added into `uint16_t`), record the proof and mark "no change".

### Output
Classified site list.

### Quality Gate
- Every site has operand ranges with a cited source, or an open question.

---

## Phase 2: Choose and Apply the Handling

### Entry Criteria
- Sites classified.

### Actions
1. Choose the handling from the requirement for that signal. If the requirement does not say, record an open question; do not choose silently.

| Requirement says | Handling |
|---|---|
| Value must stay at the limit (for example a counter or a scaled physical value displayed to the driver) | Saturate to the type maximum or minimum |
| Out-of-range value is a fault | Return an error status, keep the previous valid value, report a diagnostic |
| Modulo behavior is intended (rolling counters, CRC, timestamps) | Use an unsigned type, comment that wrap is intended, add a test across the wrap point |

2. Implement checks with one of these forms. Confirm the compiler supports the chosen form first:
   - GCC 5+ and Clang: `if (__builtin_add_overflow(a, b, &r)) { /* handle */ }`; also `__builtin_sub_overflow`, `__builtin_mul_overflow`. They return true on overflow and store the wrapped result.
   - C23 compilers: `#include <stdckdint.h>` then `if (ckd_add(&r, a, b)) { ... }`. Check with `echo '#include <stdckdint.h>' | gcc -std=c2x -x c -fsyntax-only -` before using.
   - Portable precondition, signed add: `if (((b > 0) && (a > (INT32_MAX - b))) || ((b < 0) && (a < (INT32_MIN - b)))) { ... }`.
   - Division: `if ((d == 0) || ((n == INT32_MIN) && (d == -1))) { ... }`.
3. Never write a post-check like `if (a + b < a)` for signed types; the overflow already happened and the compiler can remove the check.
4. Edit one function at a time, rebuild, run tests.

### Output
Updated code per site.

### Quality Gate
- Host-test build with `-Wall -Wextra -Werror=conversion` exits 0 for every changed file.
- `grep -nE "if \(.*\+.*<" <changed files>` finds no signed post-check patterns.

---

## Phase 3: Boundary Tests and Sanitizer Proof

### Entry Criteria
- Code updated.

### Actions
1. For each site add unit tests at: minimum, minimum plus one, maximum minus one, maximum, and the first value past the limit. For division, add zero and `INT_MIN / -1`.
2. Run the tests in the sanitizer profile with `-fsanitize=undefined -fno-sanitize-recover=all` (signed overflow, shift and division are reported). With Clang also add `-fsanitize=unsigned-integer-overflow` to find unintended unsigned wraps; intended wraps are then annotated or excluded per site with a recorded reason.
3. Record each test name in `c_overflow_fixes`.

### Output
`c_overflow_fixes`.

### Quality Gate
- `ctest --test-dir build/sanitizer` exits 0 and the output contains no `runtime error:` lines.
- Every site has at least the five boundary tests, or the "no change" proof.

---

## Worked Example

Illustrative only. Odometer increment `int32_t` distance accumulator.

```
src/odo.c:58:  odo_total_m = odo_total_m + delta_m;   /* int32_t */
```

Requirement: odometer saturates at its maximum. Change:

```
int32_t sum;
if (__builtin_add_overflow(odo_total_m, delta_m, &sum)) { sum = INT32_MAX; }
odo_total_m = sum;
```

Tests `odo_add_at_max_saturates` and four neighbors pass in the sanitizer build with no `runtime error:` output.

---

## Exit Criteria

DONE when every site from `type_audit` has a proof of no overflow, a handling chosen from its requirement, or an open question, and all boundary tests pass under UBSan.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Operand range unknown | **Stop**: record an open question for that site. |
| Phase 2 | Compiler lacks `__builtin_*_overflow` | **Adjust**: use the portable precondition form. |
| Phase 2 | Requirement silent on overflow behavior | **Return**: send the question to the requirement owner; leave the site open. |
| Phase 3 | UBSan reports an error in unchanged code | **Adjust**: add the site to the list and handle it in this flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
