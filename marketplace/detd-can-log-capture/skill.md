# Read-Only CAN Log Capture for Replay

**One-line description:** Captures CAN traffic from a vehicle the user owns in listen-only mode with SocketCAN `candump -L`, decodes it with `cantools` and a DBC file, and replays logs only into a virtual `vcan0` interface or directly into the replay harness with `python-can`'s `LogReader`, never onto a physical vehicle bus.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `can_interface` (object, required): Linux interface name (for example `can0`), the bus bitrate taken from the vehicle or adapter documentation, and the DBC file path.
- `record_schema` (object, required): Output of `detd-boundary-record-schema`.

---

## Outputs

- `can_log_procedure` (object): The exact capture, decode and replay commands with the safety rules.
- `sample_recording` (string): Path to a candump log converted into boundary records.

---

## Phase 1: Listen-Only Capture

### Entry Criteria
- The vehicle is owned by the user. Work is read-only: logging and decoding only.
- The adapter is a SocketCAN device on Linux (`ip link show` lists it).
- Bitrate is known from documentation; do not guess it. A wrong bitrate on an active interface causes error frames on the bus.
- No step in this flow transmits on the vehicle bus, bypasses a security gateway or alters any vehicle module.

### Actions
1. Configure listen-only so the adapter never sends frames or acknowledgements: `sudo ip link set can0 down`, `sudo ip link set can0 type can bitrate <bitrate> listen-only on`, `sudo ip link set can0 up`.
2. Confirm: `ip -details link show can0` prints `LISTEN-ONLY` in the ctrlmode line.
3. Capture with absolute timestamps in log format: `candump -L can0 > drive_001.log` (or `candump -l can0`, which writes `candump-<date>_<time>.log` in the current directory). Each line looks like `(1729500000.123456) can0 0C9#8000000000000000`.
4. If the adapter supports hardware timestamps, `candump -H` uses them; record which timestamp source was used.
5. Stop with Ctrl-C. Check the bus error counters: `ip -details -statistics link show can0`.

### Output
Raw candump log.

### Quality Gate
- `ip -details link show can0` showed `LISTEN-ONLY` before capture (save the output).
- The log has a non-zero line count (`wc -l drive_001.log`).

---

## Phase 2: Decode and Convert

### Entry Criteria
- Log exists and a DBC file for the relevant messages is available.

### Actions
1. Spot-check decoding: `cat drive_001.log | python3 -m cantools decode vehicle.dbc | head -n 40`. Confirm signal values are physically plausible (for example speed is zero while parked).
2. Convert to boundary records: read with `python-can`: `for msg in can.LogReader("drive_001.log"):` gives `msg.timestamp`, `msg.arbitration_id`, `msg.data`. Store the raw `data` bytes as payload, `arbitration_id` mapped to `source_id` by a fixed table, a per-id counter as `source_seq`, and the timestamp converted to integer nanoseconds as `recv_ns`.
3. Keep the raw `.log` file next to the converted record; the converter is code that can have bugs.

### Output
`sample_recording` in boundary record format.

### Quality Gate
- Number of frames in the converted record equals `wc -l` of the log (minus comment lines).
- Spot-checked signals match plausibility notes recorded in `can_log_procedure`.

---

## Phase 3: Replay Only Into Virtual Buses or the Harness

### Entry Criteria
- Converted record exists.

### Actions
1. Preferred: feed the converted record to the replay harness; timing comes from recorded `recv_ns`, so results are repeatable.
2. For tools that need a live interface, create a virtual bus: `sudo modprobe vcan`, `sudo ip link add dev vcan0 type vcan`, `sudo ip link set up vcan0`, then `canplayer -I drive_001.log vcan0=can0` (maps the logged `can0` frames onto `vcan0`).
3. Never run `canplayer` or `cansend` with a physical vehicle interface as the target. Record this rule in `can_log_procedure`.

### Output
`can_log_procedure`.

### Quality Gate
- `can_log_procedure` contains no command that names a physical interface as a transmit target (`rg -n 'canplayer|cansend' procedure.md` shows only `vcan` targets).

---

## Worked Example

Illustrative only. `ip -details link show can0` prints `can <LISTEN-ONLY> state ERROR-ACTIVE ... bitrate 500000`. `candump -L can0 > drive_001.log` for a parked idle run; `wc -l` prints 182340. `cantools decode` shows `VehicleSpeed: 0.0 km/h`. Converter writes 182340 frames into `drive_001.jsonl`.

---

## Exit Criteria

DONE when a listen-only capture exists, it converts into boundary records with matching frame counts, and replay is confined to the harness or `vcan`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Adapter does not support listen-only | **Stop**: use an adapter that does; do not capture with an acknowledging interface on a vehicle bus. |
| Phase 1 | Bitrate unknown | **Stop**: get it from documentation; do not try rates on the live bus. |
| Phase 2 | No DBC for a message | **Adjust**: keep raw bytes; mark signals undecoded; do not invent scalings. |
| Phase 3 | A tool requires a physical interface | **Return**: report it; use `vcan` or a bench-only isolated bus per `detd-bench-hil-replay`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
