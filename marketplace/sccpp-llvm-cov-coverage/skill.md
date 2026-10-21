# Clang Source-Based Coverage and MC/DC With llvm-cov

**One-line description:** Measures line, region, branch and MC/DC coverage of requirements-based tests with Clang source-based coverage (-fprofile-instr-generate -fcoverage-mapping -fcoverage-mcdc), merges raw profiles with llvm-profdata, and reads llvm-cov output to list every uncovered branch and every condition without an independence pair.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `build_profiles` (object, required): From `sccpp-cmake-build-profiles`; the Clang coverage profile.
- `test_command` (string, required): Command that runs the requirements-based tests.

---

## Outputs

- `llvm_coverage` (object): Clang and llvm-cov versions, flags, per-file line, region, branch and MC/DC percentages, uncovered items with file and line, MC/DC pairs not covered per decision, and report paths.

---

## Phase 1: Instrumented Build and Run

### Entry Criteria
- The coverage profile uses Clang (`clang --version` recorded) with `-fprofile-instr-generate -fcoverage-mapping`.

### Actions
1. For MC/DC add `-fcoverage-mcdc` (Clang 18 or newer). Confirm: `clang -fprofile-instr-generate -fcoverage-mapping -fcoverage-mcdc -x c -c /dev/null -o /dev/null` exits 0.
2. Clang limits the number of conditions per decision for MC/DC instrumentation; the limit and the option to change it differ by version. Read `clang --help` and the Clang source-based coverage documentation for your version, and record decisions the compiler warns it did not instrument.
3. Build, then run each test executable with a unique raw profile name: `LLVM_PROFILE_FILE="build/coverage/prof/%p-%m.profraw" <test_command>`. `%p` (process ID) and `%m` (module signature) keep runs from overwriting each other.
4. Merge: `llvm-profdata merge -sparse build/coverage/prof/*.profraw -o build/coverage/merged.profdata`. Use the `llvm-profdata` from the same LLVM release as the compiler.

### Output
`merged.profdata`.

### Quality Gate
- `ls build/coverage/prof/*.profraw | wc -l` is at least the number of test executables run.
- `llvm-profdata merge` exits 0.

---

## Phase 2: Report

### Entry Criteria
- Merged profile exists.

### Actions
1. Summary: `llvm-cov report <test_exe> -object <other_test_exe> -instr-profile=build/coverage/merged.profdata -ignore-filename-regex='(test|unity|gtest)/' -show-mcdc-summary`. Pass each additional test executable with `-object`.
2. Per-line detail: `llvm-cov show <test_exe> -object ... -instr-profile=... -show-branches=count -show-mcdc -show-line-counts-or-regions -format=html -output-dir=build/coverage/html src/`.
3. Export for tools: `llvm-cov export <test_exe> -instr-profile=... -format=lcov > build/coverage/cov.lcov` (or `-format=text` for JSON).
4. Check flags with `llvm-cov report --help` and `llvm-cov show --help`; MC/DC options exist only in versions that support `-fcoverage-mcdc`.

### Output
Summary, HTML and export files.

### Quality Gate
- Report lists every source file in scope; a missing file was never linked into a test executable.
- MC/DC columns are present in the summary when `-fcoverage-mcdc` was used.

---

## Phase 3: Read Uncovered Items

### Entry Criteria
- Reports exist.

### Actions
1. Branch lines in `llvm-cov show` look like `Branch (58:9): [True: 4, False: 0]`; a zero count means that outcome never occurred.
2. MC/DC sections list each decision with a truth table of executed test vectors and per condition `Condition C1 --> (1,3)` when an independence pair was found, or `Condition C2 --> not covered` when not. "MC/DC Coverage for Decision: 50.00%" summarizes the decision.
3. Region counts can show code inside a line that never ran (for example the right side of `a && b`) even when the line count is non-zero; read regions marked with `^0`.
4. List every uncovered branch outcome, region and MC/DC condition with file, line and decision text. Do not add tests here.

### Output
`llvm_coverage`.

### Quality Gate
- Every `[True: 0` or `False: 0]` branch and every "not covered" MC/DC condition in scope appears in the uncovered list.

---

## Worked Example

Illustrative only. Wheel speed module, Clang 18.

```
$ llvm-cov show build/coverage/wss_test -instr-profile=build/coverage/merged.profdata -show-mcdc src/wss.c
   58|      4|  if ((raw > WSS_RAW_MAX) || (sensor_fault != 0u)) {
  ------------------
  |---> MC/DC Decision Region (58:7) to (58:51)
  |  Condition C1 --> (58:8)
  |  Condition C2 --> (58:31)
  |  Executed MC/DC Test Vectors:
  |     C1, C2    Result
  |  1 { F,  F  = F      }
  |  2 { T,  -  = T      }
  |  C1-Pair: covered: (1,2)
  |  C2-Pair: not covered
  |  MC/DC Coverage for Decision: 50.00%
```

C2 needs a vector `{F, T = T}`: a test with raw in range and `sensor_fault` set.

---

## Exit Criteria

DONE when coverage was measured from fresh raw profiles of the requirements-based tests, reports exist, and every uncovered branch outcome, region and MC/DC condition is listed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `-fcoverage-mcdc` unknown | **Adjust**: record branch coverage only and an open question to move to a Clang release that supports MC/DC. |
| Phase 1 | Decision skipped for too many conditions | **Adjust**: record it; the gap flow decides whether to restructure the decision or analyze it by hand. |
| Phase 2 | `llvm-cov` reports "no coverage data found" | **Retry**: confirm the binary passed is the instrumented one and the profdata comes from the same build. |
| Phase 2 | Version mismatch between profile and llvm-cov | **Adjust**: use tools from the compiler's own LLVM install. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
