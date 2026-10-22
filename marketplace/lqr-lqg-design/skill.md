# Lqr Lqg Design

Design a linear quadratic regulator with Kalman filter state estimation, tuned from physical requirements rather than arbitrary weight matrices.

## Inputs

- `mimo-plant-model`: State-space model (A, B, C, D)
- `control-objectives`: State regulation accuracy, control effort budget, and disturbance/noise characteristics

## Outputs

- `lqr-lqg-controller`: State feedback gain K, Kalman filter gains L, and the combined output-feedback controller transfer function
- `margins-and-stability`: Gain and phase margins at each input channel, sensitivity peak, and comparison to classical margin requirements

## Process

1. Set Q matrix (state cost) from Bryson's rule: Q_ii = 1 / (max_acceptable_deviation_of_state_i)^2. This normalizes states with different units and magnitudes to comparable scales. For states you do not care about directly, set Q_ii = 0 (or small for numerical conditioning).
2. Set R matrix (input cost): R_jj = 1 / (max_allowable_input_j)^2. This prevents the LQR from demanding more actuator effort than is physically available. Start with Bryson's rule values and adjust: increase R to slow the response, decrease R for faster response with more control effort.
3. Solve the continuous or discrete algebraic Riccati equation to get the optimal state feedback gain K. Verify the closed-loop eigenvalues are at reasonable locations (not excessively fast, which would indicate Q is too large relative to R).
4. LQR with full state feedback has guaranteed gain margin of at least 6dB and phase margin of at least 60 degrees at each input channel (for continuous-time). These margins degrade when a state estimator is added.
5. Design the Kalman filter (L gain from the dual Riccati equation with Q_noise and R_noise). The combined LQG controller K_lqg(s) has no guaranteed margins. Use LQG/LTR (loop transfer recovery) to recover the LQR margins: increase Q_noise = q^2 * B * B^T with increasing q. As q goes to infinity, the LQG loop transfer approaches the LQR loop transfer and the margins are recovered. Choose the smallest q that gives acceptable margins (typically 6dB gain, 45 degrees phase).
6. Verify the final controller: plot singular values of the return difference I + GK at the plant input to check stability margins. The minimum singular value at each frequency should be above 0.5 (6dB) for adequate margin.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
