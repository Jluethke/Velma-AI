# ROS 2 slam_toolbox Map Building From A Bag

**One-line description:** Builds a 2D occupancy map and a serialized pose graph with slam_toolbox's online asynchronous mode on bag replay, saves both with the package's services and `nav2_map_server`, and checks loop closure on a revisited section.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `lidar_slam_choice` (object, required): Output of `loc-lidar-slam-selection` with slam_toolbox chosen.
- `sensor_bag` (string, required): rosbag2 with the scan (or point cloud) topic, odometry inputs and `/tf_static`.
- `frame_spec` (object, required): Output of `loc-frame-convention-audit`.
- `project_dir` (string, required): ROS 2 package path for configs and maps.

---

## Outputs

- `map_files` (object): Paths of the occupancy grid (`.pgm` and `.yaml`), the serialized pose graph (`.posegraph` and `.data`), the params file used, and the loop closure check result.

---

## Phase 1: Configure

### Entry Criteria
- `sudo apt install ros-<distro>-slam-toolbox ros-<distro>-nav2-map-server`.
- The odom-frame EKF runs on replay and publishes `odom -> base_link`.
- For a 3D lidar: `pointcloud_to_laserscan` configured with `min_height` and `max_height` chosen to exclude ground and overhead structure, `target_frame` set to a level frame.

### Actions
1. Copy `mapper_params_online_async.yaml` from `$(ros2 pkg prefix slam_toolbox)/share/slam_toolbox/config/` into `<project_dir>/config/`.
2. Set `odom_frame: odom`, `map_frame: map`, `base_frame: base_link`, `scan_topic: /scan`, `mode: mapping`, `resolution` (user input, meters per cell), `max_laser_range` (from the lidar spec or the projected scan range).
3. Ensure no other node publishes `map -> odom` during mapping (the map EKF is off or has `publish_tf: false`).

### Output
Params file.

### Quality Gate
- `ros2 param` dump after launch shows the four frame and topic values as set.

---

## Phase 2: Map On Replay

### Entry Criteria
- Params ready.

### Actions
1. Launch: `ros2 launch slam_toolbox online_async_launch.py slam_params_file:=<params> use_sim_time:=true`.
2. Play the bag: `ros2 bag play <bag> --clock --rate 0.5` (slower than real time if the CPU cannot keep up; check `/diagnostics` and the node log for dropped scans).
3. Watch the map in RViz2 (`/map` topic, fixed frame `map`).
4. At the end, before stopping anything:
   - `ros2 service call /slam_toolbox/serialize_map slam_toolbox/srv/SerializePoseGraph "{filename: '<project_dir>/maps/site'}"`
   - `ros2 run nav2_map_server map_saver_cli -f <project_dir>/maps/site`
   Check the exact service names with `ros2 service list | grep slam_toolbox`.

### Output
Saved map and pose graph.

### Quality Gate
- `ls <project_dir>/maps/` shows `site.pgm`, `site.yaml`, `site.posegraph`, `site.data`.

---

## Phase 3: Loop Closure Check

### Entry Criteria
- Map saved.

### Actions
1. Open `site.pgm` and inspect the revisited section: a closed loop shows single walls; a failed loop shows doubled or offset walls.
2. Read the node log for loop closure messages during the revisit.
3. Report: loop closed (yes or no), doubled-wall locations if any, and the replay rate used.

### Output
`map_files`.

### Quality Gate
- Loop closure verdict with the log line or the doubled-wall location.

---

## Worked Example

Illustrative. 3D lidar projected to `/scan` with heights 0.3 to 1.8 m above `base_link`. `resolution: 0.05`. Bag played at 0.5x. Node log shows a loop closure at the second pass of the ramp entrance. `site.pgm` 2400x1800 cells, single walls. Files saved to `maps/`.

---

## Exit Criteria

DONE when occupancy grid and serialized pose graph are saved and the loop closure verdict is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | "Message Filter dropping message" in the log | **Adjust**: transforms missing at scan time; check `odom -> base_link` and static lidar transform. |
| Phase 2 | Map smears in turns | **Adjust**: check odometry yaw rate quality and scan timestamp alignment. |
| Phase 2 | Service not found | **Adjust**: use the names from `ros2 service list`. |
| Phase 3 | Doubled walls | **Retry**: replay slower, or record a drive with a slower revisit of the loop. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
