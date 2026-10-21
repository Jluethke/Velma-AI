# Software-in-the-Loop Replay of a ROS 2 Bag

**One-line description:** Feeds recorded sensor topics from a ROS 2 bag into the software under test on simulated time, records its outputs into a new bag, and diffs those outputs against a baseline so a code change shows exactly which messages changed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `bag_path` (string, required): Recorded drive or simulation bag (directory with `metadata.yaml`). Real-vehicle bags must come from read-only logging on a vehicle the user owns.
- `sut_launch_file` (string, required): Launch file that starts the software under test with `use_sim_time` true.
- `baseline_bag` (string, optional): Output bag from an earlier accepted SIL run of the same input. When absent, this run becomes the baseline and the diff is skipped.

---

## Outputs

- `sil_output_bag` (string): Path to the bag holding the software's output topics from this replay.
- `sil_diff_report` (object): Per output topic: message counts in baseline and new, count of messages with changed content, first changed stamp, and max absolute difference per numeric field.

---

## Phase 1: Inspect the Bag and Split Topics

### Entry Criteria
- `ros2 bag info <bag_path>` runs without error.

### Actions
1. Run `ros2 bag info <bag_path>` and record: storage id (`sqlite3` or `mcap`), duration, and each topic with type and count. MCAP is the default storage from ROS 2 Iron onward; Humble needs `ros-humble-rosbag2-storage-mcap` to read MCAP.
2. Split topics into two lists:
   - Inputs to replay: sensor and state topics the software consumes (`ros2 node info` on the software lists its subscriptions).
   - Outputs to exclude: any topic the software publishes, and `/clock` if present in the bag (playback provides its own clock).
3. `/tf_static` uses transient-local durability. Write a QoS override file `qos.yaml`:
```yaml
/tf_static:
  reliability: reliable
  durability: transient_local
  history: keep_all
```

### Output
Input topic list, output topic list, `qos.yaml`.

### Quality Gate
- No topic appears in both lists.
- Every subscription of the software is either in the input list or recorded as absent from the bag.

---

## Phase 2: Replay and Record

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Terminal 1: `ros2 launch <pkg> <sut_launch_file>` (all nodes `use_sim_time:=true`).
2. Terminal 2: `ros2 bag record -o sil_out <output topics...>`. Add your distro's sim-time option (`ros2 bag record --help`) so stamps follow the replay clock.
3. Terminal 3: `ros2 bag play <bag_path> --clock --rate 1.0 --topics <input topics...> --qos-profile-overrides-path qos.yaml --start-paused`. Confirm flags with `ros2 bag play --help` on your distro.
4. Unpause (press space in the play terminal, or call the player's resume service listed by `ros2 service list | grep -i rosbag2_player`).
5. Let playback finish, stop the recorder with Ctrl-C, then stop the software.
6. Do NOT replay with `--rate` above 1.0 for a run you will diff; if the software cannot keep up, rate changes which messages it drops.
7. Run the replay a second time without code changes and diff the two outputs (Phase 3). If they differ, the software is not deterministic under replay; fix that before using the baseline.

### Output
`sil_output_bag`.

### Quality Gate
- `ros2 bag info sil_out` shows every output topic with a nonzero count.
- The repeat run with unchanged code shows zero changed messages.

---

## Phase 3: Diff Against the Baseline

### Entry Criteria
- `sil_output_bag` recorded; `baseline_bag` given.

### Actions
1. Read both bags with `rosbag2_py.SequentialReader` and `rclpy.serialization.deserialize_message` in a small script in your project.
2. Match messages per topic by header stamp (for topics without header, by sequence order and say so).
3. For each matched pair, compare fields; numeric fields report absolute difference, others report equal or not.
4. Record per topic: counts, changed count, first changed stamp, max difference per field.
5. Interpret:

| Result | Meaning |
|---|---|
| Counts differ | Software dropped or added outputs; check processing time and QoS |
| Same counts, changed values after a code change | Expected change or regression; review against the change's intent |
| Changes in a topic the change should not touch | Regression candidate; report first stamp |

### Output
`sil_diff_report`.

### Quality Gate
- Report lists every output topic with both counts.
- Every changed topic has a first changed stamp.

---

## Worked Example

Illustrative.
```
$ ros2 bag info drive_0412
Storage id: mcap   Duration: 182.4s
Topic: /lidar/points | Type: sensor_msgs/msg/PointCloud2 | Count: 1824
Topic: /imu | Type: sensor_msgs/msg/Imu | Count: 36480
$ ros2 bag play drive_0412 --clock --topics /lidar/points /imu /tf_static --qos-profile-overrides-path qos.yaml --start-paused
```
Diff: `/perception/objects` baseline 1824, new 1824, changed 37, first changed stamp 1712933100.250000000, max position difference 0.42 m.

---

## Exit Criteria

DONE when the software's outputs from replay are recorded, a no-change repeat run matches itself, and the diff against the baseline is reported per topic.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cannot read MCAP on Humble | **Adjust**: install the MCAP storage plugin. |
| Phase 2 | Software sees no time advance | **Adjust**: add `--clock` to play and `use_sim_time` true to every node. |
| Phase 2 | Two `/clock` publishers | **Adjust**: exclude `/clock` from the replayed topics. |
| Phase 2 | Repeat run differs | **Stop**: fix nondeterminism before trusting diffs. |
| Phase 3 | No `baseline_bag` | **Return**: store this run as the baseline; report "no diff". |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
