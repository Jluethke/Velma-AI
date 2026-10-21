# Filter Replay On A Recorded Bag

**One-line description:** Runs the built localization filter (robot_localization, Python or C++) against the recorded bag and exports a time-aligned estimate log in TUM format plus per-step covariance and innovation records, the single input for gating, consistency and accuracy evaluation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `filter_entrypoint` (string, required): The command that runs the built filter: a `ros2 launch` command, a Python replay script, or a C++ replay executable.
- `sensor_bag` (string, required): rosbag2 path from `loc-rosbag2-drive-logging`.
- `stack` (string, required): "ros2", "python" or "cpp".

---

## Outputs

- `estimate_log` (object): Paths of `estimate.tum`, the covariance record, the innovation record (or a statement that the stack does not expose innovations), and run metadata (bag, commit or file hash, start and end stamps).

---

## Phase 1: Run The Filter

### Entry Criteria
- The filter flow for `stack` passed its own tests.

### Actions
1. Branch on `stack`:

   | `stack` | Command |
   |---|---|
   | ros2 | Terminal 1: the launch command with `use_sim_time:=true`. Terminal 2: `ros2 bag record -o out/est /odometry/filtered/global /odometry/filtered/local /tf`. Terminal 3: `ros2 bag play <bag> --clock`. |
   | python | `python scripts/run_ekf_on_bag.py <bag> out/` (or the UKF script) |
   | cpp | export measurements, then `./build/ekf_replay meas.csv out/` |

2. Record the hash of the config or source used: `sha256sum <config or source files>`.
3. Wait for the full bag to play. Do not stop early; a partial run biases evaluation toward the start.

### Output
Raw filter outputs.

### Quality Gate
- The output covers from the first to the last GNSS stamp of the bag (compare first and last stamps).

---

## Phase 2: Export To Common Format

### Entry Criteria
- Raw outputs exist.

### Actions
1. ROS 2: `pip install evo` then `evo_traj bag2 out/est /odometry/filtered/global --save_as_tum` writes a TUM file named after the topic. Check `evo_traj --help` for the `bag2` subcommand in your evo version.
2. Export covariance for ROS 2 with a short `rosbags` script that writes stamp plus the 36-element `pose.covariance` per message.
3. Innovations: robot_localization does not publish innovations. Record "innovations not exposed; NIS not available for this stack" in the log. Python and C++ replays already wrote `innovations.csv`.
4. Confirm TUM format: 8 space-separated columns `timestamp tx ty tz qx qy qz qw`, timestamp in seconds.

### Output
`estimate_log`.

### Quality Gate
- `awk '{print NF}' estimate.tum | sort -u` prints only `8`.
- The innovation record path or the "not exposed" statement is present.

---

## Worked Example

Illustrative. `stack` = ros2. After replay, `evo_traj bag2 out/est /odometry/filtered/global --save_as_tum` writes `odometry_filtered_global.tum` with 60150 poses from 1729500000.02 to 1729501203.40, matching the bag's GNSS span.

---

## Exit Criteria

DONE when a full-length TUM estimate, a covariance record and an innovation record or explicit absence note exist with the run's config hash.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Output stops before bag end | **Retry**: check for a crash in the filter log and rerun. |
| Phase 1 | ROS 2 output timestamps are wall time | **Adjust**: `use_sim_time` was not set; relaunch. |
| Phase 2 | `evo_traj bag2` not recognized | **Adjust**: upgrade evo or export with a `rosbags` script. |
| Phase 2 | TUM file has 9 or more columns | **Adjust**: strip extra columns; evo rejects them. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
