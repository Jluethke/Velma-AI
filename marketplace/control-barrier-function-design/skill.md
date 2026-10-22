# Control Barrier Function Design

Design control barrier functions that render the safe set forward-invariant, ensuring the system never leaves the safe region.

## Inputs

- `safe-set-definition`: Safe set C defined by h(x) >= 0
- `system-model`: Control-affine system dx/dt = f(x) + g(x)u

## Outputs

- `cbf-constraint`: The CBF condition on the control input: L_f h(x) + L_g h(x) * u >= -alpha(h(x)) that guarantees safety
- `cbf-qp-controller`: QP formulation that minimally modifies a nominal controller to satisfy the CBF constraint

## Process

1. Verify that h(x) is a valid control barrier function: for all x on the boundary of C (where h(x) = 0), there must exist a control input u such that h_dot = L_f h + L_g h * u >= 0. If L_g h = 0 on the boundary, the constraint has relative degree > 1 and a higher-order CBF (HOCBF) is needed.
2. Choose the class-K function alpha: alpha(h) = gamma * h with gamma > 0 is the simplest choice. Larger gamma allows the system to approach the boundary faster (more aggressive use of the safe set) but requires more control authority to enforce safety near the boundary. Smaller gamma is more conservative but easier to enforce.
3. Formulate the CBF-QP: minimize ||u - u_nominal||^2 subject to L_f h(x) + L_g h(x) * u >= -alpha(h(x)) for each constraint h_i. This finds the control closest to the nominal (performance-oriented) controller that satisfies all safety constraints. The QP is small (n_u variables, m constraints) and can be solved in real-time.
4. For multiple safety constraints, include each as a separate inequality in the QP. If the constraints conflict (no u satisfies all simultaneously), the problem is infeasible. Handle this by prioritizing constraints (relax lower-priority constraints first) or by designing the safe set to guarantee feasibility (pre-verified through reachability analysis).
5. For systems with relative degree > 1 (the control input does not appear in h_dot directly), use exponential CBF or HOCBF: define a sequence of functions psi_0 = h, psi_1 = psi_0_dot + alpha_1(psi_0), ..., psi_r = psi_(r-1)_dot + alpha_r(psi_(r-1)) where u appears in psi_r. The constraint becomes psi_r >= 0.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
