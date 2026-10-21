# CAN Log Replay Faults on vcan

**One-line description:** Captures CAN traffic read-only from a vehicle or machine the user owns with `candump -l` on a listen-only interface, makes a mutated copy of the log for each fault case (dropped frames, frozen counters, out-of-range signal values), and replays it with `canplayer` only onto a virtual `vcan0` bus where the monitor listens, never onto a physical bus.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fault_injection_plan` (object[], required): Output of `rmon-fault-injection-plan`; cases with `executor == "rmon-can-vcan-replay-test"`.
- `can_log` (string, required): Path to a `candump -l` log captured read-only, or the interface name to capture one from.
- `dbc_file` (string, optional): DBC file for the captured messages, used to decode and to encode mutated signal values with `cantools`.

---

## Outputs

- `can_replay_results` (object[]): One row per case: `case_id`, mutated log path, the `canplayer` command, `observed_verdict`, `t_inject_ns`, `t_detect_ns`, `outcome`.

---

## Phase 1: Read-Only Capture

### Entry Criteria
- The vehicle or machine is owned by the user. Capture only; nothing is transmitted.
- `can-utils` installed: `candump` and `canplayer` are on PATH.

### Actions
1. Bring the interface up in listen-only mode so the adapter never acknowledges or transmits:
   ```
   sudo ip link set can0 down
   sudo ip link set can0 type can bitrate <bitrate from the vehicle documentation> listen-only on
   sudo ip link set can0 up
   ip -details link show can0
   ```
   Confirm the output shows `LISTEN-ONLY`. Some adapters do not support it; then use an adapter that does.
2. Capture: `candump -l can0` writes `candump-<date>_<time>.log`. Stop with Ctrl+C.
3. Check content: `head candump-*.log` shows lines like `(1709564531.204512) can0 1A0#0011223344556677`.
4. Do not send frames, do not run UDS or diagnostic writes, and do not touch gateway, immobilizer, emissions or safety ECUs in any way beyond passive listening.

### Output
A read-only capture log.

### Quality Gate
- `ip -details link show can0` output contains `LISTEN-ONLY`.
- The log file has lines with timestamps and IDs: `wc -l candump-*.log` greater than 0.

---

## Phase 2: Build Mutated Logs

### Entry Criteria
- Capture log exists; the log is copied, never edited in place.

### Actions
1. Set up the virtual bus:
   ```
   sudo modprobe vcan
   sudo ip link add dev vcan0 type vcan
   sudo ip link set up vcan0
   ```
2. For each case, copy the log and apply exactly one mutation:

   | Fault model | Mutation on the copy |
   |---|---|
   | omission | delete all lines of the target ID for the case duration: `awk` on timestamp range and ID |
   | stuck-at counter | replace the alive counter nibble or byte with a constant in every line of the target ID |
   | out-of-range value | re-encode the signal with `cantools` from the DBC at the planned value, write the new data bytes |
   | delay | add the planned offset to timestamps of the target ID only |

3. With a DBC, decode to check the mutation: `python -m cantools decode <dbc_file> < mutated.log | rg <message_name>` (cantools reads candump format on stdin). Without a DBC, only omission, delay and raw counter cases are possible; record the others as blocked.

### Output
One mutated log per case.

### Quality Gate
- `diff original.log mutated.log | wc -l` is greater than 0 for every case, and only target-ID lines differ (`diff` lines all contain the target ID).
- `ip link show vcan0` shows the interface `UP`.

---

## Phase 3: Replay onto vcan Only

### Entry Criteria
- The monitor listens on `vcan0`. No physical CAN interface is up in a transmit-capable mode on this host, or the replay command maps only to `vcan0`.

### Actions
1. Replay with explicit interface mapping (the log was recorded on `can0`; map it to `vcan0`):
   ```
   canplayer -I mutated.log vcan0=can0
   ```
   The `vcan0=can0` assignment sends frames recorded on `can0` out on `vcan0`. Never write `can0=can0`.
2. Record the replay start time in the monitor clock, then read the monitor event log for the first `stale` or `fail` record of the target check after the mutation time.
3. Run the unmodified log too; it is the `must_not_trip` baseline for this capture.

### Output
`can_replay_results`.

### Quality Gate
- Every `canplayer` command in the results contains `vcan` on the left side of `=`: `rg -n "canplayer" can_replay_results.json | rg -v "vcan[0-9]+="` returns nothing.
- The unmodified log replay produced zero trips, or each trip is listed as a false trip.

---

## Worked Example

Illustrative only.
```
$ ip -details link show can0 | rg -o "LISTEN-ONLY"
LISTEN-ONLY
$ candump -l can0
Disabled standard output while logging.
Enabling Logfile 'candump-2026-03-04_150301.log'
$ canplayer -I fi040_omission.log vcan0=can0
$ jq -c 'select(.check_id=="AGE-wheel_speed" and .verdict=="stale")' events.jsonl | head -1
{"t_mono_ns":77120443100,"event":"trip","check_id":"AGE-wheel_speed","verdict":"stale",...}
```

---

## Exit Criteria

DONE when the capture was listen-only, each case replayed a single-mutation copy onto vcan only, verdicts were read from the monitor log, and the unmodified baseline replay was run.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Adapter does not support listen-only | **Stop**: use an adapter that does; do not capture in normal mode on a vehicle. |
| Phase 1 | Bitrate unknown | **Return**: to the vehicle documentation; wrong bitrate produces error frames. |
| Phase 2 | No DBC for a value-mutation case | **Adjust**: mark the case blocked; do not guess signal layouts. |
| Phase 3 | Replay command targets a physical interface | **Stop**: correct the mapping to `vcanN=can0` before running. |

**Do not:** transmit on a vehicle bus, edit the original capture, or describe any way to bypass gateways, immobilizers, emissions or safety systems.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
