# ROS 2 Bag Record to MCAP

**One-line description:** Builds, tests and freezes a `ros2 bag record` command that writes MCAP with split limits from the storage budget, a sized write cache, explicit topic selection and QoS overrides, then confirms with `ros2 bag info` that nothing was lost in a test recording.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `log_format_decision` (object, required): From `dlog-format-select`; confirms rosbag2 with `mcap` storage and per-topic compression.
- `storage_budget` (object, required): From `dlog-storage-budget`; split size and duration.
- `topic_list` (string[], optional): Topics to record. If absent, Phase 1 builds it from `ros2 topic list`; recording everything with `-a` is not the default.

---

## Outputs

- `record_command` (object): The exact command line, the storage config YAML, the QoS override YAML, the ROS 2 distro and rosbag2 version, and the test recording results.

---

## Phase 1: Select Topics and QoS

### Entry Criteria
- ROS 2 environment sourced; sensor drivers running.
- Logging is passive: this flow publishes nothing to any control or actuator topic.

### Actions
1. `ros2 topic list -t` and keep the topics from `topic_list` (or from `log_format_decision` sources if `topic_list` is absent). Always include `/tf`, `/tf_static` and `/diagnostics` if they exist; replay needs transforms.
2. For each topic run `ros2 topic info -v <topic>` and record publisher QoS (reliability, durability, history, depth).
3. `/tf_static` is published with TRANSIENT_LOCAL durability. The recorder must subscribe TRANSIENT_LOCAL to receive it if it starts after the publisher. Write `qos_overrides.yaml`:
   ```
   /tf_static:
     reliability: reliable
     durability: transient_local
     history: keep_all
   ```
4. For BEST_EFFORT sensor topics, keep best effort in the recorder; a reliable subscriber does not match a best-effort publisher.
5. Do NOT record image topics twice (raw and compressed) unless `log_format_decision` asks for both.

### Output
Topic list and `qos_overrides.yaml`.

### Quality Gate
- Every recorded topic has its publisher QoS written down.
- `/tf_static` appears in the override file when it exists in the graph.

---

## Phase 2: Build the Command

### Entry Criteria
- Topics and QoS chosen.

### Actions
1. Check the flags your distro supports: `ros2 bag record --help`. Flags below exist in recent distros; names changed between releases (for example topic selection via `--topics` in Jazzy), so trust `--help` over this list.
2. Base command:
   ```
   ros2 bag record -s mcap -o /data/drives/<drive_id> \
     --max-bag-duration <split_duration_s> --max-bag-size <split_size_bytes> \
     --max-cache-size <bytes> \
     --storage-preset-profile <none|fastwrite|zstd_fast|zstd_small> \
     --qos-profile-overrides-path qos_overrides.yaml \
     --topics <topic> <topic> ...
   ```
3. Preset choice: `zstd_fast` when `log_format_decision` asks for zstd; `fastwrite` disables chunk CRC and compression for the lowest write cost; `none` keeps plugin defaults. For finer control use `--storage-config-file mcap_writer.yaml` with keys from the rosbag2_storage_mcap README (for example `compression`, `chunkSize`, `noChunkCRC`). Do not combine rosbag2 file-level `--compression-mode` with MCAP chunk compression.
4. `--max-cache-size`: the default is in `--help`. Raise it when Phase 3 shows lost messages and disk bandwidth from `dlog-disk-throughput-measure` is adequate; the cache absorbs write stalls, it does not fix a slow disk.

### Output
Draft `record_command`.

### Quality Gate
- Every flag in the command appears in this machine's `ros2 bag record --help` output.

---

## Phase 3: Test Recording

### Entry Criteria
- Draft command ready.

### Actions
1. Record at least two split periods at the busiest condition used in `dlog-sensor-rate-inventory`. Stop with Ctrl-C once (SIGINT) so rosbag2 writes the summary and `metadata.yaml`.
2. `ros2 bag info /data/drives/<drive_id>`: read `Duration`, `Messages`, and per-topic `Count`. Expected count per topic = measured rate x duration.
3. Watch recorder console output during the test for warnings about lost or dropped messages and record them verbatim.
4. `mcap doctor` each `.mcap` file; it must report no errors.
5. Confirm the split: number of files equals ceil(duration / split duration).

### Output
`record_command` with test results.

### Quality Gate
- Per-topic counts are within the measured rate x duration expectation or the difference is listed.
- `mcap doctor` exits 0 for every file.
- File count matches the split rule.

---

## Worked Example

Illustrative. Humble with rosbag2_storage_mcap installed, split 60 s / 1,500,000,000 bytes.
```
$ ros2 bag record -s mcap -o /data/drives/d2026_10_21_a \
    --max-bag-duration 60 --max-bag-size 1500000000 \
    --storage-preset-profile zstd_fast \
    --qos-profile-overrides-path qos_overrides.yaml \
    /cam_front/image_raw/compressed /lidar/points /imu/data /tf /tf_static
^C
$ ros2 bag info /data/drives/d2026_10_21_a
Storage id:        mcap
Duration:          150.03s
Messages:          47512
Topic: /imu/data | Type: sensor_msgs/msg/Imu | Count: 30004 | Serialization Format: cdr
Topic: /lidar/points | Type: sensor_msgs/msg/PointCloud2 | Count: 1500 | ...
$ for f in /data/drives/d2026_10_21_a/*.mcap; do mcap doctor "$f"; done
```
3 files for 150 s at 60 s split. IMU expected 200 Hz x 150.03 s = 30006, got 30004.

---

## Exit Criteria

DONE when the command is frozen, every flag is confirmed by `--help`, and a test recording passes count, doctor and split checks.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `/tf_static` missing in test bag | **Adjust**: add the transient_local override and rerun. |
| Phase 2 | Flag rejected as unrecognized | **Adjust**: use the spelling from `--help` for this distro. |
| Phase 3 | Lost-message warnings or low counts | **Retry**: raise `--max-cache-size`, choose a lighter preset, then rerun; if still low, **Return** to `dlog-disk-throughput-measure`. |
| Phase 3 | No `metadata.yaml` after stop | **Adjust**: run `ros2 bag reindex <dir> -s mcap` and stop the recorder with a single SIGINT next time. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
