# ROS 2 Bag Recording of Monitor Topics

**One-line description:** Records the monitor's inputs, verdict topic, switch state and fallback commands with `ros2 bag record` in its own process with explicit topics, MCAP storage and split limits, and verifies message counts and duration with `ros2 bag info` so a trip can be replayed later with `ros2 bag play`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ros2_qos_monitor` (object, required): Output of `rmon-ros2-qos-deadline-liveliness` (topics and QoS).
- `log_dir` (string, required): Directory with enough free space for the bags; not inside the marketplace.

---

## Outputs

- `ros2_bag_record` (object): The exact record command, bag directory, `ros2 bag info` output, and per-topic message counts.

---

## Phase 1: Prepare the Recording Command

### Entry Criteria
- `printenv ROS_DISTRO` prints a distribution.
- `df -h <log_dir>` shows free space; the split size and total retention come from the user.

### Actions
1. List the exact topics: every monitored input, the monitor verdict topic, the decision module state topic, the advanced and safety controller command topics, and `/rosout`. Do not use `-a` (record all): large sensor topics fill the disk and crowd out the monitor topics.
2. Check the storage plugin: `ros2 bag record --help | rg -i storage`. MCAP (`--storage mcap`) is available when `ros-$ROS_DISTRO-rosbag2-storage-mcap` is installed; it is the default from Iron onward. Record which plugin is used.
3. If monitored topics use non-default QoS, write a QoS override file and pass `--qos-profile-overrides-path overrides.yaml` so the recorder subscription is compatible (see the rosbag2 README for the YAML format).

### Output
A recording command line.

### Quality Gate
- The topic list contains the verdict topic and the switch state topic.
- `ros2 bag record --help` output confirms every flag used in the command.

---

## Phase 2: Record and Verify

### Entry Criteria
- Command prepared. Monitor and component running (bench or closed course only when actuators are live).

### Actions
1. Start the recorder in its own terminal or as its own systemd service:
   ```
   ros2 bag record -o <log_dir>/run_$(date +%Y%m%d_%H%M%S) --storage mcap \
     --max-bag-duration <seconds> \
     /cmd_vel /cmd_vel_safe /monitor/verdict /monitor/switch_state /wheel_ticks /rosout
   ```
2. Stop with Ctrl+C (SIGINT) so the bag metadata is written; `kill -9` leaves an incomplete bag. If a bag lacks `metadata.yaml`, run `ros2 bag reindex <bag_dir>`.
3. Inspect: `ros2 bag info <bag_dir>`. Read Duration, Messages, and the per-topic `Count`.
4. Compute expected count per topic as duration in seconds times the ICD rate. A count well below expected means drops in the recorder or the publisher; record it, do not ignore it.

### Output
Bag directory and info output.

### Quality Gate
- `ros2 bag info` lists every topic from Phase 1 with a non-zero count.
- The output lists, for every topic, recorded count, expected count (duration times ICD rate) and their ratio; any ratio below the acceptance value given by the user is flagged.

---

## Phase 3: Replay Check

### Entry Criteria
- Bag verified.

### Actions
1. Replay into an isolated domain so nothing reaches live actuators: `ROS_DOMAIN_ID=<unused id> ros2 bag play <bag_dir> --topics /wheel_ticks /cmd_vel`.
2. Run a second copy of the monitor on that domain and confirm it produces the same verdict sequence as the recorded `/monitor/verdict` for at least one trip.
3. If it differs, the monitor depends on something not recorded (a parameter, wall time, another topic); add it to the topic list.

### Output
`ros2_bag_record`.

### Quality Gate
- The replayed verdict sequence matches the recorded one for the chosen trip (compare with `ros2 topic echo /monitor/verdict` output saved to file).
- Replay ran with a `ROS_DOMAIN_ID` different from the live system, shown in the command line.

---

## Worked Example

Illustrative only.
```
$ ros2 bag info /data/bags/run_20260304_150150
Files:             run_20260304_150150_0.mcap
Bag size:          41.2 MiB
Storage id:        mcap
Duration:          120.004s
Messages:          31877
Topic information: Topic: /cmd_vel | Type: geometry_msgs/msg/Twist | Count: 5999 | Serialization Format: cdr
                   Topic: /monitor/verdict | Type: std_msgs/msg/String | Count: 6000 | Serialization Format: cdr
```
Expected `/cmd_vel` at 50 Hz over 120 s is 6000; 5999 recorded.

---

## Exit Criteria

DONE when monitor topics are recorded with explicit topic lists, bag metadata is complete, counts are compared to expected rates, and one trip replays to the same verdicts on an isolated domain.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | MCAP plugin missing | **Adjust**: install `ros-$ROS_DISTRO-rosbag2-storage-mcap` or record with the default plugin and note it. |
| Phase 2 | Recorder logs incompatible QoS | **Retry**: add a QoS override file for that topic. |
| Phase 2 | Bag missing metadata after a crash | **Adjust**: `ros2 bag reindex <bag_dir>`. |
| Phase 3 | Replay reaches live hardware | **Stop**: use a separate domain ID or an isolated network before any further replay. |

**Do not:** record with `-a` on a sensor-heavy robot, kill the recorder with SIGKILL, or replay onto the live domain.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
