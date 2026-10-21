# Python CAN Log Replay into Software Under Test

**One-line description:** Replays a recorded candump log onto a virtual CAN bus (SocketCAN vcan or python-can's virtual interface) with original timing, decodes it with a DBC through cantools, and checks that the software under test receives and decodes every expected message, all without touching a physical vehicle bus.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_log_file` (string, required): Log recorded read-only with `candump -L` (or `-l`) on a vehicle the user owns, or on a bench.
- `dbc_file` (string, required): DBC describing the messages in the log, from the vehicle documentation or the user's own reverse-engineered notes.
- `sut_entrypoint` (string, required): Command that starts the software under test, taking the CAN channel and interface as arguments.

---

## Outputs

- `can_replay_report` (object): Log duration and frame count, per-ID counts sent, per-ID counts the software reported decoding, decode errors from cantools, timing error of replay versus log, and a verdict.

---

## Phase 1: Prepare a Virtual Bus Only

### Entry Criteria
- The replay target is virtual. Replaying a log onto a physical vehicle bus is out of scope for this flow and must not be done.

### Actions
1. Linux SocketCAN: `sudo modprobe vcan`, `sudo ip link add dev vcan0 type vcan`, `sudo ip link set up vcan0`. Confirm with `ip -details link show vcan0` (shows `vcan`).
2. Windows or no SocketCAN: use python-can's `virtual` interface: `can.Bus(interface='virtual', channel='sil')` in both the replayer and the software under test, in the same process or via the documented `udp_multicast` interface for separate processes (check the python-can docs for your version).
3. Install tools: `pip install python-can cantools`; on Linux also `sudo apt install can-utils`.
4. Inspect the log: `head -3 <can_log_file>`. The `-L` format is `(1712933100.123456) can0 1A0#0011223344556677`. Record the source interface name.

### Output
A virtual bus and an inspected log.

### Quality Gate
- `ip -details link show vcan0` shows type vcan, or the python-can virtual channel name is recorded.
- No command in this flow names a physical interface (`can0`, `pcan`, `kvaser`) as a send target.

---

## Phase 2: Decode Check Before Replay

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Decode the log with the DBC: `python -m cantools decode <dbc_file> < <can_log_file> > decoded.txt` (cantools reads candump text; confirm with `python -m cantools decode --help`).
2. Count undecoded IDs: IDs present in the log but not in the DBC appear without signal names. List them; they are either out of scope or missing DBC entries.
3. Check DBC parse warnings: `python -c "import cantools; db=cantools.database.load_file('<dbc_file>', strict=True); print(len(db.messages))"`. `strict=True` raises on overlapping signals or signals beyond the frame length.

### Output
Decoded log and list of unknown IDs.

### Quality Gate
- `load_file(..., strict=True)` succeeds.
- Unknown-ID list is written, even if empty.

---

## Phase 3: Replay and Compare

### Entry Criteria
- Phase 2 gate passed; software started on the virtual channel with `sut_entrypoint`.

### Actions
1. SocketCAN: `canplayer -I <can_log_file> vcan0=can0` maps the logged interface `can0` to `vcan0` and keeps original timing. Check `canplayer -h` for options such as loop count.
2. python-can alternative:
```python
import can
with can.Bus(interface='socketcan', channel='vcan0') as bus:
    for msg in can.MessageSync(can.LogReader('drive.log'), timestamps=True):
        bus.send(msg)
```
   `MessageSync` with `timestamps=True` waits to reproduce the log's spacing.
3. In parallel record what was sent: `candump -L vcan0 > replayed.log`.
4. Compare timing: per ID, the mean and max difference between log inter-arrival times and replayed inter-arrival times. Report them; do not invent a pass limit. If the software has a documented receive timeout per message, compare against that.
5. Compare counts: per ID, frames in log, frames in `replayed.log`, and frames the software reports decoding (from its log or a counter topic).

### Output
`can_replay_report`.

### Quality Gate
- Per-ID frame counts in `replayed.log` equal the log's counts.
- The software's decoded count is reported for every ID it subscribes to.

---

## Worked Example

Illustrative.
```
$ head -2 drive.log
(1712933100.123456) can0 1A0#0011223344556677
(1712933100.124010) can0 3E9#0000FA00
$ python -m cantools decode my.dbc < drive.log | head -2
(1712933100.123456) can0 1A0#0011223344556677 ::
WheelSpeeds(FL: 12.3 km/h, FR: 12.3 km/h, ...)
$ canplayer -I drive.log vcan0=can0
```
Report: 41 210 frames, 38 IDs, 2 unknown IDs (0x7DF, 0x7E8 diagnostic), all counts match, mean inter-arrival error 0.04 ms, max 0.9 ms; software decoded all 36 subscribed IDs.

---

## Exit Criteria

DONE when the log has been replayed on a virtual bus only, frame counts match, timing error is reported, and the software's per-ID decode counts are listed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Request to replay onto a vehicle bus | **Stop**: out of scope; this flow is SIL on a virtual bus. |
| Phase 2 | DBC strict load fails | **Adjust**: fix the reported signal overlap or length in the DBC. |
| Phase 3 | `canplayer` sends nothing | **Adjust**: the interface mapping must name the log's interface on the right side. |
| Phase 3 | Software decodes fewer frames than sent | **Return**: report per ID; check its CAN filters and receive buffer. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
