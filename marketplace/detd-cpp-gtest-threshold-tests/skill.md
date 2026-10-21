# C++ Threshold Tests with GoogleTest Value Parameters

**One-line description:** Turns derived boundary cases into GoogleTest value-parameterized tests (`TEST_P` with `INSTANTIATE_TEST_SUITE_P`) using hex float literals and `std::nextafter`, asserts decisions with `EXPECT_EQ` rather than the 4-ULP `EXPECT_DOUBLE_EQ`, and proves the tests catch an operator change.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `boundary_cases` (object[], required): Output of `detd-threshold-boundary-cases`.

---

## Outputs

- `boundary_test_file` (string): Path of the generated test source and the count of instantiated cases.

---

## Phase 1: Write the Parameterized Suite

### Entry Criteria
- GoogleTest is available in the build (`find_package(GTest)` or `FetchContent`), and tests run under `ctest`.

### Actions
1. Create `tests/threshold_test.cpp` with `struct Case { const char* name; double input; Decision expected; };`.
2. Fill `kCases[]` with hex float literals (C++17), for example `{"max_lateral_accel_at", 0x1.8p+1, Decision::kNotTriggered}`. For adjacent values you may write `std::nextafter(0x1.8p+1, -INFINITY)` in a helper, but the literal from `boundary_cases` is preferred because it is the reviewed value.
3. `class ThresholdTest : public ::testing::TestWithParam<Case> {};` and `TEST_P(ThresholdTest, Decides) { EXPECT_EQ(decide(GetParam().input), GetParam().expected); }`.
4. `INSTANTIATE_TEST_SUITE_P(Limits, ThresholdTest, ::testing::ValuesIn(kCases), [](const auto& info) { return std::string(info.param.name); });` Names must be alphanumeric or underscore.
5. For float outputs that must be exact, compare bits: `EXPECT_EQ(std::bit_cast<std::uint64_t>(a), std::bit_cast<std::uint64_t>(b))`. `EXPECT_DOUBLE_EQ` allows a 4 ULP difference by design and hides boundary flips; do not use it here.
6. Special values: `std::numeric_limits<double>::quiet_NaN()`, `infinity()`, `-0.0`.
7. Compile the test with the same float flags as the decision targets (`-ffp-contract=off`).

### Output
Test source.

### Quality Gate
- `build/tests/threshold_test --gtest_list_tests` lists one entry per case.

---

## Phase 2: Run and Report

### Entry Criteria
- Suite builds.

### Actions
1. `ctest --test-dir build -R Threshold --output-on-failure`, or run the binary with `--gtest_filter='Limits/ThresholdTest.*'`.
2. Failures mean code disagrees with spec. Do not edit expectations. To keep CI usable while a defect is open, prefix the case name with `DISABLED_` only together with a defect id comment; GoogleTest prints a count of disabled tests in every run, which keeps them visible.

### Output
Run log.

### Quality Gate
- Run log saved; each disabled or failing case has a defect id.

---

## Phase 3: Prove the Tests Bite

### Entry Criteria
- Suite runs.

### Actions
1. On a scratch branch, change one comparison operator at a listed `code_site`.
2. Rebuild and run; the `_at` case for that limit must fail.
3. Return to the original branch and delete the scratch branch.

### Output
`boundary_test_file` with mutation evidence.

### Quality Gate
- The mutated run shows the expected case `[  FAILED  ]`; the scratch branch is gone (`git branch --list`).

---

## Worked Example

Illustrative only. `threshold_test --gtest_list_tests` prints `Limits/ThresholdTest.` followed by `Decides/max_lateral_accel_at` and others. Run prints `[  FAILED  ] Limits/ThresholdTest.Decides/max_lateral_accel_at`. Mutation of `max_speed` makes `Decides/max_speed_at` fail.

---

## Exit Criteria

DONE when every boundary case is an instantiated test with an exact literal, decisions compare with `EXPECT_EQ`, and the mutation check fails the expected case.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Compiler rejects hex float literal | **Adjust**: build with `-std=c++17` or later. |
| Phase 1 | Test name has invalid characters | **Adjust**: use only letters, digits and underscore. |
| Phase 3 | Mutation not detected | **Retry**: the input does not reach that site; fix the case inputs. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
