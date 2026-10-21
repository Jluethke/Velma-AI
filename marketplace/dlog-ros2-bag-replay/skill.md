# ROS 2 Bag Replay with Sim Time

**One-line description:** Replays a recorded drive or test slice into a ROS 2 stack with `ros2 bag play --clock` and `use_sim_time`, records the stack's outputs to a separate bag for comparison, and keeps every actuator interface disconnected.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `archive_path` (string, required): Drive directory or test slice to replay.
- `drive_index` (object, required): From `dlog-drive-index-sqlite`; gives topics and duration for checks.
- `entry_point` (string, required): Launch command for the stack under test, for example `ros2 launch perception_bringup replay.launch.py`.

---

## Outputs

- `replay_procedure` (object): Play command, launch command and parameters, output bag path, input and output topic lists, message counts, and the checks that passed.

---

## Phase 1: Isolate the Stack

### Entry Criteria
- Replay runs on a desktop, a CI machine, or a vehicle computer on a bench with actuator interfaces disconnected. If any actuator output is physically wired, the setup is a bench or closed course behind an independent hardware emergency stop, and braking paths are never blocked or delayed by this replay.
- No live sensor drivers run; replayed topics must be the only source.

### Actions
1. Use an isolated DDS domain: `export ROS_DOMAIN_ID=<unused id>` and, on Humble and later, `export ROS_LOCALHOST_ONLY=1` (Jazzy also offers `ROS_AUTOMATIC_DISCOVERY_RANGE=LOCALHOST`; check your distro).
2. Remove or remap every node that writes to vehicle buses or actuator drivers in the launch file; list them by name in `replay_procedure`.
3. `ros2 topic list` before starting playback must be empty except `/parameter_events` and `/rosout`.

### Output
Isolated environment.

### Quality Gate
- `ros2 node list` shows no driver or actuator interface node after the stack starts.

---

## Phase 2: Play

### Entry Criteria
- Stack launched with `use_sim_time:=true` for every node (pass it in the launch file, not per node by hand).

### Actions
1. Start recording outputs: `ros2 bag record -s mcap -o out_<run> --use-sim-time --topics <output topics>`.
2. Play: `ros2 bag play <archive_path> --clock --rate 1.0 --qos-profile-overrides-path qos_overrides.yaml --delay <seconds>`. `--clock` publishes `/clock` from bag time. `--delay` gives subscribers time to match before data flows. Use the same QoS override file as the recording (TRANSIENT_LOCAL for `/tf_static`).
3. Remove recorded `/clock` if the original bag contains one: add `--topics` with an explicit list, or check `ros2 bag play --help` for an exclude option on your distro.
4. If the original recording has stack outputs (for example `/perception/objects`), do not play them; remap them with `--remap /perception/objects:=/recorded/perception/objects` so the live stack output does not collide.
5. Wait for playback to finish, then stop the recorder with one SIGINT.

### Output
Output bag.

### Quality Gate
- `ros2 bag info out_<run>` shows each expected output topic with Count > 0.
- Input message counts reported by playback match `drive_index` for the replayed span.

---

## Phase 3: Characterize Repeatability

### Entry Criteria
- At least one output bag.

### Actions
1. Note the limits: DDS delivery, executor scheduling and callback timing make ROS 2 graph replay not bit-exact between runs, even with sim time. Outputs can differ when a node drops a message under load or when timers fire relative to message arrival differently.
2. Run the replay a second time with identical settings and hand both output directories to `dlog-replay-determinism-check`.
3. If exact repeatability is required, move the node's processing into a library and use `dlog-py-replay-harness` or `dlog-cpp-replay-harness`, keeping the ROS 2 replay as an integration test.
4. Replay at `--rate` above 1.0 only after confirming at 1.0 that outputs are complete; faster replay hides CPU limits.

### Output
`replay_procedure`.

### Quality Gate
- Two output bags exist from identical commands, and their paths are in `replay_procedure`.

---

## Worked Example

Illustrative.
```
$ export ROS_DOMAIN_ID=77 ROS_LOCALHOST_ONLY=1
$ ros2 launch perception_bringup replay.launch.py use_sim_time:=true
$ ros2 bag record -s mcap -o out_run1 --use-sim-time --topics /perception/objects /tf
$ ros2 bag play cases/case_0007 --clock --delay 2 --qos-profile-overrides-path qos_overrides.yaml \
    --remap /perception/objects:=/recorded/perception/objects
$ ros2 bag info out_run1 | grep objects
Topic: /perception/objects | Type: perception_msgs/msg/ObjectArray | Count: 119 | ...
```

---

## Exit Criteria

DONE when the stack has been replayed in isolation with sim time twice and both output bags are ready for comparison.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | An actuator or bus writer node starts | **Stop**: remove it from the launch file before any playback. |
| Phase 2 | Output topic count is 0 | **Adjust**: check `use_sim_time`, QoS compatibility (`ros2 topic info -v`), and `/tf_static` delivery; rerun. |
| Phase 2 | Nodes see time jump backward | **Adjust**: restart nodes between runs; sim time starts at the bag start. |
| Phase 3 | Outputs differ between runs | **Return**: to `dlog-replay-determinism-check` for classification. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
