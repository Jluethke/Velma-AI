# MPC Formulation As A Sparse QP

**One-line description:** Writes a linear time-varying tracking MPC for the kinematic bicycle as a sparse quadratic program (states, inputs, input-rate constraints, soft state constraints with slack), decides between OSQP and acados from a decision table, and checks the matrices before any solver is wired in.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `plant_model` (object, required): From `ctrl-bicycle-model-py`; provides `jacobians`.
- `reference_trajectory` (object, required): From `ctrl-speed-profile-jerk-limited`.
- `control_spec` (object, required): Supplies limits, controller period, and the user's horizon length and weights if already chosen.

---

## Outputs

- `mpc_problem` (object): The written formulation (variables, dynamics, cost, constraints, slack), `control/mpc_qp.py` that builds `P, q, A, l, u` for a given state and reference window, dimension table, solver decision with reasons, and tests on matrix structure.

---

## Phase 1: Write The Problem

### Entry Criteria
- `jacobians` exists and is tested.

### Actions
1. State `x = [px, py, psi, v]`, input `u = [a, delta]`. Horizon `N` steps of `dt_mpc` (user choice; total preview `N dt_mpc` should cover the stopping distance at `v_max_test` under `decel_max`, computed as `v^2 / (2 decel_max)`; print it).
2. Linear time-varying model: linearize at each reference point k: `x_{k+1} = Ad_k x_k + Bd_k u_k + c_k`, with `Ad_k = I + A_k dt`, `Bd_k = B_k dt` (forward Euler, acceptable when `dt_mpc` is small relative to the dynamics; otherwise use `scipy.linalg.expm` on the augmented matrix) and `c_k = f(xr_k, ur_k) dt + xr_k - Ad_k xr_k - Bd_k ur_k`.
3. Cost: `sum_k (x_k - xr_k)' Q (x_k - xr_k) + u_k' R u_k + (u_k - u_{k-1})' R_d (u_k - u_{k-1}) + (x_N - xr_N)' Q_N (x_N - xr_N)`. Weights are user tuning values; Q_N from the discrete Riccati solution of the last stage is a documented choice (record if used).
4. Hard input constraints: `|delta| <= delta_max`, `-decel_max <= a <= a_max`. Input rate: `|delta_k - delta_{k-1}| <= rate_max dt_mpc`, `|a_k - a_{k-1}| <= jerk_max dt_mpc`, with `u_{-1}` equal to the last applied command.
5. State constraints (for example a lateral corridor) are soft: add slack `s >= 0` with linear plus quadratic penalty so the QP is always feasible. Never make state constraints hard in a real-time loop.

### Output
Formulation document in `mpc_problem`.

### Quality Gate
- The document lists every variable, constraint and weight with a source (user or derived).

---

## Phase 2: Sparse Matrices

### Entry Criteria
- Formulation written.

### Actions
1. Decision vector `z = [x_0..x_N, u_0..u_{N-1}, s]`. Size `nz = 4 (N+1) + 2N + ns`.
2. Equality rows: `x_0 = x_meas` and the N dynamics rows, written as `l = u = rhs` rows in `A` (OSQP convention: `l <= A z <= u`).
3. Inequality rows: input bounds, rate rows (difference matrix), soft constraint rows with slack.
4. Build with `scipy.sparse.block_diag`, `scipy.sparse.kron`, `scipy.sparse.vstack`; convert `P` to upper triangle CSC: `scipy.sparse.triu(P, format="csc")`.
5. Implement `build_qp(x_meas, u_prev, ref_window) -> P, q, A, l, u` in `control/mpc_qp.py`. Keep the sparsity pattern fixed across calls so solvers can update values only (OSQP `update(Px=..., Ax=...)` requires an unchanged pattern).

### Output
`control/mpc_qp.py`.

### Quality Gate
- A pytest asserts `P.shape == (nz, nz)`, `A.shape[1] == nz`, `numpy.all(l <= u)`, and that the sparsity pattern (`A.indices`, `A.indptr`) is identical for two different reference windows.

---

## Phase 3: Solver Decision

### Entry Criteria
- Matrices build.

### Actions
1. Decision table:

| Condition | Choice |
|---|---|
| Linear time-varying QP above, Python prototype or C via OSQP code generation, moderate N | OSQP (`ctrl-mpc-osqp-py`) |
| Nonlinear model kept in the optimizer, real-time iteration needed, embedded C target | acados with SQP_RTI and HPIPM (`ctrl-mpc-acados`) |
| Model valid only with tire forces (dynamic bicycle) at higher lateral acceleration | acados with the nonlinear dynamic model |

2. Record measured, not assumed, solve time later; the decision here is provisional until `ctrl-closed-loop-sim-py` measures the worst-case solve time against the controller period.
3. Sanity solve: solve one instance with a dense reference solver (`cvxpy` with its default QP solver) and keep the solution as a golden vector for the solver flows.

### Output
`mpc_problem`.

### Quality Gate
- The golden solution file exists and the cvxpy problem status prints `optimal`.

---

## Worked Example

Illustrative only. N = 30, dt_mpc = 0.05 s (1.5 s preview); stopping distance at 6.94 m/s with decel 3.0 is 8.0 m, covered by 1.5 s at that speed (10.4 m).

- Phase 2: nz = 4 * 31 + 60 + 0 = 184; A has 124 equality rows and 240 inequality rows.
- Phase 3: Python prototype and linear model, so OSQP; cvxpy golden status `optimal`.

---

## Exit Criteria

DONE when `build_qp` returns well-formed sparse matrices with a fixed pattern, a golden solution exists, and the solver choice is recorded with reasons.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Preview shorter than stopping distance | **Adjust**: raise N or dt_mpc; record. |
| Phase 2 | Pattern changes between calls | **Adjust**: insert explicit zeros so the pattern is constant. |
| Phase 3 | cvxpy reports infeasible | **Adjust**: check that state constraints are soft and `u_prev` lies within bounds. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
