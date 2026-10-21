# Mahalanobis Outlier Gating For Filter Updates

**One-line description:** Sets chi-square Mahalanobis gates for each measurement type from a user-chosen probability and the measurement dimension, applies them in robot_localization's rejection thresholds or a custom filter's update, and reports what was rejected and why, including the persistent-rejection trap.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `estimate_log` (object, required): Output of `loc-filter-bag-replay`.
- `filter_design` (object, required): Output of `loc-ekf-model-design` (measurement dimensions).
- `gate_probability` (number, required): User-chosen probability that a consistent measurement passes the gate (for example 0.99 or 0.999). This is a user decision, not a default.
- `reject_streak_limit` (integer, optional): Number K of consecutive rejected absolute-sensor updates that triggers reinitialization. If absent, report it as an open question and do not invent one.

---

## Outputs

- `gating_config` (object): Per measurement type: dimension, squared gate from the chi-square quantile, the robot_localization threshold value (gate distance, not squared) if applicable, and the persistent-rejection rule.
- `rejected_measurements` (object): Count and time list of rejected updates per sensor on the replay, with the squared distances.

---

## Phase 1: Compute Gates

### Entry Criteria
- `gate_probability` given by the user.

### Actions
1. For each measurement type with dimension m (GNSS 2D position m = 2, wheel twist vx and vyaw m = 2, IMU yaw rate m = 1): `g2 = scipy.stats.chi2.ppf(gate_probability, m)`.
2. robot_localization compares the squared Mahalanobis distance against the square of the configured threshold, so its `*_rejection_threshold` value is `sqrt(g2)`. Confirm by reading `filter_base.cpp` (`checkMahalanobisThreshold`) in your installed version.
3. Custom filters: reject when `d2 = y^T S^-1 y > g2` using the solve already in the update.
4. Persistent-rejection rule: if K consecutive updates from an absolute sensor are rejected, the filter has likely diverged and the gate is now hiding the truth. K is `reject_streak_limit`. Response: reinitialize position from the sensor and inflate P, and log the event. Never leave a gate that can reject forever.

### Output
Draft `gating_config`.

### Quality Gate
- Every gate shows m, `gate_probability` and the `chi2.ppf` value printed by the command.

---

## Phase 2: Apply And Replay

### Entry Criteria
- Gates computed.

### Actions
1. ROS 2: set `odom1_pose_rejection_threshold` (GNSS in the map EKF), `odom0_twist_rejection_threshold`, `imu0_angular_velocity_rejection_threshold`. Replay.
2. Python or C++: read `innovations.csv` from `estimate_log`; mark `d2 > g2`. Then rerun the replay with gating enabled so rejected updates are not applied.
3. Count rejections per sensor. The expected fraction for a consistent filter is about `1 - gate_probability`. A much larger fraction means R or Q is too small, not that the sensor is bad.
4. List rejected GNSS updates with stamps and fix type. Rejections clustered in a tunnel or under trees are expected multipath; rejections spread evenly are a tuning problem.

### Output
`rejected_measurements`.

### Quality Gate
- Rejection fraction per sensor is reported next to `1 - gate_probability`.

---

## Phase 3: Decide

### Entry Criteria
- Rejection counts reported.

### Actions
1. Apply this table:

   | Observation | Action |
   |---|---|
   | Fraction near `1 - gate_probability`, rejections at known bad spots | accept gates |
   | Fraction far above, spread over the drive | return to `loc-nees-nis-consistency` and `loc-q-r-derivation`; do not widen the gate to hide it |
   | Consecutive-rejection reinit fired | inspect the time window; check lever arm and time offset |
   | Zero rejections with obvious multipath jumps visible | R too large; check provenance |

2. Freeze `gating_config`.

### Output
`gating_config`.

### Quality Gate
- The table row chosen is recorded with the observed numbers.

---

## Worked Example

Illustrative. `gate_probability` 0.999. `python -c "from scipy.stats import chi2; print(chi2.ppf(0.999,2))"` prints 13.8155, so g2 = 13.82 and robot_localization threshold = 3.717. Replay: GNSS 11 of 12031 rejected (0.09 percent, expected 0.1), all inside an underpass at t = 640 to 652 s. Gates accepted.

---

## Exit Criteria

DONE when each measurement type has a gate derived from `gate_probability`, a persistent-rejection rule, and a replay rejection report interpreted with the decision table.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | User gives no probability | **Stop**: ask for it; do not pick one. |
| Phase 2 | Innovations not exposed (ros2) | **Adjust**: report rejection counts from `/diagnostics` or debug output, and state the limitation. |
| Phase 3 | Large spread rejection fraction | **Return**: send to Q and R revision, keeping the gate. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
