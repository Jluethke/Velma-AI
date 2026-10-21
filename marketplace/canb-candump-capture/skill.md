# candump Capture with Timestamps and Filters

**One-line description:** Records CAN and CAN FD traffic with can-utils candump into a replayable log file, using the right timestamp mode, kernel-side ID/mask filters and error frame capture, and checks the log for drops before anyone decodes it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_netdev` (string, required): Interface to capture, for example "can0".
- `link_state` (object, required): From `canb-socketcan-link-up`; must show the interface up.
- `capture_filters` (string[], optional): candump filter expressions, for example "123:7FF" (exact standard ID), "18FEF100:1FFFFFFF" (exact extended ID), "~123:7FF" (everything except 0x123). Empty means capture all.
- `capture_seconds` (integer, required): How long to record, chosen by the user for the scenario being captured.

---

## Outputs

- `candump_log` (string): Path to the candump log file (format `(seconds.micros) can0 123#DEADBEEF`), plus a header note of filters, timestamp source and frame count.

---

## Phase 1: Choose Capture Options

### Entry Criteria
- `link_state` state is ERROR-ACTIVE, ERROR-WARNING or ERROR-PASSIVE (not BUS-OFF or STOPPED).

### Actions
1. Timestamp mode, from the candump help text (`candump -h`):
   - `-l` writes a log file named `candump-YYYY-MM-DD_HHMMSS.log` in the current directory, with absolute epoch timestamps. Use this for every capture that will be decoded or replayed.
   - `-ta` absolute, `-td` delta to previous frame, `-tz` relative to start, `-tA` absolute with date, for live viewing only.
   - `-H` uses hardware timestamps when the driver provides them (see `adapter_report`). Without `-H` timestamps are taken in the kernel at receive time.
2. Filters are applied in the kernel: `candump can0,123:7FF,456:7FF` passes only 0x123 and 0x456. A match means `received_id & mask == filter_id & mask`. `~` inverts. Several filters are OR-ed unless `j` (join) is appended per the help text.
3. Error frames: add the error filter `#FFFFFFFF` to the interface spec (for example `can0,#FFFFFFFF`) together with `-e` so error frames are printed with a decoded reason.
4. Decision: if the purpose is later decoding with a DBC or replay, capture without ID filters unless the bus load would overflow the host; filtered logs cannot answer later questions.

### Output
Final candump command.

### Quality Gate
- The command includes `-l` (or `-L` redirected to a file).
- Every filter in the command appears in `capture_filters` or the command has none.

---

## Phase 2: Record

### Entry Criteria
- Command chosen.

### Actions
1. Record the interface RX counters before: `ip -s link show <can_netdev>`; note RX packets and RX dropped.
2. Run, for example: `timeout <capture_seconds> candump -l -e can0,#FFFFFFFF`. `timeout` (coreutils) ends the capture cleanly; candump closes the file on SIGTERM.
3. Do not run candump through `sudo` unless the user's account cannot open a raw CAN socket; a raw socket does not need root on most distributions.
4. Record the counters after with the same command.

### Output
Log file on disk.

### Quality Gate
- The log file exists and `wc -l <file>` is greater than 0 (or the user confirms the bus was expected to be silent).
- RX dropped did not increase during the capture.

---

## Phase 3: Validate the Log

### Entry Criteria
- Log written.

### Actions
1. Read the first and last lines: `head -n 3 <file>` and `tail -n 3 <file>`. Each line must look like `(1697040000.123456) can0 123#DEADBEEF`. CAN FD frames use `##` followed by a flags nibble, for example `123##1DEADBEEF` (flag 1 means bit rate switch).
2. Check that the timestamp span (last minus first) is close to `capture_seconds`.
3. Count frames per ID: `awk '{print $3}' <file> | cut -d'#' -f1 | sort | uniq -c | sort -rn | head`. Keep this table in the header note.
4. Count error frames: in the log format they carry the CAN_ERR_FLAG bit (`20000000` set in the ID field, eight hex digits). Record the count.
5. Replay sanity check on a virtual interface only: `canplayer -I <file> vcan0=can0` maps the recorded interface name to vcan0. Never replay onto a real vehicle bus.

### Output
`candump_log` with header note.

### Quality Gate
- Timestamp span matches `capture_seconds` to the nearest second.
- The per-ID count table is present.

---

## Worked Example

Illustrative. Input: `can_netdev`="can0", no filters, `capture_seconds`=60.

- Phase 1: command `timeout 60 candump -l -e can0,#FFFFFFFF`.
- Phase 2: file `candump-2026-10-21_101500.log`, RX dropped 0 before and after.
- Phase 3: first line `(1792577700.004211) can0 0C9#8000000000000000`; span 59.99 s; top ID 0C9 with 6000 frames; 0 error frames.

---

## Exit Criteria

DONE when `candump_log` points to a non-empty log in candump format with no RX drops, a span matching the request, and a per-ID count table.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Interface BUS-OFF or STOPPED | **Stop**: run `canb-busoff-recovery` or `canb-socketcan-link-up` first. |
| Phase 2 | `socket: Operation not permitted` | **Adjust**: rerun with sudo and record why. |
| Phase 2 | RX dropped increased | **Adjust**: add ID filters or raise the socket receive buffer with candump's `-r` option (check `candump -h`), then recapture. |
| Phase 3 | Log empty on a live bus | **Return**: check bit rate in `link_state` and termination. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
