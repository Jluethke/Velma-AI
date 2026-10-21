# Python EKF Implementation With NumPy

**One-line description:** Implements the designed EKF in NumPy with Joseph-form covariance update, wrapped angle residuals and a per-update innovation log, and proves it with a finite-difference Jacobian test and a simulated-data NEES test under pytest.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `filter_design` (object, required): Output of `loc-ekf-model-design`.
- `noise_covariances` (object, required): Output of `loc-q-r-derivation`.
- `project_dir` (string, required): Python project root.

---

## Outputs

- `filter_impl` (string): Path of the filter module and the replay entry point script.
- `filter_unit_tests` (object): pytest results for Jacobian, symmetry, and simulated consistency tests.

---

## Phase 1: Write The Filter Core

### Entry Criteria
- `filter_design` has f(x), F, every h(x) and H.

### Actions
1. Create `<pkg>/ekf.py` with a class holding `x` (shape (n,)) and `P` (shape (n, n)). One file; do not split into many modules on the first pass.
2. `predict(dt)`: `x = f(x, dt)`, `F = F_jac(x, dt)`, `P = F @ P @ F.T + Q(dt)`, wrap yaw.
3. `update(z, h, H_jac, R, residual_fn)`:
   - `y = residual_fn(z, h(x))` (wraps angle components),
   - `S = H @ P @ H.T + R`,
   - `K = np.linalg.solve(S.T, (P @ H.T).T).T` (solve, not `inv`),
   - `x = x + K @ y`, wrap yaw,
   - Joseph form: `I_KH = I - K @ H; P = I_KH @ P @ I_KH.T + K @ R @ K.T`,
   - `P = 0.5 * (P + P.T)` to remove asymmetry from rounding.
4. Every update appends to a log: stamp, sensor name, `y`, `S`, and `d2 = y @ np.linalg.solve(S, y)`. This log is what NIS and gating read later.
5. `filterpy.kalman.ExtendedKalmanFilter` is an acceptable alternative; if used, pass `residual=` for angle wrapping and override `predict_x` for the nonlinear motion model, because its default predict is linear `F @ x`.

### Output
`ekf.py`.

### Quality Gate
- `python -c "import <pkg>.ekf"` exits 0.

---

## Phase 2: Unit Tests

### Entry Criteria
- Core written.

### Actions
1. `test_jacobians`: for random states, compare analytic F and each H against central finite differences (`eps = 1e-6`); assert `np.allclose(analytic, numeric, atol=1e-5)`. Wrap angle differences in the numeric Jacobian.
2. `test_covariance_spd`: after 1000 random predict and update cycles, `np.linalg.cholesky(P)` succeeds and `np.allclose(P, P.T)`.
3. `test_wrap`: a yaw residual of 359 degrees comes out as -1 degree.
4. `test_simulated_nees`: simulate the process model with Q noise and measurements with R noise from known truth for M runs; compute average NEES; assert it lies inside the two-sided chi-square interval from `scipy.stats.chi2.ppf` at the probability the user sets for `loc-nees-nis-consistency`, with M*n degrees of freedom divided by M.
5. Run `pytest -q`. Do not edit a test to pass; fix the filter.

### Output
`filter_unit_tests`.

### Quality Gate
- `pytest -q` prints zero failed and lists the four tests.

---

## Phase 3: Replay Entry Point

### Entry Criteria
- Tests pass.

### Actions
1. Write `scripts/run_ekf_on_bag.py <bag> <out_dir>` that reads topics with `rosbags.highlevel.AnyReader`, sorts all measurements by corrected stamp, runs predict to each stamp then update, and writes `estimate.tum` (timestamp x y z qx qy qz qw), `covariance.npy`, and `innovations.csv`.
2. Measurements of a sensor whose rejected flag is set by the gating rule are still logged with `rejected=1`.

### Output
`filter_impl`.

### Quality Gate
- Running the script on the bag writes all three files; `head -3 estimate.tum` shows 8 columns.

---

## Worked Example

Illustrative. `pytest -q` output: `4 passed in 3.12s`. `python scripts/run_ekf_on_bag.py bags/drive_2026_10_21 out/` prints `processed 240620 imu, 60150 odom, 12031 gnss; wrote out/estimate.tum`.

---

## Exit Criteria

DONE when the filter passes Jacobian, SPD, wrap and simulated NEES tests and the replay script writes estimate, covariance and innovation files.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `np.linalg.solve` raises singular matrix | **Adjust**: check R has no zero diagonal entries. |
| Phase 2 | Jacobian test fails | **Adjust**: fix the analytic derivative named by the failing index; do not loosen `atol`. |
| Phase 2 | Simulated NEES out of interval | **Stop**: the code or the Q discretization is wrong; real-data tuning cannot fix it. |
| Phase 3 | Estimate jumps at GNSS updates | **Return**: send to `loc-mahalanobis-gating` and check lever arm. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
