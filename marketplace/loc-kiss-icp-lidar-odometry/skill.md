# KISS-ICP Lidar Odometry On A Bag

**One-line description:** Runs KISS-ICP lidar odometry on the recorded rosbag2 point clouds with the Python pipeline, exports poses in TUM format, and checks drift against wheel odometry and ground truth with evo.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sensor_bag` (string, required): rosbag2 path with a `sensor_msgs/msg/PointCloud2` topic.
- `frame_spec` (object, required): Output of `loc-frame-convention-audit` for the lidar-to-base_link transform.

---

## Outputs

- `lidar_odom_traj` (object): Path of the KISS-ICP pose output converted to TUM in `base_link`, the exact command and config, run time, and the RPE drift figure.

---

## Phase 1: Install And Run

### Entry Criteria
- Python 3 virtual environment; `pip install kiss-icp rosbags evo`.
- `kiss_icp_pipeline --help` prints usage. Read it for the bag and topic options in your installed version; do not assume flags.

### Actions
1. Run on the bag with the topic flag shown in `--help` (for example `kiss_icp_pipeline --topic /points <bag>`).
2. Record the config used. KISS-ICP adapts most parameters; record `max_range` and `min_range` and any changed value, and the default config dump if the CLI offers one (check `--help` for a dump or config option).
3. Note the results directory the tool prints at the end and the files it wrote (poses in KITTI and TUM style; names vary by version).

### Output
Raw lidar odometry poses in the lidar frame.

### Quality Gate
- The run completes and prints the results directory; the pose file has one row per processed scan (compare with `ros2 bag info` count).

---

## Phase 2: Convert To base_link And TUM

### Entry Criteria
- Raw poses exist.

### Actions
1. If the pose file lacks timestamps, map row i to the stamp of scan i from the bag (iterate with `rosbags`); confirm counts match first.
2. KISS-ICP poses describe the lidar frame. Convert to `base_link`: T_odom_base(t) = T_base_lidar * T_lidar0_lidar(t) * T_base_lidar^-1, with T_base_lidar from `frame_spec`.
3. Write TUM with 8 columns.

### Output
TUM trajectory in `base_link`.

### Quality Gate
- `awk '{print NF}' lidar_odom.tum | sort -u` prints `8`.

---

## Phase 3: Measure Drift

### Entry Criteria
- TUM trajectory.

### Actions
1. `evo_rpe tum gt.tum lidar_odom.tum -a -r trans_part --delta 100 --delta_unit m -v` if ground truth exists, else against wheel odometry dead reckoning as a comparison (state that it is a comparison, not an accuracy).
2. Inspect `evo_traj tum lidar_odom.tum --ref gt.tum -a -p --plot_mode xy`. Degenerate geometry (long featureless tunnels, open highway with no structure) shows as along-track slip; mark those windows.
3. Report run time per scan from the CLI summary to decide whether it can run online on the target computer.

### Output
`lidar_odom_traj`.

### Quality Gate
- RPE statistics block is pasted from evo output.
- Degenerate windows listed with times, or "none observed".

---

## Worked Example

Illustrative. `kiss_icp_pipeline --topic /points bags/drive_2026_10_21` processes 12030 scans. Converted with T_base_lidar (1.20, 0, 1.85). `evo_rpe ... --delta 100 --delta_unit m` rmse 0.82 m per 100 m; along-track slip in the 300 m underpass at t 640 to 652 s.

---

## Exit Criteria

DONE when KISS-ICP poses exist in `base_link` TUM format with a drift figure and degenerate windows identified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Topic not found | **Adjust**: list topics with `ros2 bag info` and pass the exact name. |
| Phase 1 | Pipeline cannot read the storage format | **Adjust**: convert with `ros2 bag convert` or check `--help` for supported formats. |
| Phase 2 | Pose count differs from scan count | **Stop**: find dropped scans before assigning stamps. |
| Phase 3 | Large drift everywhere | **Retry**: check `max_range` against the lidar spec and that the vehicle body is not in the cloud (raise `min_range`). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
