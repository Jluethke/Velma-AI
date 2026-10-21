# Recorded Drive Drop Audit

**One-line description:** Audits a recorded drive for lost data three ways: per-topic message counts against measured rates, inter-message gaps and sequence jumps found by scanning `log_time` and sequence fields with the Python `mcap` reader, and kernel and logger drop counters captured during the drive.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `log_dir` (string, required): Directory of one drive's recorded files.
- `measured_rates` (object[], required): From `dlog-sensor-rate-inventory`; expected rate per topic.

---

## Outputs

- `drop_report` (object): Per topic: expected count, recorded count, difference, largest gaps with their log times, sequence jumps, and the counter evidence (logger stats, `ip -s link`, `netstat -su`); plus a verdict per topic of CLEAN, GAPS or UNEXPLAINED.

---

## Phase 1: Count Messages

### Entry Criteria
- `log_dir` holds closed files (no `.active` files, recorder stopped).

### Actions
1. MCAP files: `mcap info <file>` per file; sum per-channel message counts and durations. rosbag2: `ros2 bag info <log_dir>` gives per-topic `Count` and total `Duration`.
2. expected = measured rate x recorded duration for the topic (use the topic's own first and last `log_time`, not the bag duration, for topics that start late).
3. difference = expected - recorded. Report it as a number and a fraction.
4. A nonzero difference alone is not a drop: sensors run slightly off nominal rate. Phase 2 decides.

### Output
Count table.

### Quality Gate
- Every topic in the files appears in the count table with expected, recorded and difference.

---

## Phase 2: Scan Gaps and Sequences

### Entry Criteria
- Count table built.

### Actions
1. Write a short script (in the project, not in the log directory) using the documented reader:
   ```python
   from mcap.reader import make_reader
   with open(path, "rb") as f:
       r = make_reader(f)
       for schema, channel, message in r.iter_messages(log_time_order=True):
           # per channel.topic: track previous message.log_time and message.sequence
   ```
2. For each topic compute the gap list: consecutive `log_time` differences. Report the largest gaps and the nominal period (1 / measured rate). A gap is flagged when it exceeds the tolerance the user sets as a multiple of the nominal period; this flow does not pick the multiple.
3. If the writer sets `sequence` (custom MCAP writers from `dlog-py-mcap-writer` or `dlog-cpp-mcap-writer`), list every jump greater than 1. rosbag2 may leave `sequence` as zero; then skip this step and say so.
4. For sensors that carry their own counters (for example a frame counter in a camera message, a rolling counter in CAN payloads), check those too; they reveal drops upstream of the logger.
5. Check gaps across file boundaries: last message of file N to first of file N+1.

### Output
Gap and sequence findings.

### Quality Gate
- Each flagged gap lists topic, start `log_time`, length in ns and file name.
- File-boundary gaps were checked for every split.

---

## Phase 3: Attribute with Counters

### Entry Criteria
- Gaps listed.

### Actions
1. Logger counters: `mcap list metadata <file>` for drop stats; rosbag2 recorder console warnings saved during the drive.
2. Network: `netstat -su` (or `nstat -az | grep -i Udp`) before and after; `RcvbufErrors` increases mean UDP sensor packets were dropped at the socket.
3. CAN: `ip -details -statistics link show can0` deltas for `dropped` and `overrun`.
4. Disk: if `iostat` was logged, find `w_await` spikes at the gap times.
5. Decision table per topic:

| Evidence | Verdict |
|---|---|
| No flagged gaps, no counter increments | CLEAN |
| Flagged gaps matched by a counter at the same time | GAPS (cause named) |
| Flagged gaps with no matching counter | UNEXPLAINED |

### Output
`drop_report`.

### Quality Gate
- Every topic has a verdict from the table.
- Every GAPS verdict names the counter and the time it moved.

---

## Worked Example

Illustrative.
```
topic        expected  recorded  diff   largest gap        verdict
/imu/data    30006     30004     2      10.1 ms (period 5) CLEAN
/lidar/pts   1500      1488      12     1.20 s at t=...712 GAPS: RcvbufErrors +3410
/cam_front   4500      4500      0      34 ms              CLEAN
```
Cause for lidar: socket buffer overflow; fix by raising `net.core.rmem_max` and the driver's socket buffer, then retest.

---

## Exit Criteria

DONE when every topic has a count, a gap scan and a verdict, and every gap is attributed or marked UNEXPLAINED.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | File has no summary (`mcap info` fails) | **Stop**: run `dlog-log-validate-recover` first. |
| Phase 2 | User gives no gap tolerance | **Return**: report the gap distribution and ask for the tolerance. |
| Phase 3 | No counters were captured during the drive | **Adjust**: mark gaps UNEXPLAINED and add counter capture to the next drive's procedure. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
