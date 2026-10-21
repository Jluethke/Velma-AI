# Sanitizers in Host Test Builds

**One-line description:** Runs the host unit and integration tests under AddressSanitizer plus UndefinedBehaviorSanitizer (and separately MemorySanitizer or ThreadSanitizer where they apply) with fail-fast options, reads each report to its source line, and keeps sanitizers out of the target image.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `build_profiles` (object, required): From `sccpp-cmake-build-profiles`; the sanitizer profile directory.
- `test_command` (string, required): Command that runs all host tests, for example `ctest --test-dir build/sanitizer --output-on-failure`.
- `stack` (string, required): "gcc" or "clang"; selects which extra sanitizers are available.

---

## Outputs

- `sanitizer_report` (object): Compiler and version, flags and runtime options per run, every report (sanitizer, error kind, file, line, test name), its classification, and the final run results.

---

## Phase 1: Configure Sanitizer Runs

### Entry Criteria
- The sanitizer profile in `build_profiles` exists and is separate from target and coverage profiles.

### Actions
1. Base run (GCC or Clang): compile and link flags `-fsanitize=address,undefined -fno-sanitize-recover=all -fno-omit-frame-pointer -g -O1`.
2. Clang only, add to a second run: `-fsanitize=unsigned-integer-overflow,implicit-conversion,local-bounds` (confirm each name in the Clang UndefinedBehaviorSanitizer documentation for your version; unsigned overflow is defined behavior in C and C++, so hits need judgment, see Phase 3).
3. Separate runs, never combined with ASan: ThreadSanitizer `-fsanitize=thread` only if host tests run multiple threads; MemorySanitizer `-fsanitize=memory` (Clang, Linux x86_64, needs all linked code instrumented) only if uninitialized reads are suspected and the dependency set can be rebuilt.
4. Runtime options for every run:
   - `ASAN_OPTIONS=detect_leaks=1:abort_on_error=1:detect_stack_use_after_return=1:strict_string_checks=1`
   - `UBSAN_OPTIONS=print_stacktrace=1:halt_on_error=1`
5. These flags apply to host builds only. Sanitizer runtimes do not exist for bare metal MCU targets in the standard toolchains.

### Output
Configured sanitizer build directories and environment.

### Quality Gate
- `grep -c -- "-fsanitize" build/target/compile_commands.json` prints 0.
- `grep -c -- "-fsanitize=address,undefined" build/sanitizer/compile_commands.json` equals the number of entries in that file.

---

## Phase 2: Run and Collect Reports

### Entry Criteria
- Sanitizer build succeeded.

### Actions
1. Run `test_command` with the runtime options exported; tee output to `build/sanitizer/san.log`.
2. Extract reports: `grep -nE "ERROR: AddressSanitizer|ERROR: LeakSanitizer|runtime error:|WARNING: ThreadSanitizer|WARNING: MemorySanitizer" build/sanitizer/san.log`.
3. Read each report:

| Report text | Meaning | First frame to read |
|---|---|---|
| `heap-buffer-overflow`, `stack-buffer-overflow`, `global-buffer-overflow` | Read or write outside an object | Frame `#0` in project code; the "located N bytes after" line gives the object |
| `stack-use-after-return`, `stack-use-after-scope` | Pointer to a dead local used | Frame `#0` and the allocation frame |
| `runtime error: signed integer overflow` | UB in arithmetic | File:line printed before the message |
| `runtime error: shift exponent` | Shift by width or more | File:line |
| `runtime error: load of misaligned address` | Cast to a stricter-aligned pointer | File:line; check packed CAN frame structs |
| `detected memory leaks` | Leak in test or code | Allocation stack |

4. Record each report with the failing test name from CTest output.

### Output
Report list.

### Quality Gate
- The number of reports listed equals the grep count from step 2.

---

## Phase 3: Classify and Fix

### Entry Criteria
- Report list exists.

### Actions
1. Classify: production defect, test code defect, or intended behavior (only for Clang's unsigned overflow and implicit conversion checks, where wrap is documented by a requirement or comment).
2. Fix one defect at a time; rerun the full suite after each.
3. For intended unsigned wrap, add `__attribute__((no_sanitize("unsigned-integer-overflow")))` on that function only, with a comment citing the requirement; never disable sanitizers for whole files or the whole build.
4. Never suppress an ASan or signed overflow report.
5. Final run: all runs exit 0 with no reports.

### Output
`sanitizer_report`.

### Quality Gate
- Final run of `test_command` exits 0 and `grep -cE "ERROR: AddressSanitizer|runtime error:" build/sanitizer/san.log` prints 0.
- Every `no_sanitize` attribute in source is listed with its requirement citation.

---

## Worked Example

Illustrative only. CAN gateway signal unpacker tests with GCC 13.

```
src/can_unpack.c:72:18: runtime error: load of misaligned address 0x602000000011 for type 'uint32_t', which requires 4 byte alignment
    #0 0x55d1 in can_unpack_u32 src/can_unpack.c:72
    #1 0x55f9 in test_REQ_CAN_004_unpack_offset_1 test/test_can.c:40
```

The unpacker cast `&frame->data[1]` to `uint32_t *`. Fixed with byte-wise assembly `(uint32_t)d[1] | ((uint32_t)d[2] << 8) | ...`; rerun shows 0 reports. On the Cortex-M0 target this same cast would have caused a HardFault.

---

## Exit Criteria

DONE when all applicable sanitizer runs finish with zero reports, every former report is fixed or documented as intended unsigned wrap at function scope, and the target build has no sanitizer flags.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Linker cannot find `libasan` or `libubsan` | **Adjust**: install the compiler's sanitizer runtime or run with Clang; record the change. |
| Phase 2 | ASan reports in a vendor stub only used by tests | **Adjust**: fix the stub; it is test code but its bugs hide real results. |
| Phase 2 | MSan reports in uninstrumented libraries | **Adjust**: rebuild the libraries with MSan or drop the MSan run and record why. |
| Phase 3 | User asks to add a suppressions file to pass | **Stop**: suppressions hide defects; fix the cause or document intended unsigned wrap per function. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
