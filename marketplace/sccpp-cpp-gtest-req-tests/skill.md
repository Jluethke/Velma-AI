# C++: Requirements-Based Unit Tests With GoogleTest

**One-line description:** Derives unit test cases for C++ classes from requirement IDs with equivalence classes and boundary values, implements them in GoogleTest with parameterized tests and RecordProperty tags carrying the requirement ID into the XML report, and builds the trace matrix from that report.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `requirements` (object[], required): Software unit requirements with ID, text, input ranges and expected behavior.
- `codebase_dir` (string, required): Source tree root of the C++ code base.
- `build_profiles` (object, required): From `sccpp-cmake-build-profiles`; the host-test profile.

---

## Outputs

- `cpp_unit_tests` (object): Test sources, CMake registration, the XML report path and the last result per test.
- `cpp_trace_matrix` (object[]): Rows of requirement ID, test names, derivation method, and pass or fail, built from the `requirement` property in the GoogleTest XML.

---

## Phase 1: Derive Test Cases

### Entry Criteria
- Every requirement in scope has an ID and a stated input range or condition.

### Actions
1. List each requirement's inputs and ranges; split into equivalence classes (valid, below, above, special values).
2. Add boundary cases at minimum, minimum minus one step, maximum, maximum plus one step, with the step from the signal resolution.
3. Add fault injection cases for every error value dependencies can return.
4. Group cases that differ only in input and expected value into one parameter table for `TEST_P`.
5. List requirements not testable at unit level with the reason and the level that covers them.

### Output
Test case tables per requirement.

### Quality Gate
- Every requirement ID appears in a case table or in the not-unit-testable list.

---

## Phase 2: Implement in GoogleTest

### Entry Criteria
- GoogleTest available through `find_package(GTest)` or `FetchContent` (record the version).

### Actions
1. Fixture per class: `class WheelSpeedTest : public ::testing::Test { protected: StubAdc adc_; WheelSpeed uut_{adc_}; };`. Inject hardware access through constructor-provided interfaces or template parameters so stubs replace hardware in tests. Do not add virtual functions to production code only for testing unless the design already uses them.
2. Tag every test with its requirement: first line in the body `RecordProperty("requirement", "REQ-WSS-012");`. GoogleTest writes it into the `testcase` element of the XML output, as an attribute and, in newer releases, also as a `<property name="requirement" value="..."/>` child; open one report and confirm which form your version writes before parsing.
3. Parameterized boundaries: `class WssBoundary : public ::testing::TestWithParam<std::tuple<uint16_t, WssResult>> {};`, `TEST_P(WssBoundary, Scales) {...}`, `INSTANTIATE_TEST_SUITE_P(REQ_WSS_012, WssBoundary, ::testing::Values(...));` (the older `INSTANTIATE_TEST_CASE_P` is deprecated).
4. Use `ASSERT_*` when continuing makes no sense (null result), `EXPECT_*` otherwise; `EXPECT_EQ(static_cast<int>(status), static_cast<int>(WssError::kRange))` for scoped enums if no printer is defined.
5. CMake: `add_executable(wss_test test/wss_test.cpp src/wheel_speed.cpp)`, `target_link_libraries(wss_test GTest::gtest_main)`, `include(GoogleTest)`, `gtest_discover_tests(wss_test)`.
6. If the build uses `-fno-exceptions`, build GoogleTest the same way; check the GoogleTest version's documentation for its exceptions setting (`GTEST_HAS_EXCEPTIONS`).
7. Never delete or weaken a test to get green.

### Output
Test sources and CMake registration.

### Quality Gate
- `cmake --build build/host-test` exits 0.
- `grep -c "RecordProperty(\"requirement\"" test/*.cpp` is at least the number of non-parameterized tests, and each parameterized suite records it in the test body.

---

## Phase 3: Run and Trace

### Entry Criteria
- Tests build.

### Actions
1. Run `./build/host-test/wss_test --gtest_output=xml:build/host-test/wss_test.xml` (or through CTest).
2. Read the console: `[  PASSED  ] N tests.` and any `[  FAILED  ]` lines with the expected and actual values printed above them.
3. Parse the XML: each `<testcase name=... status="run" result="completed" requirement="REQ-WSS-012">` with or without a `<failure>` child. Build `cpp_trace_matrix` from the `requirement` attribute or property child, whichever Phase 2 confirmed.
4. Route failures as code or test defects with the printed expected and actual values as evidence.

### Output
`cpp_unit_tests`, `cpp_trace_matrix`.

### Quality Gate
- XML report exists and `python -c "import xml.etree.ElementTree as E;r=E.parse('build/host-test/wss_test.xml').getroot();print(r.get('failures'))"` prints 0, or each failure is a recorded defect.
- Every requirement in scope has at least one `testcase` with its ID.

---

## Worked Example

Illustrative only. REQ-WSS-012 as in the C variant, implemented in C++17.

```
[ RUN      ] REQ_WSS_012/WssBoundary.Scales/4
[       OK ] REQ_WSS_012/WssBoundary.Scales/4 (0 ms)
[  PASSED  ] 9 tests.
```

The XML contains `requirement="REQ-WSS-012"` on 7 test cases and `requirement="REQ-WSS-013"` on 2. Trace matrix: both requirements pass.

---

## Exit Criteria

DONE when every unit-testable requirement has derived cases implemented in GoogleTest with a requirement property, the XML report shows zero unrecorded failures, and the trace matrix covers every requirement.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Requirement lacks range or expected value | **Return**: open question to the requirement owner. |
| Phase 2 | Class constructs hardware drivers internally, cannot be stubbed | **Return**: report the design issue; propose dependency injection as a change request, do not rewrite the class in this flow. |
| Phase 3 | `requirement` attribute missing in XML | **Adjust**: confirm `RecordProperty` is called inside the test body, not in `SetUpTestSuite`. |
| Phase 3 | Test fails | **Stop**: record expected and actual; classify the defect before changing anything. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
