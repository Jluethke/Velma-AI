# Python Sensor Dropout and Stall Detector

**One-line description:** Detects missed samples, stalls, duplicate and backward timestamps in sensor streams without ROS, using sequence counters where the sensor provides them and a period-rounding rule on timestamps where it does not, both offline on a log and live with a time.monotonic_ns watchdog.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `timing_requirements` (object, required): From `vsens-sensor-inventory`; nominal period per sensor and user tolerances, including the stall timeout per sensor if the user set one.
- `stream_log_path` (string, required): Directory of per-sensor CSV logs with columns `host_monotonic_ns`, `sensor_stamp_ns`, and `seq` when the sensor provides a counter (V4L2 buffer `sequence`, UBX `iTOW`, lidar frame or measurement id, IMU sample counter).

---

## Outputs

- `dropout_report` (object): Per sensor: total samples, missed samples by counter and by timestamp, gap events with start time and length, stalls longer than the timeout, duplicate stamps, backward stamps, counter wraps handled, and the live watchdog test result.

---

## Phase 1: Offline Gap Analysis

### Entry Criteria
- `python3 -c "import numpy"` succeeds. Do not add other dependencies.
- Each CSV has a header row with the column names above.

### Actions
1. Write `dropout.py`. Load each CSV with `numpy.genfromtxt(path, delimiter=',', names=True, dtype=None)`.
2. Counter-based (preferred when `seq` exists): `d = numpy.diff(seq)`. Handle wraparound with the counter width from the sensor documentation: `d = numpy.mod(d, 2**bits)`. Missed samples = `sum(d - 1)` over `d > 1`. `d == 0` is a duplicate. For UBX `iTOW` (milliseconds of GPS week), divide by the configured period in ms first and handle the week rollover at 604800000 ms.
3. Timestamp-based (when no counter): `dt = numpy.diff(sensor_stamp_ns)`, `n = numpy.rint(dt / period_ns)`. Missed samples = `sum(n - 1)` over `n >= 2`. Rounding to the nearest whole number of periods means jitter under half a period never counts as a gap; that half-period boundary follows from the rule, not from a tuned threshold.
4. Flag `dt <= 0` as duplicate (zero) or backward (negative). Backward stamps mean a clock step or a driver bug; list each with its index.
5. Compare counter-based and timestamp-based counts where both exist. A difference means stamps are jittered or reassigned by the driver.

### Output
Per-sensor offline counts and gap list.

### Quality Gate
- For every sensor, missed plus received equals the expected count from first to last counter value (or first to last stamp divided by period), printed as an equation.
- Backward and duplicate stamp counts are printed for every sensor.

---

## Phase 2: Live Watchdog

### Entry Criteria
- Offline analysis done.

### Actions
1. In the reader process for each sensor, store `last_ns = time.monotonic_ns()` on every sample. Use `time.monotonic_ns()`, never `time.time()`, because wall time can step when chrony or PTP adjusts it.
2. Run a watchdog thread that wakes every nominal period and computes `age = time.monotonic_ns() - last_ns`. Raise a stall event when `age` exceeds the user's stall timeout. If the user set none, record "open question" and log ages without raising events.
3. Write each event as one JSON line with sensor id, event type, `age_ns`, and `time.time_ns()` for human correlation.
4. Do NOT make the watchdog block, delay or gate any braking, emergency-stop or actuator path. It only reports. If a downstream system consumes these events, that consumer's design is out of scope here.

### Output
Watchdog running with an event log.

### Quality Gate
- The event log file exists and each line parses with `python3 -c "import json,sys;[json.loads(l) for l in open(sys.argv[1])]" events.jsonl`.
- The watchdog wake period equals the smallest nominal period in `timing_requirements` (printed at start).

---

## Phase 3: Prove It Is Live

### Entry Criteria
- Watchdog running.
- Sensors on a bench or a parked vehicle.

### Actions
1. Unplug one sensor for a few seconds and replug it.
2. Confirm a stall event appears for that sensor and none for the others.
3. Rerun Phase 1 on the log captured during the test; the gap list must contain one gap matching the unplug interval.
4. Repeat for each sensor. Emit `dropout_report`.

### Output
`dropout_report`.

### Quality Gate
- One stall event per unplug test appears in `events.jsonl`, matched by sensor id.
- The offline gap list shows the unplug gap with a length within one period of the stall duration observed.

---

## Worked Example

Illustrative only. IMU at 200 Hz with a 16-bit counter; camera at 30 fps with V4L2 `sequence`; GNSS NAV-PVT at 5 Hz.

```
$ python3 dropout.py --logs logs/ --req timing.json
imu:    received 719,872  missed(counter) 128  missed(stamp) 128  wraps 10  dup 0  back 0
camera: received 107,993  missed(counter) 7    missed(stamp) 7    dup 0  back 0
gnss:   received 17,999   missed(iTOW) 1       dup 0  back 0
check imu: 719872 + 128 = 720000 expected  OK
```
Unplug test: camera stall event after the user's 0.5 s timeout; offline gap of 2.13 s found at the same time.

---

## Exit Criteria

DONE when offline counts reconcile with expected counts, the live watchdog logs events, and an unplug test produces a matching stall event and offline gap for every sensor.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Counter and stamp counts disagree | **Adjust**: report both; the driver may reassign stamps; trust the counter. |
| Phase 1 | Backward stamps | **Return**: to `vsens-pps-chrony` or `vsens-ptp-linuxptp` to find the clock step. |
| Phase 2 | No stall timeout given | **Return**: record "open question"; log ages only. |
| Phase 3 | No event on unplug | **Stop**: the watchdog is not running on live data; fix before claiming coverage. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
