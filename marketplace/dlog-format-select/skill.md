# Drive Log Format Selection

**One-line description:** Chooses the recording format for every vehicle or robot data source (MCAP, rosbag2 with MCAP or sqlite3 storage, Vector BLF) and the derived analytics format (Parquet) from an explicit decision table, so each choice is traceable to a property of the source and the consumer.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `data_sources` (object[], required): One entry per stream: name, kind (camera, lidar, radar, imu, gnss, can, vehicle_state, software_topic), transport (ROS 2 topic, UDP, SocketCAN, USB, GMSL, in-process), and the tool that will read the log later.
- `stack` (string, required): Software stack that records and replays the data: `ros2`, `python` or `cpp`. Chains branch on this value.
- `replay_target` (string, optional): What the logs must replay into (ROS 2 graph, Python library, C++ library, Vector CANoe or CANalyzer, notebook analytics). Defaults to the same as `stack`.

---

## Outputs

- `log_format_decision` (object): Per source: recording format, storage plugin or container, message encoding (cdr, protobuf, json, raw bytes), compression choice, derived export format if any, and the decision table row that justifies it.

---

## Phase 1: Classify Sources

### Entry Criteria
- `data_sources` lists at least one stream.
- `stack` is one of `ros2`, `python`, `cpp`.

### Actions
1. For each entry in `data_sources`, record three facts in a table: does it already arrive as a typed ROS 2 message, is it raw bytes (UDP packets, CAN frames, compressed video), and who reads the log afterward.
2. For CAN sources, write down whether anyone downstream uses Vector tools (CANalyzer, CANoe) that read BLF natively.
3. For camera sources, write down whether frames arrive raw (sensor_msgs/Image), JPEG/PNG compressed (sensor_msgs/CompressedImage) or as an H.264/H.265 bitstream (foxglove_msgs/CompressedVideo). Do not assume; check with `ros2 topic info -v <topic>` on ROS 2 or the driver documentation otherwise.
4. Do NOT pick formats in this phase. Only classify.

### Output
A source classification table with one row per entry in `data_sources`.

### Quality Gate
- The table row count equals the number of entries in `data_sources`.
- Every row has transport, encoding and downstream reader filled in, none marked "unknown" without a named follow-up question.

---

## Phase 2: Apply the Decision Table

### Entry Criteria
- Classification table complete.

### Actions
1. Apply this table top to bottom; the first matching row wins:

| Condition | Recording format | Reason |
|---|---|---|
| `stack` == `ros2` and source is a ROS 2 topic | rosbag2 with `mcap` storage plugin (`ros2 bag record -s mcap`) | MCAP is append-only, chunked and indexed; a file cut by power loss can be recovered with `mcap recover`. MCAP is the rosbag2 default storage from ROS 2 Iron onward; on Humble pass `-s mcap` and install `ros-humble-rosbag2-storage-mcap`. |
| `stack` == `ros2`, need for SQL queries on the bag itself | rosbag2 `sqlite3` storage | Only when a reader requires sqlite3. Run `ros2 bag reindex` after crashes. |
| CAN source and a Vector tool reads it | BLF via python-can `BLFWriter` | Native BLF import in Vector tools. |
| CAN source, no Vector reader | MCAP channel of raw frames, or candump log | Keeps CAN in the same time base and file as other sensors. |
| `stack` == `python` or `cpp`, any source | MCAP via the `mcap` library | Same container and tooling (`mcap` CLI, Foxglove) as ROS 2 logs. |
| Analytics consumer (SQL, dataframes, notebooks) | Parquet, derived from the MCAP after the drive | Parquet writes its footer at close; a crash mid-write leaves an unreadable file, so never use it as the primary recording. |

2. For each MCAP output choose compression: `zstd` when CPU headroom exists, `lz4` when CPU is the limit, none for streams that are already compressed (JPEG, H.264). Record the choice; the measured CPU cost is checked in `dlog-drop-audit`.
3. For every row record the message encoding exactly as the MCAP spec names it (`cdr`, `protobuf`, `json`, `ros2msg` schema encoding for ROS 2).
4. If `replay_target` differs from `stack`, add a conversion note (for example `mcap convert` from a ROS 2 sqlite3 bag, or BLF to MCAP through a python-can reader script).

### Output
`log_format_decision`.

### Quality Gate
- Every source in `data_sources` has exactly one recording format and a cited decision table row.
- No source has Parquet as its only recording format.
- Each MCAP source names a compression choice and a message encoding.

---

## Worked Example

Illustrative. Inputs: `stack` = `ros2`; sources: front camera (`/cam_front/image_raw/compressed`, CompressedImage), roof lidar (`/lidar/points`, PointCloud2), IMU (`/imu/data`), powertrain CAN (`can0`, read by CANalyzer), `replay_target` = `ros2`.

Phase 1 table (excerpt):
```
source        transport      encoding           reader
cam_front     ROS2 topic     JPEG in cdr        ros2 replay
lidar         ROS2 topic     cdr                ros2 replay
can0          SocketCAN      raw frames         CANalyzer
```
Phase 2 result:
```
cam_front -> rosbag2 mcap, compression none (JPEG already compressed), row 1
lidar     -> rosbag2 mcap, zstd, row 1
imu       -> rosbag2 mcap, zstd, row 1
can0      -> BLF via python-can BLFWriter, row 3
analytics -> Parquet export of /imu/data after the drive, row 6
```

---

## Exit Criteria

DONE when `log_format_decision` covers every source with a format, an encoding, a compression choice and the table row that selected it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A source's message type cannot be determined | **Stop**: run `ros2 topic info -v` or read the driver docs; do not guess an encoding. |
| Phase 2 | `stack` is not ros2, python or cpp | **Return**: ask the user which stack records the data; the chain branches on it. |
| Phase 2 | rosbag2 MCAP plugin missing on Humble | **Adjust**: install `ros-humble-rosbag2-storage-mcap` and confirm with `ros2 bag record --help` listing `mcap` under storage choices. |
| Phase 2 | A reader needs a format not in the table | **Return**: record it as an open question with the reader's name; do not invent a format. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
