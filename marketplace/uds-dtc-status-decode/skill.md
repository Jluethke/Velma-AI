# DTC Format and Status Byte Decode

**One-line description:** Decodes 3-byte UDS DTCs into SAE J2012 text plus failure type byte, decodes each of the eight ISO 14229-1 status bits, and merges them with OBD-II two-byte codes into one deduplicated fault list with plain meanings.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `raw_dtc_records` (object[], optional): From `uds-read-dtc-0x19`.
- `obd_dtcs` (object[], optional): From `uds-obd2-mode03-dtcs`. At least one of the two inputs must be present.

---

## Outputs

- `decoded_dtcs` (object[]): One row per fault: text code, failure type byte, source (UDS or OBD), each status bit as a named boolean, a one-line state summary, and the ECU.

---

## Phase 1: Decode the Code

### Entry Criteria
- At least one input present.

### Actions
1. For UDS records with DTCFormatIdentifier 0x00 or 0x04 (SAE J2012-DA): the first two bytes decode like an OBD-II code (bits 7-6 of byte 1: 00 P, 01 C, 10 B, 11 U; bits 5-4 second digit; bits 3-0 third digit; byte 2 as two hex digits). Byte 3 is the Failure Type Byte (FTB). Write it as `P0133-00` or the OEM's style.
2. For format 0x01 (ISO 14229-1) or 0x02 (J1939-73), keep the 3 bytes as hex; J1939 needs SPN/FMI decoding per SAE J1939-73, which is out of scope here.
3. FTB meanings (for example 0x11 circuit short to ground, 0x13 circuit open) are listed in SAE J2012-DA; cite it, do not guess.

### Output
Text codes.

### Quality Gate
- Unit test: bytes `01 33 00` give `P0133-00`; `C1 23 00` give `U0123-00`.

---

## Phase 2: Decode the Status Byte

### Entry Criteria
- Codes decoded.

### Actions
1. ISO 14229-1 DTC status bits:

| Bit | Mask | Name | Meaning |
|---|---|---|---|
| 0 | 0x01 | testFailed | Failing at the most recent test |
| 1 | 0x02 | testFailedThisOperationCycle | Failed at least once this cycle |
| 2 | 0x04 | pendingDTC | Failed this or last cycle, not yet confirmed |
| 3 | 0x08 | confirmedDTC | Confirmed and stored |
| 4 | 0x10 | testNotCompletedSinceLastClear | Test has not finished since the last clear |
| 5 | 0x20 | testFailedSinceLastClear | Failed at least once since the last clear |
| 6 | 0x40 | testNotCompletedThisOperationCycle | Test has not finished this cycle |
| 7 | 0x80 | warningIndicatorRequested | ECU requests the warning lamp |

2. AND each status with the ECU's availabilityMask first; unsupported bits are not meaningful.
3. Summary rules:

| Condition | Summary |
|---|---|
| bit 0 set | active now |
| bit 3 set, bit 0 clear | stored, not active now |
| bit 2 set, bit 3 clear | pending |
| bit 7 set | lamp requested |
| bit 4 set | not yet tested since clear |

### Output
Status fields and summary.

### Quality Gate
- Unit test: status 0x2F gives testFailed, testFailedThisOperationCycle, pendingDTC, confirmedDTC, testFailedSinceLastClear all true and the others false.

---

## Phase 3: Merge with OBD Codes

### Entry Criteria
- Phase 2 done.

### Actions
1. Map OBD codes: service 0x03 to confirmed, 0x07 to pending, 0x0A to permanent.
2. Match a UDS row and an OBD row when the ECU is the same and the first two bytes match. Keep both sources on one row.
3. Sort: active first, then confirmed, then pending.
4. Run the unit tests from Phase 1 and Phase 2 and paste the summary.

### Output
`decoded_dtcs`.

### Quality Gate
- Test summary shows all passed.
- No two rows share ECU, code and FTB.

---

## Worked Example

Illustrative only.

Input record `01 33 00 2F` from 7E8, and OBD stored P0133 from 7E8.

Row: `{"code": "P0133-00", "ecu": "7E8", "sources": ["UDS", "OBD 03"], "testFailed": true, "confirmedDTC": true, "pendingDTC": true, "summary": "active now, stored"}`.

---

## Exit Criteria

DONE when every DTC has a text code, a named status breakdown and a summary, with OBD and UDS views merged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Format identifier is 0x02 | **Return**: keep raw; J1939 decode is outside this flow. |
| Phase 2 | Status bits outside availabilityMask set | **Adjust**: mask them out and note it. |
| Phase 3 | Unit test fails | **Stop**: fix the decoder; never edit the expected values. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
