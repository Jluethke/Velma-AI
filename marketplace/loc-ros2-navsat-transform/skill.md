# ROS 2 navsat_transform And Dual EKF For GNSS Fusion

**One-line description:** Configures robot_localization's `navsat_transform_node` and a second map-frame `ekf_node` so GNSS fixes enter the filter as map-frame odometry, with the IMU yaw convention, `yaw_offset`, `magnetic_declination_radians`, `zero_altitude` and datum handled, and verifies the map frame against the GNSS track.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ekf_config` (string, required): Odom-frame EKF config from `loc-ros2-robot-localization-ekf`.
- `frame_spec` (object, required): Output of `loc-frame-convention-audit`, including the heading source's yaw zero reference.
- `gnss_noise_model` (object, required): Output of `loc-gnss-fix-quality-model`.
- `datum_origin` (object, optional): Fixed datum latitude, longitude and heading if the map frame must be repeatable across runs.

---

## Outputs

- `navsat_config` (string): Path of the YAML for `navsat_transform_node` and the map-frame EKF.
- `dual_ekf_launch` (string): Path of the launch file starting the odom EKF, the map EKF and `navsat_transform_node` with remappings.

---

## Phase 1: Map-Frame EKF

### Entry Criteria
- The odom-frame EKF passes its verification.

### Actions
1. Copy the odom EKF parameters into a second node named `ekf_filter_node_map` with `world_frame: map`. This instance publishes `map -> odom`.
2. Inputs: same odometry and IMU as the odom instance, plus `odom1: /odometry/gps` with config fusing x and y only (and z if not in 2D).
3. Remap the map instance's output to `/odometry/filtered/global`, keeping the odom instance on `/odometry/filtered/local`, so they do not collide.

### Output
Map EKF section.

### Quality Gate
- Exactly one node has `world_frame: map` and exactly one has `world_frame: odom`.

---

## Phase 2: navsat_transform Parameters

### Entry Criteria
- Map EKF written.

### Actions
1. Subscriptions: `imu/data` (orientation), `gps/fix` (`NavSatFix`), `odometry/filtered` (remap to the map EKF output `/odometry/filtered/global`). Publishes `odometry/gps` and, if `publish_filtered_gps: true`, `gps/filtered`.
2. Yaw convention: navsat_transform expects IMU yaw 0 facing east, counterclockwise positive (REP 103). If the heading source reports 0 at magnetic north, set `magnetic_declination_radians` to the local declination (from NOAA's calculator for the location and date) and `yaw_offset` to pi/2 per the package documentation. If the source reports true-north heading, set declination 0.
3. If the IMU has no absolute heading at all (6-axis), set `use_odometry_yaw: true` so the node takes heading from the filter, and make sure the filter gets heading from elsewhere (dual antenna GNSS or course-over-ground initialization). Without any absolute heading, the map frame rotation is arbitrary.
4. `zero_altitude: true` for the 2D design.
5. Datum: if `datum_origin` is provided, set `wait_for_datum: true` and `datum: [lat, lon, heading]`; otherwise the first fix becomes the origin and maps from different runs will not align.
6. GNSS covariance: navsat passes the `NavSatFix` covariance through; ensure the driver or a relay applies the per-fix-type rule from `gnss_noise_model`.
7. The transform broadcast parameter is named `broadcast_cartesian_transform` in recent distributions (older ones used `broadcast_utm_transform`); check the installed `params/navsat_transform.yaml`.

### Output
`navsat_config`.

### Quality Gate
- `yaw_offset`, `magnetic_declination_radians`, `zero_altitude` and the datum choice each have a written reason.

---

## Phase 3: Launch And Verify

### Entry Criteria
- Configs complete.

### Actions
1. Write `dual_ekf_launch` with three nodes, `use_sim_time: True`, and remappings: navsat `imu/data` to the IMU topic, `gps/fix` to the GNSS topic, `odometry/filtered` to `/odometry/filtered/global`.
2. Replay the bag. `ros2 topic hz /odometry/gps` must print a rate near the GNSS rate.
3. Plot `/odometry/gps` x,y and `/odometry/filtered/global` x,y. They overlap. If the GNSS track is rotated against the filtered track by a constant angle, the yaw convention or `yaw_offset` is wrong.
4. Drive start and end at the same point: the map-frame end position returns near the start; report the gap.

### Output
`dual_ekf_launch`.

### Quality Gate
- `/odometry/gps` publishes at the GNSS rate.
- Constant rotation between GNSS and filtered tracks is reported in degrees (target: within the heading uncertainty of the source).

---

## Worked Example

Illustrative. 6-axis IMU, single-antenna GNSS. `use_odometry_yaw: true`, `yaw_offset: 0.0`, `magnetic_declination_radians: 0.0`, `zero_altitude: true`, datum given. First replay: GNSS track rotated 90 degrees from filtered track; cause: the heading relay published north-zero heading; fixed by converting to ENU in the relay. Second replay: rotation under 1 degree, loop end gap 0.4 m.

---

## Exit Criteria

DONE when the dual EKF and navsat_transform run on replay, `/odometry/gps` overlaps the global estimate without constant rotation, and the loop gap is reported.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Two nodes publish `map -> odom` | **Stop**: remove the duplicate; a second localizer must set `publish_tf: false`. |
| Phase 2 | No absolute heading source | **Return**: add dual-antenna GNSS or a course-over-ground initializer to `loc-ekf-model-design`. |
| Phase 3 | `/odometry/gps` never publishes | **Adjust**: check the three subscriptions are remapped and the IMU publishes orientation. |
| Phase 3 | GNSS track rotated by constant angle | **Adjust**: fix yaw convention or `yaw_offset`, then replay again. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
