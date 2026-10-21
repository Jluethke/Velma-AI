# UDS ClearDiagnosticInformation 0x14

**One-line description:** Clears DTCs with UDS service 0x14 (or OBD-II service 0x04) only after the user confirms, after the full fault list, snapshots and readiness status are saved, and verifies the result with a fresh read.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `decoded_dtcs` (object[], required): From `uds-dtc-status-decode`. Saved before clearing.
- `request_guard` (object, required): From `uds-readonly-request-guard`.
- `clear_confirmed` (boolean, required): True only after the user has read the consequences in Phase 1 and agreed.

---

## Outputs

- `clear_result` (object): The group cleared, request and response hex, the saved pre-clear record path, and the post-clear DTC read.

---

## Phase 1: Save and Explain

### Entry Criteria
- `decoded_dtcs` exists.

### Actions
1. Save `decoded_dtcs`, all snapshot and extended data hex, and the OBD service 0x01 PID 0x01 readiness bytes to a timestamped JSON file. Clearing erases them in the ECU.
2. Tell the user, in these words: clearing resets readiness monitors to "not complete" and erases freeze-frame data; an emissions inspection may fail until drive cycles complete; permanent DTCs (OBD service 0x0A) are not erased by a scan tool clear; a fault that is still present will return.
3. Do not clear to hide a fault before a sale or an inspection.
4. Proceed only if `clear_confirmed` is true after this explanation.

### Output
Saved record and confirmation.

### Quality Gate
- The JSON file exists and contains every row of `decoded_dtcs`.
- `clear_confirmed` is true.

---

## Phase 2: Clear

### Entry Criteria
- Phase 1 passed. Engine off, ignition on (many ECUs refuse with engine running; NRC 0x22).

### Actions
1. Pick the group (ISO 14229-1 groupOfDTC, 3 bytes):

| Group | Meaning |
|---|---|
| `FF FF FF` | All groups |
| `FF FF 33` | Emissions-related systems |
| one 3-byte DTC | A single DTC, if the ECU supports it |

2. Send `14 <group>` physically to the ECU through the guarded send with `clear_confirmed` true. Positive response is `54`.
3. For OBD-II only vehicles, the equivalent is service `04`, positive response `44`, sent to 7DF.
4. On `7F 14 22`, stop and report; do not retry with engine state changes on the road.

### Output
Clear response.

### Quality Gate
- Response is `54` (or `44`), quoted in `clear_result`.

---

## Phase 3: Verify

### Entry Criteria
- Positive response received.

### Actions
1. Run `uds-read-dtc-0x19` (`19 02 FF`) and `uds-obd2-mode03-dtcs` again.
2. Expected: confirmed DTCs gone; codes whose fault is still present may return as pending or active within the operation cycle.
3. Record the post-clear list in `clear_result`.

### Output
`clear_result`.

### Quality Gate
- Post-clear read is attached; any returning DTC is listed with its status byte.

---

## Worked Example

Illustrative only.

```
saved: dtc_preclear_2026-10-21T10-42-05.json (2 DTCs, readiness 07 65 04)
tx 14 FF FF FF -> rx 54
tx 19 02 FF    -> rx 59 02 7F          no DTCs
```

---

## Exit Criteria

DONE when the pre-clear record is saved, the clear returns a positive response, and a fresh read is attached.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `clear_confirmed` false | **Stop**: do not clear. |
| Phase 2 | `7F 14 22` | **Return**: report the condition (engine running, speed); do not force it. |
| Phase 2 | `7F 14 31` | **Adjust**: the group is not supported; use `FF FF FF`. |
| Phase 3 | DTC returns at once | **Return**: the fault is present; report it as active. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
