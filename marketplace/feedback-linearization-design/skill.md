# Feedback Linearization Design

Design an exact feedback linearization controller that transforms the nonlinear system into a linear one via a coordinate change and nonlinear state feedback.

## Inputs

- `system-equations`: Nonlinear state equations
- `system-analysis`: Relative degree, zero dynamics stability confirmation

## Outputs

- `linearizing-controller`: The nonlinear feedback law u = alpha(x) + beta(x)*v that renders the input-output map linear, plus the linear outer-loop controller for v
- `implementation-requirements`: States that must be measured or estimated, computational requirements, and sensitivity to model errors

## Process

1. Compute the Lie derivatives: L_f^k h(x) for k = 0 to r-1, and L_g L_f^(r-1) h(x). The feedback linearizing law is u = (1 / L_g L_f^(r-1) h) * (-L_f^r h + v) where v is the new input to the linearized system.
2. Design the outer-loop linear controller for v to place the closed-loop poles of the linearized (y, dy, ..., d^(r-1)y) dynamics. For tracking, v = y_ref^(r) + k_(r-1)*(y_ref^(r-1) - y^(r-1)) + ... + k_0*(y_ref - y). Choose gains k_i for desired closed-loop bandwidth and damping.
3. If r < n, monitor the zero dynamics states during simulation. Even though they are uncontrollable from this output, they must remain bounded. If they diverge for certain reference trajectories, the trajectory is infeasible.
4. Assess robustness: feedback linearization cancels the nonlinearity exactly, so model errors create residual nonlinearity. Quantify the effect: if the model error is delta_f in f(x) and delta_g in g(x), the closed-loop error is approximately (delta_f + delta_g * u_nominal). Large u_nominal amplifies model errors.
5. For implementation, all states must be available (measured or estimated via a nonlinear observer). The control law requires real-time evaluation of Lie derivatives, which involves partial derivatives of f, g, and h. Verify that this computation fits within the control loop sample time.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
