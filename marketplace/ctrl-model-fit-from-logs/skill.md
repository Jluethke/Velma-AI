# Fit And Validate The Bicycle Model From Logs

**One-line description:** Uses a read-only drive log to estimate the effective steering ratio, steering offset, actuator lag and transport delay, and to measure where the kinematic bicycle model's yaw rate prediction departs from the measured yaw rate, producing a `model_fit_report` the simulator and tuning flows read.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `plant_model` (object, required): From `ctrl-bicycle-model-py`.
- `drive_log` (object, required): From `ctrl-can-readonly-log`; decoded CSV with speed, steering angle and yaw rate.

---

## Outputs

- `model_fit_report` (object): Fitted steering ratio and offset with confidence intervals, estimated transport delay and first-order lag time constant for steering and longitudinal response where the log supports it, yaw-rate residual statistics binned by lateral acceleration, and plots saved as PNG.

---

## Phase 1: Prepare Segments

### Entry Criteria
- `drive_log` has speed, a steering signal and yaw rate.

### Actions
1. Load with `numpy.genfromtxt(path, delimiter=",", names=True)`. Drop rows marked invalid by the capture flow.
2. Remove segments below the minimum speed the user names for the fit (the steering-to-yaw relation is ill conditioned near zero speed). Record the threshold as user supplied.
3. Low-pass the yaw rate and steering with a zero-phase filter `scipy.signal.filtfilt(b, a, x)` from `scipy.signal.butter(N, Wn, fs=fs)`. The cutoff is a user choice; record it. Zero-phase filtering is acceptable offline only, never in the controller.
4. Compute measured lateral acceleration `ay = v * r` (r = yaw rate) for binning.

### Output
Cleaned segments.

### Quality Gate
- The number of samples kept and dropped per reason is printed.

---

## Phase 2: Fit Steering Ratio, Offset And Delay

### Entry Criteria
- Cleaned segments exist.

### Actions
1. Kinematic yaw rate prediction: `r_pred = v * tan((theta_hw - offset)/ratio) / L`, where theta_hw is the handwheel angle. If the log already has road wheel angle, fit only the offset.
2. Fit `ratio` and `offset` with `scipy.optimize.least_squares` on samples with |ay| below the low-lateral-acceleration bin the user selects. Report the fitted values and their standard errors from the Jacobian (`J = res.jac`, covariance `inv(J.T @ J) * s^2`).
3. Delay: compute the cross-correlation between measured yaw rate and `r_pred` with `scipy.signal.correlate` and `scipy.signal.correlation_lags`; the lag at the peak times the sample period is the combined steering-plus-measurement delay. Report the lag resolution (one sample period).
4. If the log contains a commanded steering signal and the measured angle (from an existing driver-assist feature observed passively), fit a first-order lag plus delay `G(s) = e^{-s T} / (tau s + 1)` with `least_squares` on the step-like segments. Otherwise record actuator lag as an open question to be measured on the bench by `ctrl-bench-actuation-test`.
5. Do not use the fitted ratio if its standard error is larger than the precision the user needs; record the open question instead.

### Output
Fitted parameters with uncertainties.

### Quality Gate
- Each fitted value has a standard error.
- The delay estimate is stated with its resolution in seconds.

---

## Phase 3: Validity Map

### Entry Criteria
- Parameters fitted.

### Actions
1. Bin samples by |ay| using bin edges the user chooses. For each bin report RMS and 95th percentile of `r_meas - r_pred` (`numpy.percentile`).
2. Plot residual versus |ay| with matplotlib, save `yaw_residual_vs_ay.png`.
3. State the lateral acceleration bin where the residual RMS first exceeds the user's model error tolerance. That bin is the kinematic model's measured validity edge for this vehicle. If the user gave no tolerance, report the table and add an open question.
4. Write `model_fit_report.json` with all values, units, filter settings, thresholds used and their sources.

### Output
`model_fit_report`.

### Quality Gate
- `model_fit_report.json` parses and contains `steering_ratio`, `steering_offset_rad`, `delay_s`, `residual_by_ay_bin`.
- The PNG files exist on disk.

---

## Worked Example

Illustrative only. 14 min log, user minimum fit speed 3 m/s, low-ay bin below 1 m/s^2.

- Phase 1: 41,200 samples kept, 9,800 dropped below 3 m/s.
- Phase 2: ratio 15.8 (se 0.07), offset 0.6 deg (se 0.05 deg), correlation peak at 6 samples of 0.02 s, so delay 0.12 s plus or minus 0.02 s. No commanded steering in the log, so actuator lag is an open question.
- Phase 3: residual RMS 0.004 rad/s below 1 m/s^2 rising to 0.031 rad/s in the 3 to 4 m/s^2 bin; the user's tolerance 0.02 rad/s is first exceeded at 3 m/s^2.

---

## Exit Criteria

DONE when ratio, offset and delay are fitted with uncertainty and the residual table shows where the kinematic model stops matching this vehicle.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No yaw rate in the log | **Return**: ask for a log containing yaw rate, or record the fit as not possible. |
| Phase 2 | least_squares does not converge | **Adjust**: give initial guesses from `control_spec` and bound the ratio to positive values; retry. |
| Phase 2 | Correlation peak is flat | **Adjust**: use segments with steering transients only; retry. |
| Phase 3 | Too few samples in high-ay bins | **Return**: report bins as insufficient; do not extrapolate. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
