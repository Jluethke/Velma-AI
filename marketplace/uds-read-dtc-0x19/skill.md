# UDS ReadDTCInformation 0x19

**One-line description:** Reads DTCs from a UDS ECU with service 0x19 per ISO 14229-1, using subfunction 0x01 to count, 0x02 to list by status mask, 0x0A for all supported DTCs, and 0x04 and 0x06 for snapshot and extended data of one DTC, and splits the response into 4-byte records.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `session_state` (object, required): From `uds-session-control-0x10`.
- `status_mask` (string, optional): DTC status mask in hex. When absent use 0xFF (all bits) and filter later with `uds-dtc-status-decode`.

---

## Outputs

- `raw_dtc_records` (object[]): Per ECU: the DTCStatusAvailabilityMask, DTC format identifier, and every record (3-byte DTC, status byte), plus snapshot and extended data hex where read.

---

## Phase 1: Count

### Entry Criteria
- Session active (default session usually suffices for 0x19).

### Actions
1. Send `19 01 <mask>`. Response: `59 01 <availabilityMask> <DTCFormatIdentifier> <countHi> <countLo>`.
2. DTCFormatIdentifier values (ISO 14229-1): 0x00 SAE J2012-DA format 00, 0x01 ISO 14229-1 format, 0x02 SAE J1939-73, 0x03 ISO 11992-4, 0x04 SAE J2012-DA format 04. Record it; decoding depends on it.
3. The availabilityMask lists which status bits this ECU supports. AND your mask with it.

### Output
Count and format.

### Quality Gate
- `count` and `dtc_format` recorded from response bytes.

---

## Phase 2: List

### Entry Criteria
- Count known.

### Actions
1. Send `19 02 <mask>`. Response: `59 02 <availabilityMask>` then N records of 4 bytes: `DTCHigh DTCMid DTCLow Status`.
2. Check `(len(payload) - 3) % 4 == 0`. If not, the response is malformed; record it.
3. Number of records must equal the count from Phase 1 when the same mask is used (it can differ if a DTC changes state between the two requests; then repeat once).
4. Long lists are multi-frame; read through the ISO-TP socket.
5. Optional: `19 0A` returns every DTC the ECU supports with its current status, useful to know what the ECU can report.

### Output
Record list.

### Quality Gate
- Record count equals Phase 1 count, or the repeat is recorded.

---

## Phase 3: Snapshot and Extended Data for One DTC

### Entry Criteria
- At least one DTC with the confirmedDTC bit set (see `uds-dtc-status-decode`).

### Actions
1. Snapshot identification: `19 03` lists DTC and record numbers that have snapshots.
2. Snapshot data: `19 04 <DTC 3 bytes> <recordNumber>` (0xFF = all records). Response `59 04 <DTC> <status> <recordNumber> <numberOfIdentifiers> <DID> <data>...`.
3. Extended data: `19 06 <DTC 3 bytes> <recordNumber>` (0xFF = all). Contents (for example occurrence counter, aging counter) are OEM-defined.
4. The data layout after each DID is OEM-defined. Keep the raw hex; decode only with an OEM document.

### Output
`raw_dtc_records` with snapshot and extended hex.

### Quality Gate
- Each snapshot response echoes the requested DTC.

---

## Worked Example

Illustrative only.

```
tx 19 01 FF -> rx 59 01 7F 00 00 02        mask 0x7F, format 0x00 (SAE J2012-DA), 2 DTCs
tx 19 02 FF -> rx 59 02 7F 01 33 00 2F C1 23 00 08
                 records: 013300/0x2F, C12300/0x08
tx 19 04 C1 23 00 FF -> rx 59 04 C1 23 00 08 01 01 F4 0D 00
                 record 0x01, one DID 0xF40D. ISO 14229-1 maps DIDs 0xF400 to 0xF4FF to
                 OBD service 0x01 PIDs, so this is PID 0x0D vehicle speed = 0 km/h.
```

---

## Exit Criteria

DONE when every ECU in scope has its count, format identifier and record list, with snapshot or extended hex for confirmed DTCs where requested.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `7F 19 12` on 0x01 | **Adjust**: go straight to `19 02`. |
| Phase 2 | Record length not a multiple of 4 | **Return**: record malformed; check for truncated multi-frame. |
| Phase 3 | `7F 19 31` | **Return**: no snapshot for that DTC or record; record it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
