# Gazebo Deterministic Seed and Repeat-Run Check

**One-line description:** Runs a Gazebo plus ROS 2 simulation twice with the same seed and a fixed iteration count, records the ego pose and sensor stamps against simulation time, and compares the runs to decide whether the setup is deterministic and where it first diverges.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sim_launch_file` (string, required): Launch file from `vsim-gz-ros2-bridge`.
- `sim_seed` (integer, required): Seed for Gazebo's random number generator and for every node that uses randomness.

---

## Outputs

- `determinism_report` (object): Seed, Gazebo and ROS versions, iteration count, per-run SHA-256 of the pose log, verdict "DETERMINISTIC" or "DIVERGES", and the first diverging sim time and field.

---

## Phase 1: Pin Seeds and Stepping

### Entry Criteria
- `sim_launch_file` passes its own gate.

### Actions
1. Check the seed flag on your version: `gz sim --help | grep -i seed`. If a `--seed` option is listed, add `--seed <sim_seed>` to `gz_args`. If not listed, record that Gazebo's own seed is not set from the command line on this version and check the SDF or docs for your version.
2. Add `--iterations <N>` to `gz_args` so each run stops after the same number of physics steps (confirm the flag in `gz sim --help`).
3. Run the server headless (`-s --headless-rendering`) so GUI frame rate does not interfere.
4. Seed every node with randomness from a ROS parameter (`seed`) set to `sim_seed`; `grep -rn -E "random|rand\(|default_rng" src/` to find them.
5. Do not run a ROS node that publishes on `/clock` other than the bridge.

### Output
Seeded launch arguments.

### Quality Gate
- `gz_args` in the launch file contains `--iterations` and, when supported, `--seed`.
- Every node found by the grep reads the `seed` parameter.

---

## Phase 2: Record Two Runs

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Choose the recorded topics: ego odometry or pose, and the header stamps of each sensor topic.
2. For run A: start `ros2 bag record -o runA --use-sim-time /odom /imu /lidar/points` (check `ros2 bag record --help` for the sim-time option name on your distro), then `ros2 launch <pkg> sim.launch.py`. Stop the recorder after Gazebo exits.
3. Repeat for run B with identical arguments and an idle machine.
4. Export each bag's pose stream to CSV keyed by message header stamp (not receive time) using a small `rosbag2_py` reader in your project: columns stamp_ns, x, y, z, qx, qy, qz, qw.
5. Hash: `sha256sum runA_pose.csv runB_pose.csv`.

### Output
Two pose CSVs and their hashes.

### Quality Gate
- Both CSVs have the same row count (`wc -l`).
- Hashes are printed side by side.

---

## Phase 3: Compare and Report

### Entry Criteria
- Phase 2 complete.

### Actions
1. If hashes match: verdict "DETERMINISTIC" for this machine and versions.
2. If not: `diff runA_pose.csv runB_pose.csv | head -5` gives the first differing stamp. Classify:

| Symptom | Likely cause | Next action |
|---|---|---|
| Row counts differ | Recording started late or messages dropped | Use header stamps only; compare overlap; check QoS depth. |
| Same stamps, different values from the first row | Spawn pose or seed differs | Recheck Phase 1. |
| Values diverge mid-run | Node fed by wall time, or multithreaded physics | Grep for wall-clock use; record physics engine thread settings. |
| Only sensor data differs | Rendering sensors on GPU vary | Record as open question; compare non-rendered sensors only. |

3. Run once more with `sim_seed + 1` and confirm noisy sensor values differ; identical values mean noise is not seeded or not enabled.
4. Write `determinism_report` with the scope: same machine, GPU, driver, Gazebo and ROS versions.

### Output
`determinism_report`.

### Quality Gate
- Report holds the seed, both hashes, the verdict, and the scope statement.
- The seed-plus-one run result is recorded.

---

## Worked Example

Illustrative. `sim_seed` = 7, `--iterations 20000` at 1 ms steps = 20 s sim time.
```
$ gz sim --help | grep -i seed
  --seed [arg]                 Start with a given random number seed.
$ wc -l runA_pose.csv runB_pose.csv
 2001 runA_pose.csv
 2001 runB_pose.csv
$ sha256sum runA_pose.csv runB_pose.csv
b81e...0c  runA_pose.csv
b81e...0c  runB_pose.csv
```
Verdict DETERMINISTIC (Harmonic, Jazzy, same machine).

---

## Exit Criteria

DONE when two same-seed runs are compared on header stamps and the report states a verdict, its scope, and the first divergence if any.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `--seed` option | **Adjust**: record it; rely on seeded nodes and noise-free comparison topics. |
| Phase 2 | Bag empty | **Retry**: start the recorder before launch and confirm topic names with `ros2 topic list`. |
| Phase 3 | Divergence from rendering sensors only | **Return**: report as open question; do not drop the topic silently. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
