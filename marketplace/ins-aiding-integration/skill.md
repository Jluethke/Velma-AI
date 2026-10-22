# Ins Aiding Integration

Design the integration of external aiding sources (GPS, baro, velocity) with the INS using Kalman filtering to bound error growth and calibrate sensor errors in flight.

## Inputs

- `error-state-model`: The INS error propagation model
- `alignment-procedure`: The alignment sequence and initial accuracy

## Outputs

- `aided-ins-design`: Complete aided INS architecture with measurement models, filter tuning, and fault detection
- `performance-prediction`: Aided navigation accuracy under various aiding availability scenarios including GPS denial

## Process

1. Define the aiding architecture: loosely coupled (GPS position/velocity as measurements to the INS Kalman filter), tightly coupled (GPS pseudorange and delta-range as measurements), or ultra-tightly coupled (INS-aided GPS tracking loops). Loosely coupled is simplest and works when GPS has 4+ satellites. Tightly coupled works with fewer satellites and in jamming. Ultra-tight provides maximum jam resistance.
2. Design the measurement model for each aiding source. GPS position: H maps error states to position difference, R from GPS DOP and UERE. GPS velocity: similarly with velocity errors. Barometric altitude: single measurement with pressure-altitude error model. Doppler velocity (radar or sonar): velocity measurement in sensor frame, transformed through attitude.
3. Tune the Kalman filter. Set Q from IMU specifications. Set R from aiding source specifications. Verify filter consistency: the normalized innovation sequence should be zero-mean with unity variance. If innovations are too large, R is too small or the model is wrong. If the state uncertainty does not decrease when measurements arrive, R is too large.
4. Design GPS denial handling. When GPS is lost, the filter reverts to free-inertial propagation. The covariance grows according to the unaided error model. Previously estimated sensor biases remain calibrated for a period (depends on Markov correlation time). Predict the position error growth rate during GPS denial from the covariance propagation.
5. Implement fault detection and exclusion. Monitor the innovation sequence for outliers (chi-squared test). For critical applications, implement receiver autonomous integrity monitoring (RAIM) concepts: compare the solution with and without each measurement to detect faulty measurements. Set false alarm and missed detection probability targets.
6. Run a Monte Carlo simulation varying the sensor errors, aiding availability, and dynamics to predict the navigation accuracy distribution. Report the 95th percentile accuracy for each scenario: continuous GPS, GPS denial for 5/15/60 minutes, GPS denied entirely. This becomes the system performance specification.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
