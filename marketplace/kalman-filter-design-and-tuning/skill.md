# Kalman Filter Design And Tuning

Design and tune a Kalman filter (or its nonlinear variants) by selecting process and measurement noise covariances from physical reasoning and data.

## Inputs

- `system-model`: Discrete-time state-space model
- `sensor-configuration`: Sensor noise characteristics from datasheets or calibration
- `estimator-architecture`: KF, EKF, or UKF selection

## Outputs

- `tuned-estimator`: Kalman filter with Q and R matrices, initial state estimate and covariance, and convergence time estimate
- `tuning-rationale`: How Q and R were determined and what each element represents physically

## Process

1. Set measurement noise covariance R from sensor specifications. For each sensor, R_ii = sigma_sensor_i^2 where sigma is the 1-sigma noise from the datasheet or from static calibration data. R is typically well-known and should be set from data, not tuned.
2. Set process noise covariance Q to represent model uncertainty and unmodeled disturbances. Q is the primary tuning knob. Start from physical reasoning: if a state represents position and the unmodeled acceleration disturbance has magnitude a_max, then Q for the velocity state is approximately (a_max * dt)^2 and for position is approximately (0.5 * a_max * dt^2)^2.
3. If physical reasoning is insufficient, use the following tuning procedure: increase Q_ii for state i to make the estimator trust the measurement more (faster response, more noise). Decrease Q_ii to make the estimator trust the model more (smoother estimate, slower response to real changes). The ratio Q/R sets the estimator bandwidth.
4. For EKF, compute the Jacobians F = df/dx and H = dh/dx at each time step evaluated at the current state estimate. If the Jacobians are expensive, consider UKF which avoids explicit Jacobian computation by propagating sigma points through the nonlinear functions.
5. For UKF, select sigma point parameters: alpha (spread, typically 1e-3 for Gaussian), beta (distribution, 2 for Gaussian is optimal), kappa (secondary scaling, 0 or 3-n). These rarely need tuning from the defaults for Gaussian problems.
6. Validate the estimator: the normalized innovation sequence (innovation / sqrt(innovation covariance)) should be white noise with unit variance. If the innovations are too large, the model is wrong or Q is too small. If the innovations are too small, Q is too large (estimator is being conservative). Use the normalized estimation error squared (NEES) test for consistency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
