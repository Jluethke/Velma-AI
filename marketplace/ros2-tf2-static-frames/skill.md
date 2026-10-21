# ROS 2 tf2 Frame Tree and Static Transforms

**One-line description:** Lays out a robot's coordinate frame tree per REP 103 and REP 105, publishes fixed sensor mounts as static transforms (static_transform_publisher or robot_state_publisher), assigns each dynamic transform to exactly one publisher, and verifies the tree with view_frames and tf2_echo.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `frame_spec` (object, required): Every sensor and body with its mount position in meters and orientation in radians relative to a named parent, taken from CAD or measurement, plus which nodes provide odometry and localization.
- `workspace_dir` (string, required): Workspace root.

---

## Outputs

- `frame_tree` (object): Parent and child for every frame, static or dynamic, and the single publisher of each transform.
- `tf_check` (object): The `view_frames` PDF path and `tf2_echo` output for every leaf frame relative to `base_link`.

---

## Phase 1: Lay Out the Tree

### Entry Criteria
- `frame_spec` gives a parent, translation and rotation for every frame.

### Actions
1. Apply REP 103 axis conventions: body frames are x forward, y left, z up, right handed; units meters and radians. Camera optical frames, named with the suffix `_optical_frame`, are z forward, x right, y down.
2. Apply REP 105 frame names and roles:

| Frame | Role | Publisher of the transform into it |
|---|---|---|
| `map` | World-fixed, globally consistent, may jump | Root, or child of `earth` for multi-map systems |
| `odom` | World-fixed, continuous, drifts over time | `map -> odom` from the localization node |
| `base_link` | Rigidly attached to the robot body | `odom -> base_link` from the odometry source |
| sensor frames | Fixed mounts | Static transforms from `base_link` or a child |

3. Each frame has exactly one parent. Each transform has exactly one publisher. Write `frame_tree` as a table: parent, child, static or dynamic, publisher.
4. Record any frame whose mount values are not measured or from CAD as an open question; do not estimate a mount.

### Output
Draft `frame_tree`.

### Quality Gate
- Every child frame appears exactly once as a child.
- Every transform row names exactly one publisher.

---

## Phase 2: Publish Static Transforms

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Decision rule: if the robot has a URDF, put fixed mounts in it as `fixed` joints and run `robot_state_publisher` with `robot_description`; it publishes fixed joints on `/tf_static`. If there is no URDF, use one `static_transform_publisher` per mount.
2. Static publisher command form for Humble and newer (named arguments):
   `ros2 run tf2_ros static_transform_publisher --x 0.20 --y 0.0 --z 0.15 --roll 0.0 --pitch 0.0 --yaw 0.0 --frame-id base_link --child-frame-id laser_link`
   The older positional form is deprecated. Quaternion form uses `--qx --qy --qz --qw`.
3. In a launch file use `Node(package='tf2_ros', executable='static_transform_publisher', arguments=['--x', '0.20', ..., '--frame-id', 'base_link', '--child-frame-id', 'laser_link'])`.
4. Confirm each sensor driver's `frame_id` parameter equals the child frame name you used. A mismatch leaves data in a frame that is not in the tree.
5. Do not publish a fixed mount on `/tf` in a timer loop; static data belongs on `/tf_static`, which uses transient local durability so late subscribers receive it.

### Output
Static transforms running.

### Quality Gate
- `ros2 topic echo --once /tf_static` contains a transform for every static row of `frame_tree`.
- Each sensor's published `header.frame_id` (checked with `ros2 topic echo --once <topic> --field header`) matches the tree.

---

## Phase 3: Verify the Tree

### Entry Criteria
- All publishers in `frame_tree` are running.

### Actions
1. `ros2 run tf2_tools view_frames` listens for a few seconds and writes `frames_<timestamp>.pdf` and `.gv`. Open the PDF; it must be one connected tree rooted at `map` (or `odom` when no localization runs).
2. For each leaf frame: `ros2 run tf2_ros tf2_echo base_link <leaf>`. It prints `Translation: [x, y, z]` and rotation in quaternion and RPY. Compare with `frame_spec`.
3. Check orientation physically: place an object in front of the sensor and confirm it appears at positive x in `base_link` in RViz with the Fixed Frame set to `base_link`.
4. Fill `tf_check`.

### Output
`frame_tree`, `tf_check`.

### Quality Gate
- The PDF shows a single tree with no unconnected subtrees.
- Every `tf2_echo` translation equals `frame_spec` to the precision given in `frame_spec`.

---

## Worked Example

Illustrative only. Lidar 0.20 m ahead of and 0.15 m above `base_link`.

- Phase 2: static publisher as in step 2; `/tf_static` echo shows `child_frame_id: laser_link`.
- Phase 3: `ros2 run tf2_ros tf2_echo base_link laser_link` prints `Translation: [0.200, 0.000, 0.150]` and `Rotation: in RPY (degree) [0.000, -0.000, 0.000]`.

---

## Exit Criteria

DONE when the tree is one connected REP 105 tree, every transform has one publisher, and every leaf matches its measured mount.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Mount not measured | **Return**: request the measurement or CAD value. |
| Phase 1 | Two nodes would publish the same transform (for example two odometry sources both publish `odom -> base_link`) | **Adjust**: disable TF output on all but one (for example fuse them in a filter that is the only publisher). |
| Phase 3 | `view_frames` shows two trees | **Adjust**: find the missing link between the trees and add its publisher. |
| Phase 3 | Object appears behind or mirrored | **Adjust**: fix the yaw or sign in the mount; recheck REP 103 axes. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
