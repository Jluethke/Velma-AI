# Cross-Sensor Time Sync Check

**One-line description:** Measures, from a recorded drive, the latency between each message's own stamp and its log receive time, and the time offset between sensor pairs using a shared physical event or a calibration tool, then reports every pair outside the user's tolerance.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `log_dir` (string, required): One drive's validated files.
- `clock_domain_map` (object[], required): From `dlog-clock-domain-map`; says which stamps are comparable.

---

## Outputs

- `sync_report` (object): Per topic latency statistics (stamp to `log_time`), per sensor pair estimated offset with method and uncertainty, and the list of pairs outside tolerance.

---

## Phase 1: Stamp to Log Latency

### Entry Criteria
- Files pass `dlog-log-validate-recover`.

### Actions
1. For ROS 2 messages decode `header.stamp` with `mcap-ros2-support`:
   ```python
   from mcap.reader import make_reader
   from mcap_ros2.decoder import DecoderFactory
   r = make_reader(f, decoder_factories=[DecoderFactory()])
   for schema, channel, message, ros_msg in r.iter_decoded_messages(topics=[...]):
       stamp_ns = ros_msg.header.stamp.sec * 1_000_000_000 + ros_msg.header.stamp.nanosec
       latency_ns = message.log_time - stamp_ns
   ```
2. Only compute latency where `clock_domain_map` says the stamp and `log_time` share a domain (or both are disciplined to the same master).
3. Report per topic: median, minimum, maximum, and the spread. A negative latency means the stamp is in the future relative to the logger: a clock offset, not a fast network.
4. A latency that grows steadily over the drive means the clocks drift apart; fit a line of latency vs time and report the slope in ns per second.

### Output
Latency table.

### Quality Gate
- Every topic with a header stamp has latency statistics or a stated reason (different domain).
- Any negative minimum latency is listed.

---

## Phase 2: Pairwise Offset

### Entry Criteria
- Latency table built.

### Actions
1. Choose a method per pair:

| Pair | Method |
|---|---|
| Camera and IMU | Temporal calibration with Kalibr (`kalibr_calibrate_imu_camera`), which estimates a time shift; record its reported shift |
| Lidar and IMU or lidar and camera | Shared motion event: a sharp yaw rotation in place, compare the time of peak yaw rate in IMU with peak rotation estimated from consecutive scans or frames |
| CAN and other sensors | A signal visible in both, such as wheel speed from CAN vs speed from GNSS or odometry; cross-correlate the two series |
| Any pair with hardware trigger | Verify trigger timestamps align to the trigger period; compare frame stamps to the trigger log |

2. For cross-correlation, resample both series onto a common uniform grid using the stamps, then take the lag of peak correlation; the grid step limits resolution, so report it as the uncertainty.
3. Do NOT treat `log_time` differences between topics as sensor offsets; `log_time` includes transport and queue delays.

### Output
Offset per pair with uncertainty.

### Quality Gate
- Each pair offset names its method and the drive time window used.

---

## Phase 3: Compare to Tolerance

### Entry Criteria
- Offsets known.

### Actions
1. The tolerance per pair is a user input, derived from the use (for example, at a given vehicle speed an offset moves a lidar point by speed x offset; the user picks the allowed displacement).
2. List pairs whose |offset| + uncertainty exceeds tolerance.
3. Write `sync_report`.

### Output
`sync_report`.

### Quality Gate
- Every pair has PASS or FAIL against a stated tolerance, or "no tolerance given".

---

## Worked Example

Illustrative.
```
topic          median latency  min      max      slope
/imu/data      0.42 ms         0.31 ms  3.9 ms   0.0 ns/s
/cam_front     21.7 ms         18.2 ms  44.0 ms  0.0 ns/s   (stamp = host receive)
/lidar/points  -1.8 ms         -2.1 ms  6.0 ms   +2.1 ns/s  (negative: lidar clock ahead)
pair cam_front/imu  Kalibr shift 18.9 ms +- 0.5 ms   FAIL vs 5 ms tolerance
```

---

## Exit Criteria

DONE when every comparable topic has latency statistics and every requested pair has an offset with method, uncertainty and verdict.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `mcap_ros2` not installed | **Adjust**: `pip install mcap-ros2-support`. |
| Phase 1 | Stamps in different domains | **Return**: skip latency, flag for `dlog-ptp-linuxptp-sync` or `dlog-chrony-gnss-pps`. |
| Phase 2 | No motion event in the drive | **Return**: request a short calibration drive with an in-place rotation on a closed course. |
| Phase 3 | Offset exceeds tolerance | **Return**: report it; do not shift stamps in the archived log. Corrections belong in the replay configuration. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
