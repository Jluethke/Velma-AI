# State Estimation Filter Design

Implement state estimation using Kalman filter variants: select between EKF, UKF, and particle filter based on system nonlinearity and computational constraints, tune process and measurement noise, and validate filter performance.

## Inputs

- `fusion-architecture`: Selected fusion architecture with data flow
- `sensor-manifest`: Sensor specifications including noise characteristics

## Outputs

- `filter-design`: State estimation filter implementation with state vector, process model, measurement models, and noise parameters
- `filter-performance`: Estimated accuracy of state estimates (position, velocity, orientation) under nominal and degraded conditions

## Process

1. Define the state vector. For a ground vehicle: position (x, y), heading, velocity, yaw rate, and optionally acceleration. For a drone: full 6-DOF pose plus velocities. For each tracked object: position, velocity, heading, dimensions, classification. The state vector size determines computational cost per filter update.
2. Select the filter variant. Extended Kalman Filter (EKF): linearizes nonlinear models around the current estimate using Jacobians. Fast, works well when nonlinearity is mild (small timesteps, smooth motion). Unscented Kalman Filter (UKF): propagates sigma points through the nonlinear model, avoids Jacobian computation, better accuracy for strongly nonlinear systems at 2-3x the cost of EKF. Particle filter: represents the posterior as a set of weighted samples, handles arbitrary nonlinearity and multimodal distributions, but scales poorly with state dimension (practical up to ~10 states with 1000+ particles). For most robotic platforms, EKF or UKF is sufficient for ego-state estimation. Use particle filters for global localization with ambiguous measurements.
3. Set process noise (Q matrix) and measurement noise (R matrix). Process noise represents unmodeled dynamics: for a constant-velocity model, Q encodes expected acceleration magnitude. Tune Q from recorded trajectory data by computing the innovation sequence and checking its whiteness (autocorrelation should be near zero). Measurement noise R comes from sensor specifications and calibration residuals. Verify consistency: the normalized innovation squared (NIS) should follow a chi-squared distribution with degrees of freedom equal to measurement dimension.
4. Validate filter performance against ground truth (RTK-GPS for position, motion capture for full pose in controlled environments). Compute RMS error for each state component. Check that the filter's reported covariance (P matrix) is consistent with actual errors: the estimated uncertainty should contain the actual error approximately 95% of the time at the 2-sigma level. Tune Q and R iteratively if consistency is poor.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
