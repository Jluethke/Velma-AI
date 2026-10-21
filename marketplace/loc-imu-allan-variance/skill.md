# IMU Allan Variance Noise Characterization

**One-line description:** Extracts gyro and accelerometer white noise density, bias instability and rate random walk from a long static IMU log with an overlapping Allan deviation plot, following the slope method of IEEE Std 952, and compares them against the datasheet.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sensor_bag` (string, required): rosbag2 path from `loc-rosbag2-drive-logging`, or a separate static recording.
- `imu_topic` (string, required): IMU topic name, for example `/imu/data_raw`.
- `sensor_datasheets` (object, required): Datasheet noise figures with units: gyro noise density, accel noise density, bias instability if given.

---

## Outputs

- `imu_noise_params` (object): Per axis: gyro white noise N (rad/s/sqrt(Hz)), gyro bias instability B, gyro rate random walk K, and the same three for the accelerometer, each with the tau where it was read, plus the datasheet comparison.

---

## Phase 1: Extract The Static Segment

### Entry Criteria
- The vehicle was parked and not touched for the static segment. Engine running adds vibration; record whether it was on.
- The static segment length is known. Long-tau terms need long records; IEEE Std 952 practice uses recordings of hours for bias instability.

### Actions
1. Read the bag in Python without a ROS install: `pip install rosbags numpy allantools matplotlib`, then use `from rosbags.highlevel import AnyReader` to iterate `imu_topic` and pull `header.stamp`, `angular_velocity`, `linear_acceleration`.
2. Cut the static segment by time. Check it is static: the standard deviation of each gyro axis over 1-second windows must not jump; plot it and inspect.
3. Compute the sample rate from timestamps: `fs = 1 / median(diff(t))`. Check for gaps: report any `diff(t)` greater than twice the median.

### Output
Static arrays per axis and the sample rate.

### Quality Gate
- Number of gaps reported (zero or listed with times).
- `fs` printed and within the driver's configured rate.

---

## Phase 2: Compute And Read Allan Deviation

### Entry Criteria
- Static arrays exist.

### Actions
1. For each axis: `taus, adev, adev_err, n = allantools.oadev(x, rate=fs, data_type="freq", taus="octave")` where `x` is rate (rad/s) or specific force (m/s^2).
2. Plot `adev` versus `taus` on log-log axes with error bars.
3. Read the three terms using IEEE Std 952 slopes:
   - White noise (angle random walk for gyro, velocity random walk for accel): fit the slope -1/2 line and read its value at tau = 1 s. That value is N in units/sqrt(Hz) equivalently units*sqrt(s).
   - Bias instability: the flat minimum of the curve. B = minimum adev / 0.664 (the factor sqrt(2 ln 2 / pi) from IEEE Std 952).
   - Rate random walk: fit the slope +1/2 line and read its value at tau = 3 s. That value is K.
4. If the record is too short for a +1/2 region to appear, report K as "not observable in this record", not a guess.
5. Discard taus whose cluster count `n` is small; the `adev_err` bars show where the estimate is unreliable. State which taus were discarded.

### Output
N, B, K per axis with tau readings.

### Quality Gate
- Every reported value names the tau and slope region it came from.
- The plot file path is listed in the output.

---

## Phase 3: Compare With Datasheet And Emit

### Entry Criteria
- Values read.

### Actions
1. Convert datasheet units: deg/s/sqrt(Hz) times pi/180 gives rad/s/sqrt(Hz); deg/sqrt(h) divided by 60 gives deg/sqrt(s); micro-g/sqrt(Hz) times 9.80665e-6 gives m/s^2/sqrt(Hz).
2. Tabulate measured versus datasheet per term. A measured N much larger than datasheet usually means vibration or a driver low-pass filter not modeled.
3. Record the IMU driver's internal filter or output data rate setting; a digital low-pass filter flattens the short-tau end.
4. Emit `imu_noise_params` with units on every field.

### Output
`imu_noise_params`.

### Quality Gate
- Every field has a unit string.
- Datasheet comparison row exists for every term the datasheet provides.

---

## Worked Example

Illustrative. 2-hour static log at 200 Hz, engine off.

Gyro z: slope -1/2 line at tau 1 s reads 1.2e-4 rad/s, so N = 1.2e-4 rad/s/sqrt(Hz). Minimum adev 2.1e-5 rad/s at tau 400 s, so B = 2.1e-5/0.664 = 3.2e-5 rad/s. No clear +1/2 region before the record ends: K reported "not observable". Datasheet noise density 0.007 deg/s/sqrt(Hz) = 1.22e-4 rad/s/sqrt(Hz): matches.

---

## Exit Criteria

DONE when every axis has N and B (and K or a "not observable" note), each tied to a tau and slope, with units and a datasheet comparison.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Static segment contains motion | **Retry**: record a new static log with the vehicle parked and unoccupied. |
| Phase 1 | Timestamp gaps | **Adjust**: compute on the longest gap-free run and report its length. |
| Phase 2 | No -1/2 slope region | **Adjust**: check for a driver low-pass filter; read N from the datasheet and mark it as datasheet-sourced. |
| Phase 3 | Measured N far above datasheet | **Return**: report it with the engine state and mounting; the filter uses the measured value. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
