# Test Procedure Development

Develop test procedures that are repeatable, measurable, and traceable to requirements, with explicit pass/fail criteria and measurement uncertainty accounted for.

## Inputs

- `verification-cross-reference-matrix`: Requirements to test mapping
- `test-architecture`: Test environment definitions

## Outputs

- `test-procedures`: Step-by-step procedures for each verification event: setup, preconditions, step sequence, measurements, pass/fail criteria with tolerances, data recording requirements, and teardown
- `measurement-uncertainty-analysis`: For each quantitative measurement: instrument accuracy, calibration status, measurement technique uncertainty, and the test tolerance accounting for measurement uncertainty (guardband)
- `test-readiness-checklist`: Conditions that must be true before test execution: calibration current, test fixture verified, test article configuration confirmed, environmental conditions within limits, personnel qualified

## Process

1. Write each test step so that two different test engineers would execute it identically and obtain the same result within measurement uncertainty. Avoid ambiguous instructions like 'adjust until satisfactory.' Specify exact settings, wait times, measurement points, and acceptance thresholds.
2. Account for measurement uncertainty in pass/fail criteria. If the requirement is 'output voltage shall be 5.0V +/- 0.1V' and the measurement system has +/- 0.02V uncertainty, the test pass band should be 4.92V to 5.08V (guard-banded inward by the measurement uncertainty). This prevents accepting a product that might actually be out of specification.
3. Include acceptance criteria for the test itself (not just the product). The test is valid only if: environmental conditions were within specified ranges during the test, all instruments were within their calibration period, the test fixture was verified within its calibration interval, and no deviations from the procedure occurred. Invalid test results must be discarded and the test re-run.
4. Define the data package required from each test: raw measurements, calculated results, pass/fail status for each requirement, anomaly reports for any failures or deviations, environmental conditions during the test, and the configuration of the test article (serial number, hardware revision, software version). This package is the evidence that the requirement was verified.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
