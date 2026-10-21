# rosbag2 Drive Logging For Localization

**One-line description:** Records every localization sensor topic, the static transforms and CAN frames from a human-driven test drive into one rosbag2 file with a written replay procedure, so every later tuning and evaluation step runs offline on the same data.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `frame_spec` (object, required): Output of `loc-frame-convention-audit`.
- `sensor_topics` (string[], required): Exact topic names to record, for example `/imu/data`, `/gnss/fix`, `/points`, `/can/rx`, `/tf_static`.
- `project_dir` (string, required): Directory where the bag folder is written.

---

## Outputs

- `sensor_bag` (string): Path of the recorded rosbag2 folder, with the `ros2 bag info` summary.
- `replay_procedure` (string): The exact replay commands, including clock and sim time settings.

---

## Phase 1: Prepare The Recording

### Entry Criteria
- Logging is read-only: sensors and a CAN interface in listen-only mode. No node in this recording sends commands to the vehicle.
- The vehicle is driven by a licensed human driver on a closed course or a public road where that driving is legal. Software does not steer, brake or accelerate the vehicle in this flow.
- Every topic in `sensor_topics` is live: `ros2 topic hz <topic>` prints a rate for each.

### Actions
1. Record the rate of each topic with `ros2 topic hz` for 10 seconds and store the numbers; these are the baseline for dropped-message checks.
2. Check free disk space with `df -h <project_dir>` and multiply the measured bandwidth (`ros2 topic bw <topic>`) by the planned drive duration. Stop if the disk cannot hold it.
3. Include `/tf_static` in `sensor_topics`. Without it, replay has no extrinsics.
4. Choose storage: on Humble the default is sqlite3; on Iron and later the default is mcap. Pass `-s mcap` or `-s sqlite3` explicitly and record which.

### Output
A topic list with measured rates and a storage choice.

### Quality Gate
- Every topic in `sensor_topics` has a measured rate above zero.
- `/tf_static` is in the list.

---

## Phase 2: Record The Drive

### Entry Criteria
- Phase 1 complete.

### Actions
1. Start recording: `ros2 bag record -s mcap -o <project_dir>/bags/drive_<date> <topics...>`. Do not use `-a` (all topics); it records camera streams you did not plan for and fills the disk.
2. Begin with at least the static period the user specifies with the vehicle parked, so the filter and the IMU bias estimate start from rest.
3. Drive the route. Include straight segments, left and right turns, and a return to the start point; the loop closure gives a free consistency check.
4. End with another static period, then stop the recording with Ctrl+C once.

### Output
A bag folder on disk.

### Quality Gate
- `ros2 bag info <bag>` lists every topic in `sensor_topics` with a nonzero message count.
- For each topic, message count divided by bag duration is within the range of the Phase 1 rate (state the comparison numbers).

---

## Phase 3: Write The Replay Procedure

### Entry Criteria
- Bag passes Phase 2 gate.

### Actions
1. Write the replay command: `ros2 bag play <bag> --clock` so the bag publishes `/clock`.
2. State that every node consuming the replay must be launched with `use_sim_time:=true`; otherwise transform lookups fail with extrapolation errors.
3. If the bag also contains filter outputs from a live run, list the remap or topic filter that excludes them during replay (`ros2 bag play --topics ...`) so a replayed filter does not fight a recorded one on `/tf`.

### Output
`sensor_bag` and `replay_procedure`.

### Quality Gate
- Replay test: run `ros2 bag play <bag> --clock` and in another shell `ros2 topic echo --once /clock`; it prints a time.

---

## Worked Example

Illustrative. Topics `/imu/data /gnss/fix /points /can/rx /tf_static`.

`ros2 bag record -s mcap -o bags/drive_2026_10_21 /imu/data /gnss/fix /points /can/rx /tf_static`

`ros2 bag info` prints Duration 1203.4 s, `/imu/data` Count 240620 (about 200 Hz, matches `ros2 topic hz` 199.9), `/gnss/fix` Count 12031 (10 Hz). Replay procedure: `ros2 bag play bags/drive_2026_10_21 --clock` plus `use_sim_time:=true` on every node.

---

## Exit Criteria

DONE when the bag contains every planned topic at its measured rate and the replay procedure publishes `/clock`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A topic shows no rate | **Stop**: fix the driver before driving; a bag missing a sensor cannot be repaired later. |
| Phase 2 | Message rate in the bag well below live rate | **Retry**: record to a faster local disk, drop unneeded topics, and repeat the drive. |
| Phase 2 | Recording node crashes mid-drive | **Retry**: repeat the drive; do not splice two partial bags for evaluation. |
| Phase 3 | Extrapolation errors on replay | **Adjust**: confirm `--clock` on play and `use_sim_time:=true` on every node. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
