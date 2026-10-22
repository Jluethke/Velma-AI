# Ci Regression And Coverage

Set up continuous integration for embedded firmware with emulator-based regression testing, code coverage measurement, and automated quality gates.

## Inputs

- `fixed-point-test-suite`: Algorithmic tests to include in the CI pipeline
- `unit-test-plan`: Host-based unit tests to include in the CI pipeline

## Outputs

- `ci-pipeline-design`: CI stages: compile, static analysis, unit tests, emulator tests, coverage report, and quality gate criteria for each stage
- `coverage-targets`: Code coverage targets: line coverage, branch coverage, and MC/DC coverage (for safety-critical code), with the rationale for each target

## Process

1. Set up the CI build: cross-compile the firmware for the target (ARM GCC) and native-compile for host tests (x86 GCC/Clang). The cross-compile verifies the firmware builds without errors or warnings (-Wall -Werror). The native compile builds the test executables.
2. Run unit tests on every commit. The CI runner executes the host-based test suite and reports pass/fail. Test execution is fast (seconds) because it runs natively. Fail the pipeline on any test failure.
3. For emulator-based testing, use QEMU with the target MCU's machine model (available for many ARM Cortex-M families) or a vendor-provided simulator. Flash the firmware into the emulator, run the test sequence, and capture the output. Emulator tests are slower but test the actual target binary including startup code and peripheral interaction (with emulated peripherals).
4. Measure code coverage: compile with --coverage (GCC) to instrument the code. Run the tests. Use gcov to generate coverage data and lcov/genhtml for HTML reports. For embedded targets, use semihosting to extract the gcov data files from the target to the host after test execution.
5. Set quality gates: line coverage at least 80% for application code (not bootloader or HAL), branch coverage at least 70%. For safety-critical code (SIL 3+), require MC/DC (Modified Condition/Decision Coverage) at 100% for safety-related modules. MC/DC means every condition in every decision has been shown to independently affect the outcome.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
