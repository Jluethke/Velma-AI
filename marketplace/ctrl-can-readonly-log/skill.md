# Read-Only CAN Drive Log With SocketCAN

**One-line description:** Records speed, steering angle, yaw rate and pedal signals from a vehicle the user owns using a SocketCAN interface in listen-only mode, decodes them with the user's DBC file through python-can and cantools, and writes a time-stamped `drive_log` for model fitting.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `control_spec` (object, required): From `ctrl-spec-intake`; provides the vehicle and the signals needed.
- `can_interface` (object, required): Linux SocketCAN interface name (for example `can0`), the adapter model, and the bus bitrate the user has confirmed from vehicle documentation.
- `dbc_file` (string, required): Path to a DBC file the user is entitled to use that defines the signals to decode.

---

## Outputs

- `drive_log` (object): Paths to the raw candump log and the decoded CSV (columns `t`, `speed_mps`, `road_wheel_angle_rad` or `handwheel_angle_rad`, `yaw_rate_rps`, `accel_pedal`, `brake_pedal`, `long_accel_mps2` when present), plus a manifest of which DBC signals mapped to each column and the drive description.

---

## Phase 1: Bring Up The Interface In Listen-Only Mode

### Entry Criteria
- The user confirms they own the vehicle.
- The adapter connects to a diagnostic or bus port without cutting or splicing any wire.

### Actions
1. Check the interface exists: `ip link show can0`.
2. Configure it listen-only so the adapter never transmits, not even ACK bits: `sudo ip link set can0 down`, then `sudo ip link set can0 type can bitrate <bitrate> listen-only on`, then `sudo ip link set can0 up`. Use the bitrate from `can_interface`; do not guess it.
3. Confirm the mode: `ip -details -statistics link show can0`. The output must contain `LISTEN-ONLY` in the `ctrlmode` field and `state ERROR-ACTIVE` once traffic flows.
4. Do NOT run `cansend`, `cangen`, or any UDS or diagnostic request tool in this flow. Do NOT connect to, probe, or attempt to pass any security gateway. If the signals are not visible on the accessible bus, stop and report; do not look for a way around the gateway.

### Output
Interface up in listen-only mode.

### Quality Gate
- `ip -details link show can0` prints `LISTEN-ONLY`.
- `ip -statistics link show can0` TX packets counter does not increase during a 60 s idle capture (read it before and after).

---

## Phase 2: Capture

### Entry Criteria
- Listen-only confirmed.

### Actions
1. Start logging in candump log format with absolute timestamps: `candump -L can0 > drive_$(date +%Y%m%d_%H%M%S).log`. `-L` writes `(timestamp) can0 ID#DATA` lines that python-can reads.
2. The vehicle is driven by a human driver with normal controls. Record the drive description: straight constant speed, gentle accelerations, coasting, constant-radius turns at several speeds, braking to stop. The logger does not command anything.
3. Stop with Ctrl+C. Check the file is not empty: `wc -l drive_*.log`.
4. Check bus errors: `ip -statistics link show can0` and record the `RX errors` count.

### Output
Raw candump log file.

### Quality Gate
- Log line count is greater than zero and the first and last timestamps span the drive duration.
- TX packet counter unchanged from Phase 1.

---

## Phase 3: Decode

### Entry Criteria
- Raw log exists and `dbc_file` loads.

### Actions
1. Load the DBC: `db = cantools.database.load_file(dbc_file)`. List messages with `for m in db.messages: print(hex(m.frame_id), m.name, [s.name for s in m.signals])`.
2. Read frames: `for msg in can.LogReader(path): ...`. For each frame whose `arbitration_id` is in the DBC, call `db.decode_message(msg.arbitration_id, msg.data)`. Wrap in try/except and count decode failures per ID.
3. Map DBC signal names to the output columns and record the mapping and the DBC unit for each. Convert to SI (km/h to m/s, deg to rad, deg/s to rad/s).
4. Resample onto a uniform time base with `numpy.interp` at the controller period from `control_spec`, keeping the raw per-signal timestamps in a second file. Do not interpolate across gaps longer than the signal's own nominal period times the gap factor the user chooses; mark those rows invalid.
5. Write `drive_log.csv` and `drive_log_manifest.json`.

### Output
`drive_log`.

### Quality Gate
- Decode failure count per ID is reported; any ID with all frames failing is listed as a DBC mismatch.
- `python -c "import numpy as np; d=np.genfromtxt('drive_log.csv', delimiter=',', names=True); print(d['speed_mps'].min(), d['speed_mps'].max())"` shows speed values within 0 and the vehicle's plausible range stated by the user, with no unit left in km/h (compare against the dashboard reading noted during the drive).

---

## Worked Example

Illustrative only. `can0` at the bitrate the user's service documentation states.

- Phase 1: `ip -details link show can0` prints `can <LISTEN-ONLY> state ERROR-ACTIVE`.
- Phase 2: 14 min drive, `wc -l` gives 4.1 million lines; TX packets stayed at 0.
- Phase 3: 6 DBC messages decode; `VEHICLE_SPEED` in km/h converted to m/s; steering signal is handwheel angle in degrees, so the column is `handwheel_angle_rad` and the steering ratio from `control_spec` is applied later by `ctrl-model-fit-from-logs`.

---

## Exit Criteria

DONE when a decoded, SI-unit `drive_log` exists with its signal mapping manifest and the capture is proven transmit-free.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `listen-only` rejected by the adapter driver | **Stop**: use an adapter whose driver supports listen-only; do not capture in normal mode. |
| Phase 1 | Signals sit behind a security gateway | **Stop**: report the signals as unavailable; never attempt access through the gateway. |
| Phase 2 | Bus-off or many RX errors | **Adjust**: recheck the bitrate from documentation and wiring; recapture. |
| Phase 3 | DBC IDs do not match traffic | **Return**: ask the user for the correct DBC for this vehicle. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
