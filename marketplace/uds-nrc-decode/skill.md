# UDS Negative Response Code Decode

**One-line description:** Finds every `7F <SID> <NRC>` negative response in a diagnostic session, names it from the ISO 14229-1 NRC table, handles 0x78 responsePending correctly, and maps each code to one fixed next action so no tester retries blindly.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `session_state` (object, required): From `uds-session-control-0x10`, with its raw responses.
- `did_values` (object[], optional): From `uds-read-did-0x22`.
- `raw_dtc_records` (object[], optional): From `uds-read-dtc-0x19`.

---

## Outputs

- `nrc_report` (object[]): One row per negative response: request hex, SID, NRC hex, NRC name, category, and the prescribed action.

---

## Phase 1: Collect Negative Responses

### Entry Criteria
- At least one input contains raw responses.

### Actions
1. A negative response is exactly 3 bytes: `7F`, the request SID, the NRC. Search every raw response in the inputs for first byte `7F`.
2. Check byte 2 equals the SID of the request it answers. If not, it answers a different request (for example a delayed reply); record it as mismatched.
3. Group by NRC.

### Output
NRC list.

### Quality Gate
- Every collected row has length 3 and a request it is matched to, or is marked mismatched.

---

## Phase 2: Name and Act

### Entry Criteria
- NRC list ready.

### Actions
1. Name each NRC from ISO 14229-1:

| NRC | Name | Action |
|---|---|---|
| 0x10 | generalReject | Record; do not retry in a loop |
| 0x11 | serviceNotSupported | Record unsupported |
| 0x12 | subFunctionNotSupported | Record unsupported |
| 0x13 | incorrectMessageLengthOrInvalidFormat | Fix the request bytes |
| 0x14 | responseTooLong | Check transport buffer size |
| 0x21 | busyRepeatRequest | Retry after a delay, limited count from user input |
| 0x22 | conditionsNotCorrect | Report vehicle condition; do not force |
| 0x24 | requestSequenceError | Fix the request order |
| 0x25 | noResponseFromSubnetComponent | Record; gateway could not reach the target |
| 0x26 | failurePreventsExecutionOfRequestedAction | Record |
| 0x31 | requestOutOfRange | DID, routine or parameter not supported |
| 0x33 | securityAccessDenied | Stop for that item; security access is out of scope |
| 0x35 | invalidKey | Stop; out of scope |
| 0x36 | exceedNumberOfAttempts | Stop; out of scope |
| 0x37 | requiredTimeDelayNotExpired | Stop; out of scope |
| 0x70 to 0x73 | upload/download and programming errors | Should never appear (services denied); investigate the guard |
| 0x78 | requestCorrectlyReceived-ResponsePending | Not an error; wait up to P2* for the final reply |
| 0x7E | subFunctionNotSupportedInActiveSession | Retry once in extended session |
| 0x7F | serviceNotSupportedInActiveSession | Retry once in extended session |
| 0x81 to 0x8D | rpmTooHigh, rpmTooLow, engineIsRunning, engineIsNotRunning, engineRunTimeTooLow, temperatureTooHigh, temperatureTooLow, vehicleSpeedTooHigh, vehicleSpeedTooLow, throttle/PedalTooHigh, throttle/PedalTooLow, transmissionRangeNotInNeutral, transmissionRangeNotInGear | Report the condition to the user; do not change vehicle state to satisfy it on the road |
| 0x8F | brakeSwitch(es)NotClosed | Report; never automate a brake input |
| 0x90 | shifterLeverNotInPark | Report |
| 0x91 | torqueConverterClutchLocked | Report |
| 0x92 / 0x93 | voltageTooHigh / voltageTooLow | Check battery voltage; connect a charger |

2. For any NRC not listed, look it up in ISO 14229-1 and record the name; values 0x94 to 0xEF are reserved for specific conditions, 0xF0 to 0xFE are OEM-specific.
3. 0x78 handling: after `7F xx 78`, reset the client timeout to `p2_star_server_max_ms` and keep reading. Multiple 0x78 frames are allowed. Do not resend the request.

### Output
`nrc_report`.

### Quality Gate
- Every row has a name from the table, a cited ISO 14229-1 lookup, or "OEM-specific".
- No row with NRC 0x78 is counted as a failure.

---

## Worked Example

Illustrative only.

```
22 F1 97 -> 7F 22 31   requestOutOfRange: DID unsupported
19 04 ... -> 7F 19 78, then 59 04 ...  responsePending, then success
10 03 -> 7F 10 22      conditionsNotCorrect: report (vehicle moving?)
```

---

## Exit Criteria

DONE when every negative response is named and has one prescribed action, and pending responses are not counted as failures.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `7F` with wrong SID echo | **Return**: mark mismatched; check for overlapping requests. |
| Phase 2 | NRC 0x70 to 0x73 appears | **Stop**: a denied service reached the bus; rerun `uds-readonly-request-guard` tests. |
| Phase 2 | Endless 0x21 | **Stop**: after the user-set retry count; report the ECU busy. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
