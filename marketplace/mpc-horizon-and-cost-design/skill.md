# Mpc Horizon And Cost Design

Select prediction horizon, control horizon, and cost function weights to achieve the desired closed-loop behavior.

## Inputs

- `discrete-prediction-model`: State-space model at the chosen sample time
- `control-objectives`: Desired bandwidth, response shape, and relative importance of tracking vs control effort

## Outputs

- `mpc-tuning-parameters`: Prediction horizon N_p, control horizon N_c, output weight Q, input weight R, input rate weight S, and terminal cost P
- `tuning-rationale`: How each parameter was chosen and what trade-off it controls

## Process

1. Set prediction horizon N_p to capture the open-loop settling time of the plant (at least 1.5x the number of samples in the rise time). Too short causes instability; too long wastes computation without improving performance.
2. Set control horizon N_c less than or equal to N_p. N_c = N_p gives maximum degrees of freedom but largest QP. Reducing N_c (typically N_c = 3 to 10) constrains later moves to be constant, which acts as implicit regularization and reduces computation. Start with N_c = min(N_p, 10) and reduce if real-time computation is tight.
3. Set output tracking weight Q from the relative importance of each output and the acceptable tracking error magnitude. Use inverse-square scaling: Q_ii = 1/(max_acceptable_error_i)^2. This normalizes different-unit outputs to comparable scales.
4. Set input weight R to penalize control effort. Start with R small (prioritize tracking) and increase if actuator activity is excessive. R controls the trade-off between fast response and control smoothness.
5. Set input rate weight S (move suppression) to limit control action changes per step. This is often more important than R for practical actuator protection and noise sensitivity. Start with S = 0.1 * R and increase if moves are too aggressive.
6. For guaranteed stability without terminal constraints, compute the terminal cost P as the solution to the discrete algebraic Riccati equation (DARE) for the unconstrained LQR with weights (Q, R). This makes the finite-horizon cost approximate the infinite-horizon cost.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
