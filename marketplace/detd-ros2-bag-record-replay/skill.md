# ROS 2 Bag Record and Deterministic Replay

**One-line description:** Records decision inputs with `ros2 bag record -s mcap`, explains why `ros2 bag play --clock` with `use_sim_time` is not bit-exact (DDS delivery, executor callback order, timers), and builds a single-process replay that reads the bag with `rosbag2_py.SequentialReader` and calls the node's step function directly in recorded order.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ros_graph_nodes` (string[], required): The decision node names and the topics they subscribe to.
- `record_schema` (object, required): Output of `detd-boundary-record-schema`.

---

## Outputs

- `bag_procedure` (object): Exact record and replay commands, QoS overrides, and the in-process replay entry point.
- `sample_recording` (string): Path to an MCAP bag that `ros2 bag info` reads without error.

---

## Phase 1: Record

### Entry Criteria
- ROS 2 environment sourced (`ros2 --help` works); `ros2 bag --help` lists `record`, `play`, `info`.
- The mcap storage plugin is installed (`ros2 bag record --help` lists `mcap` under storage choices, or the package `rosbag2_storage_mcap` is present).

### Actions
1. List the topics the decision node subscribes to: `ros2 node info /<node>` under `Subscribers`.
2. Record exactly those topics plus `/tf` and `/tf_static`: `ros2 bag record -s mcap -o run_001 /topic_a /topic_b /tf /tf_static`.
3. `/tf_static` publishers use transient local durability; a late-starting recorder may need a QoS override file (`--qos-profile-overrides-path overrides.yaml`) so it receives latched messages. Check the rosbag2 README for the YAML keys in your distribution.
4. Also record the decision node's output topics, so replay can compare.
5. After stopping with Ctrl-C, run `ros2 bag info run_001` and confirm message counts per topic are non-zero.

### Output
`sample_recording`.

### Quality Gate
- `ros2 bag info run_001` exits 0 and lists every subscribed topic with a count above zero.

---

## Phase 2: Understand Why Play Is Not Bit-Exact

### Entry Criteria
- A bag exists.

### Actions
1. Standard replay is `ros2 bag play run_001 --clock` with the node started with parameter `use_sim_time:=true`; the node then takes time from `/clock`.
2. Record these limits in `bag_procedure`, because they cause run-to-run differences:

| Cause | Effect |
|---|---|
| DDS transport and QoS | Messages may be dropped or delivered in a different interleaving across topics |
| Executor callback order | With several ready callbacks, order depends on the executor; `MultiThreadedExecutor` runs them concurrently |
| Timers on sim time | Timer callbacks fire relative to `/clock` publish rate, not per message |
| Play rate and startup race | The node may miss early messages if it subscribes after play starts |

3. Use `ros2 bag play` for integration smoke tests only, never as the bit-exact gate.

### Output
Limits section of `bag_procedure`.

### Quality Gate
- `bag_procedure` lists each cause with the replay mode it applies to.

---

## Phase 3: In-Process Deterministic Replay

### Entry Criteria
- The node's logic is callable as a function `step(state, batch, now_ns)` per `detd-input-ordering-contract`, separate from ROS callbacks.

### Actions
1. Read the bag in one process:
   - `reader = rosbag2_py.SequentialReader()`
   - `reader.open(rosbag2_py.StorageOptions(uri="run_001", storage_id="mcap"), rosbag2_py.ConverterOptions("", ""))`
   - Build a topic to type map from `reader.get_all_topics_and_types()`.
   - Loop `while reader.has_next(): topic, data, t = reader.read_next()`; deserialize with `rclpy.serialization.deserialize_message(data, rosidl_runtime_py.utilities.get_message(type_name))`.
2. Group messages into ticks using the recorded tick membership if the node also wrote a boundary record; otherwise define ticks by the node's own timer period and record that this is an approximation.
3. Call `step` directly with an injected clock set to the tick time. No executor, no DDS.
4. Compare outputs to the recorded output topic messages, serialized with `rclpy.serialization.serialize_message`, with byte equality.
5. Run the replay twice and `cmp` the outputs.

### Output
`bag_procedure` with the in-process entry point.

### Quality Gate
- Two in-process replays of the same bag produce outputs where `cmp` exits 0.
- The procedure names the script and function that implement the loop.

---

## Worked Example

Illustrative only. `ros2 bag info run_001` shows `/radar/tracks Count: 4012`, `/planner/cmd Count: 401`. `ros2 bag play` replay twice: output counts 399 and 401 (two dropped at startup). In-process replay twice: 401 and 401, `cmp` exit 0.

---

## Exit Criteria

DONE when a bag of the right topics exists, the limits of play-based replay are documented, and the in-process replay is repeatable byte for byte.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | mcap plugin missing | **Adjust**: install the distribution's `rosbag2-storage-mcap` package, or record with the default storage and note it. |
| Phase 2 | Team wants `ros2 bag play` as the gate | **Return**: report the listed causes; keep play as a smoke test. |
| Phase 3 | Logic cannot be called outside callbacks | **Stop**: refactor per `detd-input-ordering-contract` first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
