# UDS RoutineControl 0x31

**One-line description:** Runs UDS service 0x31 (start 0x01, stop 0x02, request results 0x03) only for a routine the OEM documents, defaulting to reading results, denying the ISO 14229-1 safety system and erase-memory routine IDs, and allowing any actuating routine only on a bench or closed course behind an independent hardware emergency stop.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `request_guard` (object, required): From `uds-readonly-request-guard`.
- `routine_id` (string, required): 2-byte routine identifier in hex.
- `routine_doc` (string, optional): Path or citation of the OEM document that defines the routine, its option record, its result record and whether it moves anything. Without it, only subfunction 0x03 may be sent.
- `bench_estop_confirmed` (boolean, required): True only when an actuating routine will run with the ECU on a bench or the vehicle on a closed course, behind an independent hardware emergency stop that the user has tested.

---

## Outputs

- `routine_result` (object): Routine ID, subfunction used, request and response hex, routineInfo and status record (raw and decoded from the OEM document), and the safety classification.

---

## Phase 1: Classify the Routine

### Entry Criteria
- `routine_id` present.

### Actions
1. Deny without further steps:

| Routine ID | Reason |
|---|---|
| 0xE200 to 0xE2FF | ISO 14229-1 safety system routines (for example pyrotechnic deployment) |
| 0xFF00 | eraseMemory (reprogramming) |
| 0xFF01 | checkProgrammingDependencies (reprogramming sequence) |
| anything needing 0x27 first | Security access is out of scope |

2. With `routine_doc`, classify as:

| Class | Example | Allowed where |
|---|---|---|
| Non-actuating | self-test that only reads sensors, result read-out | Vehicle, parked |
| Actuating | moves a valve, motor, pump, throttle, steering, brake or lamp | Bench or closed course with hardware emergency stop only |

3. Without `routine_doc`, the only allowed request is `31 03 <rid>` (requestRoutineResults).

### Output
Classification.

### Quality Gate
- Classification cites a section of `routine_doc`, or is "undocumented: results only".

---

## Phase 2: Run

### Entry Criteria
- Not denied in Phase 1.
- For an actuating routine: `bench_estop_confirmed` is true, the vehicle or ECU is on a bench or a closed course, nobody is near moving parts, and the independent hardware emergency stop has been tested to cut power to the actuator. The emergency stop and any braking path are never routed through this software and are never delayed or blocked by it.

### Actions
1. Enter extended session if the document requires it (`uds-session-control-0x10`) and keep it alive (`uds-tester-present-0x3e`).
2. Start: `31 01 <rid> <optionRecord>`. Positive response: `71 01 <rid> <routineInfo/statusRecord>`.
3. Poll results: `31 03 <rid>` until the documented "finished" status. Use `p2_timing`; on NRC 0x78 wait up to P2*.
4. Stop when the document requires it: `31 02 <rid>`.
5. Do not change the option record from the documented values.

### Output
Responses.

### Quality Gate
- Every response echoes `rid`.
- The final result record is decoded with a cited field layout from `routine_doc`, or kept raw.

---

## Worked Example

Illustrative only.

Undocumented routine 0x0203:
```
tx 31 03 02 03 -> rx 7F 31 24   requestSequenceError: routine never started; nothing more is sent
```
Documented non-actuating self-test 0x0210 on a parked vehicle:
```
tx 31 01 02 10 -> rx 71 01 02 10 00
tx 31 03 02 10 -> rx 71 03 02 10 02 00   status 02 = finished, 00 = no fault (per routine_doc table 4)
```

---

## Exit Criteria

DONE when the routine is either denied with a reason, or run within its class limits with a decoded or raw result.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Routine ID in a denied range | **Stop**: never send it. |
| Phase 1 | Actuating routine and `bench_estop_confirmed` false | **Stop**: run only on a bench or closed course with a hardware emergency stop. |
| Phase 2 | `7F 31 33` | **Stop**: needs security access; out of scope. |
| Phase 2 | `7F 31 22` | **Return**: report the conditions; do not alter vehicle state to meet them. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
