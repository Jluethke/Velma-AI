# Controller Tuning Methodology

Tune PID controllers for each loop type using model-based methods.

## Inputs

- `control-structure`: Control loops with variable pairing
- `process-pid`: Process dynamics information

## Outputs

- `tuned-parameters`: PID parameters (Kc, Ti, Td) for each controller
- `performance-verification`: Step response and disturbance rejection test results

## Process

1. Identify the process model for each loop: perform a step test (bump the controller output 5% to 10% in manual mode) and fit a first-order-plus-dead-time (FOPDT) model: G(s) = K * exp(-theta*s) / (tau*s + 1). Estimate K (gain), tau (time constant), and theta (dead time) from the response.
2. Apply IMC (Internal Model Control) tuning rules: for a self-regulating process, Kc = tau / (K * (lambda + theta)), Ti = tau, Td = 0. The tuning parameter lambda sets the trade-off between speed and robustness: lambda = theta gives moderately aggressive tuning, lambda = 3*theta gives conservative tuning.
3. For integrating processes (level control): Kc = tau / (K_i * (lambda + theta)^2), Ti = 2*(lambda + theta), where K_i is the integrating gain. Level controllers should generally be tuned loosely (large lambda) to absorb flow disturbances into the vessel inventory rather than passing them downstream.
4. For interacting loops: detune by a factor of 2 to 3 relative to single-loop tuning. Alternatively, use a steady-state decoupler: D(s) = -G12/G11 and D(s) = -G21/G22 to cancel the interaction, then tune each loop independently.
5. Verify performance: apply step changes in setpoint and load disturbances. Check that the response meets specifications: overshoot less than 20%, settling time less than 4 time constants, no sustained oscillation. For product quality loops, verify that the product stays within specification during the worst-case disturbance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
