# Linux candump Baseline and Action Capture

**One-line description:** Records the idle baseline and every labeled action segment with `candump -l` on a listen-only SocketCAN interface, alongside the `actions.tsv` marker file, and checks each log for drops and timestamp gaps.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `socketcan_interface` (object, required): Output of `sigre-linux-socketcan-listen-only-setup`.
- `capture_plan` (object, required): Output of `sigre-capture-plan-labeled-actions`.

---

## Outputs

- `candump_logs` (object[]): One entry per segment group: log file path (candump log format, `(epoch) can0 ID#DATA`), the matching `actions.tsv` path, frame count, duration, and the interface drop counters read before and after.

---

## Phase 1: Pre-Capture Checks

### Entry Criteria
- `socketcan_interface` shows LISTEN-ONLY.
- Vehicle is parked, parking brake on, in the state of the first segment.

### Actions
1. Re-run `ip -details -statistics link show can0` and confirm `<LISTEN-ONLY>` is still present. A replug or suspend resets the interface; if the flag is gone, rerun the setup flow.
2. Record the `RX: bytes packets errors dropped` line as the "before" counters.
3. Make a working directory per session: `mkdir -p ~/canre/$(date +%Y%m%d) && cd ~/canre/$(date +%Y%m%d)`.
4. Increase the socket receive buffer if the distribution default is small: check with `sysctl net.core.rmem_max` and record the value. Do not change it unless drops are seen in Phase 3.

### Output
Pre-capture counters and working directory.

### Quality Gate
- `LISTEN-ONLY` present in the output captured at the start of this phase.
- "Before" counters recorded.

---

## Phase 2: Capture Segments

### Entry Criteria
- Pre-capture checks passed.

### Actions
1. Start the logger: `candump -l can0`. It writes `candump-YYYY-MM-DD_HHMMSS.log` in the current directory in log format with absolute epoch timestamps. Keep it running for a whole segment group.
2. In a second terminal in the same directory, start the marker loop from `capture_plan` writing `actions.tsv`.
3. Type `baseline_idle_start`, wait the planned `baseline_seconds`, type `baseline_idle_end`.
4. For each action and repetition: type `<label>_start_<n>`, perform the action, type `<label>_end_<n>`, wait the planned rest.
5. Stop `candump` with Ctrl+C only after the last end marker.
6. For driving segments, start both terminals before the drive; the passenger types markers. The driver does not touch the laptop.
7. Make the raw log read-only: `chmod a-w candump-*.log`.
8. Do NOT use `candump -L > file` and `candump -l` at the same time, and do NOT use `candump` without `-l` or `-L` for capture; the default screen format drops absolute timestamps unless `-t a` is given and is harder to parse.

### Output
Raw log files and `actions.tsv`.

### Quality Gate
- Each log file starts with a line matching `^\([0-9]+\.[0-9]{6}\) can0 [0-9A-F]+#`.
- `actions.tsv` has one start and one end marker for every planned repetition: `grep -c _start_ actions.tsv` equals `grep -c _end_ actions.tsv`.

---

## Phase 3: Integrity Checks

### Entry Criteria
- Logs are closed.

### Actions
1. Read the "after" counters from `ip -details -statistics link show can0`. Compute the difference in `dropped` and `errors`.
2. Count frames: `wc -l candump-*.log`.
3. Find timestamp gaps larger than the longest period seen in the baseline: `awk -F'[()]' 'NR>1{d=$2-p; if(d>g)g=d} {p=$2} END{print "max gap s:", g}' candump-*.log`. A gap much larger than the slowest periodic message period points to a dropped stretch.
4. Confirm every marker time lies inside the log's first and last timestamp.
5. Emit `candump_logs` with paths, counts, durations and counter deltas.

### Output
`candump_logs`.

### Quality Gate
- `dropped` delta is 0, or the delta and affected log are recorded.
- Every marker timestamp is within its log's time range.

---

## Worked Example

Illustrative only.

```
$ candump -l can0
Disabled standard output while logging.
Enabling Logfile 'candump-2026-10-21_101500.log'
^C
$ head -3 candump-2026-10-21_101500.log
(1729505700.004113) can0 1A0#0000003C0000007E
(1729505700.004702) can0 2C4#0FA0000000001234
(1729505700.005901) can0 3B0#0100000000000000
$ wc -l candump-2026-10-21_101500.log
412339 candump-2026-10-21_101500.log
```

Phase 3: dropped delta 0, max gap 0.101 s, 10 start and 10 end markers inside range.

---

## Exit Criteria

DONE when every planned segment is captured to a read-only candump log with matching markers, zero or recorded drops, and markers inside log time ranges.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | LISTEN-ONLY flag missing after replug | **Stop**: rerun `sigre-linux-socketcan-listen-only-setup` before any capture. |
| Phase 2 | Marker typed late or forgotten | **Adjust**: add a corrected line with `_fix` suffix and a note; never edit timestamps by hand to look clean. |
| Phase 3 | Dropped frames counted | **Retry**: raise the receive buffer per your distribution documentation, reduce other host load, and recapture the segment. |
| Phase 3 | Marker outside log range | **Retry**: recapture that segment; the log was stopped early. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
