# ROS 2 tf2 Lookup Error Debug

**One-line description:** Classifies a tf2 lookup failure (unconnected trees, extrapolation into the past or future, missing frame, flickering duplicate publisher) from its exact error text, measures transform rates and delays with tf2_monitor, and applies the one fix that matches the class.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `frame_tree` (object, required): Expected tree from `ros2-tf2-static-frames`.

---

## Outputs

- `tf_fix_report` (object[]): Per failure: exact error text, failure class, measurement evidence, the change made, and the passing lookup afterward.

---

## Phase 1: Classify the Error

### Entry Criteria
- A node logs a tf2 exception, or a transform is missing in RViz.

### Actions
1. Copy the full error line. Match it in this table:

| Error text contains | Class |
|---|---|
| `not part of the same tree` or `two or more unconnected trees` | Disconnected tree |
| `does not exist` or `frame ... passed to lookupTransform argument target_frame does not exist` | Missing frame |
| `extrapolation into the future` | Lookup time newer than the newest transform |
| `extrapolation into the past` | Lookup time older than the buffer holds |
| No error, but the frame jumps between two poses | Duplicate publisher |

2. If no row matches, record the text and **Return**; do not guess the class.

### Output
A failure class with its evidence.

### Quality Gate
- The error line is recorded verbatim with its class.

---

## Phase 2: Measure

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. `ros2 run tf2_tools view_frames` and compare the PDF to `frame_tree`. For each edge the PDF shows the broadcaster, average rate and most recent transform.
2. `ros2 run tf2_ros tf2_monitor <source_frame> <target_frame>` prints the average delay and the per-broadcaster publish rate for the chain. Record both.
3. Check clocks: on a bag or simulator, `ros2 param get <node> use_sim_time` must be the same for every node. Across hosts, compare host clocks with `chronyc tracking` (or `timedatectl`) on each host.
4. Duplicate publisher check: `ros2 topic info -v /tf` lists every publisher node; for the child frame in question, `ros2 topic echo /tf --field transforms` and look for two different `header.frame_id` parents or two sources for the same child.

### Output
Measurements.

### Quality Gate
- `tf2_monitor` output is recorded for the failing pair.
- `use_sim_time` values are recorded for every involved node.

---

## Phase 3: Apply the Matching Fix

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Apply only the fix for the class:

| Class | Fix |
|---|---|
| Disconnected tree | Start or fix the publisher of the missing edge (often `odom -> base_link` from odometry or `map -> odom` from localization). |
| Missing frame | Correct the sensor driver's `frame_id` parameter or the static transform's child name to the tree name. |
| Extrapolation into the future | Look up at the message's `header.stamp` with a timeout: rclcpp `tf_buffer_->lookupTransform(target, source, msg->header.stamp, rclcpp::Duration::from_seconds(t))`, rclpy `self.tf_buffer.lookup_transform(target, source, msg.header.stamp, timeout=Duration(seconds=t))`, with `t` from the measured delay in Phase 2. Use `tf2::TimePointZero` (C++) or `rclpy.time.Time()` (Python) only when the newest transform is acceptable for the use. |
| Extrapolation into the past | Process messages sooner, or increase the buffer cache time when constructing the `Buffer`; also align clocks if hosts differ. |
| Duplicate publisher | Disable TF output on all but one source (for example the odometry node's `publish_tf` style parameter; check that node's documented parameter name). |

2. Mismatched `use_sim_time` across nodes is always fixed first: set it identically in the launch file.
3. Keep the `TransformListener` alive for the node's lifetime; creating it inside a callback gives an empty buffer each time.

### Output
`tf_fix_report`.

### Quality Gate
- The original lookup succeeds (log or `tf2_echo`) for the same frames after the fix.
- The error line no longer appears over the same run duration that produced it before.

---

## Worked Example

Illustrative only. Obstacle node logs `Lookup would require extrapolation into the future. Requested time 1710000000.120 but the latest data is at time 1710000000.100`.

- Phase 1: class extrapolation into the future.
- Phase 2: `tf2_monitor odom laser_link` shows average delay of about 0.02 s for `odom -> base_link`.
- Phase 3: lookup changed to the message stamp with a timeout covering the measured delay; error gone across a 10 minute run.

---

## Exit Criteria

DONE when each failure is classified from its exact text, measured, fixed by the matching rule, and the lookup succeeds.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Error text matches no row | **Return**: record it and request more context. |
| Phase 2 | Clocks across hosts differ | **Adjust**: configure chrony or another NTP or PTP source before any code change. |
| Phase 3 | Fix applied but error persists | **Retry**: rerun Phase 2; if the class changed, return to Phase 1 with the new text. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
