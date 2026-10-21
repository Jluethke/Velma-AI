# ROS 2 Static Sensor Extrinsics

**One-line description:** Publishes each sensor's measured mounting transform as a ROS 2 static transform from a launch file and proves the resulting tf tree matches the frame spec with `tf2_echo` and `view_frames`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `frame_spec` (object, required): Output of `loc-frame-convention-audit`, with every static edge and the measured offsets.
- `project_dir` (string, required): Path of the ROS 2 package that will hold the launch file.

---

## Outputs

- `extrinsics_launch` (string): Path of the launch file that publishes every static sensor transform.
- `tf_tree_report` (object): The `view_frames` output path, the `tf2_echo` reading for every static edge, and any mismatch against `frame_spec`.

---

## Phase 1: Write The Static Transforms

### Entry Criteria
- `frame_spec` has every sensor edge with translation in meters and rotation as roll, pitch, yaw in radians or as a quaternion.
- ROS 2 is sourced: `ros2 --help` runs.

### Actions
1. For each static edge, write one `Node` in `<project_dir>/launch/extrinsics.launch.py` using package `tf2_ros`, executable `static_transform_publisher`.
2. Use the named-argument form available in ROS 2 Humble and later: `--x --y --z --roll --pitch --yaw --frame-id <parent> --child-frame-id <child>`. Run `ros2 run tf2_ros static_transform_publisher --help` and confirm these flags exist on your distribution before writing them.
3. Enter rotations in radians. If the measurement is in degrees, convert in the launch file with `math.radians` and leave the degree value in a comment.
4. Do not publish a sensor transform from both the launch file and a URDF via `robot_state_publisher`. Pick one source per edge.

### Output
`extrinsics_launch` file with one publisher per static edge.

### Quality Gate
- `ros2 launch <pkg> extrinsics.launch.py` starts with no error lines.
- The number of `static_transform_publisher` nodes equals the number of static edges in `frame_spec`.

---

## Phase 2: Verify The Tree

### Entry Criteria
- The launch file runs.

### Actions
1. With the launch running, for each static edge run `ros2 run tf2_ros tf2_echo <parent> <child>` and copy the printed Translation and Rotation (RPY in radians and degrees).
2. Compare each reading against `frame_spec`. A sign flip on y or yaw usually means a FRD measurement was typed into a FLU frame.
3. Run `ros2 run tf2_tools view_frames` and record the generated `frames_<timestamp>.pdf` path. Confirm the tree is one connected tree rooted at the expected frame.
4. Measure one transform physically as a spot check: tape-measure the lidar height above the ground plane and compare with the published z of `base_link -> lidar_link` plus the `base_link` height.

### Output
`tf_tree_report`.

### Quality Gate
- Every `tf2_echo` reading matches `frame_spec` to the precision the measurement was recorded at.
- `view_frames` shows a single tree with no orphan frames.

---

## Worked Example

Illustrative. `frame_spec` edge: `base_link -> lidar_link`, x 1.20 m, y 0.00, z 1.85, yaw 0.

Launch entry arguments: `--x 1.20 --y 0.0 --z 1.85 --roll 0 --pitch 0 --yaw 0 --frame-id base_link --child-frame-id lidar_link`.

`ros2 run tf2_ros tf2_echo base_link lidar_link` prints `Translation: [1.200, 0.000, 1.850]` and `Rotation: in RPY (radian) [0.000, -0.000, 0.000]`. Report: match.

---

## Exit Criteria

DONE when every static edge is published once, each `tf2_echo` reading matches `frame_spec`, and `view_frames` shows one connected tree.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Named flags rejected by `static_transform_publisher` | **Adjust**: use the positional form documented by `--help` on that distribution. |
| Phase 2 | `tf2_echo` prints "Invalid frame ID" | **Retry**: check the frame string spelling in the launch file against `frame_spec`; frame IDs are case sensitive. |
| Phase 2 | Two disconnected trees | **Return**: send the missing edge back to `loc-frame-convention-audit`. |
| Phase 2 | Physical spot check disagrees with published value | **Stop**: re-measure the mount; do not tune a filter on a wrong extrinsic. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
