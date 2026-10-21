# ROS 2 rosbag2 Recording With MCAP

**One-line description:** Records a chosen set of topics with rosbag2 into the MCAP storage format, with QoS overrides for latched topics, file splitting and a compression preset, then verifies message counts and integrity with `ros2 bag info` and the `mcap` CLI.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `topic_list` (object[], required): Topics to record with type and expected rate.
- `bag_dir` (string, required): Directory on a disk with enough free space for the run.
- `ros_distro` (string, required): Distro, which sets the default storage plugin.

---

## Outputs

- `bag_path` (string): Path of the recorded bag directory.
- `bag_info` (object): `ros2 bag info` output, per-topic message counts versus expected counts, and `mcap doctor` result.

---

## Phase 1: Prepare Storage and QoS

### Entry Criteria
- `topic_list` is non-empty.

### Actions
1. Storage plugin rule: Iron and newer default to MCAP. On Humble the default is sqlite3; install `sudo apt install ros-humble-rosbag2-storage-mcap` and pass `-s mcap`. Passing `-s mcap` on every distro is harmless and explicit.
2. Estimate size: for each topic, sample `ros2 topic bw <topic>` for a short window and multiply by planned duration. Compare with `df -h <bag_dir>`.
3. Latched topics such as `/tf_static` and `/robot_description` are TRANSIENT_LOCAL. Start recording before their publishers, or confirm the recorder receives them (they appear in `ros2 bag info` with a count of at least 1). If they are missing, write `qos_overrides.yaml`:
   ```
   /tf_static:
     reliability: reliable
     durability: transient_local
     history: keep_last
     depth: 1
   ```
   and pass `--qos-profile-overrides-path qos_overrides.yaml`.
4. Always include `/tf` and `/tf_static` when any recorded topic has a frame id, so the data can be transformed on replay.

### Output
Record command plan.

### Quality Gate
- Estimated size is below free space on `bag_dir`.
- `/tf_static` is in the topic set when any recorded message carries a `header.frame_id`.

---

## Phase 2: Record

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Run:
   `ros2 bag record -s mcap -o <bag_dir>/<run_name> --storage-preset-profile zstd_fast --max-bag-duration <seconds> /tf /tf_static <topics...>`
   MCAP presets include `none`, `fastwrite`, `zstd_fast` and `zstd_small`; confirm with the rosbag2_storage_mcap README for your distro. `--max-bag-duration` and `--max-bag-size` split files; the values are user choices.
2. Avoid `-a` (all topics) on a robot with camera streams unless the size estimate covered them.
3. Stop with Ctrl+C once. Wait for the recorder to close the file; a second Ctrl+C can leave an unfinished file.

### Output
A bag directory.

### Quality Gate
- `<bag_dir>/<run_name>/metadata.yaml` exists.

---

## Phase 3: Verify

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. `ros2 bag info <bag_path>` prints storage id, duration, start and end, message count, and per-topic `Topic: ... | Type: ... | Count: N | Serialization Format: cdr`.
2. For each topic compute expected count = rate times duration and compare with Count. Record any topic below expectation with the shortfall.
3. If the `mcap` CLI is installed (Foxglove releases), run `mcap doctor <file>.mcap` and `mcap info <file>.mcap`. Doctor prints errors for a corrupt or truncated file.
4. If the recorder was killed and `metadata.yaml` is missing or wrong, run `ros2 bag reindex <bag_path> -s mcap`.

### Output
`bag_path`, `bag_info`.

### Quality Gate
- Every topic in `topic_list` has Count greater than 0.
- `mcap doctor` reports no errors, or the CLI is recorded as unavailable.

---

## Worked Example

Illustrative only. Jazzy, 60 s capture of `/scan` (10 Hz) and `/odom` (50 Hz).

- Phase 2: `ros2 bag record -s mcap -o bags/run01 /tf /tf_static /scan /odom`.
- Phase 3: `ros2 bag info bags/run01` shows `Storage id: mcap`, `Duration: 60.1s`, `/scan Count: 600`, `/odom Count: 3004`, `/tf_static Count: 1`.

---

## Exit Criteria

DONE when the bag exists in MCAP, every requested topic has messages, counts are compared with expectations, and integrity checks pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Could not find storage plugin 'mcap'` | **Adjust**: install `ros-<distro>-rosbag2-storage-mcap`. |
| Phase 2 | Disk fills during recording | **Stop**: free space or reduce topics; recordings near a full disk are not trusted. |
| Phase 3 | A topic count is 0 | **Adjust**: check QoS (`ros2 topic info -v`) and add an override; rerecord. |
| Phase 3 | Counts well below expectation on a high-rate topic | **Return**: record the shortfall; check disk write speed and use the `fastwrite` preset, then rerecord. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
