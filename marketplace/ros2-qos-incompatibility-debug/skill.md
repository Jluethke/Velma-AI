# ROS 2 QoS Incompatibility Debug

**One-line description:** Diagnoses a topic where publisher and subscriber both exist but no data arrives, isolates the failing QoS policy with `ros2 topic info -v` and incompatible-QoS events, and fixes it by changing exactly one endpoint, then proves delivery resumed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `qos_table` (object[], required): Intended per-topic QoS from `ros2-qos-profile-selection`.
- `qos_mismatches` (object[], required): Known incompatible pairs, possibly empty.

---

## Outputs

- `qos_fix_report` (object[]): Per fixed topic: symptom, the evidence lines, the policy at fault, the single endpoint changed (file and line), and the before and after `ros2 topic hz` output.

---

## Phase 1: Confirm the Symptom Is QoS

### Entry Criteria
- A topic is reported as silent, or `qos_mismatches` is non-empty.

### Actions
1. Run `ros2 topic info -v <topic>`. If `Publisher count: 0` or `Subscription count: 0`, the problem is not QoS: stop this flow and use `ros2-doctor-introspection` (wrong name, namespace or discovery).
2. If both counts are at least 1, compare each endpoint's `Reliability` and `Durability` lines with the compatibility table in `ros2-qos-profile-selection`.
3. Search the node logs for `incompatible QoS` (for example `ros2 run ... 2>&1 | grep -i "incompatible qos"`, or `ros2 topic echo /rosout | grep -i incompatible`). The line names the last incompatible policy, for example `RELIABILITY_QOS_POLICY` or `DURABILITY_QOS_POLICY`.
4. If no incompatible-QoS evidence exists and both endpoints are present, check type agreement: both endpoints in `ros2 topic info -v` must show the same `Topic type`. A type mismatch is a different defect; record it and stop.

### Output
The failing policy, or a hand-off to another flow.

### Quality Gate
- The evidence (printed QoS lines or log line) is copied verbatim into the draft report.

---

## Phase 2: Choose Which Endpoint to Change

### Entry Criteria
- A failing policy is identified.

### Actions
1. Apply this rule table. Change ONE endpoint per fix.

| Failing policy | Situation | Change |
|---|---|---|
| Reliability | Sensor publisher is BEST_EFFORT, a subscriber requests RELIABLE | Change the subscriber to BEST_EFFORT (for example `rclcpp::SensorDataQoS()`). Do not make a high-rate sensor publisher RELIABLE to satisfy one consumer. |
| Reliability | Command or state publisher is BEST_EFFORT by mistake | Change the publisher to RELIABLE per `qos_table`. |
| Durability | Subscriber requests TRANSIENT_LOCAL, publisher is VOLATILE, and the data is latched configuration | Change the publisher to TRANSIENT_LOCAL. |
| Durability | Subscriber requests TRANSIENT_LOCAL for streaming data | Change the subscriber to VOLATILE. |
| Deadline or liveliness | Any | **Return** to the owner of the requirement; the duration is a requirement, not a tuning knob. |

2. When the endpoint is in a third-party node, prefer a QoS override parameter if that node declares one. In rclcpp, nodes created with `rclcpp::QosOverridingOptions` accept parameters such as `qos_overrides./<topic>.subscription.reliability`. Confirm with `ros2 param list <node> | grep qos_overrides` before relying on it. Do not edit vendored source.

### Output
A planned single change.

### Quality Gate
- The plan names exactly one file and line, or one override parameter.

---

## Phase 3: Apply and Prove

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Record `ros2 topic hz <topic>` from the subscriber side before the change (expected: nothing printed).
2. Apply the one change; rebuild only that package with `colcon build --packages-select <pkg>`.
3. Restart both nodes in fresh terminals after sourcing `install/setup.bash`.
4. Rerun `ros2 topic info -v <topic>` and confirm the changed endpoint now shows the new policy.
5. Confirm the subscriber node receives data (its own log or its output topic with `ros2 topic hz`).
6. Confirm the incompatible-QoS log line no longer appears.

### Output
`qos_fix_report`.

### Quality Gate
- `ros2 topic info -v` shows the new policy on the changed endpoint.
- The subscriber-side evidence shows messages arriving.
- No incompatible-QoS log line appears after restart.

---

## Worked Example

Illustrative only. `/scan` silent in a custom obstacle node.

- Phase 1: `ros2 topic info -v /scan` shows publisher `Reliability: BEST_EFFORT`, subscriber `Reliability: RELIABLE`; log shows `Last incompatible policy: RELIABILITY_QOS_POLICY`.
- Phase 2: row one; change `obstacle_node.cpp:42` from `rclcpp::QoS(10)` to `rclcpp::SensorDataQoS()`.
- Phase 3: obstacle node output `/obstacles` now prints `average rate: 9.98` in `ros2 topic hz`.

---

## Exit Criteria

DONE when every entry in `qos_mismatches` and every reported silent topic has a recorded root cause, a single applied change, and proof of delivery.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Publisher or subscription count is 0 | **Return**: hand off to `ros2-doctor-introspection`. |
| Phase 1 | Type names differ between endpoints | **Stop**: report a type mismatch; rebuild both sides against one interface definition. |
| Phase 2 | Requirement owner unknown for deadline or liveliness | **Return**: record as an open question. |
| Phase 3 | Still no data after the change | **Retry**: run `ros2 daemon stop` then `ros2 daemon start`, restart nodes, and recheck; if still silent, revert the change and go back to Phase 1. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
