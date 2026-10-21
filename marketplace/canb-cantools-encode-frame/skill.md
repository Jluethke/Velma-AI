# Encode Frames from Signal Values with cantools

**One-line description:** Encodes physical signal values into CAN payloads with cantools `Message.encode` in strict mode, checks each payload by decoding it back, and emits frames ready for bench transmission only.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dbc_file` (string, required): DBC file that passed `canb-dbc-lint-load`.
- `signal_values` (object[], required): Per message: {message: name, signals: {name: physical value or choice label}}.
- `tx_permission` (string, required): From `canb-tx-scope-check`; encoded frames are only sent when it allows bench or virtual TX.

---

## Outputs

- `encoded_frames` (object[]): Per message: frame_id (hex), is_extended, is_fd, data (hex), the cansend string, and the round-trip decode result.

---

## Phase 1: Encode Strictly

### Entry Criteria
- DBC loads with `strict=True`.

### Actions
1. `msg = db.get_message_by_name(name)`.
2. Provide a value for EVERY signal in the message (for multiplexed messages, every signal of the selected mux page plus the multiplexer). cantools raises when a signal is missing; do not fill gaps with 0 without recording it.
3. `data = msg.encode(values, strict=True, scaling=True)`. Strict mode raises when a value is outside the DBC `[min|max]` range. Fix the value; do not turn strict off to get past it.
4. Labels from value tables can be given as strings when the signal has choices.
5. Round-trip: `msg.decode(data)` and compare with the input; with scaling, expect equality to the resolution of `scale` (raw values are integers).

### Output
Payloads.

### Quality Gate
- Every message encodes with `strict=True`.
- Every round-trip value equals the input within one `scale` step.

---

## Phase 2: Emit Frames

### Entry Criteria
- Payloads ready.

### Actions
1. Build the cansend string: 3 hex digits for standard IDs, 8 for extended (`msg.is_extended_frame`); `#` for classic, `##<flags>` for FD (`msg.is_fd`).
2. Write `encoded_frames`.
3. If `tx_permission` is "none", add the note "not for transmission on this target" to each entry. Sending is done only by `canb-cansend-cangen-bench`, `canb-py-cyclic-tx` or `canb-c-bcm-cyclic-tx`, which check permission again.
4. Any message whose purpose is an actuator command is sent only on a bench or closed course behind a tested, independent hardware emergency stop.

### Output
`encoded_frames`.

### Quality Gate
- Every entry has a cansend string whose ID width matches `is_extended`.

---

## Worked Example

Illustrative. Input: message `BenchMotorCmd` (0x200, 8 bytes) with signals TargetRpm=1500 (scale 1), Enable="ON" (choices 0 "OFF", 1 "ON"), and the bench has a tested hardware emergency stop.

- Phase 1: `encode({"TargetRpm": 1500, "Enable": "ON"}, strict=True)` gives `dc05010000000000` for an Intel 16-bit TargetRpm at start 0 and Enable at bit 16. Round-trip: TargetRpm 1500, Enable "ON".
- Phase 2: `cansend vcan0 200#DC05010000000000`; entry marked "bench actuator, hardware emergency stop required".

---

## Exit Criteria

DONE when every requested message is encoded strictly, round-trips, and has a cansend string with the permission note.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `EncodeError` value out of range | **Adjust**: correct the input; never disable strict. |
| Phase 1 | Missing signal error | **Adjust**: ask the user for the value; record any defaulted signal. |
| Phase 1 | Round-trip mismatch beyond one step | **Return**: byte order or signedness defect; run `canb-dbc-byte-order`. |
| Phase 2 | `tx_permission` is "none" and user wants to send | **Stop**: frames stay offline. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
