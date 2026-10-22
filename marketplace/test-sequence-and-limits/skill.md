# Test Sequence And Limits

Develop the test program sequence, set pass/fail limits from design tolerance and measurement capability, and implement debug modes for failure diagnosis in production.

## Inputs

- `fixture-design`: Completed fixture with known probe contact characteristics
- `test-strategy-document`: Functional test approach and coverage goals
- `board-specification`: Performance specifications with tolerances

## Outputs

- `test-program`: Complete test sequence: power-up sequence, parametric tests, functional tests, power-down sequence, with timing and instrument configuration for each step
- `pass-fail-limits`: Upper and lower limits for each measurement, derived from specification tolerance and measurement capability (Cpk-based)
- `debug-mode-definition`: Diagnostic test routines that run on failed boards to isolate the failure to a specific functional block and provide repair guidance

## Process

1. Sequence the tests in dependency order. Power-up: apply input power through current-limited supply, verify supply current is within expected range (catches dead shorts before damage), then measure each power rail voltage. Digital initialization: verify processor boot (check a status register or communication handshake). Analog calibration: if the board has trimming, execute the calibration sequence. Functional tests: test each function in order of criticality.
2. Set pass/fail limits using the 4:1 guard-band rule. If the specification is 3.3V plus or minus 5% (3.135V to 3.465V) and the measurement uncertainty is plus or minus 5mV, set test limits at 3.140V to 3.460V (specification limit plus uncertainty on the inward side). For parameters where the specification tolerance is tight relative to measurement uncertainty, calculate limits from the Cpk requirement: test limit = nominal plus or minus tolerance * (1 - 1/(3*Cpk)).
3. Optimize test time vs coverage trade-off. Measure the time for each test step. For high-volume production, total test time must fit within the line takt time (production rate requirement). Eliminate redundant tests (if boundary scan already tested digital connectivity, skip pin-level digital probing). Parallelize independent measurements (measure multiple analog channels simultaneously).
4. Implement a debug mode for failed boards. When a test fails, branch to a diagnostic routine that performs additional measurements to isolate the failure. For example, if a voltage rail fails, measure the rail at multiple points to distinguish between a regulator fault, excessive load current (short on the rail), and a measurement contact issue. Provide the technician with a repair action code mapping each failure signature to a likely repair.
5. Validate the test program using known-good and known-bad boards. Run 30 known-good boards to verify the false-fail rate is below 0.5% (gauge R&R study). Introduce known faults (lifted pins, wrong-value resistors, missing components) to verify detection. Calculate the actual fault coverage from the known-fault study and compare to the estimated coverage from the test strategy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
