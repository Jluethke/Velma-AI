# Gazebo to ROS 2 Bridge with Simulated Clock

**One-line description:** Writes a `ros_gz_bridge` YAML config and a ROS 2 launch file that start Gazebo, bridge sensor, command and `/clock` topics with the correct message types and directions, and verifies every ROS node runs on simulation time.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `world_file` (string, required): World from `vsim-gz-vehicle-model`.
- `noisy_vehicle_sdf` (string, required): Model with sensors from `vsim-gz-sensor-noise`.
- `ros_distro` (string, required): "humble", "jazzy" or newer.
- `gz_version` (string, required): "fortress", "garden", "harmonic" or newer.

---

## Outputs

- `bridge_config` (string): Path to `config/bridge.yaml` listing each bridged topic with ROS type, Gazebo type and direction.
- `sim_launch_file` (string): Path to `launch/sim.launch.py` that starts Gazebo and the bridge with `use_sim_time` true.

---

## Phase 1: Check the Version Pairing

### Entry Criteria
- All inputs present.

### Actions
1. Use the official pairing from the Gazebo "ROS 2 integration" docs: Humble pairs with Fortress, Jazzy pairs with Harmonic. Other pairings need `ros_gz` built from source; if your pair is not official, record that and follow the docs' source-build steps.
2. Install the binary packages for an official pair: `sudo apt install ros-<ros_distro>-ros-gz`.
3. Confirm: `ros2 pkg list | grep ros_gz` shows `ros_gz_bridge` and `ros_gz_sim`.
4. Message type prefix: `gz.msgs.` for Garden and newer, `ignition.msgs.` for Fortress.

### Output
Installed and confirmed `ros_gz` packages.

### Quality Gate
- `ros2 pkg list | grep ros_gz_bridge` prints the package.
- The pairing is cited from the Gazebo docs.

---

## Phase 2: Write the Bridge Config

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. List the Gazebo topics: start `gz sim -s -r <world_file>` and run `gz topic -l`; get each type with `gz topic -i -t <topic>`.
2. Write `config/bridge.yaml` with one entry per topic, using this mapping table:

| Gazebo type | ROS type | Direction |
|---|---|---|
| `gz.msgs.Clock` | `rosgraph_msgs/msg/Clock` | `GZ_TO_ROS` |
| `gz.msgs.Image` | `sensor_msgs/msg/Image` | `GZ_TO_ROS` |
| `gz.msgs.CameraInfo` | `sensor_msgs/msg/CameraInfo` | `GZ_TO_ROS` |
| `gz.msgs.PointCloudPacked` | `sensor_msgs/msg/PointCloud2` | `GZ_TO_ROS` |
| `gz.msgs.LaserScan` | `sensor_msgs/msg/LaserScan` | `GZ_TO_ROS` |
| `gz.msgs.IMU` | `sensor_msgs/msg/Imu` | `GZ_TO_ROS` |
| `gz.msgs.NavSat` | `sensor_msgs/msg/NavSatFix` | `GZ_TO_ROS` |
| `gz.msgs.Odometry` | `nav_msgs/msg/Odometry` | `GZ_TO_ROS` |
| `gz.msgs.Twist` | `geometry_msgs/msg/Twist` | `ROS_TO_GZ` |

   Entry format:
```yaml
- ros_topic_name: "/clock"
  gz_topic_name: "/clock"
  ros_type_name: "rosgraph_msgs/msg/Clock"
  gz_type_name: "gz.msgs.Clock"
  direction: GZ_TO_ROS
```
3. Always bridge `/clock`. Without it, nodes with `use_sim_time` true never see time advance.
4. Bridge commands (`cmd_vel`) only `ROS_TO_GZ`. Do not make command topics bidirectional; the echo loops back into ROS.
5. Check any pair not in the table against the `ros_gz_bridge` README type list; do not invent a type pair.

### Output
`bridge_config`.

### Quality Gate
- `python -c "import yaml; print(len(yaml.safe_load(open('config/bridge.yaml'))))"` prints the number of intended topics.
- `/clock` appears with direction `GZ_TO_ROS`.

---

## Phase 3: Launch File and Live Check

### Entry Criteria
- `bridge_config` written.

### Actions
1. Write `launch/sim.launch.py` that includes `ros_gz_sim`'s `gz_sim.launch.py` with `gz_args` set to `-r <world_file>` (add `-s --headless-rendering` for CI), and a `Node(package='ros_gz_bridge', executable='parameter_bridge', parameters=[{'config_file': <bridge_config>, 'use_sim_time': True}])`.
2. Pass `use_sim_time: True` to every node in this launch and to the system under test.
3. Launch: `ros2 launch <pkg> sim.launch.py`.
4. Check, each in its own terminal:
   - `ros2 topic list` shows every bridged ROS topic.
   - `ros2 topic hz /clock` prints a rate.
   - `ros2 topic hz /front_cam/image` rate is close to the SDF `<update_rate>` (lower is possible under GPU load; record it).
   - `ros2 param get /parameter_bridge use_sim_time` prints `Boolean value is: True`.
   - `ros2 topic pub --once /model/car/cmd_vel geometry_msgs/msg/Twist "{linear: {x: 1.0}}"` then `gz model -m car -p` shows movement. This is a simulated vehicle only.
5. Pause the simulation (`gz service -s /world/<world>/control --reqtype gz.msgs.WorldControl --reptype gz.msgs.Boolean --timeout 1000 --req 'pause: true'`) and confirm `/clock` stops advancing with `ros2 topic echo /clock --once` twice. If it keeps advancing, something publishes wall time on `/clock`.

### Output
`sim_launch_file`.

### Quality Gate
- `ros2 topic hz /clock` reports a rate while running and the clock value stops when paused.
- `use_sim_time` is True on the bridge node.

---

## Worked Example

Illustrative. `ros_distro` = "jazzy", `gz_version` = "harmonic".
```
$ ros2 topic list
/clock
/front_cam/image
/imu
/lidar/points
/model/car/cmd_vel
$ ros2 topic hz /clock
average rate: 999.8
$ ros2 param get /parameter_bridge use_sim_time
Boolean value is: True
```

---

## Exit Criteria

DONE when every sensor and command topic is bridged with the correct type and direction, `/clock` drives all nodes, and pausing Gazebo stops ROS time.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Unofficial version pair | **Adjust**: build `ros_gz` from source per the docs, or switch to an official pair. |
| Phase 2 | Bridge logs `Failed to create a bridge` | **Adjust**: the type pair is wrong or unsupported; check the README list. |
| Phase 3 | ROS topic exists but no messages | **Adjust**: the Gazebo topic name differs; compare with `gz topic -l`. |
| Phase 3 | Nodes use wall time | **Retry**: set `use_sim_time` true on that node and relaunch. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
