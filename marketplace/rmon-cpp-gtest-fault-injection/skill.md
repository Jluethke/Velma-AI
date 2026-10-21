# C++ Fault Injection with GoogleTest

**One-line description:** Runs every fault injection case whose executor is C++ as a GoogleTest value-parameterized test (`TEST_P` with `INSTANTIATE_TEST_SUITE_P`) loaded from the plan file, drives the range, rate and staleness checkers with a fake steady clock, and emits JUnit XML through `ctest --output-junit` plus a JSON Lines results file.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fault_injection_plan` (object[], required): Output of `rmon-fault-injection-plan`.
- `cpp_range_rate_checker` (object, required): Output of `rmon-cpp-rate-range-check`.
- `cpp_staleness_checker` (object, required): Output of `rmon-cpp-staleness-timeout`.
- `repo_dir` (string, required): Monitor CMake project root.

---

## Outputs

- `cpp_fault_results` (object[]): One row per case: `case_id`, `label`, `expected_verdict`, `observed_verdict`, `detected`, `t_inject_ns`, `t_detect_ns`, `outcome`. Also the JUnit XML path.

---

## Phase 1: Parameterized Test Suite

### Entry Criteria
- Both checker test suites pass in plain and sanitizer builds.
- `ctest --version` is 3.21 or newer if `--output-junit` is used.

### Actions
1. Create `tests/fault_injection_test.cpp`:
   ```cpp
   #include <gtest/gtest.h>
   #include <nlohmann/json.hpp>
   #include <fstream>
   #include "monitor/range_rate.hpp"
   #include "monitor/staleness.hpp"

   struct Case { std::string id, model, label, expected; nlohmann::json params; };

   static std::vector<Case> LoadCases() {
     std::ifstream f(FAULT_PLAN_PATH);
     auto j = nlohmann::json::parse(f);
     std::vector<Case> out;
     for (auto& c : j)
       if (c["executor"] == "rmon-cpp-gtest-fault-injection")
         out.push_back({c["case_id"], c["fault_model"], c["label"], c["expected_verdict"], c["parameters"]});
     return out;
   }

   class FaultInjection : public ::testing::TestWithParam<Case> {};
   TEST_P(FaultInjection, ProducesExpectedVerdict) {
     const Case& c = GetParam();
     const std::string observed = RunCase(c);   // one branch per fault model
     EXPECT_EQ(observed, c.expected) << c.id << " " << c.label;
   }
   INSTANTIATE_TEST_SUITE_P(Plan, FaultInjection, ::testing::ValuesIn(LoadCases()),
     [](const ::testing::TestParamInfo<Case>& i) {
       std::string n = i.param.id; for (auto& ch : n) if (!isalnum(static_cast<unsigned char>(ch))) ch = '_'; return n; });
   ```
2. Pass the plan path at build time: `target_compile_definitions(fault_injection_test PRIVATE FAULT_PLAN_PATH="${CMAKE_SOURCE_DIR}/fault_injection_plan.json")`.
3. Write `RunCase` with one branch per fault model. Parameter strings like `"nextafter(2.0, inf)"` map to `std::nextafter(2.0, INFINITY)` through an explicit table; unknown strings make the test fail with a message, not silently pass.
4. Timing faults use the fake clock lambda from the staleness tests; record injection and detection times in nanoseconds of fake time and append a JSON line per case to `fault_results.jsonl`.
5. GoogleTest names must be alphanumeric or underscore, which is why the name generator replaces `-` in case IDs.

### Output
Parameterized test executable.

### Quality Gate
- `./build/fault_injection_test --gtest_list_tests | rg -c "Plan/FaultInjection"` (count of listed instances) equals the number of C++-executor cases in the plan.

---

## Phase 2: Run and Report

### Entry Criteria
- Test count matches.

### Actions
1. Build and run with JUnit output:
   ```
   cmake --build build -j
   ctest --test-dir build -R FaultInjection --output-on-failure --output-junit fault_injection.xml
   ```
   Or call the binary directly: `./build/fault_injection_test --gtest_output=xml:reports/fault_injection.xml`.
2. Repeat in the sanitizer build directory.
3. For each failure classify missed trip (`must_trip` not detected) versus false trip (`must_not_trip` detected) and fix the checker; one source file per change, full rerun after each.

### Output
`cpp_fault_results`.

### Quality Gate
- Both builds report `100% tests passed` for the `FaultInjection` tests.
- `wc -l fault_results.jsonl` equals the number of C++-executor cases.

---

## Worked Example

Illustrative only.
```
$ ./build/fault_injection_test --gtest_brief=1
[  FAILED  ] Plan/FaultInjection.ProducesExpectedVerdict/FI_022, where GetParam() = ...
  Expected equality of these values:
    observed
      Which is: "pass"
    c.expected
      Which is: "stale"
```
FI-022 is a 4-bit alive counter wrap; the checker used `uint16_t`. Switched to a `& 0x0F` mask per the ICD; all cases pass.

---

## Exit Criteria

DONE when every C++-executor case runs from the plan, results exist as JUnit XML and JSON Lines in plain and sanitizer builds, and no case fails.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ctest` older than 3.21 lacks `--output-junit` | **Adjust**: use `--gtest_output=xml:` on the binary. |
| Phase 1 | Plan file not found at runtime | **Retry**: check `FAULT_PLAN_PATH` in the compile definitions. |
| Phase 2 | Expected verdict appears wrong | **Return**: to `rmon-fault-injection-plan`; do not edit it here. |

**Do not:** use `GTEST_SKIP()` or `DISABLED_` to hide failing cases, edit expected verdicts, or report results from only the plain build.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
