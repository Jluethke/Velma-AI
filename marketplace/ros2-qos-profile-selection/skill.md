# ROS 2 QoS Profile Selection

**One-line description:** Chooses reliability, durability, history and depth for every topic from a decision table keyed on what the data is, checks each publisher and subscriber pair against the DDS request-versus-offered compatibility rules, and writes the result as a per-topic QoS table.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `topic_list` (object[], required): Every topic with its message type, publishers, subscribers, and data class (stream, state, command, latched configuration, event).
- `node_spec` (object, required): Node definitions, used to find each endpoint's current QoS in code.

---

## Outputs

- `qos_table` (object[]): Per topic: reliability, durability, history, depth, and the decision table row that set each value, for publisher and for each subscriber.
- `qos_mismatches` (object[]): Each publisher and subscriber pair that is incompatible under the rules in Phase 2, with the failing policy. Empty when none.

---

## Phase 1: Choose Policies From the Decision Table

### Entry Criteria
- Every topic in `topic_list` has a data class.

### Actions
1. Classify each topic and apply this table. It encodes the ROS 2 QoS documentation guidance and the presets shipped in rclcpp and rclpy. Depth values marked user input must come from the user, not from this flow.

| Data class | Example | Reliability | Durability | History | Depth | Preset that matches |
|---|---|---|---|---|---|---|
| High-rate sensor stream where the newest sample matters | lidar scan, camera image, IMU | BEST_EFFORT | VOLATILE | KEEP_LAST | preset default (5) | `rclcpp::SensorDataQoS()` / `rclpy.qos.qos_profile_sensor_data` |
| State or result every subscriber must see | odometry, filtered estimate | RELIABLE | VOLATILE | KEEP_LAST | user input; the `rclcpp::QoS(10)` examples use 10 | `rclcpp::QoS(depth)` default |
| Command to an actuator controller | cmd_vel | RELIABLE | VOLATILE | KEEP_LAST | 1, so a stale command is never queued behind a new one | `rclcpp::QoS(1)` |
| Latched configuration a late joiner must receive | /tf_static, map, robot_description | RELIABLE | TRANSIENT_LOCAL | KEEP_LAST | 1 | `rclcpp::QoS(1).transient_local()` |
| Event log where no message may be dropped while connected | mission events | RELIABLE | VOLATILE | KEEP_ALL | n/a | `rclcpp::QoS(rclcpp::KeepAll())` |

2. If a topic fits no row, record it in `qos_table` as an open question for the user. Do not pick a row by guess.
3. Find each endpoint's current QoS in code: `grep -rn "create_publisher\|create_subscription" src/` and read the QoS argument. A bare integer such as `10` means KEEP_LAST depth 10, RELIABLE, VOLATILE.
4. Note that depth and history are not part of compatibility; they only size the local queue.

### Output
Draft `qos_table`.

### Quality Gate
- Every topic has a table row reference or an open question.
- Every endpoint's in-code QoS is recorded with its file and line.

---

## Phase 2: Check Compatibility

### Entry Criteria
- Draft `qos_table` exists.

### Actions
1. Apply the compatibility rules from the ROS 2 QoS documentation to every publisher (offered) and subscriber (requested) pair:

| Policy | Publisher offers | Subscriber requests | Compatible |
|---|---|---|---|
| Reliability | BEST_EFFORT | BEST_EFFORT | Yes |
| Reliability | BEST_EFFORT | RELIABLE | **No** |
| Reliability | RELIABLE | BEST_EFFORT | Yes |
| Reliability | RELIABLE | RELIABLE | Yes |
| Durability | VOLATILE | VOLATILE | Yes |
| Durability | VOLATILE | TRANSIENT_LOCAL | **No** |
| Durability | TRANSIENT_LOCAL | VOLATILE | Yes (no history delivered to the late joiner) |
| Durability | TRANSIENT_LOCAL | TRANSIENT_LOCAL | Yes |
| Deadline | offered period greater than requested | | **No** |
| Liveliness | offered kind weaker, or offered lease longer than requested | | **No** |

2. Rule of thumb that follows from the table: a subscriber can always request equal or weaker guarantees than the publisher offers, never stronger.
3. Record every **No** in `qos_mismatches` with topic, both endpoints, and the policy.
4. For tools: `ros2 topic echo` adapts to the publisher's QoS in current distros, but when it does not receive, pass `--qos-reliability best_effort` or `--qos-durability transient_local` explicitly.

### Output
`qos_mismatches`.

### Quality Gate
- Every publisher and subscriber pair in `topic_list` has a compatibility verdict.

---

## Phase 3: Confirm on the Live Graph

### Entry Criteria
- Nodes from `node_spec` can be started.

### Actions
1. Start the system. For each topic run `ros2 topic info -v <topic>`. Each endpoint block prints `QoS profile:` with `Reliability`, `History (Depth)`, `Durability`, `Lifespan`, `Deadline` and `Liveliness`.
2. Compare each printed value to `qos_table`. A difference means the code does not apply the intended profile.
3. Watch node logs for `New subscription discovered on topic '<t>', requesting incompatible QoS. No messages will be sent to it. Last incompatible policy: <POLICY>` or the publisher-side variant. Each such line must already be in `qos_mismatches`.

### Output
`qos_table` confirmed against the live graph.

### Quality Gate
- Every `ros2 topic info -v` value matches `qos_table` or is listed as a defect.
- Every incompatible-QoS log line maps to a `qos_mismatches` entry.

---

## Worked Example

Illustrative only. Topics: `/scan` (stream), `/cmd_vel` (command), `/map` (latched).

- Phase 1: `/scan` gets SensorDataQoS; `/cmd_vel` RELIABLE depth 1; `/map` TRANSIENT_LOCAL depth 1.
- Phase 2: a visualization node subscribes `/scan` with `rclcpp::QoS(10)` (RELIABLE). Publisher offers BEST_EFFORT, so this pair is **No** on reliability.
- Phase 3: `ros2 topic info -v /scan` shows the subscriber with `Reliability: RELIABLE`, and the log prints `Last incompatible policy: RELIABILITY_QOS_POLICY`.

---

## Exit Criteria

DONE when every topic has a justified QoS, every pair has a compatibility verdict, and the live graph matches the table.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Topic data class unknown | **Return**: ask the user which row applies. |
| Phase 1 | QoS set from a parameter at runtime | **Adjust**: read the parameter value with `ros2 param get` and use that. |
| Phase 2 | Deadline or liveliness configured but values unknown | **Return**: request the durations; do not assume defaults. |
| Phase 3 | `ros2 topic info -v` shows `UNKNOWN` values | **Adjust**: record it; some RMW layers do not report every policy, then rely on the code reading from Phase 1. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
