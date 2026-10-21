# Sensor Rate and Bandwidth Inventory

**One-line description:** Measures the real message rate and byte rate of every vehicle sensor stream (ROS 2 topics with `ros2 topic hz` and `ros2 topic bw`, raw UDP sensors with `tcpdump` and `capinfos`, CAN with `canbusload`) so storage and disk sizing use measured numbers, not datasheet guesses.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `data_sources` (object[], required): Streams to measure, with transport (ROS 2 topic, UDP port and interface, SocketCAN interface and bitrate).
- `stack` (string, required): `ros2`, `python` or `cpp`. Selects the measurement tool for in-process streams.

---

## Outputs

- `measured_rates` (object[]): Per stream: messages per second (mean, min, max), bytes per second, measurement duration, operating condition (idle, driving, worst-case scene), tool and command used.

---

## Phase 1: Set Up the Measurement Condition

### Entry Criteria
- Vehicle or robot is stationary, or driven by a person in normal traffic with logging as a passive observer. No command is sent to any actuator by this flow.
- Every sensor driver in `data_sources` is running.

### Actions
1. Write down the condition for each run: stationary indoor, stationary outdoor, driving. Lidar and compressed camera byte rates change with scene content (point returns, image entropy), so measure the busiest realistic scene the user names.
2. Pick a measurement window length and record it. Use the same window for every stream.
3. Do NOT measure while another heavy process (a build, a copy) runs on the same computer; it changes delivery rates.

### Output
A measurement plan: streams, condition, window length.

### Quality Gate
- The plan names one condition and one window length per run.
- Every stream in `data_sources` is in the plan.

---

## Phase 2: Measure Each Stream

### Entry Criteria
- Measurement plan written.

### Actions
1. ROS 2 topics: run in two terminals for the full window:
   - `ros2 topic hz /lidar/points --window 1000` and read `average rate`, `min`, `max`, `std dev`.
   - `ros2 topic bw /lidar/points` and read the reported bandwidth line (B/s, KB/s or MB/s; convert to bytes per second).
   - Note: `ros2 topic hz` measures arrival at the CLI subscriber, which can itself drop under load. Cross-check with a short `ros2 bag record` and `ros2 bag info` message counts divided by duration.
2. Raw UDP sensors (lidar, radar that stream packets): `sudo tcpdump -i <iface> -w /tmp/lidar.pcap udp port <port>` for the window, then `capinfos /tmp/lidar.pcap` and read `Data byte rate` and `Average packet rate`. Get the port from the sensor manual; do not guess it.
3. CAN: `canbusload can0@<bitrate> -r -t -b` (from can-utils) for the window. Read the bus load percentage. For frame rate, `candump -n <N> -t d can0` prints deltas between frames.
4. Python or C++ in-process streams (`stack` is `python` or `cpp`): add a counter of messages and bytes at the producer and print totals at the end of the window. Do not estimate from code.
5. Record each result into `measured_rates` with the exact command line.

### Output
`measured_rates` draft.

### Quality Gate
- Every stream has a messages-per-second and a bytes-per-second number with the command that produced it.
- For ROS 2 topics, the `ros2 topic hz` rate and the bag-count rate agree, or the difference is reported.

---

## Phase 3: Total and Sanity-Check

### Entry Criteria
- All streams measured.

### Actions
1. Sum bytes per second across all streams to get the total recording rate.
2. Compare each measured rate with the configured sensor rate (driver parameter or datasheet). If measured is below configured, record it as a suspected upstream drop to investigate before logging.
3. Finalize `measured_rates`.

### Output
`measured_rates` with a total row.

### Quality Gate
- The total row equals the sum of the per-stream rows (recompute it).
- Every measured-below-configured stream is listed with both numbers.

---

## Worked Example

Illustrative. Stack `ros2`, driving condition, 60 s window.
```
$ ros2 topic hz /lidar/points --window 600
average rate: 9.998  min: 0.093s max: 0.108s std dev: 0.00290s window: 600
$ ros2 topic bw /lidar/points
... 21.40 MB/s from 100 messages ...
$ capinfos /tmp/radar.pcap | grep -E "Data byte rate|Average packet rate"
Data byte rate:      1,204 kBps
$ canbusload can0@500000 -r -t -b
 can0@500000  2214  ...  31%
```
`measured_rates` total: about 23.6 MB/s from lidar, radar, cameras and CAN combined.

---

## Exit Criteria

DONE when every stream in `data_sources` has measured message and byte rates under a named condition, plus a total.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A driver is not running | **Stop**: start it; never fill a rate from a datasheet. |
| Phase 2 | `ros2 topic hz` shows no output | **Adjust**: check QoS mismatch with `ros2 topic info -v`; rerun with `--qos-reliability best_effort` if the CLI version offers it (check `--help`). |
| Phase 2 | tcpdump reports "packets dropped by kernel" | **Retry**: write to a fast disk or raise the buffer with `-B <KiB>`; report the drop count. |
| Phase 3 | Measured rate below configured rate | **Return**: report the stream as a suspected upstream drop for `dlog-drop-audit`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
