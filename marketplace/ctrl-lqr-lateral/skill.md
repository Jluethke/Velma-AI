# LQR Lateral Controller On Path Error Dynamics

**One-line description:** Designs a speed-scheduled discrete LQR steering controller on the lateral error dynamics (kinematic two-state model, or the four-state dynamic bicycle error model when cornering stiffness is known), with Bryson's rule weights from user tolerances, curvature feedforward and gain-table interpolation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `reference_trajectory` (object, required): From `ctrl-speed-profile-jerk-limited`.
- `plant_model` (object, required): From `ctrl-bicycle-model-py`.
- `control_spec` (object, required): Supplies L, lf, lr, mass, and if known yaw inertia and cornering stiffness, controller period and error tolerances.

---

## Outputs

- `lqr_controller` (object): Path to `control/lqr_lateral.py`, the gain table `K(v)` saved as `lqr_gains.npz`, the model variant used, Q and R with derivation, closed-loop eigenvalue magnitudes per speed, and tests.

---

## Phase 1: Choose The Error Model

### Entry Criteria
- `control_spec` loaded.

### Actions
1. Decision table:

| Data available | Model |
|---|---|
| Cornering stiffness Cf, Cr and yaw inertia Iz measured or documented | Dynamic error model, state `[e, e_dot, e_psi, e_psi_dot]` (Rajamani, Vehicle Dynamics and Control, sec. 2.5 and 3.2) |
| Missing any of those | Kinematic error model, state `[e, e_psi]` |

2. Kinematic model, linearized about straight driving at speed v: `e_dot = v e_psi`, `e_psi_dot = (v / L) delta - v kappa`. Input `delta`, disturbance `kappa`.
3. Dynamic model: use the error-state matrices from Rajamani section 2.5 (check the equation number in your edition) with `Cf`, `Cr`, `m`, `Iz`, `lf`, `lr` and speed v. Do not substitute textbook example values for Cf and Cr.
4. If the delay from `model_fit_report` is at least one controller period, augment the state with the delayed steering inputs (one state per period of delay) so the LQR sees the delay.

### Output
Continuous `A(v)`, `B(v)` and the disturbance matrix.

### Quality Gate
- The variant and every parameter source are printed.

---

## Phase 2: Weights And Gain Table

### Entry Criteria
- Model chosen.

### Actions
1. Bryson's rule (Bryson and Ho, Applied Optimal Control, 1975): `Q = diag(1 / e_max^2, 1 / e_psi_max^2, ...)`, `R = 1 / delta_max_use^2`, where `e_max`, `e_psi_max` are the user's acceptable errors and `delta_max_use` the steering magnitude the user is willing to use. These are user inputs; record them.
2. Discretize at the controller period: `scipy.signal.cont2discrete((A, B, C, D), dt, method="zoh")`.
3. Solve `P = scipy.linalg.solve_discrete_are(Ad, Bd, Q, R)` and `K = inv(R + Bd.T P Bd) Bd.T P Ad`.
4. Repeat over a speed grid from the lowest engage speed the user sets to `v_max_test`. Save `v_grid`, `K_grid` to `lqr_gains.npz`.
5. For each speed print `abs(numpy.linalg.eigvals(Ad - Bd K))`. All must be below 1 (discrete stability).
6. Feedforward for steady curvature: kinematic case `delta_ff = L kappa`; dynamic case use the steady-state feedforward derived in Rajamani chapter 3 (includes understeer gradient term `K_v a_y`). Record which.

### Output
Gain table and eigenvalue report.

### Quality Gate
- Every speed in the grid has all closed-loop eigenvalue magnitudes below 1 (printed table).
- `numpy.load("lqr_gains.npz")` contains `v_grid` and `K_grid` with matching first dimension.

---

## Phase 3: Implement And Test

### Entry Criteria
- Gains stable at every grid speed.

### Actions
1. `control/lqr_lateral.py`: compute errors at the rear axle (kinematic) or center of mass (dynamic, matching the model), interpolate each gain entry over speed with `numpy.interp` (clamp at grid ends), `delta = -K x + delta_ff`.
2. Below the lowest grid speed, hold the controller disengaged and flag `below_min_speed`; do not extrapolate gains.
3. pytest:
   - On-path straight: `delta == 0`.
   - Circle: steady-state error with feedforward is smaller than without (print both).
   - Gain interpolation at a grid point equals the stored gain exactly.
   - Closed loop with the nonlinear kinematic plant from an offset start converges.
4. Run `python -m pytest tests/test_lqr_lateral.py -q`.

### Output
`lqr_controller`.

### Quality Gate
- pytest all passed.

---

## Worked Example

Illustrative only. Kinematic variant (no cornering stiffness), L 2.7 m, dt 0.02 s, user tolerances e_max 0.3 m, e_psi_max 0.1 rad, delta_max_use 0.3 rad.

- Phase 2: Q = diag(11.1, 100), R = 11.1; at 5 m/s K = [0.84, 2.31], eigenvalue magnitudes 0.962, 0.958.
- Phase 3: circle R 25 m: 0.36 m error without feedforward, 0.004 m with. `pytest -q`: `4 passed`.

---

## Exit Criteria

DONE when a stable gain table covers the speed range, weights trace to user tolerances, and the controller tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cornering stiffness missing but dynamic model wanted | **Adjust**: use the kinematic variant and record an open question. |
| Phase 2 | `solve_discrete_are` raises LinAlgError | **Adjust**: check (A, B) stabilizability at that speed; v = 0 makes the kinematic model uncontrollable, so start the grid above zero. |
| Phase 2 | Eigenvalue magnitude at or above 1 | **Stop**: do not ship that table; recheck discretization. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
