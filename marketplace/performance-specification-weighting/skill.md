# Performance Specification Weighting

Translate closed-loop performance requirements into frequency-domain weighting functions for the H-infinity synthesis.

## Inputs

- `control-objectives`: Desired bandwidth, tracking accuracy, disturbance rejection, noise sensitivity, and control effort limits
- `uncertainty-model`: Uncertainty bounds that limit achievable performance

## Outputs

- `sensitivity-weights`: Weighting functions W_p(s) for sensitivity, W_u(s) for control sensitivity, W_t(s) for complementary sensitivity
- `design-trade-off-map`: Bode plot showing where each weight dominates and how the trade-offs interact

## Process

1. Design the sensitivity weight W_p(s) to enforce tracking and disturbance rejection at low frequencies. W_p should be large (high gain) below the desired bandwidth and roll off above it. A standard form: W_p(s) = (s/M + w_b) / (s + w_b * A) where w_b is the desired bandwidth, A is the maximum steady-state error, and M is the peak sensitivity (typically 1.5 to 2.0).
2. Design the complementary sensitivity weight W_t(s) to enforce noise rejection and stability margin at high frequencies. W_t limits the closed-loop bandwidth and should be large above the frequency where model uncertainty exceeds the nominal model. If the multiplicative uncertainty W_m is known, set W_t >= W_m to guarantee stability for all plants in the uncertainty set via the small gain theorem.
3. Design the control sensitivity weight W_u(s) to limit actuator effort. W_u penalizes large control signals and can enforce actuator bandwidth limits. Set W_u based on the inverse of the maximum allowable control signal magnitude at each frequency.
4. Check the algebraic constraint: S + T = I means you cannot make both sensitivity and complementary sensitivity small at the same frequency. The weights must be compatible: W_p should be large where W_t is small and vice versa. The crossover region where both are moderate is the closed-loop bandwidth.
5. Plot all weights on a single Bode magnitude plot to verify the design makes physical sense: low-frequency tracking (W_p large), high-frequency roll-off (W_t large), and a clear bandwidth region in between.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
