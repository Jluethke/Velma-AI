# python-can Baseline and Action Capture

**One-line description:** Records the idle baseline and each labeled action segment to candump-format `.log` files with `can.Logger` and `can.Notifier` on a listen-only python-can bus, then checks frame counts, timestamp gaps and marker coverage.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `python_can_config` (object, required): Output of `sigre-py-python-can-listen-setup`.
- `capture_plan` (object, required): Output of `sigre-capture-plan-labeled-actions`.

---

## Outputs

- `python_can_logs` (object[]): One entry per segment group: `.log` file path (candump log format written by python-can), matching `actions.tsv` path, frame count, duration, maximum timestamp gap.

---

## Phase 1: Write the Capture Script

### Entry Criteria
- `python_can_config` has a documented listen-only mechanism.

### Actions
1. Save as `~/canre/capture.py` (outside the marketplace), with `CONFIG` copied from `python_can_config`:
   ```
   import sys, can
   CONFIG = {"interface": "socketcan", "channel": "can0"}
   out = sys.argv[1]
   bus = can.Bus(**CONFIG)
   writer = can.Logger(out)
   notifier = can.Notifier(bus, [writer])
   try:
       input("Logging to %s. Press Enter to stop.\n" % out)
   finally:
       notifier.stop()
       writer.stop()
       bus.shutdown()
   ```
2. `can.Logger` picks the writer from the file suffix: `.log` writes candump log format, `.asc` Vector ASCII, `.blf` Vector binary. Use `.log` so every later flow can read it with `can.LogReader` and with can-utils.
3. Check no transmit call: `grep -nE "send" ~/canre/capture.py` must print nothing.
4. Do not use `print` inside a receive loop instead of the Notifier; console output slows the loop and drops frames on busy buses.

### Output
Capture script.

### Quality Gate
- Grep for `send` prints nothing.
- `python -c "import can; print(can.__version__)"` matches the version in `python_can_config`.

---

## Phase 2: Capture Segments

### Entry Criteria
- Script saved; vehicle in the first planned state.

### Actions
1. Terminal 1: `python ~/canre/capture.py 20261021_baseline_and_parked.log`.
2. Terminal 2, same directory: run the marker loop from `capture_plan` writing `actions.tsv`. On Windows PowerShell use: `while ($true) { $l = Read-Host; "{0}`t{1}" -f ([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()/1000), $l | Add-Content actions.tsv }`.
3. Follow the plan: baseline start marker, wait `baseline_seconds`, end marker; each action with start and end markers and rests.
4. Press Enter in terminal 1 only after the last end marker.
5. Start a new file for the driving group; the passenger handles both terminals.

### Output
Raw `.log` files and `actions.tsv`.

### Quality Gate
- First line of each log matches `^\([0-9]+\.[0-9]+\) \S+ [0-9A-F]+#`.
- `actions.tsv` start and end marker counts are equal.

---

## Phase 3: Integrity Checks

### Entry Criteria
- Logs closed.

### Actions
1. Run, per file:
   ```
   python -c "import can,sys; t=[m.timestamp for m in can.LogReader(sys.argv[1])]; import numpy as n; d=n.diff(t); print(len(t), t[-1]-t[0], d.max())" FILE.log
   ```
   It prints frame count, duration in seconds and the largest gap.
2. Compare the largest gap with the slowest periodic message period seen in the baseline. A gap many times larger than that period means frames were lost.
3. Confirm every marker in `actions.tsv` is between the first and last log timestamp.
4. Make logs read-only (`chmod a-w` on Linux or macOS, `attrib +R` on Windows).
5. Emit `python_can_logs`.

### Output
`python_can_logs`.

### Quality Gate
- Every marker lies inside its log's time range.
- Frame count, duration and max gap are recorded for every file.

---

## Worked Example

Illustrative only.

```
$ python ~/canre/capture.py 20261021_parked.log
Logging to 20261021_parked.log. Press Enter to stop.

$ python -c "...LogReader..." 20261021_parked.log
241877 498.31 0.0996
```

Max gap 0.0996 s against a slowest baseline period near 0.1 s: no loss. 10 start and 10 end markers in range.

---

## Exit Criteria

DONE when every planned segment is in a read-only candump-format log with matching markers and recorded integrity numbers.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `can.Logger` raises for the suffix | **Adjust**: use `.log`; check `python -m can.logger --help` for the formats your version supports. |
| Phase 2 | Script exits with a bus error | **Stop**: recheck listen-only and bitrate with `sigre-py-python-can-listen-setup`. |
| Phase 3 | Large gap found | **Retry**: close other programs, recapture the segment. |
| Phase 3 | Marker outside log range | **Retry**: recapture; the logger was stopped early. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
