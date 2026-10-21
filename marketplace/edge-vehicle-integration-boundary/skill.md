# Edge Vehicle Integration Boundary

**One-line description:** Connects an edge AI perception computer to a user-owned vehicle as a read-only, timestamped, sequence-numbered data source with time synchronization and staleness detection, and verifies on a bench that a perception fault never blocks, delays or gates braking or the emergency stop.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `health_report` (object, required): Output of `edge-health-report`.
- `vehicle_interface` (object, required): How perception output leaves the device (for example Ethernet with a named protocol, or a CAN interface name and bitrate) and what consumes it, on a vehicle the user owns.
- `test_site` (string, required): `bench` or `closed_course`. Public roads are not a valid value.

---

## Outputs

- `integration_record` (object): Interface definition (message fields, timestamps, sequence numbers), time synchronization status, read-only confirmation of vehicle network access, staleness test results, the independent emergency stop check, and the list of standards consulted by number.

---

## Phase 1: Define a Read-Only Interface

### Entry Criteria
- The vehicle is owned by the user.
- `test_site` is `bench` or `closed_course`.

### Actions
1. Define each perception message with: source timestamp (the camera frame capture time, not the publish time), publish timestamp, sequence number, `model_version` and `engine_key` from `health_report`, and a validity flag.
2. Vehicle network access defaults to read-only:
   - For SocketCAN logging use `candump -L <ifname>` (can-utils), and bring the interface up in listen-only mode where the controller supports it: `sudo ip link set <ifname> type can bitrate <bitrate> listen-only on` (check `ip -details link show <ifname>` and the controller docs for support).
   - Do not transmit on the vehicle network in this flow.
3. Do not describe, attempt or document bypassing a security gateway, immobilizer, emissions control or safety system. If a needed signal sits behind a gateway, record it as unavailable.

### Output
Interface definition with read-only access.

### Quality Gate
- `ip -details link show <ifname>` shows `LISTEN-ONLY` in the controller mode line, or the interface is not connected to the vehicle network at all.
- Every message field list includes source timestamp and sequence number.

---

## Phase 2: Time Synchronization

### Entry Criteria
- Interface defined.

### Actions
1. If the consumer is another computer, synchronize clocks. With chrony: `chronyc tracking` and record `System time` offset and `Leap status`. With PTP on Ethernet: `ptp4l -i <iface> -m` and `phc2sys` per the linuxptp docs; record the reported offset.
2. The allowed offset is a user input derived from the consumer's timing needs; record it as such.
3. Measure end-to-end age: consumer receive time minus source timestamp, over a recorded run.

### Output
Sync status and measured message age.

### Quality Gate
- `chronyc tracking` or `ptp4l` output is saved with the offset value.
- Message age statistics (median, max) come from a recorded run.

---

## Phase 3: Fault and Stop Independence Tests

### Entry Criteria
- Sync recorded.
- An independent hardware emergency stop that removes actuator power or engages braking without software in the path is installed and tested before any step here that commands motion; motion tests run only at `test_site` (`bench` or `closed_course`).

### Actions
1. Staleness test: stop the inference service (`sudo systemctl stop edge-infer`). The consumer must mark perception stale from sequence or timestamp age within its user-set limit. Record the detection time.
2. Freeze test: `kill -STOP` the inference process; confirm the same detection.
3. Brake and stop independence: with the perception computer powered off, unplugged, or frozen, press the hardware emergency stop and apply the brake pedal. Both must act with no dependency on the perception computer. Record each result.
4. Confirm by wiring review that no software on the perception computer sits in series with the brake or emergency stop circuit. Braking and emergency stop are never gated, delayed or blocked by software.
5. List standards consulted by number for engineering practice only, for example ISO 26262 (functional safety), ISO 21448 (safety of the intended functionality), ISO 13850 (emergency stop function design). This record does not claim compliance with any of them.
6. Assemble `integration_record`.

### Output
`integration_record`.

### Quality Gate
- Staleness and freeze tests each have a recorded detection time.
- Emergency stop and brake both acted with the perception computer off, recorded per test.

---

## Worked Example

Illustrative only.

`test_site` = `bench`, perception over Ethernet to a logging computer, vehicle CAN on `can0` listen-only.
```
$ ip -details link show can0
    can <LISTEN-ONLY> state ERROR-ACTIVE ... bitrate 500000
$ chronyc tracking
System time     : 0.000041210 seconds fast of NTP time
Leap status     : Normal
```
Stop test: consumer flagged stale after the configured limit. Perception computer unplugged: hardware emergency stop and brake pedal both acted.

---

## Exit Criteria

DONE when perception output is a read-only, timestamped data source, staleness is detected for stop and freeze faults, and braking and the emergency stop are shown to work with the perception computer off.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Vehicle not owned by the user, or `test_site` is a public road | **Stop**: this flow does not proceed. |
| Phase 1 | Controller lacks listen-only mode | **Adjust**: use a logger with a hardware listen-only mode, or disconnect TX per the interface docs. |
| Phase 2 | Offset above the user's limit | **Retry**: fix sync before measuring message age. |
| Phase 3 | No independent hardware emergency stop | **Stop**: no motion testing until one is installed and tested. |
| Phase 3 | Brake or emergency stop depends on the perception computer | **Stop**: redesign the wiring; never ship this state. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
