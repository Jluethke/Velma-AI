# UDS TesterPresent 0x3E Keep-Alive

**One-line description:** Keeps a non-default UDS session alive with service 0x3E, choosing between `3E 00` and the suppressed-response `3E 80`, physical or functional addressing, and an interval derived from the ISO 14229-2 S3 timers.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `session_state` (object, required): From `uds-session-control-0x10`.
- `p2_timing` (object, required): From `uds-session-control-0x10`.

---

## Outputs

- `keepalive_plan` (object): Request bytes, addressing, interval, the scheduler used, and the measured send intervals from a candump capture.

---

## Phase 1: Pick the Form

### Entry Criteria
- `session_state.session` is 0x03, or the user needs the default session kept active on an ECU that requires it.

### Actions
1. Decision table:

| Situation | Request | Addressing |
|---|---|---|
| One ECU in extended session, you want to see each reply | `3E 00`, expect `7E 00` | Physical (tx_id) |
| One ECU, keep-alive in the background while other requests run | `3E 80` (suppressPosRspMsgIndicationBit), no reply | Physical |
| Several ECUs in a non-default session | `3E 80` | Functional (0x7DF) |

2. With `3E 80`, a correct ECU sends nothing. A negative response is still sent for some NRCs; read it.
3. Never send TesterPresent in default session as a substitute for confirming the link; use a read instead.

### Output
Chosen request form.

### Quality Gate
- The request is exactly `3E 00` or `3E 80` (guard allows only these).

---

## Phase 2: Set the Interval

### Entry Criteria
- Form chosen.

### Actions
1. ISO 14229-2 sets S3server to 5000 ms: the server drops to default session if no request arrives for that long.
2. The tester interval must be below S3server. ISO 14229-2 gives S3client as 2000 ms nominal; use that, or a user-supplied value below 5000 ms.
3. Any other request to that ECU also resets S3server, so pause keep-alive messages during a busy exchange only if your scheduler can reschedule them; otherwise keep the fixed timer.
4. Do not send faster than needed; extra 0x3E traffic delays other requests on a loaded bus.

### Output
Interval value with source.

### Quality Gate
- Interval is less than 5000 ms and its source is ISO 14229-2 S3client or a named user input.

---

## Phase 3: Run and Measure

### Entry Criteria
- Interval set.

### Actions
1. Implement with one timer thread or the client library's helper. In python-udsoncan, call `client.tester_present()` from a timer; suppress the reply with `with client.suppress_positive_response:` around the call (check the docs for your version).
2. Run `candump -td <can_interface>,7DF:7FF` or the physical ID filter for 30 s. `-td` prints the delta time between frames.
3. Read the deltas of the `3E` frames. They must cluster at the chosen interval and never exceed 5000 ms.
4. Stop the timer and send `10 01` when done.

### Output
`keepalive_plan`.

### Quality Gate
- The maximum measured delta between `3E` frames is below 5000 ms.
- The session is still 0x03 after the run (a `22 F1 86` read of ActiveDiagnosticSessionDataIdentifier returns 03, if the ECU supports that DID).

---

## Worked Example

Illustrative only.

```
$ candump -td can0,7E0:7FF
 (000.000000)  can0  7E0   [8]  02 3E 80 AA AA AA AA AA
 (002.000412)  can0  7E0   [8]  02 3E 80 AA AA AA AA AA
 (001.999781)  can0  7E0   [8]  02 3E 80 AA AA AA AA AA
```

Max delta 2.0004 s, below 5 s. `22 F1 86` -> `62 F1 86 03`: still extended.

---

## Exit Criteria

DONE when keep-alive runs at a cited interval below S3server and the measured deltas confirm it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `7F 3E 12` | **Adjust**: the ECU rejects 0x80; use `3E 00`. |
| Phase 3 | Session drops to default | **Adjust**: interval too long or timer starved; measure with `candump -td` and fix the scheduler. |
| Phase 3 | Deltas irregular | **Retry**: move the timer off the thread doing blocking reads. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
