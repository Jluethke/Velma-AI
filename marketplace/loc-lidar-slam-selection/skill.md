# Lidar SLAM Package Selection

**One-line description:** Chooses a lidar SLAM or lidar odometry package (slam_toolbox, Cartographer, KISS-ICP, FAST-LIO2, LIO-SAM) for a vehicle from the lidar type, IMU availability, environment and license with a decision table, and lists the exact inputs and checks each choice needs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sensor_list` (object[], required): Lidar make and model (2D scanner or 3D spinning or solid-state), point rate, IMU type (6-axis or 9-axis) and rate.
- `operating_area` (object, required): Environment (parking structure, campus, urban roads, highway), approximate size, whether the route revisits places (loop closure opportunity), and whether a reusable map is needed.
- `stack` (string, required): "ros2", "python" or "cpp".

---

## Outputs

- `lidar_slam_choice` (object): Chosen package, version or commit to pin, license, required topics and message types, required extrinsics, the selection rows that decided it, and the rejected options with reasons.

---

## Phase 1: Collect Facts

### Entry Criteria
- `sensor_list` names the lidar model.

### Actions
1. Record lidar type: 2D (`sensor_msgs/LaserScan`) or 3D (`sensor_msgs/PointCloud2`). For 3D, check whether the driver publishes per-point time fields (needed for deskewing in LIO-SAM and FAST-LIO2); `ros2 topic echo --once /points --field fields` lists them.
2. Record IMU: 6-axis or 9-axis and rate. LIO-SAM's README states a 9-axis IMU requirement for its default pipeline; read the current README before deciding.
3. Record whether a saved map for later relocalization is required.

### Output
Facts table.

### Quality Gate
- Point time field presence is recorded from an echoed message.

---

## Phase 2: Select

### Entry Criteria
- Facts table complete.

### Actions
1. Apply this table and quote the row:

   | Condition | Choice | Notes |
   |---|---|---|
   | 2D lidar, planar area (lot, warehouse), ROS 2, map needed | slam_toolbox | LGPL-2.1; mapping and localization modes; ROS 2 native |
   | 3D lidar only, no IMU or unsynced IMU, odometry needed | KISS-ICP | MIT; no loop closure; Python and ROS 2 wrappers |
   | 3D lidar with per-point time plus 6-axis or 9-axis IMU | FAST-LIO2 | GPL-2.0; tightly coupled; check for a maintained ROS 2 port |
   | 3D lidar plus 9-axis IMU plus GNSS, loop closure needed | LIO-SAM | BSD-3; ROS 2 branch exists; check its status |
   | 3D lidar, need 2D map for nav2 | project 3D to 2D with `pointcloud_to_laserscan`, then slam_toolbox | set height band to exclude ground and overhangs |
   | Cartographer considered | check repository activity first | cartographer_ros has had limited maintenance; record the latest release date |

2. Check license against the project's distribution plan. GPL packages linked into a distributed product impose source obligations; record the license and let the user decide.
3. Pin the version: record the git commit or release tag.

### Output
`lidar_slam_choice`.

### Quality Gate
- The chosen row and every rejected row have a written reason.
- The license and pinned commit are recorded.

---

## Phase 3: List Integration Requirements

### Entry Criteria
- Choice made.

### Actions
1. List topics and frames the package needs (for example slam_toolbox: `scan_topic`, `odom_frame`, `base_frame`, `map_frame`; it consumes `odom -> base_link` from the odom EKF).
2. State who publishes `map -> odom`: the SLAM node, or the map EKF, never both. If the map EKF fuses GNSS, the SLAM output enters it as a pose measurement and SLAM `transform_publish_period` or equivalent is disabled.
3. List the extrinsics needed (lidar to IMU for LIO packages) and their source in `frame_spec`.

### Output
Integration list appended to `lidar_slam_choice`.

### Quality Gate
- `map -> odom` has exactly one named publisher.

---

## Worked Example

Illustrative. 3D 32-beam spinning lidar with per-point `t` field, 6-axis IMU, urban loop route, ROS 2, reusable map needed for a parking structure. Odometry choice: KISS-ICP for evaluation baseline; map choice: `pointcloud_to_laserscan` plus slam_toolbox for the planar parking deck. FAST-LIO2 rejected pending ROS 2 port check; LIO-SAM rejected: 9-axis IMU absent.

---

## Exit Criteria

DONE when a package is chosen with a quoted row, license and pinned version, and the `map -> odom` publisher is named.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No per-point time field on a 3D lidar | **Adjust**: exclude deskew-dependent packages or enable the field in the driver. |
| Phase 2 | No row fits | **Return**: report the facts table and ask the user to relax a requirement. |
| Phase 2 | License incompatible with distribution | **Stop**: present license options to the user. |
| Phase 3 | Two `map -> odom` publishers planned | **Adjust**: disable one. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
