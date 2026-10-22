# Voice Regression Tracker

Track test results over time and flag regressions.

## Inputs

- `test-results`: Current test run results
- `failure-analysis`: Failure analysis from current run

## Outputs

- `regression-report`: Tests that passed in the previous run but fail now
- `voice-testing-report`: Complete voice bot testing report with coverage, pass rates, regressions, and recommendations

## Process

1. Compare current results to the previous run and identify regressions.
2. Flag any test that moved from pass to fail as a regression.
3. Track the overall pass rate trend over time.
4. Recommend fixes for regressions and persistent failures.
5. Compile the full testing report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
