# Wheel Odometry Scale And Steering Calibration

**One-line description:** Estimates the wheel speed scale factor against GNSS speed and the steering ratio and steering offset against gyro yaw rate by least squares on recorded drive data, then measures the residual noise that becomes the odometry measurement covariance.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `wheel_odom_model` (object, required): Output of `loc-can-wheel-odometry`.
- `sensor_bag` (string, required): rosbag2 path with CAN, IMU and GNSS topics from a human-driven drive.
- `vehicle_spec` (object, required): Wheelbase, track width, nominal steering ratio.

---

## Outputs

- `odom_calibration` (object): Speed scale factor, steering ratio, steering offset, each with standard error and the data segments used.
- `wheel_odom_noise` (object): Standard deviation of vx and yaw rate residuals after calibration, with units and sample counts, for use as measurement covariance.

---

## Phase 1: Select Calibration Segments

### Entry Criteria
- The drive was done by a licensed human driver. No software actuation is involved in this flow.
- GNSS fix quality in the segments is the best the receiver provides on that drive (for example RTK fixed if available); record the fix type.

### Actions
1. Speed segments: straight, constant speed, GNSS speed available. Select by |gyro z| below the gyro noise level from `imu_noise_params` or the datasheet, and GNSS fix valid.
2. Steering segments: steady turns of several radii in both directions, at speeds low enough that tire slip is small. Select by steering angle roughly constant over the window.
3. Exclude standstill samples (speed zero) from ratio fits; they carry no information and bias a ratio.
4. List each segment with start time, end time and sample count.

### Output
Segment table.

### Quality Gate
- At least one left-turn and one right-turn steering segment are present; if not, report it.

---

## Phase 2: Fit Parameters

### Entry Criteria
- Segments selected.

### Actions
1. Speed scale s: least squares on v_gnss = s * v_wheel over speed segments. GNSS speed is from the receiver's Doppler velocity (for example `ublox` NAV-PVT `gSpeed`, or a `TwistWithCovarianceStamped` topic), not from differentiated positions.
2. Steering: with the bicycle model yaw_rate = v * tan((theta_sw - theta_0)/R) / L, fit ratio R and offset theta_0 with `scipy.optimize.least_squares` against gyro yaw rate minus the gyro bias estimated on a static segment.
3. Report the standard error of each parameter from the Jacobian returned by `least_squares` (covariance = inv(J^T J) * residual variance).
4. If the fit for R changes by more than its standard error when you split the data into left and right turns, the steering map is asymmetric or nonlinear; fit a lookup table versus steering angle instead and say so.

### Output
`odom_calibration`.

### Quality Gate
- Each parameter has a value, a standard error and a sample count.
- Left-only and right-only fits for R are both reported.

---

## Phase 3: Measure Post-Calibration Noise

### Entry Criteria
- Parameters fitted.

### Actions
1. Apply the calibration to a held-out part of the drive not used in Phase 2.
2. Compute residuals v_gnss - s*v_wheel and gyro_z - yaw_rate_model on the held-out data.
3. Report the residual standard deviation and mean for each. These standard deviations squared become the diagonal of the odometry twist covariance in `loc-q-r-derivation`.
4. Check residual whiteness with an autocorrelation plot. Strongly correlated residuals mean an unmodeled effect (slip, bias) and the white-noise covariance will understate the real error; record that in the output.

### Output
`wheel_odom_noise`.

### Quality Gate
- Held-out residual statistics are reported with sample counts and units.
- Autocorrelation plot path is listed.

---

## Worked Example

Illustrative. Speed fit over 410 s of straights: s = 1.0172, standard error 0.0004 (tires smaller than nominal). Steering fit: R = 15.62 (std err 0.05), theta_0 = 1.8 deg (std err 0.1). Left-only R 15.58, right-only R 15.66: within about one standard error, so linear map accepted.

Held-out residuals: vx std 0.06 m/s, yaw rate std 0.012 rad/s, autocorrelation drops below the 95 percent band after 3 lags.

---

## Exit Criteria

DONE when scale, ratio and offset have values with standard errors, and held-out residual noise is reported with a whiteness check.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No GNSS Doppler velocity available | **Adjust**: use RTK position differences over long windows and mark the scale estimate as lower quality. |
| Phase 1 | Only one turn direction recorded | **Retry**: record a drive with turns in both directions. |
| Phase 2 | Fit does not converge | **Adjust**: start from the nominal ratio in `vehicle_spec` and check signal units. |
| Phase 3 | Residuals strongly correlated | **Return**: report it; downstream inflates R or adds a bias state. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
