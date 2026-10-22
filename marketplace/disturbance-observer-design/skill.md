# Disturbance Observer Design

Design an observer that estimates external disturbances acting on the system, enabling feedforward compensation without direct disturbance measurement.

## Inputs

- `system-model`: Plant model with known disturbance input channel
- `tuned-estimator`: State estimator providing state estimates

## Outputs

- `disturbance-observer`: Observer structure that estimates the disturbance from the discrepancy between model prediction and measurement
- `disturbance-rejection-bandwidth`: Frequency range over which the disturbance is effectively estimated and compensated

## Process

1. Augment the state vector with the disturbance as an additional state, modeled as an integrator (d_dot = 0 for constant disturbance, d_ddot = 0 for ramp disturbance). The augmented system is [x_dot; d_dot] = [A B_d; 0 0] [x; d] + [B; 0] u, y = [C 0] [x; d]. Check observability of the augmented system.
2. Design the estimator for the augmented system. The Kalman filter approach: set Q_dd (process noise for the disturbance state) to reflect how fast the disturbance can change. Large Q_dd allows tracking fast disturbances but amplifies sensor noise in the estimate. Small Q_dd limits the disturbance estimation bandwidth.
3. The disturbance estimate d_hat from the observer feeds into a feedforward compensation: u_total = u_feedback - B_d^(-1) * d_hat (if B_d is invertible, meaning the disturbance enters through the same channel as the control). This cancels the disturbance within the observer bandwidth.
4. The effective disturbance rejection bandwidth is set by the observer gains, which are determined by Q_dd and R. The observer acts as a low-pass filter on the disturbance: it tracks disturbances below its bandwidth and ignores (cannot estimate) disturbances above it.
5. For implementation, the disturbance observer is a complement to the feedback controller: the feedback handles model uncertainty and high-frequency disturbances, while the disturbance observer handles low-frequency load disturbances. The combined bandwidth should cover the full disturbance spectrum without double-counting (which would cause oscillation).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
