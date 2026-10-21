# ROS 2 Map Relocalization With slam_toolbox Or AMCL

**One-line description:** Configures localization against a saved map (slam_toolbox localization mode or nav2 AMCL), sets the initial pose, defines how lost localization is detected, and tests relocalization with a kidnapped-start replay.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `map_files` (object, required): Output of `loc-ros2-slam-toolbox-mapping`.
- `ekf_config` (string, required): Odom-frame EKF config from `loc-ros2-robot-localization-ekf`.
- `frame_spec` (object, required): Output of `loc-frame-convention-audit`.

---

## Outputs

- `relocalization_config` (object): The localizer chosen, its params file, the initial pose method, the lost-detection rule, and who publishes `map -> odom`.
- `relocalization_test_report` (object): Results of a normal-start and a wrong-start replay: time to converge, final error against ground truth or the mapping run, and lost-detection events.

---

## Phase 1: Choose And Configure

### Entry Criteria
- `map_files` contains the occupancy grid and, for slam_toolbox, the serialized pose graph.

### Actions
1. Choose:

   | Condition | Localizer |
   |---|---|
   | Map made with slam_toolbox and pose graph saved | slam_toolbox `localization_launch.py`, `mode: localization`, `map_file_name: <path without extension>` |
   | Only the occupancy grid exists, or nav2 stack in use | nav2 `amcl` with `map_server` loading `site.yaml` |

2. slam_toolbox: set `map_start_pose: [x, y, yaw]` or `map_start_at_dock` per its docs; frames as in mapping.
3. AMCL: set `base_frame_id: base_link`, `odom_frame_id: odom`, `global_frame_id: map`, `scan_topic`, and the motion model `robot_model_type` (`nav2_amcl::DifferentialMotionModel` or `OmnidirectionalMotionModel`); a car uses differential as the closest available. Check the plugin names in your distribution's nav2 docs.
4. Exactly one node publishes `map -> odom`: the localizer. If a GNSS map EKF also runs, set its `publish_tf: false` or feed the localizer pose into it instead.

### Output
Draft `relocalization_config`.

### Quality Gate
- `ros2 run tf2_tools view_frames` during replay shows `map -> odom` with the localizer as the broadcaster.

---

## Phase 2: Initial Pose And Lost Detection

### Entry Criteria
- Localizer runs on replay.

### Actions
1. Initial pose: publish once with `ros2 topic pub --once /initialpose geometry_msgs/msg/PoseWithCovarianceStamped "{header: {frame_id: map}, pose: {pose: {position: {x: X, y: Y}, orientation: {z: QZ, w: QW}}, covariance: [...]}}"`, or use GNSS converted into the map frame when the map shares the GNSS datum.
2. AMCL global relocalization: `ros2 service call /reinitialize_global_localization std_srvs/srv/Empty` spreads particles over free space; check the service name with `ros2 service list`.
3. Lost-detection rule: monitor the localizer pose covariance (`/amcl_pose` covariance trace) and the scan match score where exposed. The trigger values are user inputs set from the normal-start replay statistics (for example the maximum covariance trace seen while localized), not invented constants.
4. On lost: hold the odom-frame estimate (odometry continues), stop trusting map-frame pose for planning, and trigger relocalization.

### Output
Initial pose method and lost-detection rule in `relocalization_config`.

### Quality Gate
- The lost-detection trigger cites the replay statistic it came from.

---

## Phase 3: Test Relocalization

### Entry Criteria
- Rules written.

### Actions
1. Normal start: replay with the correct initial pose; record convergence time and final position difference to the mapping run's trajectory (`evo_ape` with the mapping trajectory as reference).
2. Wrong start: replay with an initial pose offset by a user-chosen distance and angle; record whether it converges, how long it takes, and whether lost detection fired.
3. Global start (AMCL): call global relocalization at start; record convergence.
4. Write `relocalization_test_report`.

### Output
`relocalization_test_report`.

### Quality Gate
- Each of the three tests reports converged yes or no, time, and final difference.

---

## Worked Example

Illustrative. slam_toolbox localization with `site` pose graph. Normal start converges in 1.2 s, APE rmse to mapping trajectory 0.09 m. Wrong start offset 3 m and 20 degrees: converges after 6.5 s once the ramp wall is in view. Lost-detection trigger set at 2x the maximum covariance trace seen on normal replay (user choice, recorded).

---

## Exit Criteria

DONE when one localizer publishes `map -> odom`, initial pose and lost-detection rules are written, and the three replay tests are reported.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Map file fails to load | **Adjust**: pass the path without extension for slam_toolbox, or the `.yaml` path for map_server. |
| Phase 1 | Two `map -> odom` broadcasters | **Stop**: disable one before any test. |
| Phase 3 | Never converges from wrong start | **Return**: report the offset limit; increase initial covariance or use global relocalization. |
| Phase 3 | Converges to wrong place in repetitive structure | **Return**: report it; add GNSS or another absolute cue for initialization. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
