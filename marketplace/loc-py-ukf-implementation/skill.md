# Python UKF Implementation With filterpy

**One-line description:** Implements the designed filter as an Unscented Kalman Filter with filterpy's `UnscentedKalmanFilter` and `MerweScaledSigmaPoints`, with angle-aware mean and residual functions, tested on simulated data under pytest.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `filter_design` (object, required): Output of `loc-ekf-model-design` with formulation UKF.
- `noise_covariances` (object, required): Output of `loc-q-r-derivation`.
- `project_dir` (string, required): Python project root.

---

## Outputs

- `filter_impl` (string): Path of the UKF module and replay script.
- `filter_unit_tests` (object): pytest results.

---

## Phase 1: Configure Sigma Points And Functions

### Entry Criteria
- `filter_design` has f(x) and each h(x).
- `pip install filterpy numpy scipy rosbags pytest` done; record the filterpy version.

### Actions
1. `points = MerweScaledSigmaPoints(n=n, alpha=alpha, beta=2.0, kappa=kappa)`. beta = 2 is optimal for Gaussian priors per Van der Merwe (2004). alpha is a user input; record it and its source. A common documented choice is kappa = 3 - n or 0; record which.
2. `ukf = UnscentedKalmanFilter(dim_x=n, dim_z=m, dt=dt, fx=fx, hx=hx, points=points)`.
3. Angle handling: set `ukf.x_mean_fn` to a function that computes the yaw component as `atan2(sum(w*sin), sum(w*cos))`; set `ukf.residual_x` and `ukf.residual_z` to functions that wrap angle components. Without these, sigma points straddling plus or minus pi average to zero yaw.
4. For several sensors with different z sizes, call `ukf.update(z, R=R_sensor, hx=hx_sensor)`; filterpy accepts `hx` and `R` overrides per call. Confirm in your installed version by reading `help(UnscentedKalmanFilter.update)`.

### Output
`<pkg>/ukf.py`.

### Quality Gate
- `python -c "import <pkg>.ukf"` exits 0.
- `help(UnscentedKalmanFilter.update)` output confirms the `hx` and `R` keyword arguments.

---

## Phase 2: Tests

### Entry Criteria
- Module imports.

### Actions
1. `test_mean_wrap`: sigma points at yaw 179 and -179 degrees average to 180, not 0.
2. `test_linear_equivalence`: on a linear model, the UKF state and covariance after one predict and update match a hand-written KF within 1e-9 (the unscented transform is exact for linear models).
3. `test_spd`: after many cycles `np.linalg.cholesky(ukf.P)` succeeds. If it fails, filterpy raises inside `sigma_points`; record the step.
4. `test_simulated_nees`: same method as the EKF flow, with the user's probability.
5. Run `pytest -q`.

### Output
`filter_unit_tests`.

### Quality Gate
- `pytest -q` prints zero failed.

---

## Phase 3: Replay Script

### Entry Criteria
- Tests pass.

### Actions
1. Write `scripts/run_ukf_on_bag.py <bag> <out_dir>`, ordering measurements by corrected stamp and calling `ukf.predict(dt=...)` with the actual dt per step.
2. After each update, log `ukf.y` (residual), `ukf.S` (innovation covariance) and `ukf.mahalanobis` (filterpy computes it after update; confirm the attribute exists in your version).
3. Write `estimate.tum`, `covariance.npy`, `innovations.csv`.

### Output
`filter_impl`.

### Quality Gate
- All three files are written; `estimate.tum` has 8 columns.

---

## Worked Example

Illustrative. n = 5 (x, y, yaw, v, yaw_rate), alpha = 0.1 (user input), beta = 2, kappa = 3 - 5 = -2 recorded. `pytest -q` prints `4 passed`. A run starting with yaw variance (pi)^2 converges to the GNSS course within the first turn without the divergence the EKF showed.

---

## Exit Criteria

DONE when the UKF passes wrap, linear equivalence, SPD and simulated NEES tests and writes replay outputs.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Negative kappa makes P non-SPD | **Adjust**: set kappa = 0 and record the change. |
| Phase 2 | Cholesky failure in `sigma_points` | **Adjust**: check Q and R are SPD and symmetrize P after update. |
| Phase 2 | Linear equivalence fails | **Stop**: the fx or hx wiring is wrong. |
| Phase 3 | Attribute missing in installed filterpy | **Adjust**: compute Mahalanobis from `y` and `S` directly. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
