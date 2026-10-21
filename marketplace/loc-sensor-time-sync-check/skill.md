# Sensor Timestamp And Latency Check

**One-line description:** Measures timestamp quality and relative latency between IMU, wheel odometry and GNSS in a recorded bag by comparing header stamps with receive times and by cross-correlating yaw rate and speed signals, producing the time offsets the filter must apply.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sensor_bag` (string, required): rosbag2 path from `loc-rosbag2-drive-logging`.
- `frame_spec` (object, required): Output of `loc-frame-convention-audit`.
- `wheel_odom_signals` (object, required): Output of `loc-can-wheel-odometry`.

---

## Outputs

- `time_offsets` (object): Per sensor: stamp source (hardware, driver receive time, GNSS time), jitter statistics, estimated offset relative to the IMU with its method, and the parameter in the filter that will apply it.

---

## Phase 1: Classify Stamp Sources

### Entry Criteria
- Bag readable with `rosbags` or `ros2 bag info`.

### Actions
1. For each sensor topic, read both `header.stamp` and the bag record time (the log time each message was written). With `rosbags`, the `timestamp` yielded per message is the record time in nanoseconds.
2. Compute `delay = record_time - header.stamp` per message. Report median, 5th and 95th percentile.
3. Classify: delay near-constant and small means the driver stamps on receive; delay varying with bus load means stamps include queueing; negative delay means the sensor clock is ahead of the host clock and a clock sync (PTP, chrony with PPS) is missing.
4. CAN frames stamped by SocketCAN are receive times; record that the wheel odometry stamp is when the frame arrived, not when the ECU sampled the wheel.

### Output
Per-topic stamp classification and delay statistics.

### Quality Gate
- Every topic has median and percentile delay in milliseconds.

---

## Phase 2: Estimate Relative Latency By Cross-Correlation

### Entry Criteria
- Phase 1 complete.

### Actions
1. Resample IMU `angular_velocity.z` and wheel odometry yaw rate to a common uniform grid (for example the IMU rate) over a drive section with many turns.
2. Remove means, compute `numpy.correlate` (mode "full") or `scipy.signal.correlate`, and find the lag of the peak. Refine with parabolic interpolation around the peak.
3. Repeat for GNSS Doppler speed versus wheel speed over a section with accelerations and decelerations.
4. Report each lag with sign convention stated: positive lag means the second signal arrives later.
5. Repeat on a second, disjoint section. If the two lags differ by more than one resampling interval, the latency is not constant; report both.

### Output
Relative latency estimates.

### Quality Gate
- Each lag is reported for two disjoint sections with the grid interval.

---

## Phase 3: Map Offsets To Filter Settings

### Entry Criteria
- Lags estimated.

### Actions
1. For robot_localization: there is no per-sensor latency parameter in `ekf_node`; correct stamps upstream in the driver or with a small relay node that subtracts the offset from `header.stamp`. For `navsat_transform_node`, the `delay` parameter delays the start of the transform, not per-message stamps; do not use it as latency compensation.
2. For a custom filter: process measurements in stamp order with a buffer at least as long as the largest latency, and apply each measurement at its corrected stamp (out-of-sequence handling by re-propagating from the buffered state).
3. Write `time_offsets` with sensor, offset, method, and where it is applied.

### Output
`time_offsets`.

### Quality Gate
- Every sensor with a nonzero offset names exactly one place where it is corrected.

---

## Worked Example

Illustrative. `/imu/data` delay median 1.2 ms. `/can/rx` delay median 0.4 ms (receive stamps). `/gnss/fix` delay median 85 ms, 95th percentile 112 ms.

Cross-correlation of gyro z and wheel yaw rate: peak lag +18 ms (wheel later), second section +20 ms. GNSS speed versus wheel speed: +104 ms. Result: subtract 19 ms from wheel odometry stamps and 104 ms from GNSS stamps in a relay node.

---

## Exit Criteria

DONE when each sensor has a classified stamp source, a measured relative offset confirmed on two sections, and one named correction point.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Negative delays | **Stop**: fix host clock sync (chrony or PTP) and re-record. |
| Phase 2 | No clear correlation peak | **Adjust**: choose a section with more turning or acceleration. |
| Phase 2 | Lag differs between sections | **Return**: report variable latency; recommend hardware timestamping. |
| Phase 3 | Driver cannot be modified | **Adjust**: write a relay node that republishes with corrected stamps. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
