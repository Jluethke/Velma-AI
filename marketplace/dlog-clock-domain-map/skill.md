# Timestamp Clock Domain Map

**One-line description:** Builds a table of every timestamp the logging system produces, with the clock it comes from (sensor internal clock, PTP hardware clock, CLOCK_REALTIME, CLOCK_MONOTONIC, GNSS time) and the moment it is captured, so later sync checks compare stamps that share a time base.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `data_sources` (object[], required): Streams with driver name and version, and how each timestamp field is filled.

---

## Outputs

- `clock_domain_map` (object[]): Per stream and per timestamp field: clock domain, capture point (exposure start, exposure middle, scan start, per point, kernel receive, driver publish, logger receive), epoch (Unix UTC, GPS, TAI, boot), how it is disciplined (PTP, PPS, NTP, none) and the evidence.

---

## Phase 1: List Every Timestamp Field

### Entry Criteria
- Driver source code or documentation is available for every stream.

### Actions
1. For each stream list every time field that reaches the log:
   - ROS 2: `header.stamp` inside the message, plus the rosbag2 receive time stored as MCAP `log_time`, plus MCAP `publish_time` where the recorder fills it (check your rosbag2 version notes).
   - MCAP written directly: `log_time` and `publish_time` that your code sets.
   - SocketCAN: kernel receive timestamp (software `SO_TIMESTAMP`, or hardware if the adapter driver documents it; read the adapter driver docs, since CAN adapters differ).
   - BLF: object timestamp written by the logger.
   - Lidar: packet timestamp and per-point time offsets in the packet format.
2. Mark which fields exist in the log and which only exist inside the driver.

### Output
A list of time fields per stream.

### Quality Gate
- Every stream has at least one time field listed with its storage location in the log.

---

## Phase 2: Assign Clock Domain and Capture Point

### Entry Criteria
- Field list complete.

### Actions
1. For each field, read the driver code to find which call produced it. Map the call to a domain:

| Code pattern | Domain |
|---|---|
| `rclcpp::Clock().now()`, `node->now()` with `use_sim_time` false, `time.time()`, `CLOCK_REALTIME` | System realtime (Unix UTC, steps when NTP or phc2sys steps) |
| `std::chrono::steady_clock`, `time.monotonic()`, `CLOCK_MONOTONIC` | Monotonic since boot, not comparable across computers |
| Sensor packet time field | Sensor internal clock; disciplined only if the sensor is PTP or PPS synced |
| `/dev/ptpN` reads, NIC hardware stamps | PTP hardware clock of that NIC |
| GNSS message time | GPS time or UTC as the receiver reports; GPS time and UTC differ by the leap second count broadcast in the navigation message |

2. Record the capture point. For cameras, check the driver: stamps can be exposure start, exposure middle or the moment the frame reached the host. For rolling shutter, rows are exposed at different times; record the readout time if the datasheet gives it.
3. Record how each domain is disciplined and to which master. A sensor clock free running with no sync is a valid answer; write it down.
4. Do NOT assume `header.stamp` is sensor time. Many drivers fill it with `now()` on receive.

### Output
`clock_domain_map`.

### Quality Gate
- Every field has a domain, a capture point and an evidence reference (file and line, or doc section).
- Every field using monotonic time is flagged as not comparable across hosts.

---

## Worked Example

Illustrative.
```
stream     field          domain              capture point          disciplined by
cam_front  header.stamp   system realtime     host receive (driver)  phc2sys from eth1 PHC
cam_front  log_time       system realtime     rosbag2 receive        same
lidar      header.stamp   sensor clock        first point of scan    PTP from grandmaster
can0       BLF timestamp  system realtime     kernel receive         same as host
gnss       msg time       GPS time            receiver epoch         GNSS
```
Finding: `cam_front/header.stamp` is host receive time (driver line `msg.header.stamp = this->now();`), so it includes USB transfer latency.

---

## Exit Criteria

DONE when every time field in the log has a domain, capture point, epoch and discipline source with evidence.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Driver source not available | **Adjust**: measure empirically in `dlog-sensor-sync-check` and mark the domain "inferred". |
| Phase 2 | Two fields claim the same domain but differ by a constant | **Return**: report as an epoch or leap second mismatch; do not correct silently. |
| Phase 2 | Driver uses monotonic time in a multi-computer system | **Return**: report it; cross-host comparison needs a realtime or PTP stamp. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
