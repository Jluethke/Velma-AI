# Mbd Model Validation And Correlation

Validate the multibody model against physical test data and correlate model parameters.

## Inputs

- `motion-results`: Simulation results
- `test-data`: Physical measurements: accelerometer data, position tracking, strain gauge, or load cell data from the real mechanism

## Outputs

- `correlation-report`: Quantitative comparison of simulation to test, parameter adjustments made, and remaining discrepancies
- `validated-mbd-model`: Model with calibrated parameters documented for use in design studies

## Process

1. Compare time-domain signals: overlay measured and simulated accelerations, displacements, or forces at the same locations. Use cross-correlation to check timing alignment. Compute NRMSE (normalized root mean square error) as the primary comparison metric.
2. Compare frequency content: compute the frequency spectrum (FFT) of measured and simulated signals. The dominant frequencies should match (correct mechanism kinematics). Amplitude differences at specific frequencies point to incorrect stiffness (wrong frequency) or incorrect damping (wrong amplitude).
3. Calibrate parameters: if joint friction, bushing stiffness, or contact parameters are uncertain, run a parameter identification. Minimize the error between simulated and measured responses by adjusting the uncertain parameters. Use design-of-experiments (DOE) to screen which parameters have the most effect, then optimize those.
4. Check that the model reproduces multiple operating conditions, not just the calibration condition. A model calibrated on one speed or load should predict other speeds and loads without re-calibration. If it does not, the model structure (not just parameters) may be wrong.
5. Document the validated operating envelope: the model is valid for the range of speeds, loads, and configurations that have been validated. Extrapolation beyond this range requires additional validation or conservative margin.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
