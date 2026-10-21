# Radar Object List Decoding on CAN, Read-Only

**One-line description:** Receives an automotive radar's CAN or CAN FD output in listen-only mode with SocketCAN and can-utils, decodes the object or detection messages with cantools and the vendor DBC, and checks message cycle times, bus load and error counters.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sensor_inventory` (object[], required): From `vsens-sensor-inventory`; the radar row.
- `can_interface` (string, required): SocketCAN interface name (for example `can0`), the adapter model, and the bit rate (and data bit rate for CAN FD) from the radar manual.
- `radar_dbc` (string, required): Path to the DBC file the radar vendor supplies for this firmware.

---

## Outputs

- `radar_stream_report` (object): Message ids seen with counts and measured cycle time, decoded signal samples per message, DBC cycle time attribute per message, bus load percent, error counters before and after, and the list of ids seen but absent from the DBC.

---

## Phase 1: Open the Bus Listen-Only

### Entry Criteria
- The radar is on a bench harness or on a vehicle the user owns.
- This flow never transmits. On a vehicle bus, transmission is out of scope; any radar configuration message the manual requires is sent only on a bench harness with the radar alone on its bus, outside this flow.

### Actions
1. Bring the interface up in listen-only mode so the adapter never sends frames or acknowledgements: `sudo ip link set <if> down`, then `sudo ip link set <if> type can bitrate <rate> listen-only on`, then `sudo ip link set <if> up`. For CAN FD add `dbitrate <drate> fd on` with the rates from the radar manual.
2. Confirm: `ip -details link show <if>` must print `LISTEN-ONLY` in the ctrlmode line and the bit rate you set.
3. Read error counters: `ip -details -statistics link show <if>` and record the `berr-counter tx rx` and state (`ERROR-ACTIVE`, `ERROR-PASSIVE`, `BUS-OFF`).
4. Note: a listen-only node does not acknowledge. On a bench where the radar is the only other node, the radar sees no ACK and may retransmit or go error-passive. On a bench harness add a second normal-mode node or use the adapter's documented mode for a single-node bench, per the adapter manual.

### Output
Interface up in listen-only mode with baseline counters.

### Quality Gate
- `ip -details link show <if>` contains `LISTEN-ONLY`.
- The state reads `ERROR-ACTIVE` before capture.

---

## Phase 2: Capture and Decode

### Entry Criteria
- Interface listen-only and error-active.

### Actions
1. Capture 60 seconds with absolute timestamps: `candump -tA -L <if> > radar.log` (`-L` writes log-file format that `canplayer` and `cantools` read). Stop with Ctrl+C.
2. List DBC contents: `python3 -m cantools dump <radar_dbc>`. Record each message id, name, length and the `GenMsgCycleTime` attribute if present.
3. Decode: `candump -tA <if> | python3 -m cantools decode <radar_dbc>` for a live view, or decode the log with a short script calling `db = cantools.database.load_file(dbc)` and `db.decode_message(frame_id, data)`.
4. List ids in `radar.log` that are not in the DBC. Do not guess their meaning.
5. Check multiplexed object lists: many radars send a header message with the object count, then one message per object. Confirm the count of object messages after each header equals the header's count field.

### Output
Decoded samples and id lists.

### Quality Gate
- Every DBC message id seen in `radar.log` decodes without an exception.
- The unknown-id list is recorded (empty is a valid result).

---

## Phase 3: Timing, Load and Errors

### Entry Criteria
- Decoding works.

### Actions
1. For each id, compute intervals between consecutive frames from the `-tA` timestamps. Record median and maximum.
2. Compare the median to `GenMsgCycleTime` from the DBC. A missing attribute is recorded as "not specified".
3. Measure bus load: `canbusload <if>@<rate>` for 30 seconds and record the percent it prints.
4. Read error counters again with `ip -details -statistics link show <if>` and record any change.
5. Record what clock the timestamps represent: `candump -tA` uses host receive time from the kernel, not the radar's measurement time. If the DBC has a radar timestamp or cycle counter signal, record its name.
6. Emit `radar_stream_report`.

### Output
`radar_stream_report`.

### Quality Gate
- Every id has median and maximum interval next to its DBC cycle time or "not specified".
- Error counters before and after are both recorded.

---

## Worked Example

Illustrative only. A 77 GHz radar on `can1`, 500 kbit/s classic CAN.

```
$ sudo ip link set can1 type can bitrate 500000 listen-only on && sudo ip link set can1 up
$ ip -details link show can1 | grep -o 'LISTEN-ONLY'
LISTEN-ONLY
$ candump -tA can1 | python3 -m cantools decode radar.dbc
 (2026-10-21 10:02:11.104)  can1  60A   [4]  ...
Obj_0_Status(Obj_NofObjects: 7, Obj_MeasCounter: 1203, ...)
$ canbusload can1@500000
 can1@500000  1450  ...  37%
```
Object list header 0x60A median interval matches the DBC cycle time; 7 object messages follow each header.

---

## Exit Criteria

DONE when the bus was opened listen-only, every known message decodes, cycle times are compared with the DBC, and bus load and error counters are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `RTNETLINK answers: Operation not supported` for listen-only | **Stop**: the adapter driver lacks listen-only; do not connect it to a vehicle bus in normal mode. |
| Phase 1 | State `BUS-OFF` | **Stop**: wrong bit rate or wiring; recheck the manual and termination. |
| Phase 2 | cantools decode error for a known id | **Adjust**: DBC version does not match firmware; get the matching DBC. |
| Phase 3 | Intervals far above DBC cycle time | **Return**: to Phase 1 and check error counters and bus load. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
