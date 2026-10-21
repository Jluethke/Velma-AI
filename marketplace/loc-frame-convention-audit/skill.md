# Localization Frame Convention Audit

**One-line description:** Fixes every coordinate frame a vehicle localization stack uses (world, map, odom, base_link, each sensor), states the axis convention of each (ENU or NED, FLU or FRD), and records every sensor whose native convention differs from the project convention, before any filter is written.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `vehicle_spec` (object, required): Vehicle geometry: wheelbase, track width, reference point chosen as `base_link` (for example rear axle center on the ground plane), and the measured mounting position and orientation of every sensor relative to that point.
- `sensor_list` (object[], required): Every sensor with make, model, driver package, published message type, and the frame_id string the driver writes into its messages.

---

## Outputs

- `frame_spec` (object): The frame tree (parent, child, static or dynamic, publisher), the world convention (ENU or NED), the body convention (FLU or FRD), every sensor frame with its native convention, the conversion each sensor needs, and the angle units and yaw zero reference for each heading source.

---

## Phase 1: Choose The Project Conventions

### Entry Criteria
- `vehicle_spec` names a `base_link` reference point and gives sensor mounting offsets in a stated unit.
- `sensor_list` lists every sensor that will feed the filter.

### Actions
1. Pick the world convention with this table. Do not mix conventions inside one filter.

   | If the stack is | World frame | Body frame | Reference |
   |---|---|---|---|
   | ROS or ROS 2 (robot_localization, nav2, slam_toolbox) | ENU (x east, y north, z up) | FLU (x forward, y left, z up) | REP 103 |
   | PX4, ArduPilot, or aerospace INS output | NED (x north, y east, z down) | FRD (x forward, y right, z down) | vendor docs |
   | Custom Python or C++ filter with no ROS consumer | ENU unless every consumer is aerospace | FLU | project choice, write it down |

2. Write the ROS frame hierarchy from REP 105 if the stack uses ROS: `earth` (optional, ECEF) -> `map` -> `odom` -> `base_link` -> sensor frames. `odom` is continuous and drifts; `map` is globally consistent and may jump.
3. Record the yaw zero reference per heading source. REP 103 ENU yaw is 0 when facing east and increases counterclockwise. A compass or many INS units report heading 0 at north, increasing clockwise. These differ by a rotation and a sign flip, not just an offset.
4. Record the angle unit of every heading or steering signal (degrees or radians) exactly as the driver or DBC publishes it.

### Output
Project world and body conventions and the REP 105 frame hierarchy, written into a draft `frame_spec`.

### Quality Gate
- Exactly one world convention and one body convention are recorded in `frame_spec`.
- Every heading source in `sensor_list` has a yaw zero reference and a direction of increase recorded.

---

## Phase 2: Map Each Sensor To The Convention

### Entry Criteria
- Draft `frame_spec` from Phase 1.

### Actions
1. For each sensor, read the driver documentation or source for the frame it publishes in. Do not assume. Examples to check: many IMU drivers publish in the chip's own axes; REP 145 requires IMU data in the sensor frame with orientation relative to an ENU world.
2. For each sensor, run the driver and read one message: `ros2 topic echo --once /imu/data` (ROS 2) or the vendor tool output. Record `header.frame_id`.
3. With the vehicle stationary and level, check the IMU sign: `linear_acceleration.z` must read about +9.8 m/s^2 in a FLU frame (gravity reaction points up) and about -9.8 in an FRD frame. If it reads the wrong sign, the axis convention differs from what the driver claims.
4. Rotate the stationary vehicle by hand only if it is safe to push, or drive it slowly by a licensed driver in a left turn: `angular_velocity.z` must be positive for a left (counterclockwise from above) turn in FLU.
5. For each sensor whose native convention differs, record the exact conversion: ENU to NED is (x, y, z) -> (y, x, -z); FLU to FRD is (x, y, z) -> (x, -y, -z).

### Output
Per-sensor frame rows with native convention, measured sign checks, and required conversion.

### Quality Gate
- Every sensor row has a `header.frame_id` copied from a real echoed message.
- The IMU gravity sign and yaw-rate sign checks are recorded with the measured values.

---

## Phase 3: Freeze The Frame Spec

### Entry Criteria
- Every sensor is mapped.

### Actions
1. Write the final frame tree: each edge with parent, child, static or dynamic, and which node publishes it.
2. Confirm each child frame has exactly one parent and each dynamic transform has exactly one publisher. Two nodes publishing `map -> odom` is the most common ROS localization fault.
3. Save `frame_spec` as a YAML or JSON file in the project and state its path.

### Output
`frame_spec`.

### Quality Gate
- Every child frame appears exactly once as a child in the tree.
- Every dynamic edge names exactly one publisher.

---

## Worked Example

Illustrative. Input: a passenger car, `base_link` at rear axle center on the ground, a 6-axis IMU on the center console, a GNSS antenna on the roof, a 3D lidar on the roof rack, ROS 2 Humble.

- Phase 1: world ENU, body FLU, tree `map -> odom -> base_link -> {imu_link, gnss_link, lidar_link}`. The GNSS receiver reports heading 0 north clockwise, recorded as "needs ENU yaw = pi/2 - heading".
- Phase 2: `ros2 topic echo --once /imu/data` prints `frame_id: imu_link`, `linear_acceleration.z: 9.79`. A slow left turn gives `angular_velocity.z: 0.21`, consistent with FLU.
- Phase 3: `map -> odom` published by the map-frame EKF, `odom -> base_link` by the odom-frame EKF, sensor edges static.

---

## Exit Criteria

DONE when `frame_spec` lists every frame, its convention, its single parent and publisher, and every sensor's conversion backed by an echoed message and a measured sign check.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `vehicle_spec` gives no `base_link` reference point | **Stop**: ask the user to choose and measure one; every extrinsic depends on it. |
| Phase 2 | Driver frame convention undocumented | **Adjust**: decide it from the measured gravity and yaw-rate signs and record the evidence. |
| Phase 2 | Gravity sign contradicts the driver documentation | **Return**: record the measured convention as truth and flag the driver setting to the user. |
| Phase 3 | Two publishers for one dynamic edge | **Adjust**: assign the edge to one node and disable transform publishing in the other (for example `publish_tf: false`). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
