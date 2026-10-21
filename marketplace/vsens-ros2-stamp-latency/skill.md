# ROS 2 Header Stamp Latency Measurement

**One-line description:** Measures, per ROS 2 sensor topic, the delay from header.stamp to subscriber receipt with ros2 topic delay and a small rclpy recorder node, separates scan or exposure duration from transport delay, and flags stamps that come from the wrong clock.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `clock_discipline_report` (object, required): From `vsens-pps-chrony`; confirms the host clock is disciplined and names its source.
- `topic_list` (object[], required): Sensor topics to measure, each with its message type and what the driver documents `header.stamp` to mean (exposure start, mid-exposure, scan start, scan end, or receive time), plus the user's allowed latency for that topic if one exists.

---

## Outputs

- `stamp_latency_report` (object): Per topic: message count, median, 99th percentile and maximum of receipt time minus `header.stamp`, the count of negative delays, inter-arrival statistics, the documented stamp meaning, and the clock domain verdict.

---

## Phase 1: Quick Check with ros2 topic delay

### Entry Criteria
- `use_sim_time` is false on every node (`ros2 param get /<node> use_sim_time`), since the measurement uses wall time.
- Publisher and subscriber clocks are synchronized; if they run on different hosts, both hosts appear in `clock_discipline_report` or a PTP report.

### Actions
1. For each topic, run `ros2 topic delay <topic>` for 30 seconds. It prints `average delay`, `min`, `max`, `std dev` and `window`. Record them.
2. Run `ros2 topic hz <topic>` for the same window and record the rate.
3. Apply:

| Observed | Meaning |
|---|---|
| Delay on the order of years or tens of seconds | Stamp is not wall clock (sensor boot time, GPS time without epoch handling, or TAI vs UTC) |
| Negative delays | Stamp is in the future; clock domain mismatch or the publisher host clock is ahead |
| Delay roughly equals one scan or frame period plus a small remainder | Stamp marks scan or exposure start; expected |
| Small positive delay with low spread | Plausible; continue to Phase 2 |

### Output
Quick delay table and verdict per topic.

### Quality Gate
- Every topic has a recorded `ros2 topic delay` summary.
- Every topic has a row from the table assigned.

---

## Phase 2: Per-Message Recorder

### Entry Criteria
- No topic is in a clock-domain-mismatch row, or the mismatch was fixed and Phase 1 rerun.

### Actions
1. Write `stamp_recorder.py`: an rclpy node that subscribes to each topic with a QoS matching the publisher (check with `ros2 topic info -v <topic>`; sensor drivers often publish BEST_EFFORT, and a RELIABLE subscriber will receive nothing).
2. In the callback, read `now = self.get_clock().now().nanoseconds` first, then `stamp = msg.header.stamp.sec * 10**9 + msg.header.stamp.nanosec`, and append `(now - stamp, now)` to a list. Do no other work in the callback.
3. Run it with a `MultiThreadedExecutor` or one node per topic so a slow topic does not delay another's callbacks.
4. After the window, write a CSV per topic and compute median, 99th percentile, maximum, count of negative values, and inter-arrival gaps from the `now` column.
5. For lidar, subtract the documented scan period if `header.stamp` is scan start, and report both raw and adjusted values. For cameras, report the documented stamp meaning beside the values.

### Output
Per-topic CSV and statistics.

### Quality Gate
- Each CSV row count equals the message count printed by the node at exit.
- The negative-delay count is reported for every topic.

---

## Phase 3: Compare with Requirements

### Entry Criteria
- Statistics computed.

### Actions
1. For each topic, compare the 99th percentile delay with the allowed latency given for that topic in `topic_list`, if the user set one. Otherwise mark "no limit set".
2. Note what this measures: receipt time minus stamp includes driver processing, middleware transport and executor scheduling. It does not measure time from photons or laser return to stamp; use `vsens-camera-led-latency` for that.
3. Emit `stamp_latency_report`.

### Output
`stamp_latency_report`.

### Quality Gate
- Every topic has a pass, fail, or "no limit set" entry with the numbers used.
- The report contains the sentence stating that the measurement excludes sensor-internal latency.

---

## Worked Example

Illustrative only.

```
$ ros2 topic delay /camera/image_raw
average delay: 0.021
	min: 0.017s max: 0.034s std dev: 0.00261s window: 30
$ ros2 topic delay /points
average delay: 0.112
	min: 0.104s max: 0.131s std dev: 0.00410s window: 10
$ ros2 topic delay /imu/data_raw
average delay: -36.998
```
`/points` delay is about one 0.1 s scan plus 12 ms; stamp is scan start per the driver docs. `/imu/data_raw` is negative by about 37 s: the IMU driver stamps in TAI from the PTP clock; fixed via the `vsens-ptp-linuxptp` UTC offset handling, then rerun.

---

## Exit Criteria

DONE when every topic has per-message delay statistics in a single clock domain, compared with the user's limit or marked as having none.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ros2 topic delay` prints nothing | **Adjust**: message has no header or QoS mismatch; check `ros2 topic info -v`. |
| Phase 1 | Clock domain mismatch | **Return**: to `vsens-ptp-linuxptp` or `vsens-pps-chrony`; do not subtract a constant in code. |
| Phase 2 | Recorder receives nothing | **Adjust**: set subscriber QoS reliability to BEST_EFFORT to match the publisher. |
| Phase 3 | Delay above limit | **Return**: report the topic and numbers; do not change driver code in this flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
