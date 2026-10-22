# Test Execution And Analysis

Execute the vibration and shock tests, monitor test article health, and analyze results for pass/fail determination.

## Inputs

- `fixture-design`: Verified test fixture
- `control-strategy`: Control configuration
- `instrumentation-plan`: Sensor and DAQ configuration
- `random-vibration-spec`: PSD test profile
- `shock-spec`: Shock specification

## Outputs

- `test-data`: Time histories, PSDs, and SRS from all channels during all test runs
- `functional-test-results`: Results of functional checks before, during (if required), and after vibration/shock exposure
- `test-report`: Complete test report with pass/fail determination, anomalies, and measured vs specified environments

## Process

1. Perform a pre-test functional check of the test article. Document baseline performance. Perform a low-level sine sweep (0.25g or 0.5g) to characterize the test article's resonant frequencies before applying the full test level. This sweep becomes the reference for tracking resonance shifts.
2. Run the random vibration test: start at -12 dB (one-quarter amplitude) for a brief check, then increase to -6 dB, then to full level. Monitor control quality (PSD within tolerance), response channels (no unexpected high responses), and abort conditions. Run for the specified duration on each axis.
3. After random: repeat the low-level sine sweep. Compare resonant frequencies to the pre-test sweep. A frequency shift of more than 5% typically indicates structural damage (cracking, loosening). A shift of 2-5% warrants investigation.
4. Execute shock tests: apply the specified number of shocks per axis per direction. Verify that each shock's SRS at the control point meets the specification within tolerance. Monitor for rattling, clicking, or other sounds during impact that indicate loose hardware.
5. Perform the post-test functional check. Compare to the pre-test baseline. Any degradation in function is a test failure regardless of whether the structure shows visible damage. Document all results in the test report with measured spectra overlaid on specifications, functional test comparison, and photographs of the test setup.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
