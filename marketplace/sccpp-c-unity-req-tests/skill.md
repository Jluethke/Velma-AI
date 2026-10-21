# C: Requirements-Based Unit Tests With Unity

**One-line description:** Derives unit test cases for C modules from requirement IDs using equivalence classes and boundary values, implements them in the Unity framework with hardware stubs, and produces a trace matrix from every requirement to its passing tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `requirements` (object[], required): Software unit requirements with ID, text, input ranges and expected behavior.
- `codebase_dir` (string, required): Source tree root of the C code base.
- `build_profiles` (object, required): From `sccpp-cmake-build-profiles`; the host-test profile.

---

## Outputs

- `c_unit_tests` (object): Test source files, the test runner registration, CTest names and the last run result per test.
- `c_trace_matrix` (object[]): Rows of requirement ID, test case names, derivation method (equivalence class, boundary value, error guessing, fault injection), and pass or fail.

---

## Phase 1: Derive Test Cases

### Entry Criteria
- Every requirement in scope has an ID and a stated input range or condition.

### Actions
1. For each requirement list its inputs and their ranges. Split each range into equivalence classes: valid, below minimum, above maximum, and special values named by the requirement.
2. For each boundary add cases at minimum, minimum minus one step, maximum, maximum plus one step. The step is the signal resolution from the requirement or signal definition.
3. Add fault injection cases for every error status the unit can receive from its dependencies (stub returns timeout, CRC error and so on).
4. These derivation methods are the ones ISO 26262-6:2018 lists for unit test case derivation (analysis of requirements, equivalence classes, boundary values, error guessing); cite the clause from the user's copy.
5. Name each case `test_<REQID>_<condition>_<expected>` with the ID made identifier-safe, for example `test_REQ_WSS_012_speed_above_max_reports_range_error`.
6. Requirements that cannot be tested at unit level (timing, integration) are listed with the reason and the test level that will cover them.

### Output
Test case table.

### Quality Gate
- Every requirement ID appears in at least one test case or in the not-unit-testable list with a reason.

---

## Phase 2: Implement in Unity

### Entry Criteria
- Unity sources available (`unity.c`, `unity.h`, `unity_internals.h` from ThrowTheSwitch Unity, vendored under `test/unity/` or fetched by CMake `FetchContent`).

### Actions
1. One test file per module: `test/test_wss.c`, with `setUp(void)` and `tearDown(void)` defined (Unity calls them around each test).
2. Replace hardware access with stubs: the module's register or driver header is substituted in the test build by a stub header with variables the test sets (for example `stub_adc_value`). CMock can generate mocks from headers; use it only if the project already uses it.
3. Use typed assertions that match the variable type: `TEST_ASSERT_EQUAL_UINT16`, `TEST_ASSERT_EQUAL_INT32`, `TEST_ASSERT_EQUAL_HEX32`, `TEST_ASSERT_EQUAL` (int). For status enums use `TEST_ASSERT_EQUAL_INT` with the enum value.
4. Runner: `int main(void) { UNITY_BEGIN(); RUN_TEST(test_REQ_WSS_012_speed_above_max_reports_range_error); return UNITY_END(); }`.
5. Register in CMake: `add_executable(test_wss test/test_wss.c src/wss.c test/stubs/adc_stub.c test/unity/unity.c)` and `add_test(NAME test_wss COMMAND test_wss)`.
6. Never weaken an assertion or delete a test to get green. A failing test is either a code defect or a test defect; record which with evidence.

### Output
Test sources and CMake registration.

### Quality Gate
- `cmake --build build/host-test` exits 0.
- Number of `RUN_TEST(` lines equals the number of test cases in the Phase 1 table.

---

## Phase 3: Run and Build the Trace Matrix

### Entry Criteria
- Tests build.

### Actions
1. Run `ctest --test-dir build/host-test --output-on-failure --output-junit unit.xml` (CTest 3.21 or newer for `--output-junit`; check `ctest --help`).
2. Read Unity output lines: `test/test_wss.c:41:test_REQ_WSS_012_speed_above_max_reports_range_error:PASS`, or `:FAIL: Expected 2 Was 0`. The summary line `N Tests M Failures K Ignored` must show 0 failures and 0 ignored.
3. Build `c_trace_matrix` by parsing the requirement ID from each test name.
4. For each failing test, record expected and actual from the Unity message and route the defect to the module owner; do not change the expected value unless the requirement says it is wrong.

### Output
`c_unit_tests`, `c_trace_matrix`.

### Quality Gate
- Unity summary shows 0 Failures and 0 Ignored, or each failure is a recorded defect.
- Every requirement row in `c_trace_matrix` has at least one test name and a result.

---

## Worked Example

Illustrative only. REQ-WSS-012: "Wheel speed shall be reported in 0.01 km/h for raw values 0 to 32000; values above 32000 return WSS_ERR_RANGE."

Cases: raw 0, 1, 31999, 32000 (valid, exact scaled outputs), 32001 and 65535 (range error), ADC stub timeout (fault injection).

```
test/test_wss.c:58:test_REQ_WSS_012_raw_32001_reports_range_error:PASS
-----------------------
7 Tests 0 Failures 0 Ignored
OK
```

---

## Exit Criteria

DONE when every unit-testable requirement has derived boundary, equivalence and fault cases implemented in Unity, all tests pass or have recorded defects, and the trace matrix covers every requirement.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Requirement has no range or expected value | **Return**: record an open question to the requirement owner; no test can be derived. |
| Phase 2 | Module includes vendor HAL that does not compile on host | **Adjust**: add a stub header directory first on the include path for the test target only. |
| Phase 3 | Test fails | **Stop**: record expected and actual; decide code defect or test defect with evidence before any change. |
| Phase 3 | Unity reports Ignored tests | **Adjust**: remove `TEST_IGNORE` or record why each is ignored as an open item. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
