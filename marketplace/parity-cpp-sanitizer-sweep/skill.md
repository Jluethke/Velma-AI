# Parity C++ Sanitizer Sweep

**One-line description:** Runs the C++ port harness on every golden vector under AddressSanitizer, UndefinedBehaviorSanitizer with the float checks it leaves out by default, and MemorySanitizer or Valgrind, because uninitialized reads and undefined behavior make results change across compilers and architectures.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `port_repo` (string, required): Path to the C++ port.
- `golden_manifest` (string, required): Output of `parity-golden-manifest-lock`.
- `compiler` (string, required): `gcc` or `clang` (MSVC supports only AddressSanitizer through `/fsanitize=address`).
- `fp_flags` (string[], required): Output of `parity-fp-flag-baseline`.

---

## Outputs

- `sanitizer_findings` (object[]): Each sanitizer report with sanitizer name, error kind, source location, and the golden case id that triggered it.

---

## Phase 1: ASan and UBSan Build

### Entry Criteria
- The harness builds normally.

### Actions
1. Configure a separate build directory so production flags stay untouched: `cmake -S . -B build-asan -DCMAKE_BUILD_TYPE=RelWithDebInfo -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined -fsanitize=float-divide-by-zero -fsanitize=float-cast-overflow -fno-omit-frame-pointer -fno-sanitize-recover=all"`. GCC and Clang both document that `float-divide-by-zero` is not enabled by `-fsanitize=undefined`.
2. Keep `fp_flags` in this build as well, so the arithmetic matches production as closely as possible.
3. Run every golden file: `UBSAN_OPTIONS=print_stacktrace=1 ./build-asan/parity_harness <entry> golden/<entry>.jsonl /dev/null`.
4. `-fsanitize=float-divide-by-zero` reports every floating division by zero, including intended ones that produce infinity. Classify each: intended (the reference also divides by zero there and the contract has infinity in scope) or defect.
5. Record each report with the case id. The harness echoes case ids; print the current id to stderr before each case to map reports.

### Output
ASan and UBSan findings.

### Quality Gate
- Every golden file ran to completion or its first error is recorded.
- Every `runtime error:` line in the logs appears in the findings.

---

## Phase 2: Uninitialized Reads

### Entry Criteria
- Phase 1 complete.

### Actions
1. If `compiler` is `clang` on Linux, build with MemorySanitizer: `-fsanitize=memory -fsanitize-memory-track-origins -fno-omit-frame-pointer`. MSan needs every linked C++ library instrumented, including the standard library; the Clang MSan documentation describes building an instrumented libc++. Without it, expect false reports from uninstrumented code.
2. Otherwise run the normal (non-sanitized) harness under Valgrind: `valgrind --tool=memcheck --track-origins=yes --error-exitcode=1 ./build/parity_harness <entry> golden/<entry>.jsonl /dev/null`. Find its uninitialized-value reports with `grep -E "depends on uninit|Use of uninit"` on the log (Valgrind prints these messages with British spelling, so match the prefix).
3. An uninitialized `double` used in arithmetic is the most common cause of results that differ between `-O0` and `-O2`, or between x86_64 and aarch64, with no float flag explanation.
4. Emit `sanitizer_findings`.

### Output
`sanitizer_findings`.

### Quality Gate
- MSan or Valgrind ran on every golden file, and its exit code is recorded.
- Valgrind's `ERROR SUMMARY: 0 errors` line, or MSan's clean exit, is present for a passing run.

---

## Worked Example

Illustrative.

```
$ ./build-asan/parity_harness lowpass_step golden/lowpass_step.jsonl /dev/null
src/lp.cpp:31:18: runtime error: division by zero
case=4410
$ valgrind --track-origins=yes --error-exitcode=1 ./build/parity_harness lowpass_step golden/lowpass_step.jsonl /dev/null 2> vg.log
$ grep -cE "depends on uninit|Use of uninit" vg.log
1
$ grep -A2 "depends on uninit" vg.log | grep " at "
==2211==    at lp::step(double, std::array<double, 2ul>&) (lp.cpp:27)
$ grep "ERROR SUMMARY" vg.log
==2211== ERROR SUMMARY: 1 errors from 1 contexts
```

Findings: an intended divide by zero at `lp.cpp:31` (reference does the same; infinity in scope) and a defect at `lp.cpp:27`, a local `double` read before assignment on the first call.

---

## Exit Criteria

DONE when all golden vectors ran under ASan plus UBSan and under MSan or Valgrind, and every report is recorded with its case id and classification.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Sanitizer runtime missing at link | **Retry**: install the compiler's sanitizer runtime package (for GCC on Debian or Ubuntu, `libasan` and `libubsan` versions matching the compiler). |
| Phase 2 | MSan reports inside uninstrumented libraries | **Adjust**: switch to Valgrind for this run and record why. |
| Phase 2 | Weak model initializes the variable to zero to silence the report | **Stop**: initialize it to what the reference uses at that point, and confirm by the golden comparison. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
