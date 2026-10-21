# ROS 2 robot_localization ekf_node Configuration

**One-line description:** Writes and verifies the `ekf_node` YAML for robot_localization in ROS 2: frames, the 15-element per-sensor config vectors, differential and relative modes, two_d_mode, process noise, and rejection thresholds, checked on bag replay with diagnostics.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `filter_design` (object, required): Output of `loc-ekf-model-design`.
- `noise_covariances` (object, required): Output of `loc-q-r-derivation`.
- `frame_spec` (object, required): Output of `loc-frame-convention-audit`.
- `project_dir` (string, required): ROS 2 package path for config and launch files.

---

## Outputs

- `ekf_config` (string): Path of `ekf_odom.yaml` (odom-frame instance).
- `ekf_launch` (string): Path of the launch file starting `ekf_node` with that config.

---

## Phase 1: Frames And Global Parameters

### Entry Criteria
- `sudo apt install ros-<distro>-robot-localization` done; `ros2 pkg prefix robot_localization` prints a path.
- Open the package's `params/ekf.yaml` in that prefix and keep it beside you; parameter names below must match it for your distribution.

### Actions
1. Under `ekf_filter_node: ros__parameters:` set `frequency` (filter output rate, Hz; at or below the fastest input rate), `sensor_timeout`, `two_d_mode` (true for the 2D design), `publish_tf: true`, `map_frame: map`, `odom_frame: odom`, `base_link_frame: base_link`, `world_frame: odom`.
2. With `world_frame: odom`, this instance publishes `odom -> base_link`. It must fuse only continuous sources (wheel odometry, IMU); never feed GNSS or map poses here.
3. Set `print_diagnostics: true` for the tuning period.

### Output
Global section of `ekf_odom.yaml`.

### Quality Gate
- `world_frame` equals `odom_frame` and no absolute pose source is listed.

---

## Phase 2: Sensor Inputs

### Entry Criteria
- Global section written.

### Actions
1. Each sensor gets `<type><N>: <topic>` and `<type><N>_config:` a 15-boolean list in this fixed order: x, y, z, roll, pitch, yaw, vx, vy, vz, vroll, vpitch, vyaw, ax, ay, az.
2. Wheel odometry (`odom0`): fuse vx, vy, vyaw. Set vy true with value zero for a nonholonomic car only if the odometry message publishes vy = 0 with a small covariance; that encodes no side slip. Do not fuse odometry x, y, yaw directly when the source integrates them; if you must, set `odom0_differential: true`.
3. IMU (`imu0`): fuse vyaw and, if the filter estimates acceleration, ax. Fuse absolute yaw only if the IMU has a trustworthy magnetometer-free heading (most do not in a car). Set `imu0_remove_gravitational_acceleration: true` if ax is fused and the driver reports specific force.
4. Use `_queue_size` at least the ratio of sensor rate to `frequency`.
5. Rejection thresholds: `odom0_twist_rejection_threshold`, `imu0_angular_velocity_rejection_threshold`, `imu0_linear_acceleration_rejection_threshold`. Values come from `loc-mahalanobis-gating`; leave unset (no rejection, the package default) until then.
6. Covariance: robot_localization uses the covariance in each incoming message as R. Make the drivers or a relay publish the R from `noise_covariances`; a zero covariance in a message breaks the filter.
7. Write `process_noise_covariance` as a 15x15 row-major list (225 values) from `noise_covariances`, and `initial_estimate_covariance` likewise.

### Output
`ekf_config`.

### Quality Gate
- Every `_config` list has exactly 15 entries (count them with a YAML load in Python).
- `process_noise_covariance` has 225 entries.

---

## Phase 3: Launch And Verify On Replay

### Entry Criteria
- Config complete; `sensor_bag` and its replay procedure available.

### Actions
1. Launch file: `Node(package='robot_localization', executable='ekf_node', name='ekf_filter_node', parameters=[config, {'use_sim_time': True}])`.
2. Replay the bag with `--clock`. Run `ros2 topic hz /odometry/filtered` and confirm it matches `frequency`.
3. `ros2 topic echo /diagnostics` and read the `ekf_filter_node` entries; warnings name missing transforms or timed-out sensors.
4. `ros2 run tf2_ros tf2_echo odom base_link` prints a continuously changing transform.
5. Plot x, y from `/odometry/filtered` against wheel-only dead reckoning; they should match closely on straights with the IMU improving yaw in turns.

### Output
`ekf_launch`.

### Quality Gate
- `/odometry/filtered` rate matches `frequency` within the rate printed by `ros2 topic hz`.
- `/diagnostics` shows no error-level status from the filter node during replay.

---

## Worked Example

Illustrative. `odom0: /wheel/odometry`, `odom0_config: [false,false,false, false,false,false, true,true,false, false,false,true, false,false,false]`. `imu0: /imu/data`, `imu0_config: [false,false,false, false,false,false, false,false,false, false,false,true, true,false,false]`. `frequency: 50.0`, `two_d_mode: true`. On replay `ros2 topic hz /odometry/filtered` prints `average rate: 49.98`.

---

## Exit Criteria

DONE when the odom-frame EKF runs on replay at its configured rate, publishes `odom -> base_link`, and diagnostics show no errors.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Parameter name not in the installed `params/ekf.yaml` | **Adjust**: use the name from the installed file for your distribution. |
| Phase 2 | Config list wrong length | **Stop**: the node will reject or misread it; fix to 15. |
| Phase 3 | "Could not obtain transform" warnings | **Return**: send to `loc-ros2-static-extrinsics`. |
| Phase 3 | Output drifts sideways in turns | **Adjust**: check IMU yaw-rate sign and the vy fusion setting. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
