# IMU Driver Bring-Up: Rate, Units and Axis Signs

**One-line description:** Brings up an IMU on serial, SPI or USB and proves its output rate, units, axis directions and timestamp spacing with three bench tests: a static gravity test, a right-hand rotation test, and a sample-interval histogram.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sensor_inventory` (object[], required): From `vsens-sensor-inventory`; the IMU row with interface, device path and datasheet rate.
- `imu_device` (string, required): Stable device path (`/dev/serial/by-id/...`, `/dev/spidevB.C`, or IIO device `/sys/bus/iio/devices/iio:deviceN`) and the driver in use.

---

## Outputs

- `imu_stream_report` (object): Measured output rate, sample interval statistics, unit conversion confirmed, the mapping from sensor axes to the body frame (REP 103: x forward, y left, z up), the sign test results, the timestamp source, and the logged file paths.

---

## Phase 1: Open the Stream and Measure Rate

### Entry Criteria
- The IMU is bolted to a rigid mount on a bench, not hand-held.

### Actions
1. Serial: read the baud rate and framing from the datasheet. Set with `stty -F <dev> <baud> raw -echo`. Do not guess baud; a wrong baud gives garbage that sometimes looks like valid bytes.
2. IIO (kernel driver): list channels with `ls /sys/bus/iio/devices/iio:deviceN/` and read `in_accel_x_raw`, `in_accel_scale`, `in_anglvel_x_raw`, `in_anglvel_scale`, `sampling_frequency`. Value in SI = raw x scale per the kernel IIO ABI (`Documentation/ABI/testing/sysfs-bus-iio`).
3. ROS 2: `ros2 topic hz /imu/data_raw --window 1000` and record average rate and std dev.
4. Log 60 seconds of samples with the device timestamp (if the IMU provides a counter or time field) and the host receive time (`CLOCK_MONOTONIC`).
5. Compute sample intervals from the device timestamp and from host time separately. Plot or print a histogram of each.

### Output
Rate and interval statistics from both clocks.

### Quality Gate
- The median device-time interval equals 1 / configured rate from the datasheet register setting.
- The count of intervals greater than 1.5 x the median is recorded for both clocks (this counts missed samples, where one missed sample doubles the interval).

---

## Phase 2: Static Gravity Test

### Entry Criteria
- Stream runs at the configured rate.

### Actions
1. Place the IMU level with the axis that should be body z pointing up. Log 30 seconds.
2. An accelerometer at rest measures specific force, so the up-pointing axis reads about +g, not -g. Compute the mean of each axis.
3. Confirm units: the magnitude `sqrt(ax^2+ay^2+az^2)` must be near local gravity in m/s^2. A value near 1 means the driver outputs g units; a value near 1000 means milli-g. Convert in the driver, not downstream.
4. Repeat with the IMU on its side so body x points up, then body y up. Record which raw axis and sign reads +g each time.

### Output
Raw-to-body accelerometer axis map with signs.

### Quality Gate
- Each of three orientations has exactly one axis reading +g in magnitude and the other two near zero, written as a table.
- The unit conversion is stated (m/s^2) with the factor applied.

---

## Phase 3: Rotation Sign Test and Report

### Entry Criteria
- Accelerometer axis map exists.

### Actions
1. Rotate the IMU counterclockwise about body z when viewed from above (positive yaw by the right-hand rule). The body-z gyro must read positive during the motion.
2. Repeat for body x (roll right side down is positive about x forward under REP 103) and body y.
3. Confirm gyro units are rad/s. A peak near 57 times what you expect means degrees per second.
4. With ROS 2 `sensor_msgs/msg/Imu`, if the driver gives no orientation, set `orientation_covariance[0] = -1` as the message definition requires. Fill `angular_velocity_covariance` and `linear_acceleration_covariance` from the datasheet noise density or from `vsens-imu-allan-variance`, never zeros meaning "unknown".
5. Emit `imu_stream_report`.

### Output
`imu_stream_report`.

### Quality Gate
- Each of the three rotation tests shows the expected positive sign on the expected axis, recorded with peak values.
- `imu_stream_report` states the timestamp source: device counter, hardware sync, or host receive time.

---

## Worked Example

Illustrative only. A serial IMU configured to 200 Hz.

Phase 1: device-time median interval 5.000 ms; host-time median 5.01 ms; 0 device-time intervals above 7.5 ms; 37 host-time intervals above 7.5 ms (USB batching, not lost data).
Phase 2: level: raw z mean +9.80, x 0.02, y -0.04. On side: raw y reads +9.79, so raw y maps to body x. Magnitude 9.80 m/s^2, units confirmed.
Phase 3: yaw counterclockwise: raw z peak +1.1 rad/s. Mapping table recorded.

---

## Exit Criteria

DONE when the rate matches the configured rate on the device clock, units are SI, every axis maps to the body frame with a tested sign, and the timestamp source is named.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Garbled serial bytes | **Adjust**: wrong baud or framing; read the datasheet and set it again. |
| Phase 1 | Device-time gaps present | **Stop**: real data loss; check bus bandwidth and driver buffer before calibrating anything. |
| Phase 2 | Up axis reads -g | **Adjust**: the axis or sign map is inverted; fix the map in the driver, not in downstream code. |
| Phase 3 | Gyro sign wrong on one axis | **Adjust**: a left-handed raw frame needs a sign flip in the map; retest all three axes. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
