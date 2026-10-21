# DBC Signal Byte Order: Intel vs Motorola

**One-line description:** Verifies every Intel (little-endian, @1) and Motorola (big-endian, @0) signal in a DBC by computing its bit positions by hand from the DBC start bit convention, comparing with cantools' layout, and decoding a known reference frame.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dbc_file` (string, required): The DBC file.
- `dbc_report` (object, required): From `canb-dbc-lint-load`; lists the signals and their byte order.
- `reference_frames` (object[], optional): Frames with known physical values (for example from a bench where the user set the value), each {id, data_hex, expected: {signal: value}}.

---

## Outputs

- `byte_order_table` (object[]): Per signal: byte order, DBC start bit, the list of (byte, bit) positions from MSB to LSB, cantools agreement (yes/no), and the reference decode result.

---

## Phase 1: Learn the Two Conventions

### Entry Criteria
- `dbc_report` lists the signals.

### Actions
1. Bit numbering in a DBC: bit `n` is byte `n // 8`, bit `n % 8` within that byte, with bit 0 the least significant bit of byte 0.
2. Intel (`@1`, cantools "little_endian"): the DBC start bit is the signal's LSB. The signal occupies start, start+1, ... upward, continuing into the next byte. Example: start 8, length 12 covers byte 1 bits 0..7 and byte 2 bits 0..3; byte 1 is the low byte.
3. Motorola (`@0`, cantools "big_endian"): the DBC start bit is the signal's MSB. Walk downward within the byte (bit 7 toward bit 0); when you pass bit 0 of a byte, continue at bit 7 of the NEXT byte (byte index + 1). Example: start 7, length 16 covers byte 0 bits 7..0 then byte 1 bits 7..0; byte 0 is the high byte.
4. Pitfall: some tools (and some spreadsheets) give the Motorola LSB position or use a "sawtooth" or "forward MSB" numbering instead. A DBC always stores the MSB for `@0`. Never convert a start bit unless you know which convention the source used.

### Output
Rules written down.

### Quality Gate
- Both worked conversions above are reproduced by hand in the notes.

---

## Phase 2: Compute and Compare

### Entry Criteria
- Rules written.

### Actions
1. For each signal list its bit positions from MSB to LSB using the rules.
2. Run `cantools dump <dbc_file>` and read the bit diagram for the message; each signal's bits are drawn with its name. Compare position by position.
3. A disagreement means the DBC start bit is not what the author intended or your walk is wrong; redo the walk once, then record it.
4. Check that signed signals (`-` in the DBC, `is_signed` True) use two's complement over exactly `length` bits.

### Output
Draft `byte_order_table`.

### Quality Gate
- Every signal has an agreement value.
- Every disagreement names the message, signal and both position lists.

---

## Phase 3: Reference Decode

### Entry Criteria
- `reference_frames` given. If not, skip to Exit with "no reference" recorded.

### Actions
1. Decode each frame: `db.decode_message(frame_id, bytes.fromhex(data_hex))`.
2. Compare with `expected`. The physical value is `raw * scale + offset`.
3. A value that is wrong by a factor near 256 or byte-swapped (for example 0x1234 read as 0x3412) means the byte order is wrong in the DBC.
4. Record result per signal.

### Output
`byte_order_table`.

### Quality Gate
- Each reference signal decodes to its expected value, or the mismatch is recorded with the raw value.

---

## Worked Example

Illustrative. Signal `VehicleSpeed : 7|16@0+ (0.01,0) [0|655.35] "km/h"` in message 0x1A0.

- Phase 1: Motorola, MSB at byte 0 bit 7, 16 bits, so byte 0 then byte 1.
- Phase 2: positions (0,7)..(0,0),(1,7)..(1,0); `cantools dump` diagram agrees.
- Phase 3: reference frame `1A0#1388000000000000`; raw 0x1388 = 5000; 5000 * 0.01 = 50.00 km/h, expected 50.00. If the DBC had said `@1`, raw would be 0x8813 = 34835, a byte-swap error.

---

## Exit Criteria

DONE when every signal's bit positions are computed by hand, compared with cantools, and checked against reference frames when given.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Source document uses a non-DBC numbering | **Stop**: identify the numbering convention before converting any start bit. |
| Phase 2 | Hand walk and cantools disagree | **Retry**: redo the walk once; if still different, record the signal as a DBC defect. |
| Phase 3 | Byte-swapped result | **Return**: report the byte order defect to the DBC owner. |
| Phase 3 | Off by a constant | **Adjust**: check offset and signedness before blaming byte order. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
