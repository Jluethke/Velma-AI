# OBD-II Stored, Pending and Permanent DTC Read

**One-line description:** Reads emissions DTCs with OBD-II service 0x03 (stored), 0x07 (pending) and 0x0A (permanent), plus MIL status and DTC count from service 0x01 PID 0x01, and decodes each two-byte code into its SAE J2012 text form.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `isotp_link_check` (object, required): From `uds-kernel-can-isotp-module`.
- `can_interface` (string, required): For example `can0`.

---

## Outputs

- `obd_dtcs` (object[]): One row per code: ECU response ID, kind (stored, pending, permanent), raw two bytes, text code (for example P0133).
- `mil_status` (object): Per ECU, MIL on/off and confirmed DTC count from PID 0x01.

---

## Phase 1: MIL and Count

### Entry Criteria
- Transport verified. Ignition on.

### Actions
1. Send `01 01` to 7DF. Each ECU answers `41 01 A B C D`.
2. MIL = bit 7 of A. DTC count = A AND 0x7F.
3. Bytes B, C, D hold readiness monitor status; record them raw for later inspection-readiness questions. Do not interpret them without the J1979 table.

### Output
`mil_status`.

### Quality Gate
- Each responding ECU has `mil` and `count` taken from byte A.

---

## Phase 2: Read Codes

### Entry Criteria
- Phase 1 done.

### Actions
1. Send `03` to 7DF (stored), then `07` (pending), then `0A` (permanent). Each is a one-byte Single Frame.
2. On CAN (ISO 15765-4) the positive response is `43 N` then N pairs of bytes (`47` and `4A` for the other two services). N may be 0.
3. Responses with many codes are multi-frame; read them through the ISO-TP socket, not raw frames.
4. Decode each pair `H L`:

| Bits 7-6 of H | Letter |
|---|---|
| 00 | P (powertrain) |
| 01 | C (chassis) |
| 10 | B (body) |
| 11 | U (network) |

   Second character = bits 5-4 of H (0 to 3). Third character = bits 3-0 of H as hex. Last two characters = L as two hex digits.
5. Example: `01 33` gives P0133; `C1 23` gives U0123; `41 23` gives C0123.
6. Skip pairs `00 00` (padding on non-CAN protocols). Do NOT send service 0x04; clearing is `uds-clear-dtc-0x14` behind a confirmation.

### Output
`obd_dtcs`.

### Quality Gate
- Number of stored codes per ECU equals N in the `43` response.
- The decoder test `01 33` gives P0133 and `C1 23` gives U0123.

---

## Phase 3: Cross-Check

### Entry Criteria
- Codes decoded.

### Actions
1. Compare the stored code count with the PID 0x01 count from Phase 1. A mismatch is recorded, not corrected.
2. Look up each code's meaning: P0xxx, P2xxx, P34xx to P39xx and U0xxx are SAE-defined (SAE J2012-DA); P1xxx and other manufacturer ranges need the OEM service information. Do not invent descriptions.

### Output
Annotated `obd_dtcs`.

### Quality Gate
- Every description cites SAE J2012-DA or an OEM document, or reads "description unknown".

---

## Worked Example

Illustrative only.

```
01 01 -> 7E8: 41 01 82 07 65 04     MIL on, 2 codes
03    -> 7E8: 43 02 01 33 04 20     P0133, P0420
07    -> 7E8: 47 00                 no pending
0A    -> 7E8: 4A 01 04 20           permanent P0420
```

---

## Exit Criteria

DONE when stored, pending and permanent codes are decoded for every responding ECU and the counts are cross-checked against PID 0x01.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `41 01` reply | **Return**: rerun `uds-kernel-can-isotp-module`; the transport is down. |
| Phase 2 | `7F 0A 11` | **Adjust**: the ECU predates service 0x0A; record permanent codes as unsupported. |
| Phase 3 | Count mismatch | **Return**: record both values; some ECUs count only MIL-on codes. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
