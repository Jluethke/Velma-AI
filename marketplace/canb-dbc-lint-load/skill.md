# DBC Load and Lint with cantools

**One-line description:** Loads a DBC file with cantools in strict mode, lists every message and signal with its layout from `cantools dump`, and records parse errors, overlapping signals, out-of-frame signals and missing units before any decoding is trusted.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dbc_file` (string, required): Path to the DBC file. Its origin (OEM, supplier, community, self-written) must be recorded.

---

## Outputs

- `dbc_report` (object): cantools version, load result, message count, per-message summary (frame ID, name, length, cycle time attribute if present, sender), the list of problems found, and the byte order and multiplexing inventory.

---

## Phase 1: Strict Load

### Entry Criteria
- `dbc_file` exists and is readable.

### Actions
1. `python3 -m pip install cantools`; record `python3 -c "import cantools; print(cantools.__version__)"`.
2. Load strictly in Python: `db = cantools.database.load_file(dbc_file, strict=True)`. Strict mode raises on overlapping signals and signals that do not fit in the frame.
3. If it raises, copy the exception text into `dbc_report.problems`, then load again with `strict=False` only to continue the inventory. Never use a non-strict load for production decoding without recording why.
4. Check the file encoding: DBC files are often cp1252. If load fails with a decode error, retry with `encoding="cp1252"` and record it.

### Output
Loaded database or the recorded error.

### Quality Gate
- Strict load result (pass or the exception text) is recorded.
- Version of cantools is recorded.

---

## Phase 2: Inventory

### Entry Criteria
- Database loaded (strict or not).

### Actions
1. Run `cantools dump <dbc_file>` and save the output. For each message it prints the ID, length, senders, cycle time when the GenMsgCycleTime attribute exists, an ASCII bit-layout diagram, and the signal tree.
2. For every message record: `frame_id` (hex), `name`, `length`, `is_extended_frame`, `senders`, `cycle_time` (None if absent).
3. For every signal record: `name`, `start`, `length`, `byte_order` ("little_endian" = Intel, `@1` in the DBC; "big_endian" = Motorola, `@0`), `is_signed`, `scale`, `offset`, `minimum`, `maximum`, `unit`, `choices` (value table), and whether it is a multiplexer or multiplexed (`multiplexer_ids`).
4. Count messages that use big-endian signals, multiplexing, or value tables; those need `canb-dbc-byte-order` and `canb-dbc-mux-valuetables`.

### Output
Inventory tables.

### Quality Gate
- Message count in the inventory equals `len(db.messages)`.
- Every signal has byte order, signedness, scale and offset recorded.

---

## Phase 3: Lint

### Entry Criteria
- Inventory done.

### Actions
1. Flag these problems (each is checkable from the inventory):
   - signal with no unit where scale is not 1;
   - `minimum`/`maximum` both 0 (common placeholder meaning "not set");
   - message with no sender;
   - duplicate frame IDs;
   - signal names that collide after case folding;
   - cycle time missing on a message that the user says is periodic.
2. Do not "fix" the DBC in this flow. List problems; changes are the DBC owner's decision.

### Output
`dbc_report`.

### Quality Gate
- Each problem names the message and signal.
- The report states whether strict load passed.

---

## Worked Example

Illustrative. Input: `vehicle_bench.dbc` (self-written).

- Phase 1: cantools 39.4.x; strict load raises `The signal WheelSpeedFL does not fit in message WheelSpeeds.` Recorded; non-strict load used for inventory.
- Phase 2: `cantools dump` shows 12 messages; WheelSpeeds 0x1A0, length 8, cycle 20 ms, four big-endian 16-bit signals.
- Phase 3: problems: WheelSpeedFL start bit places it past byte 7; EngineTemp has scale 0.5 and no unit.

---

## Exit Criteria

DONE when `dbc_report` records the strict load result, a full inventory, and a problem list naming each message and signal.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `UnicodeDecodeError` | **Retry**: load with `encoding="cp1252"`. |
| Phase 1 | Parse error at a line | **Return**: report the line; do not edit the DBC silently. |
| Phase 2 | `cantools dump` fails but Python load works | **Adjust**: build the inventory from `db.messages` in Python. |
| Phase 3 | User asks to auto-fix problems | **Return**: list proposed edits for the DBC owner instead. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
