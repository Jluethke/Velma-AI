# ROS 2 Graph Introspection With ros2 doctor and the CLI

**One-line description:** Runs a fixed introspection sequence (ros2 doctor report, daemon reset, node, topic, service and parameter listing, rate and bandwidth sampling) and compares the live graph to the expected node and topic list, classifying each difference as a name, discovery, QoS or type fault.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `topic_list` (object[], required): Expected topics with types, publishers, subscribers and rates.
- `node_spec` (object, required): Expected fully qualified node names.

---

## Outputs

- `introspection_report` (object): ros2 doctor result, expected-versus-observed tables for nodes and topics, measured rates, and each difference with its fault class and next flow.

---

## Phase 1: Environment Health

### Entry Criteria
- The system under test is running.

### Actions
1. `ros2 doctor`. It prints checks and ends with `All N checks passed` or lists failed checks. Then `ros2 doctor --report` and save it; read the sections for ROS 2 information (distro), RMW middleware name, network configuration and topic list.
2. Confirm in the report: distro matches all hosts, middleware matches `RMW_IMPLEMENTATION` on all hosts, and the expected network interface is up.
3. `ros2 daemon stop` then `ros2 daemon start`. The daemon caches graph data; a stale daemon shows nodes that have exited or misses new ones.

### Output
Health section of the report.

### Quality Gate
- `ros2 doctor` output and the `--report` file are saved.
- Middleware name is recorded per host.

---

## Phase 2: Compare the Graph

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. `ros2 node list`. Compare with `node_spec`. A warning that nodes share an exact name means two processes use one name; parameters and services on that name become unreliable.
2. `ros2 topic list -t` lists topics with types. Compare with `topic_list`.
3. For each expected topic: `ros2 topic info -v <topic>` for endpoint counts, node names, types and QoS.
4. `ros2 service list -t` and `ros2 action list -t` when the design uses them.
5. Classify each difference:

| Observation | Fault class | Next flow |
|---|---|---|
| Node missing from `ros2 node list` | Process not running or discovery | Check the process; then `ros2-dds-rmw-selection` |
| Topic present under a different name or namespace | Name or remap | `ros2-py-launch-file` |
| Both endpoints present, no data | QoS | `ros2-qos-incompatibility-debug` |
| Same topic name, different types per endpoint | Type | `ros2-interface-definition` |
| Node visible only on its own host | Discovery | `ros2-dds-rmw-selection` |

### Output
Difference table.

### Quality Gate
- Every expected node and topic is marked present or absent, and every difference has a fault class.

---

## Phase 3: Measure Data Flow

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. For each topic with an expected rate: `ros2 topic hz <topic>`; read `average rate`, `min`, `max`, `std dev` over at least two printed windows.
2. For large topics: `ros2 topic bw <topic>`.
3. For stamped messages: `ros2 topic delay <topic>` prints the age of messages from `header.stamp` (requires a header).
4. One sample: `ros2 topic echo --once <topic>` (add `--no-arr` to hide long arrays).
5. Visual check of connections: `ros2 run rqt_graph rqt_graph` when a display is available.

### Output
`introspection_report`.

### Quality Gate
- Every topic with an expected rate has a measured rate recorded.
- Every difference from Phase 2 names the next flow.

---

## Worked Example

Illustrative only. Expected `/front/range_filter` publishing `/front/range` at 20 Hz.

- Phase 1: `ros2 doctor` prints `All 5 checks passed`.
- Phase 2: `ros2 topic list -t` shows `/range [sensor_msgs/msg/Range]` but not `/front/range`: fault class name or remap, next flow `ros2-py-launch-file`.
- Phase 3: `ros2 topic hz /range` prints `average rate: 20.001`.

---

## Exit Criteria

DONE when environment health, graph comparison and data rates are recorded and every difference has a fault class and next flow.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ros2 doctor` reports a failed network check | **Adjust**: record the interface; check cables or WiFi before graph work. |
| Phase 2 | CLI shows nothing at all | **Retry**: restart the daemon, confirm `ROS_DOMAIN_ID` in this shell, rerun. |
| Phase 3 | `ros2 topic hz` silent but `info` shows endpoints | **Return**: hand off to `ros2-qos-incompatibility-debug`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
