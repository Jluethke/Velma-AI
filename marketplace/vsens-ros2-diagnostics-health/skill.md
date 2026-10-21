# ROS 2 Sensor Health with diagnostic_updater and diagnostic_aggregator

**One-line description:** Adds per-topic frequency and timestamp checks to ROS 2 sensor drivers or a sidecar node with diagnostic_updater's FrequencyStatus and TimeStampStatus, groups them with diagnostic_aggregator analyzers, and proves dropout detection by unplugging each sensor and watching the level change to ERROR or STALE.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `timing_requirements` (object, required): From `vsens-sensor-inventory`; nominal period per sensor and the user's tolerances.
- `topic_list` (object[], required): Sensor topics with message type, publishing node, and the user's allowed latency per topic if any.

---

## Outputs

- `health_monitor_config` (object): The FrequencyStatus and TimeStampStatus parameters per topic with their source, the aggregator analyzers YAML, the `/diagnostics_agg` level observed for each topic in normal running and during the unplug test, and the detection time per sensor.

---

## Phase 1: Derive Parameters

### Entry Criteria
- `ros2 pkg list | grep -E 'diagnostic_updater|diagnostic_aggregator'` prints both packages.

### Actions
1. For each topic, set `min_freq` and `max_freq` from the nominal rate in `timing_requirements` and the user's rate tolerance. If the user gave no tolerance, write "open question" and do not deploy the check for that topic until it is answered.
2. Set the FrequencyStatus `tolerance` (fraction added outside min and max) and `window_size` (number of update cycles averaged) from the user's inputs; the diagnostic_updater defaults are documented in its source (`FrequencyStatusParam`); if the user accepts defaults, record that the defaults were used and their values from the installed header or Python module.
3. TimeStampStatus `min_acceptable` and `max_acceptable` bound `now - header.stamp` in seconds. Set them from the user's latency limit and the measured results of `vsens-ros2-stamp-latency` if available. A negative `min_acceptable` is needed only if stamps can be slightly in the future.
4. Write the table: topic, min_freq, max_freq, tolerance, window_size, min_acceptable, max_acceptable, source of each.

### Output
Parameter table.

### Quality Gate
- Every number in the table has a source column entry (user input, documented default, or measurement).
- No topic with "open question" is included in the deployed set.

---

## Phase 2: Instrument and Aggregate

### Entry Criteria
- Parameter table complete for the deployed topics.

### Actions
1. If the driver is your code, add a `diagnostic_updater::Updater` and wrap the publisher in `diagnostic_updater::DiagnosedPublisher` or add a `diagnostic_updater::TopicDiagnostic` with `FrequencyStatusParam` and `TimeStampStatusParam`; call `tick(stamp)` on each publish.
2. If the driver is third-party, do NOT edit it. Write a sidecar rclpy node that subscribes with matching QoS and calls `freq_status.tick()` and `ts_status.tick(stamp_seconds)` in the callback, with an `Updater` publishing on `/diagnostics`.
3. Write `analyzers.yaml` for `diagnostic_aggregator`: one `diagnostic_aggregator/GenericAnalyzer` per sensor group with `path`, `contains` or `startswith` matching your status names, and `timeout` from the user (seconds after which a missing status becomes STALE).
4. Launch: `ros2 run diagnostic_aggregator aggregator_node --ros-args --params-file analyzers.yaml`.
5. Read: `ros2 topic echo /diagnostics_agg`. Levels in `diagnostic_msgs/msg/DiagnosticStatus`: 0 OK, 1 WARN, 2 ERROR, 3 STALE.

### Output
Running health monitoring.

### Quality Gate
- With all sensors running, every deployed topic shows level 0 in `/diagnostics_agg` for one minute, saved from `ros2 topic echo`.
- `analyzers.yaml` is saved in the report.

---

## Phase 3: Prove Dropout Detection

### Entry Criteria
- All topics OK.
- Sensors are on a bench or a parked vehicle; unplugging a sensor must not affect any vehicle control function. If any sensor feeds a function that moves the vehicle, do not run this test on that vehicle.

### Actions
1. Note the time, then unplug one sensor (USB, Ethernet or power).
2. Watch `/diagnostics_agg` and record the time the status for that topic changes to 2 (ERROR, frequency out of range) or 3 (STALE, no status update).
3. Replug and record the time it returns to 0.
4. Repeat for every sensor. Record detection and recovery times.
5. Emit `health_monitor_config`.

### Output
`health_monitor_config`.

### Quality Gate
- Every deployed topic shows a level change to 2 or 3 after unplug, with the recorded time.
- Every topic returns to 0 after replug, with the recorded time.

---

## Worked Example

Illustrative only. Camera nominal 30 Hz, user tolerance gives min 29, max 31; IMU 200 Hz.

```
$ ros2 topic echo /diagnostics_agg --field status
- level: "\0"
  name: /Sensors/Camera/camera_freq
  message: Desired frequency met
...
(unplug camera at 10:41:02)
- level: "\x02"
  name: /Sensors/Camera/camera_freq
  message: No events recorded.
```
Camera: ERROR after 1.0 s, OK 3.4 s after replug (driver restart time).

---

## Exit Criteria

DONE when every deployed topic has sourced thresholds, reads OK in normal running, and is proven to go ERROR or STALE on unplug and recover on replug.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No tolerance from user | **Return**: list the topic as an open question; do not deploy a guessed threshold. |
| Phase 2 | Sidecar sees no messages | **Adjust**: match QoS reliability and durability to the publisher. |
| Phase 2 | Status never appears in `/diagnostics_agg` | **Adjust**: analyzer `path` or match string does not match the status name; fix the YAML. |
| Phase 3 | No level change on unplug | **Stop**: the monitor is not live; check the Updater period and that `tick` is called per message. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
