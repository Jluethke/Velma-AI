# Fixed-Width Integer Types and Promotion Audit

**One-line description:** Replaces basic numeric types with fixed-width types from stdint.h or cstdint in safety-relevant interfaces and finds every expression where integer promotion, signedness or plain char changes the result on the target, using the target's real type sizes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `codebase_dir` (string, required): Source tree root.
- `build_profiles` (object, required): From `sccpp-cmake-build-profiles`; target compiler and flags.
- `language` (string, required): "c" or "cpp".

---

## Outputs

- `type_audit` (object): Target type sizes and char signedness as read from the compiler, every basic-type use in interfaces with its replacement, every promotion or signedness hazard found with the expression and the corrected form, and the arithmetic sites handed to the overflow flows.

---

## Phase 1: Read the Target's Real Type Model

### Entry Criteria
- Target compiler available (cross compiler if a target profile exists).

### Actions
1. Dump predefined macros with the target flags: `arm-none-eabi-gcc <target -mcpu/-mfloat-abi flags> -dM -E -x c /dev/null | grep -E "__SIZEOF_(INT|LONG|SHORT|POINTER|LONG_LONG)__|__CHAR_UNSIGNED__|__INT_WIDTH__"`. For Clang use `clang --target=<triple> -dM -E -x c /dev/null`.
2. Record `sizeof(int)`, `sizeof(long)`, pointer size, and whether `__CHAR_UNSIGNED__` is defined (plain `char` is unsigned on many ARM ABIs and signed on x86). Record both the target and host values.
3. If host and target differ in `int` size or char signedness, every host unit test result involving those types is suspect. Add `-funsigned-char` or `-fsigned-char` to the host-test profile to match the target, and record it.

### Output
Target and host type tables.

### Quality Gate
- Type table values come from the `-dM -E` output pasted in the report.
- Host-test char signedness matches the target (check `-dM -E` with host-test flags).

---

## Phase 2: Replace Basic Types in Interfaces

### Entry Criteria
- Type tables recorded.

### Actions
1. Find basic types: `grep -rnE "\b(unsigned |signed )?(char|short|int|long)\b" src include --include=*.h --include=*.hpp`. Interfaces (headers) first; then module-internal code.
2. Replace with the fixed-width type matching the value range from the requirement or the signal definition: `uint8_t`, `int16_t`, `uint32_t`, and so on. This follows MISRA C:2012 Directive 4.6 (typedefs indicating size and signedness should be used in place of basic numerical types).
3. Keep plain `char` only for character text. Never use plain `char` for numeric data.
4. Do not change `int` used where the standard library or a vendor API requires `int` (for example `main` return, `errno`); record each exception.
5. One header at a time; rebuild host-test and target after each header, run tests.

### Output
Updated interfaces with build and test results.

### Quality Gate
- Target and host-test builds both exit 0 after each header change.
- `ctest --test-dir build/host-test` exits 0 after each header change.

---

## Phase 3: Find Promotion and Signedness Hazards

### Entry Criteria
- Interfaces updated.

### Actions
1. Rebuild with `-Wconversion -Wsign-conversion` (GCC or Clang) and, for C, run the Cppcheck MISRA addon for Rules 10.1 to 10.8 (essential type model). Collect hits.
2. Check every arithmetic expression on types narrower than `int` with these rules:

| Pattern | Hazard on 32-bit `int` | Corrected form |
|---|---|---|
| `uint16_t a, b; uint32_t p = a * b;` | Both promote to signed `int`; 65535 * 65535 exceeds `INT_MAX`, signed overflow is undefined behavior | `uint32_t p = (uint32_t)a * (uint32_t)b;` |
| `uint8_t x = ~mask;` then compare | `~` on promoted `int` sets high bits; comparison with `uint8_t` fails | `uint8_t x = (uint8_t)(~mask);` |
| `uint8_t s = 200u; s << 4` | Result is `int`, then truncated on store | Cast to the wider unsigned type before shifting and check the range |
| `int32_t e = -1; if (e < sizeof buf)` | `e` converts to unsigned, comparison false | Compare after checking `e >= 0`, or cast `sizeof` to a signed type with a known range |
| Mixed `float` and integer division | Integer division happens first | Convert one operand to the floating type before dividing |

3. Write each hazard with file, line, current expression, corrected expression. Send arithmetic that can exceed its type range to `sccpp-c-overflow-checks` or `sccpp-cpp-overflow-checks` in `type_audit`.
4. Do NOT add casts only to silence `-Wconversion`. A cast is correct only when the value range is shown to fit; otherwise it hides truncation.

### Output
`type_audit`.

### Quality Gate
- Every `-Wconversion` and `-Wsign-conversion` hit is either corrected with a range justification or handed to an overflow flow.
- Every corrected expression has a unit test at the range boundary that passes.

---

## Worked Example

Illustrative only. Wheel speed scaling on Cortex-M (`__SIZEOF_INT__` 4, `__CHAR_UNSIGNED__` 1); host x86_64 had signed char, so `-funsigned-char` is added to host-test.

```
src/wss_scale.c:31:  uint32_t ticks_scaled = raw_ticks * scale_num;  /* both uint16_t */
```

Promotion to `int` can overflow for `raw_ticks` 65535 and `scale_num` 40000. Corrected to `(uint32_t)raw_ticks * (uint32_t)scale_num`; boundary test with both operands at 65535 passes and matches 4294836225u.

---

## Exit Criteria

DONE when the target type model is recorded, interfaces use fixed-width types, host and target char signedness match, and every promotion or signedness hazard is corrected with a boundary test or handed to an overflow flow.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No cross compiler available | **Adjust**: read type sizes from the target ABI document (for ARM, the AAPCS) and record the citation. |
| Phase 2 | Changing a type breaks a vendor API call | **Adjust**: keep the vendor type at the call boundary and convert with a checked conversion. |
| Phase 3 | Hundreds of conversion hits | **Adjust**: process one file at a time, starting with files in the safety-relevant module list. |
| Phase 3 | Range of a value is unknown | **Stop**: record an open question; do not cast until the range is known. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
