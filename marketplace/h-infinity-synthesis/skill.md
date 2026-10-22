# H Infinity Synthesis

Synthesize a controller that minimizes the H-infinity norm of the weighted closed-loop transfer function, guaranteeing stability under uncertainty and nominal performance.

## Inputs

- `nominal-plant-model`: Plant transfer function or state-space model
- `sensitivity-weights`: W_p, W_u, W_t weighting functions

## Outputs

- `h-infinity-controller`: Controller transfer function K(s) that achieves gamma < 1 (or minimizes gamma)
- `synthesis-report`: Achieved gamma, closed-loop singular value plots, and controller order

## Process

1. Formulate the generalized plant P(s): stack the performance outputs (W_p * S, W_u * KS, W_t * T) as the regulated output z, the exogenous input w as reference and disturbance, the control input u, and the measured output y. This is the standard two-port formulation.
2. Solve the H-infinity optimal control problem using Riccati-based synthesis (hinfsyn) or LMI-based synthesis. The result is a controller K(s) that minimizes gamma = ||T_{zw}||_infinity. If gamma < 1, all weighted performance specifications are met.
3. If gamma > 1, the specifications are infeasible. Relax the weights: reduce W_p bandwidth (accept slower tracking), increase W_t weight at lower frequencies (accept more noise), or increase W_u (accept more control effort). Iterate until gamma < 1.
4. Examine the controller K(s): check its order (typically equal to plant order plus weight orders), verify it is stable, and plot its frequency response. A very high-order controller can be reduced using balanced truncation while checking that the closed-loop gamma does not increase significantly.
5. Verify stability under uncertainty: with the multiplicative uncertainty model, check that ||W_m * T||_infinity < 1 (small gain theorem). This guarantees stability for all plants in the uncertainty set. Plot |W_m * T| vs frequency; the peak value is the inverse of the stability margin.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
