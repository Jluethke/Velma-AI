# UDS DiagnosticSessionControl 0x10

**One-line description:** Enters the UDS default (0x01) or extended (0x03) diagnostic session with service 0x10 per ISO 14229-1, decodes the P2 and P2* server timing from the positive response, and refuses the programming session.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `request_guard` (object, required): From `uds-readonly-request-guard`; every request goes through it.
- `can_interface` (string, required): For example `can0`.
- `tx_id` (string, required): Physical request ID of the target ECU, for example `7E0`.
- `rx_id` (string, required): Response ID, for example `7E8`.

---

## Outputs

- `session_state` (object): ECU IDs, active session (0x01 or 0x03), the raw request and response hex, and the time it was entered.
- `p2_timing` (object): `p2_server_max_ms` and `p2_star_server_max_ms` decoded from the response.

---

## Phase 1: Choose the Session

### Entry Criteria
- Guard tests passed. Vehicle stationary, engine state as required by the user's goal.

### Actions
1. Decision table:

| Goal | Session |
|---|---|
| Read standard DIDs (VIN, part numbers), read DTCs | 0x01 default is often enough; try it first |
| A DID or 0x19 subfunction answers NRC 0x7F (serviceNotSupportedInActiveSession) or 0x31 in default | 0x03 extended |
| Reprogramming (0x02) | Denied; out of scope |

2. Do not enter extended session "just in case". Stay in default when it answers.

### Output
Chosen session.

### Quality Gate
- The chosen session is 0x01 or 0x03.

---

## Phase 2: Send and Decode

### Entry Criteria
- Session chosen.

### Actions
1. Request `10 01` or `10 03` through the guarded send.
2. Positive response: `50 <session> P2hi P2lo P2*hi P2*lo` (ISO 14229-1 for the 2013 and later editions; older ECUs may return only `50 <session>`).
3. Decode: `p2_server_max_ms = (P2hi << 8) | P2lo` (1 ms resolution). `p2_star_server_max_ms = ((P2*hi << 8) | P2*lo) * 10` (10 ms resolution).
4. Typical default values seen are `00 32 01 F4` = 50 ms and 5000 ms; always use the decoded values, never these examples.
5. Negative response `7F 10 NRC`: decode with `uds-nrc-decode`. NRC 0x22 (conditionsNotCorrect) often means the vehicle state (speed, engine) does not allow the session.
6. Client timeout: wait at least `p2_server_max_ms` plus bus latency for the first reply. On NRC 0x78 (responsePending), wait up to `p2_star_server_max_ms` for each further reply.

### Output
`session_state`, `p2_timing`.

### Quality Gate
- `p2_timing` values are computed from response bytes quoted in `session_state.response_hex`.

---

## Phase 3: Keep or Leave the Session

### Entry Criteria
- Session active.

### Actions
1. A non-default session times out on the server after S3server = 5000 ms without a request (ISO 14229-2). Start `uds-tester-present-0x3e` before doing slow work.
2. When finished, return to default: send `10 01`. Record the time.
3. An ECU reset or ignition cycle also returns the ECU to default; do not send 0x11 ECUReset (denied).

### Output
Session closed or kept alive.

### Quality Gate
- The session log ends with a `50 01` response, or with `uds-tester-present-0x3e` running.

---

## Worked Example

Illustrative only.

```
tx 7E0: 10 03
rx 7E8: 50 03 00 32 01 F4
```

`p2_timing` = `{"p2_server_max_ms": 50, "p2_star_server_max_ms": 5000}`. Later `10 01` -> `50 01 00 32 01 F4`.

---

## Exit Criteria

DONE when the ECU is in the chosen session with decoded timing, and the session is returned to default at the end.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | User requests session 0x02 | **Stop**: programming session is out of scope. |
| Phase 2 | `7F 10 12` | **Adjust**: subfunction not supported; stay in default. |
| Phase 2 | `7F 10 22` | **Return**: report the conditions; do not try to force them. |
| Phase 2 | No response | **Retry**: once after checking IDs; then return to `uds-kernel-can-isotp-module`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
