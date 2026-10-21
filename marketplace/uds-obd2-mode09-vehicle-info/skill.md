# OBD-II Service 0x09 Vehicle Information

**One-line description:** Reads VIN (PID 0x02), calibration IDs (0x04), calibration verification numbers (0x06) and ECU name (0x0A) with OBD-II service 0x09, reassembling the multi-frame replies and validating the VIN check digit.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `isotp_link_check` (object, required): From `uds-kernel-can-isotp-module`.
- `can_interface` (string, required): For example `can0`.

---

## Outputs

- `vehicle_info` (object): Per ECU: VIN, calibration IDs, CVNs, ECU name, the raw hex of each response, and the VIN check digit result.

---

## Phase 1: Support Query

### Entry Criteria
- Transport verified.

### Actions
1. Send `09 00` to 7DF. Decode the 4-byte bitmap exactly as in `uds-obd2-supported-pids` Phase 2 (bit 7 of A = PID 0x01).
2. Only query PIDs whose bit is set.

### Output
Supported service 0x09 PIDs per ECU.

### Quality Gate
- The bitmap decode reuses the tested decoder from `uds-obd2-supported-pids`.

---

## Phase 2: Read the PIDs

### Entry Criteria
- Phase 1 done.

### Actions
1. VIN: send `09 02` physically to the engine ECU. On CAN the reply is `49 02 01` then 17 ASCII bytes (multi-frame). The `01` is the number of data items.
2. Calibration ID: `09 04`. Reply `49 04 N` then N blocks of 16 bytes ASCII, right-padded with 0x00. Strip trailing zeros.
3. CVN: `09 06`. Reply `49 06 N` then N blocks of 4 bytes. Print as 8 hex digits; it is a checksum, not text.
4. ECU name: `09 0A`. Reply `49 0A 01` then 20 bytes ASCII.
5. Read all of these through the ISO-TP socket so the kernel sends flow control. Raw `cansend` cannot complete a multi-frame read.

### Output
Raw replies.

### Quality Gate
- VIN reply payload length is 3 + 17 = 20 bytes.

---

## Phase 3: Validate VIN

### Entry Criteria
- VIN read.

### Actions
1. VIN characters must not include I, O or Q.
2. For North American VINs, compute the check digit (49 CFR 565): transliterate letters (A=1, B=2, C=3, D=4, E=5, F=6, G=7, H=8, J=1, K=2, L=3, M=4, N=5, P=7, R=9, S=2, T=3, U=4, V=5, W=6, X=7, Y=8, Z=9), multiply by position weights 8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2, sum, take modulo 11; remainder 10 is X. Compare with position 9.
3. Compare the VIN with the label on the vehicle. A mismatch means a replaced ECU or a wrong vehicle; record it.

### Output
`vehicle_info`.

### Quality Gate
- `vehicle_info.vin_check_digit_ok` is true or false, computed, never blank for a North American VIN.

---

## Worked Example

Illustrative only.

```
09 02 -> 7E8: 49 02 01 31 47 31 ... (17 ASCII) -> VIN 1G1....
09 0A -> 7E8: 49 0A 01 45 43 4D 00 2D 45 6E 67 69 6E 65 43 6F 6E 74 72 6F 6C 00 00
         20 data bytes -> "ECM" (short name) and "EngineControl" (long name), zero padded
```

---

## Exit Criteria

DONE when every supported service 0x09 PID is read, decoded, and the VIN is checked.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `09 00` not answered | **Adjust**: vehicle may predate service 0x09 on CAN; record unsupported. |
| Phase 2 | Reply truncated at 7 bytes | **Return**: a raw tool was used; repeat through the ISO-TP socket. |
| Phase 3 | Check digit fails | **Return**: record the VIN as read and flag it; do not alter it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
