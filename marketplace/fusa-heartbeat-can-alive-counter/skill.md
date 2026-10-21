# CAN Heartbeat with Alive Counter, CRC and Timeout Monitoring

**One-line description:** Specifies and verifies end-to-end protection for a safety-relevant CAN frame between the project's own nodes (a rolling alive counter, a CRC over the payload and data id, and a receive timeout, in the style of the AUTOSAR E2E profiles), then checks period, counter and CRC on a captured log with SocketCAN `candump` in listen-only mode and `cantools`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `safety_requirements` (object[], required): Output of `fusa-requirements-decomposition`; supplies the timeout budget per frame.
- `can_interface` (string, required): SocketCAN interface name, for example `can0`, on a bus the user owns (the project's own drive-by-wire bus or a bench harness).
- `dbc_file` (string, optional): Path to the DBC that describes the frames. Without it, Phase 1 writes one for the project's own frames.

---

## Outputs

- `heartbeat_monitor` (object): `stack` (`can`), `frames` (id, period, counter bits and position, CRC polynomial and position, data id, timeout), `log_file`, `log_checks` (period max, counter errors, CRC errors), `receiver_code_locations`, `test_results`.

---

## Phase 1: Specify the Protection

### Entry Criteria
- The frames to protect are sent and received by the project's own nodes. This flow never alters or injects frames on a production vehicle network, and never touches gateways, immobilizers, emissions or factory safety systems.
- A TSR names each frame and its budget.

### Actions
1. For each frame, define: a 4-bit alive counter (0 to 15, incremented by one per transmission, wrapping to 0), a CRC-8 byte, a data id that is included in the CRC but not transmitted (so a frame copied to another id fails), and a receive timeout from the TSR budget.
2. Pick the CRC from a published definition and write its parameters: for example the SAE J1850 CRC-8 (polynomial 0x1D) used by AUTOSAR E2E Profile 1 and 2; copy initial value and final XOR from the AUTOSAR CRC library specification for the chosen profile. Do not invent a polynomial.
3. Write or extend the DBC with signals for the counter and CRC, for example `SG_ AliveCounter : 8|4@1+ (1,0) [0|15] "" STEER_ECU` and `SG_ Crc8 : 0|8@1+ (1,0) [0|255] "" STEER_ECU`. Validate with `python3 -m cantools dump <dbc_file>`.
4. Write the receiver rules: accept only if CRC matches, counter equals previous + 1 modulo 16 (allow a configured maximum delta only if the TSR permits lost frames), and the frame arrived within the timeout. On any failure: count it, and on the condition the TSR defines (for example one timeout), drop the software stop request relay.

### Output
Frame protection specification and DBC.

### Quality Gate
- `python3 -m cantools dump <dbc_file>` exits 0 and lists the counter and CRC signals for every protected frame.
- Every frame has a CRC definition with polynomial, initial value and final XOR cited to a published specification.

---

## Phase 2: Capture and Check a Log (Read-Only)

### Entry Criteria
- Phase 1 gate passed.
- The interface is configured listen-only so the capture node cannot acknowledge or send: `sudo ip link set <can_interface> down`, `sudo ip link set <can_interface> type can bitrate <bus bitrate> listen-only on`, `sudo ip link set <can_interface> up`. The bitrate comes from the bus design, not a guess.

### Actions
1. Confirm mode: `ip -details link show <can_interface>` shows `LISTEN-ONLY` in the ctrlmode line.
2. Capture with absolute timestamps for a run of normal operation: `candump -l <can_interface>` (writes `candump-<date>.log`), or filter one id: `candump -ta <can_interface>,210:7FF`.
3. Decode: `python3 -m cantools decode <dbc_file> < candump-<date>.log` (check `python3 -m cantools decode --help` for the input format your version accepts).
4. Check period: compute inter-arrival times per id from the timestamps and record the maximum. Check counter: count transitions where the new counter is not previous + 1 modulo 16. Check CRC: recompute with the Phase 1 parameters and count mismatches.

### Output
`log_checks` with max period, counter errors and CRC errors per frame.

### Quality Gate
- `ip -details link show <can_interface>` output contains `LISTEN-ONLY`.
- The log file exists and is non-empty (`wc -l` greater than 0).
- Max inter-arrival time per frame is below its timeout; counter and CRC error counts are reported as numbers.

---

## Phase 3: Verify Receiver Reaction on an Isolated Bench Bus

### Entry Criteria
- Phase 2 gate passed.
- Bench only: the receiver ECU on an isolated bench bus with its own termination, not connected to any vehicle; actuator power behind the independent hardware emergency stop.

### Actions
1. Bring a separate bench interface up in normal mode on the isolated bus.
2. Timeout test: stop the sender (power it off or halt it) and measure from the last frame to relay drop.
3. Counter test: from the bench interface, send frames with a repeated counter using `cansend <bench_if> 210#<payload>` built with a valid CRC but a stale counter. Expected: rejection and reaction per the TSR.
4. CRC test: send a frame with one CRC bit flipped. Expected: rejection.
5. Locate the receiver code for each check (`rg -n "AliveCounter|crc8|timeout" <receiver source>`) and record file:line.

### Output
`heartbeat_monitor` with test results and code locations.

### Quality Gate
- Each test has an observed reaction and a measured time.
- `receiver_code_locations` contains a file:line for timeout, counter and CRC checks.

---

## Worked Example

Illustrative only. Frame 0x210 at 10 ms period on the project's 500 kbit/s drive-by-wire bus; TSR timeout 50 ms.

```
$ ip -details link show can0 | grep -o "LISTEN-ONLY"
LISTEN-ONLY
$ candump -ta can0,210:7FF | head -3
 (1760000000.101233)  can0  210   [8]  3A 01 F4 00 00 00 00 00
 (1760000000.111251)  can0  210   [8]  C7 02 F4 00 00 00 00 00
 (1760000000.121240)  can0  210   [8]  5E 03 F4 00 00 00 00 00
```
Byte 0 is the CRC, low nibble of byte 1 the counter (1, 2, 3). Max inter-arrival over 60 s: 10.9 ms; counter errors 0; CRC errors 0. Bench timeout test: relay drop 54 ms after the last frame, exceeding 50 ms; recorded as a failure and returned to firmware.

---

## Exit Criteria

DONE when every protected frame has a published-spec CRC, counter and timeout, a read-only log shows period and integrity, and the receiver's reactions are proven on an isolated bench bus with code locations recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Frame belongs to the base vehicle's factory network | **Stop**: protect only the project's own frames; log factory frames read-only at most. |
| Phase 2 | `listen-only` not supported by the adapter | **Adjust**: use an adapter that supports it, or capture from the project's own bus only. |
| Phase 2 | CRC mismatches on every frame | **Adjust**: recheck byte order, data id and initial value against the spec before blaming the sender. |
| Phase 3 | Receiver accepts a stale counter | **Stop**: firmware defect; return to the requirement owner. |

**Do not:** transmit on a vehicle's factory network, choose a CRC polynomial without a source, or count a frame as valid when only the timeout passes.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
