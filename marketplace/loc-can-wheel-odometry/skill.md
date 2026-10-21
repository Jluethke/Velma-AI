# Wheel Odometry From Vehicle CAN Speed And Steering

**One-line description:** Decodes wheel speed and steering angle from read-only CAN logs with a DBC and cantools, and turns them into planar odometry (velocity and yaw rate) with a kinematic bicycle model and a differential rear-wheel model, cross-checked against each other and the IMU gyro.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dbc_file` (string, required): Path of a DBC file the user has for this vehicle model, covering wheel speed and steering angle messages.
- `sensor_bag` (string, required): rosbag2 path containing raw CAN frames (for example `can_msgs/msg/Frame` on `/can/rx`) and the IMU topic, or a `candump -l` log file.
- `vehicle_spec` (object, required): Wheelbase L, rear track width, steering ratio from the manufacturer if known, and which axle is the `base_link` reference.

---

## Outputs

- `wheel_odom_signals` (object): Decoded signal names, message IDs, scale, offset, unit and measured rate for each wheel speed and steering signal.
- `wheel_odom_model` (object): The odometry equations used, the parameter values, the script path that produces `nav_msgs/Odometry`-shaped output, and the gyro cross-check result.

---

## Phase 1: Capture And Decode Read-Only

### Entry Criteria
- The user owns the vehicle.
- The CAN interface is listen-only. On SocketCAN: `sudo ip link set can0 type can bitrate <bitrate> listen-only on` then `sudo ip link set can0 up`, where `<bitrate>` is the vehicle bus rate the user supplies. Nothing in this flow transmits on the bus.
- Access is through the diagnostic port or a documented tap point. If a security gateway blocks a message on that port, accept it and work with the messages that are visible; do not bypass the gateway.

### Actions
1. If logging outside ROS: `candump -l can0` writes `candump-<date>.log`. Inside ROS, the bag already holds the frames.
2. Inspect the DBC: `cantools dump <dbc_file>` and find the wheel speed and steering angle messages. Record message ID, signal name, scale, offset, unit, byte order and signedness exactly as printed.
3. Decode a sample: `candump -L can0 | cantools decode <dbc_file>` live, or in Python `db = cantools.database.load_file(dbc); db.decode_message(frame_id, data)` over the log.
4. Plot each wheel speed and the steering angle over time. Check that wheel speeds are zero while parked and equal on a straight segment.
5. Determine the steering signal: steering wheel angle (needs ratio) or road wheel angle (no ratio). The DBC unit and range tell you: a range of several hundred degrees is the steering wheel.

### Output
`wheel_odom_signals`.

### Quality Gate
- Every signal row has ID, scale, offset, unit and measured rate copied from tool output.
- On a static segment, all decoded wheel speeds read zero.

---

## Phase 2: Build Two Odometry Models

### Entry Criteria
- Signals decoded.

### Actions
1. Vehicle speed at the rear axle: v = mean of the rear-left and rear-right wheel speeds, converted to m/s (km/h divided by 3.6).
2. Model A, differential rear wheels: yaw_rate = (v_rr - v_rl) / track_width_rear.
3. Model B, kinematic bicycle about the rear axle: delta = steering_wheel_angle / steering_ratio (converted to radians); yaw_rate = v * tan(delta) / L.
4. If `base_link` is not the rear axle center, transform the velocity to `base_link`: lateral velocity at a point a distance d ahead of the rear axle is v_y = yaw_rate * d. Record it.
5. Integrate pose only for a sanity plot. For the filter, publish velocities (vx, vyaw) with covariance and let the filter integrate; set `odom0_differential` style handling downstream rather than feeding integrated pose.
6. Write a script `wheel_odom.py` that reads the bag and emits time, vx, vy, yaw_rate per sample.

### Output
Model A and Model B yaw rate series.

### Quality Gate
- Both models print a yaw rate series of the same length as the speed series.
- On straight segments, both yaw rates average within the noise of zero (report mean and std).

---

## Phase 3: Cross-Check Against The Gyro

### Entry Criteria
- Both series exist.

### Actions
1. Interpolate the IMU `angular_velocity.z` to the odometry timestamps.
2. Compute residuals: gyro minus Model A, gyro minus Model B. Report mean and standard deviation in turns and on straights separately.
3. Interpret with this table:

   | Observation | Likely cause | Next action |
   |---|---|---|
   | Model B residual grows with steering angle | steering ratio wrong or nonlinear | calibrate in `loc-wheel-odom-calibration` |
   | Model A residual large at low speed | wheel speed quantization | prefer Model B below the speed where A becomes noisy |
   | Both residuals have constant offset | gyro bias | expected; filter estimates bias |
   | Residual sign flipped | steering sign convention | flip sign, recheck with a left turn |

4. Do not tune any value here. Calibration is the next flow.

### Output
`wheel_odom_model`.

### Quality Gate
- Residual statistics for both models are reported with sample counts.

---

## Worked Example

Illustrative. `cantools dump vehicle.dbc` shows message `WHEEL_SPEEDS` 0x1D0 with `WHEEL_SPEED_RL` scale 0.01 km/h. Steering `STEER_ANGLE` 0x025 scale 0.1 deg, range plus or minus 780 deg, so it is steering wheel angle.

At 30 km/h (8.33 m/s), steering wheel 90 deg, ratio 15.0, L 2.70 m: delta = 6.0 deg = 0.1047 rad, yaw_rate = 8.33 * tan(0.1047)/2.70 = 0.324 rad/s. Gyro reads 0.331 rad/s. Model B residual mean -0.006 rad/s in turns.

---

## Exit Criteria

DONE when speed and steering are decoded read-only with documented scaling, both odometry models produce yaw rate, and the gyro residuals are reported.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Wheel speed message not visible on the accessible bus | **Stop**: report which messages are visible; do not bypass a gateway. Use the visible vehicle speed signal if present. |
| Phase 1 | DBC decode gives nonsense values | **Adjust**: check byte order and signedness in `cantools dump`; the DBC may be for another model year. |
| Phase 2 | Wheel speeds unequal on straights | **Return**: report per-wheel ratio; tire size difference is calibrated next. |
| Phase 3 | Residual sign flipped | **Adjust**: flip the steering sign and verify with a known left turn. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
