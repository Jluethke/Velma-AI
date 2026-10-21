# UDS ReadDataByIdentifier 0x22

**One-line description:** Reads ECU identification and data with UDS service 0x22 per ISO 14229-1, starting from the standardized 0xF1xx identification DIDs, checking the echoed DID and length of every response, and decoding ASCII, BCD and raw values only from documented formats.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `session_state` (object, required): From `uds-session-control-0x10`.
- `did_list` (string[], required): DIDs to read, in hex. Start with the ISO 14229-1 identification DIDs below; OEM DIDs only with an OEM document that defines their format.

---

## Outputs

- `did_values` (object[]): One row per DID: DID, raw response hex, decoded value, format used, source of the format, or the negative response.

---

## Phase 1: Build the DID List

### Entry Criteria
- A session is active.

### Actions
1. Standard identification DIDs (ISO 14229-1, Annex C):

| DID | Name | Usual format |
|---|---|---|
| 0xF186 | ActiveDiagnosticSession | 1 byte |
| 0xF187 | VehicleManufacturerSparePartNumber | ASCII |
| 0xF188 | VehicleManufacturerECUSoftwareNumber | ASCII |
| 0xF189 | VehicleManufacturerECUSoftwareVersionNumber | ASCII |
| 0xF18A | SystemSupplierIdentifier | ASCII |
| 0xF18B | ECUManufacturingDate | BCD YY MM DD (commonly) |
| 0xF18C | ECUSerialNumber | ASCII |
| 0xF190 | VIN | 17 ASCII |
| 0xF191 | VehicleManufacturerECUHardwareNumber | ASCII |
| 0xF192 | SystemSupplierECUHardwareNumber | ASCII |
| 0xF194 | SystemSupplierECUSoftwareNumber | ASCII |
| 0xF197 | SystemNameOrEngineType | ASCII |

2. "Usual format" is not guaranteed; the length of each record is defined by the vehicle manufacturer. Read the raw bytes first.
3. Do not scan the whole 0x0000 to 0xFFFF range. Read only the DIDs in `did_list`.

### Output
Final DID list.

### Quality Gate
- Every DID is either from the table or cites an OEM document.

---

## Phase 2: Read and Validate

### Entry Criteria
- DID list ready.

### Actions
1. Read one DID per request: `22 F1 90`. ISO 14229-1 allows several DIDs in one request (`22 F1 90 F1 8C`), but then you must split the response by known lengths; avoid it unless lengths are documented.
2. Positive response: `62` + the 2-byte DID echo + data. Check the echo equals the request DID; if not, discard.
3. Negative response `7F 22 NRC`:

| NRC | Meaning | Action |
|---|---|---|
| 0x31 | requestOutOfRange (DID not supported) | Record unsupported |
| 0x7F / 0x7E | not supported in active session | Retry once in extended session |
| 0x33 | securityAccessDenied | Record protected; do not attempt 0x27 |
| 0x13 | incorrectMessageLengthOrInvalidFormat | Check request bytes |
| 0x14 | responseTooLong | Transport buffer too small; check `isotp_params` |
| 0x78 | responsePending | Keep waiting up to P2* |

4. Use the timing from `p2_timing` for every read.

### Output
Raw responses.

### Quality Gate
- Every row has either a `62` echo match or an NRC from the table.

---

## Phase 3: Decode

### Entry Criteria
- Raw responses collected.

### Actions
1. ASCII: decode bytes as ASCII, strip trailing 0x00, 0x20 and 0xFF. Print non-printable bytes as hex instead of dropping them.
2. BCD date: each nibble is a decimal digit; reject nibbles above 9.
3. Unknown format: keep raw hex. Do not guess a scaling for OEM DIDs.
4. Cross-check: VIN from 0xF190 must equal the VIN from OBD service 0x09 PID 0x02 if read.

### Output
`did_values`.

### Quality Gate
- Every decoded value records the `format_source` (ISO 14229-1 Annex C, OEM document, or "raw").

---

## Worked Example

Illustrative only.

```
tx 22 F1 90 -> rx 62 F1 90 31 47 31 34 41 4B 35 32 38 37 35 31 32 33 34 35 36
   VIN = "1G14AK52875123456"
tx 22 F1 8B -> rx 62 F1 8B 19 04 22   date 2019-04-22 (BCD)
tx 22 F1 97 -> rx 7F 22 31            unsupported
```

---

## Exit Criteria

DONE when every DID in `did_list` has a validated raw response or a decoded NRC, and every decoded value names its format source.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | User asks to scan all DIDs | **Adjust**: limit to the documented list; scanning can wake protected handlers. |
| Phase 2 | DID echo mismatch | **Retry**: once; then record the mismatch. |
| Phase 2 | NRC 0x33 | **Stop**: for that DID; security access is out of scope. |
| Phase 3 | ASCII contains control bytes | **Return**: record the raw hex; do not clean it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
