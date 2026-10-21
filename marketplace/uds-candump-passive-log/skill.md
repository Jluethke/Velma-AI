# Passive CAN Capture with candump

**One-line description:** Records a timestamped, replayable CAN log from the OBD-II port with `candump -l` while the interface is in listen-only mode, and checks the log for dropped frames and error frames before anyone decodes it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_link_status` (object, required): From `uds-socketcan-link-setup`, with a confirmed bitrate.
- `can_interface` (string, required): For example `can0`.
- `capture_seconds` (integer, optional): How long to record. User input; no default is assumed. When absent, record until the user stops it with Ctrl-C.

---

## Outputs

- `candump_log` (string): Path to the candump log file (`candump-YYYY-MM-DD_HHMMSS.log`) plus its frame count, first and last timestamp, and the drop count.

---

## Phase 1: Capture

### Entry Criteria
- `can_link_status.state` is ERROR-ACTIVE.

### Actions
1. Put the link in listen-only mode so the capture cannot transmit: `sudo ip link set <can_interface> down; sudo ip link set <can_interface> type can bitrate <bitrate> listen-only on; sudo ip link set <can_interface> up`.
2. Raise the socket receive buffer if the bus is busy: `candump` accepts `-r <size>`; check `candump -h` on your version.
3. Start the capture: `candump -l -e -d <can_interface>`.
   - `-l` writes to `candump-<date>_<time>.log` in the current directory in the log format `(timestamp) can0 7E8#0441...`.
   - `-e` also records error frames.
   - `-d` monitors dropped frames.
4. If `capture_seconds` is set, wrap it: `timeout <capture_seconds> candump -l -e -d <can_interface>`.
5. To capture a diagnostic exchange made by another tool, run the capture in normal mode instead and record that the link was not listen-only.

### Output
A log file in the working directory.

### Quality Gate
- `ls candump-*.log` shows exactly one new file.
- `wc -l` on that file is greater than 0.

---

## Phase 2: Check the Log

### Entry Criteria
- Log file exists.

### Actions
1. Count frames: `wc -l candump-*.log`.
2. Count error frames. In the log format an error frame carries the CAN_ERR_FLAG, so its ID prints as eight hex digits starting `2000` (for example `can0 20000080#...`). Run `grep -cE ' 2000[0-9A-F]{4}#' candump-*.log`.
3. Print the first and last line to get the time span.
4. Check drop messages printed by `-d` on the terminal (lines like `DROPCOUNT`). Any drop means the log is incomplete for ISO-TP reassembly.
5. Get per-ID counts for later decoding: `cut -d' ' -f3 candump-*.log | cut -d'#' -f1 | sort | uniq -c | sort -rn | head -n 20`.
6. Do not edit the log by hand. Keep the original; copy it before any filtering.

### Output
`candump_log` with path and statistics.

### Quality Gate
- Drop count recorded (0 or a number), read from the terminal output.
- Error frame count recorded from the grep command.
- Time span recorded from the first and last timestamp.

---

## Worked Example

Illustrative only.

```
$ timeout 30 candump -l -e -d can0
$ wc -l candump-2026-10-21_101500.log
41872 candump-2026-10-21_101500.log
$ head -n 2 candump-2026-10-21_101500.log
(1761041700.104221) can0 0C9#840D2A0000000000
(1761041700.104498) can0 3E9#0000000000000000
```

`candump_log` = `{"path": "candump-2026-10-21_101500.log", "frames": 41872, "errors": 0, "drops": 0, "span_s": 30.0}`.

---

## Exit Criteria

DONE when one unedited log file exists with its frame, error and drop counts recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `candump: socket: Address family not supported` | **Stop**: the `can` and `can_raw` modules are not loaded; run `sudo modprobe can_raw`. |
| Phase 1 | Log is empty | **Retry**: confirm ignition on and bitrate with `uds-socketcan-link-setup`. |
| Phase 2 | Drops reported | **Retry**: raise the receive buffer, close other CAN programs, capture again. |
| Phase 2 | Many error frames | **Return**: the link has a wiring or bitrate problem; go back to `uds-socketcan-link-setup`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
