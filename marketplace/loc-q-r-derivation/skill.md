# Deriving Q And R From Sensor Noise

**One-line description:** Converts measured and datasheet noise figures into the filter's discrete process noise Q and measurement noise R with documented unit conversions and discretization, so every covariance entry traces to a measurement, a datasheet line, or a stated user input.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `filter_design` (object, required): Output of `loc-ekf-model-design`.
- `imu_noise_params` (object, required): Output of `loc-imu-allan-variance`.
- `wheel_odom_noise` (object, required): Output of `loc-wheel-odom-calibration`.
- `gnss_noise_model` (object, required): Output of `loc-gnss-fix-quality-model`.

---

## Outputs

- `noise_covariances` (object): Continuous noise spectral densities, the discretization used, Q as a function of dt, R per sensor and per fix type, initial covariance P0, and a provenance table naming the source of every entry.

---

## Phase 1: Measurement Noise R

### Entry Criteria
- All three noise inputs present with units.

### Actions
1. Wheel odometry: R_odom = diag(sigma_vx^2, sigma_yawrate^2) from `wheel_odom_noise`.
2. GNSS position: R per fix type from the `gnss_noise_model` rule.
3. IMU used as a measurement at rate fs: discrete sigma = N * sqrt(fs), where N is the white noise density from `imu_noise_params` in units/sqrt(Hz). Example: N = 1.2e-4 rad/s/sqrt(Hz), fs = 200 Hz gives sigma = 1.7e-3 rad/s.
4. Do not reduce R below the measured value to "trust the sensor more". That produces an inconsistent filter that NEES and NIS will flag.

### Output
R table.

### Quality Gate
- Every R entry has a unit and a source row in the provenance table.

---

## Phase 2: Process Noise Q

### Entry Criteria
- R table done.

### Actions
1. IMU as propagation input (error-state INS): continuous noise densities are gyro N_g^2 and accel N_a^2 for angle and velocity random walk; bias random walk densities come from K, or from B with a first-order Gauss-Markov model whose correlation time is a user input. Discrete Q_k = G Qc G^T dt for small dt (first-order approximation; state that it is first order).
2. Kinematic model without IMU input (CTRV, constant velocity): the noise is the unmodeled acceleration and yaw acceleration. Their spectral densities are not sensor properties. Get them from a user input describing the expected maneuvering (for example maximum longitudinal and lateral acceleration of the drive profile) or from the drive data: compute the std of measured acceleration from the IMU over the drive and record it as the source.
3. For a white-acceleration model on [p, v], the discrete Q is q * [[dt^3/3, dt^2/2], [dt^2/2, dt]] (Bar-Shalom, Li, Kirubarajan 2001, continuous white noise acceleration model). Use the matching form for each kinematic channel.
4. robot_localization takes a fixed `process_noise_covariance` scaled by dt internally; if `dynamic_process_noise_covariance` is true it is also scaled by velocity. Record which is used.

### Output
Q definition.

### Quality Gate
- Every nonzero Q entry has a provenance row: measurement, datasheet, or named user input.

---

## Phase 3: Initial Covariance And Handoff

### Entry Criteria
- Q and R done.

### Actions
1. P0 from the initialization rule in `filter_design`: position variance from the first GNSS fix R, yaw variance large (for example (pi)^2 when unknown, which is a statement of ignorance, not a tuned number), velocity variance small only if starting static.
2. Write the provenance table with columns: matrix, entry, value, unit, source.
3. List entries whose source is a user input as open items for the NEES and NIS check to confirm or refute. That check is the only allowed path for changing them, and changes are recorded with before and after values.

### Output
`noise_covariances`.

### Quality Gate
- Provenance table has a row for every nonzero entry of Q, R and P0.
- User-input entries are listed as open items.

---

## Worked Example

Illustrative. Wheel odometry sigma_vx 0.06 m/s, sigma_yawrate 0.012 rad/s, R_odom = diag(0.0036, 1.44e-4). GNSS RTK fixed sigma 0.010 m horizontal, R = diag(1e-4, 1e-4). CTRV kinematic Q: drive data accel std 0.9 m/s^2 gives q_v = 0.81 (m/s^2)^2 per second as spectral density, marked "drive data, open item".

---

## Exit Criteria

DONE when Q, R and P0 are fully specified with units and every entry has a provenance row.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Noise input missing units | **Stop**: return to the producing flow; unit errors are the most common Q/R fault. |
| Phase 2 | No basis for kinematic process noise | **Return**: request the drive profile as a user input or use drive-data acceleration std, and mark it open. |
| Phase 3 | NEES or NIS later shows inconsistency | **Retry**: revise only the open-item entries, record the change, and rerun the consistency check. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
