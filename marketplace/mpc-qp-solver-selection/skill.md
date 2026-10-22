# Mpc Qp Solver Selection

Select and configure the quadratic programming solver for real-time execution within the control loop sample time.

## Inputs

- `mpc-tuning-parameters`: Problem dimensions (N_p, N_c, number of inputs, outputs, constraints)
- `constraint-matrices`: Number and type of constraints
- `mpc-sample-time-rationale`: Available computation time per sample

## Outputs

- `solver-configuration`: Selected solver, warm-starting strategy, iteration limits, and fallback behavior for solver failure
- `worst-case-timing-analysis`: Measured or estimated worst-case solve time vs available time, and what happens when the solver exceeds the time budget

## Process

1. Calculate QP size: number of decision variables = N_c * n_u (inputs over control horizon); number of inequality constraints = 2 * (N_c * n_u + N_p * n_y) for box constraints on inputs and outputs. This determines which solver class is appropriate.
2. For small QP (under 100 variables, under 200 constraints): active set methods (qpOASES) are fast and provide exact solutions. Warm-starting from the previous solution's active set makes typical solves very fast (few pivots).
3. For medium QP (100 to 1000 variables): interior point methods (ECOS, MOSEK) or ADMM-based methods (OSQP) are competitive. OSQP is good for embedded because it avoids matrix factorization updates and has predictable per-iteration cost.
4. For large QP or nonlinear MPC: use structure-exploiting solvers (FORCES Pro, acados) that exploit the banded structure of the MPC problem for O(N) per-iteration complexity instead of O(N^3).
5. Implement warm-starting: shift the previous solution by one time step (discard first move, duplicate last move) as initial guess. This typically reduces solve iterations by 50% to 80%.
6. Define fallback behavior when the solver fails to converge within the iteration limit: apply the second element of the previous solution (since the first was already applied), and set an alarm. Never apply a zero input on solver failure unless zero is a safe default.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
