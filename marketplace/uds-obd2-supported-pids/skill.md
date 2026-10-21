# OBD-II Supported PID Discovery

**One-line description:** Queries OBD-II service 0x01 PIDs 0x00, 0x20, 0x40 and onward per SAE J1979, decodes each 32-bit support bitmap into the exact PID list for every responding ECU, and stores the raw responses for scaling.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `isotp_link_check` (object, required): From `uds-kernel-can-isotp-module`, proving the transport works.
- `can_interface` (string, required): For example `can0`.

---

## Outputs

- `supported_pids` (object): Per responding ECU (response ID), the sorted list of supported service 0x01 PIDs.
- `raw_pid_responses` (object[]): Raw hex of each support query and later data query, with response ID and timestamp.

---

## Phase 1: Query Support Bitmaps

### Entry Criteria
- `isotp_link_check.response` begins with `41`.
- Ignition on. Engine running is optional; some PIDs report 0 with engine off.

### Actions
1. Use the functional ID 0x7DF so every emissions ECU answers. Start a capture: `candump -L <can_interface>,7E8:7F8 > pid_support.log` (the filter `7E8:7F8` passes IDs 0x7E8 to 0x7EF).
2. Send `01 00` on 7DF: `echo "01 00" | isotpsend -s 7DF -d 7E8 -p AA:AA <can_interface>`. Functional requests are Single Frame only; never send a multi-frame request to 0x7DF.
3. Each answer is `41 00 A B C D`. Store it in `raw_pid_responses`.
4. If bit 0 of byte D is 1, PID 0x20 is supported; query `01 20`. Repeat for 0x40, 0x60, 0x80, 0xA0, 0xC0 while the last bit is set.
5. SAE J1979 on CAN allows up to six PIDs in one service 0x01 request; keep to one PID per request in this flow so each response is easy to attribute.

### Output
Raw bitmaps per ECU.

### Quality Gate
- Every bitmap query has a response line in `pid_support.log` or is recorded as no response.

---

## Phase 2: Decode Bitmaps

### Entry Criteria
- At least one `41 00` response.

### Actions
1. For a query of base PID `B` with data bytes A, B, C, D: bit 7 of A is PID `B+0x01`, bit 0 of A is `B+0x08`, bit 7 of B is `B+0x09`, and so on to bit 0 of D = `B+0x20`.
2. Write it as code or by hand: for i in 0..31, if `(word >> (31 - i)) & 1` then PID `base + i + 1` is supported, where `word = A<<24 | B<<16 | C<<8 | D`.
3. Remove the range-continuation PIDs (0x20, 0x40, ...) from the data list; they are support queries, not data.
4. Group by response ID: 0x7E8 is commonly the engine ECU and 0x7E9 the transmission, but confirm with service 0x09 PID 0x0A (ECU name) in `uds-obd2-mode09-vehicle-info` rather than assume.

### Output
`supported_pids`.

### Quality Gate
- The decoded list for `41 00 BE 3F A8 13` equals [01, 03, 04, 05, 06, 07, 0B, 0C, 0D, 0E, 0F, 10, 11, 13, 15, 1C, 1F, 20] before removing 0x20 (use this as a unit test).

---

## Phase 3: Read Supported Data PIDs

### Entry Criteria
- `supported_pids` decoded.

### Actions
1. For each supported PID send `01 <pid>` physically to the owning ECU (for example tx 7E0, rx 7E8).
2. Append each raw response to `raw_pid_responses`. Do not scale here; scaling is `uds-obd2-pid-scaling`.
3. A `7F 01 12` (subFunctionNotSupported) or `7F 01 31` (requestOutOfRange) for a PID marked supported is a finding; record it.

### Output
`raw_pid_responses` complete.

### Quality Gate
- `raw_pid_responses` has one entry per supported data PID per ECU.

---

## Worked Example

Illustrative only.

```
$ echo "01 00" | isotpsend -s 7DF -d 7E8 -p AA:AA can0
candump: can0 7E8 [8] 06 41 00 BE 3F A8 13 AA
candump: can0 7E9 [8] 06 41 00 98 18 80 11 AA
```

7E8 supports 01, 03 to 07, 0B to 11, 13, 15, 1C, 1F, and continues at 0x20. 7E9 supports a shorter list and also continues at 0x20.

---

## Exit Criteria

DONE when every responding ECU has a decoded PID list and a raw response for each supported data PID.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No response on 7DF | **Adjust**: try 29-bit functional ID 18DB33F1 and responses 18DAF1xx. |
| Phase 1 | Response only with engine running | **Retry**: start the engine; some ECUs sleep with ignition only. |
| Phase 2 | Bitmap decode differs from the unit test | **Stop**: fix the bit order; bit 7 of byte A is the lowest PID. |
| Phase 3 | NRC for a PID marked supported | **Return**: record the mismatch; do not retry in a loop. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
