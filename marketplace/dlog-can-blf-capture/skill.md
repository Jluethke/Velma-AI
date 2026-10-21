# Read-Only CAN Capture to BLF

**One-line description:** Captures a vehicle CAN bus read-only, with the SocketCAN interface in listen-only mode, to Vector BLF using python-can (`can.logger` or `can.BLFWriter`) or to candump log files with can-utils, and monitors socket and controller drop counters during the capture.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_interface` (string, required): SocketCAN interface name, for example `can0`.
- `can_bitrate` (integer, required): Bus bitrate in bit/s from the vehicle's documentation or a measured value. Never guess; a wrong bitrate produces error frames.
- `storage_budget` (object, required): From `dlog-storage-budget`; rotation size or duration.

---

## Outputs

- `can_capture_command` (object): Interface setup commands, the capture command, python-can and can-utils versions, rotation settings, and the counters read before and after a test capture.

---

## Phase 1: Bring Up Listen-Only

### Entry Criteria
- The vehicle is owned by the user.
- The adapter connects to a diagnostic or bus tap the user is entitled to read. This flow never transmits and never passes through or alters a security gateway.

### Actions
1. `sudo ip link set <can_interface> down`.
2. `sudo ip link set <can_interface> type can bitrate <can_bitrate> listen-only on`.
3. `sudo ip link set <can_interface> up`.
4. `ip -details -statistics link show <can_interface>` and confirm the line `<LISTEN-ONLY>` in the ctrlmode list and `state ERROR-ACTIVE`. Record the RX and error counters as the baseline.
5. Listen-only means the controller does not send ACK bits or error frames. Do NOT run `cansend`, `cangen` or any transmit tool on a vehicle bus.

### Output
Interface up in listen-only.

### Quality Gate
- `ip -details link show` output contains `LISTEN-ONLY`.
- A 10-frame read with `candump -n 10 <can_interface>` returns frames.

---

## Phase 2: Choose Capture Tool

### Entry Criteria
- Frames are received.

### Actions
1. Pick by consumer:

| Consumer | Tool | Command |
|---|---|---|
| Vector CANalyzer or CANoe | python-can logger to BLF | `python -m can.logger -i socketcan -c <can_interface> -f drive.blf` |
| Linux tooling, replay with canplayer | can-utils candump | `candump -l -t A <can_interface>` (writes `candump-<date>.log`) |
| Same MCAP as other sensors | MCAP writer flows | raw frames in a channel, see `dlog-py-mcap-writer` |

2. In python-can 4.x the console script may be `can_logger`; check `python -m can.logger --help` for size-based rotation options (the `SizedRotatingLogger`) and set them from `storage_budget`.
3. For a custom script: `with can.Bus(interface="socketcan", channel="<can_interface>") as bus, can.BLFWriter("drive.blf") as w: for msg in bus: w.on_message_received(msg)`. Always close the writer; BLF object counts are finalized on close.
4. Add `-d` to candump runs (`candump -d -l ...`) to print a message when the socket drops frames.

### Output
Capture command.

### Quality Gate
- The command's options all appear in the installed tool's `--help`.

---

## Phase 3: Test Capture and Drop Check

### Entry Criteria
- Command chosen.

### Actions
1. Capture for a fixed window with the vehicle running.
2. Read counters again with `ip -details -statistics link show <can_interface>`. Compare `RX: dropped`, `overrun`, `bus-errors`, `error-warn`, `error-pass`, `bus-off` with the baseline.
3. Count frames in the file: BLF with `python -c "import can; print(sum(1 for _ in can.BLFReader('drive.blf')))"`; candump log with `wc -l`.
4. Compare with expected frames from `canbusload` or the frame rate in `measured_rates`.
5. Bring the interface back to normal only if the user needs it: listen-only stays the default for logging.

### Output
`can_capture_command`.

### Quality Gate
- `dropped` and `overrun` deltas are recorded as numbers (zero or not).
- File frame count is reported next to the expected count.

---

## Worked Example

Illustrative. `can0`, bitrate 500000 from the service documentation.
```
$ sudo ip link set can0 type can bitrate 500000 listen-only on && sudo ip link set can0 up
$ ip -details -statistics link show can0 | grep -E "LISTEN|state|dropped"
    can <LISTEN-ONLY> state ERROR-ACTIVE (berr-counter tx 0 rx 0) restart-ms 0
    RX: bytes  packets  errors  dropped  missed  mcast
$ python -m can.logger -i socketcan -c can0 -f drive.blf
$ python -c "import can; print(sum(1 for _ in can.BLFReader('drive.blf')))"
198214
```
Window 90 s, expected about 2,214 frames/s x 90 s = 199,260; difference 1,046 frames investigated in `dlog-drop-audit`.

---

## Exit Criteria

DONE when the bus is captured in listen-only mode, the file is readable, and drop counters are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `RTNETLINK answers: Operation not supported` for listen-only | **Stop**: the adapter driver lacks listen-only; use an adapter that supports it rather than an active node on a vehicle bus. |
| Phase 1 | Error counters rise and no frames arrive | **Stop**: the bitrate is wrong; confirm it from documentation. |
| Phase 3 | Socket drops reported by `candump -d` | **Adjust**: raise the socket receive buffer (python-can and candump options; check `--help`), reduce other CPU load, retest. |
| Phase 3 | BLF unreadable | **Retry**: the writer was not closed; fix shutdown and recapture. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
