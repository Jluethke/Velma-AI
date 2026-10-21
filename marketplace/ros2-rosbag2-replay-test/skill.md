# ROS 2 rosbag2 Replay for Offline Testing

**One-line description:** Replays an MCAP bag with simulated time into the nodes under test, isolates them from live drivers by remapping or domain, controls rate and start offset, and confirms the nodes consumed the replayed data on the bag's clock.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `bag_path` (string, required): Bag from `ros2-rosbag2-mcap-record`.
- `bag_info` (object, required): The bag's topic list and counts.

---

## Outputs

- `replay_report` (object): Play command, nodes under test with `use_sim_time`, observed output rates, and any differences from live behavior.

---

## Phase 1: Isolate the Replay

### Entry Criteria
- `bag_info` lists the topics the nodes under test consume.

### Actions
1. Never replay onto a live robot network where drivers or controllers are running; replayed commands would reach real hardware. Use a separate `ROS_DOMAIN_ID` on an isolated host, or `ROS_AUTOMATIC_DISCOVERY_RANGE=LOCALHOST` (Iron and newer) or `ROS_LOCALHOST_ONLY=1` (Humble).
2. If the bag contains command topics (for example `/cmd_vel`) and the nodes under test produce them, exclude them from playback: `--topics` with only the input topics.
3. Verify isolation: `ros2 node list` before playback shows only the nodes under test.

### Output
Isolated environment.

### Quality Gate
- `ros2 node list` shows no hardware driver or controller nodes.

---

## Phase 2: Play With Simulated Time

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Start the nodes under test with `use_sim_time:=true` (launch argument or `--ros-args -p use_sim_time:=true`). All nodes must agree.
2. Play: `ros2 bag play <bag_path> --clock --topics <input topics...>`. `--clock` publishes `/clock` from the bag timestamps. Optional: `--rate 0.5` slows playback, `--start-offset <s>` skips ahead, `--loop` repeats, `--remap /scan:=/scan_replay` renames topics. Confirm flags with `ros2 bag play --help` for your distro.
3. Recent distros support `--start-paused` and keyboard controls (space to pause or resume); check `--help`.
4. Static transforms: `/tf_static` is replayed with its recorded QoS; include it in `--topics` whenever `/tf` is included.

### Output
Running replay.

### Quality Gate
- `ros2 topic echo --once /clock` prints a time equal to the bag's start time region from `bag_info`, not wall time.
- `ros2 param get <node> use_sim_time` prints `True` for every node under test.

---

## Phase 3: Observe and Compare

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. `ros2 topic hz <node output>` during playback; record the rate. At `--rate r`, expect the output rate to scale by about r for input-driven nodes.
2. Record the nodes' outputs: `ros2 bag record -s mcap -o <bag_path>_out <output topics>` in parallel, for comparison across code versions.
3. Compare to a previous run's output bag if one exists (message counts and spot checks of values).
4. Note any tf2 extrapolation errors; they usually mean a node is not using sim time.

### Output
`replay_report`.

### Quality Gate
- Every node output topic shows a rate during playback.
- The output bag exists and `ros2 bag info` lists the outputs with Count greater than 0.

---

## Worked Example

Illustrative only. Testing an obstacle node on `bags/run01`.

- Phase 1: `ROS_DOMAIN_ID=42` on an isolated laptop; `ros2 node list` shows only `/obstacle_node`.
- Phase 2: `ros2 bag play bags/run01 --clock --topics /scan /tf /tf_static`.
- Phase 3: `ros2 topic hz /obstacles` prints `average rate: 9.99`; output bag `bags/run01_out` has `/obstacles Count: 598`.

---

## Exit Criteria

DONE when replay ran isolated from hardware, on the bag's clock, and the nodes' outputs were recorded and compared.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Hardware driver nodes visible | **Stop**: change domain or isolate the host before playing. |
| Phase 2 | `/clock` shows wall time | **Adjust**: add `--clock` and stop any other `/clock` publisher. |
| Phase 3 | Node output silent | **Adjust**: check `use_sim_time` and QoS of the replayed topic with `ros2 topic info -v`. |
| Phase 3 | `Lookup would require extrapolation` errors | **Adjust**: run `ros2-tf2-lookup-debug`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
