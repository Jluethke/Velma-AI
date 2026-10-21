# Write DBC Message and Signal Entries

**One-line description:** Writes `BO_` and `SG_` entries for each decoded message in Vector DBC syntax (decimal IDs, extended-ID flag bit, Motorola versus Intel start bits, sign, factor, offset, range, unit), adds counter and checksum fields, value tables for states, and per-signal comments that carry the evidence.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `scaled_signals` (object[], required): Output of `sigre-scale-offset-regression`.
- `typed_fields` (object[], required): Output of `sigre-endianness-signedness-test`; also holds unscaled fields and state fields.
- `counter_checksum_map` (object[], required): Output of `sigre-counter-checksum-detect`.
- `existing_dbc` (string, optional): Path to a DBC the user already keeps for this vehicle. It is never edited in place; a copy is extended.

---

## Outputs

- `dbc_draft` (object): Path to `work/vehicle_re.dbc`, the list of messages and signals added, and a diff against `existing_dbc` when one was given.

---

## Phase 1: Prepare the File

### Entry Criteria
- At least one field in `typed_fields`.

### Actions
1. If `existing_dbc` is given, copy it: `cp existing.dbc work/vehicle_re.dbc`. Never write to the original.
2. Otherwise create `work/vehicle_re.dbc` with this header (each keyword on its own line; the blank lines matter to some parsers):
   ```
   VERSION ""

   NS_ :

   BS_:

   BU_:

   ```
3. Naming: message names `ID_<HEX>` until the sending module is known; signal names in CamelCase with no spaces (for example `VehicleSpeed`, `BrakePedalPressed`, `Counter_2C4`, `Checksum_2C4`). DBC identifiers allow letters, digits and underscores and must not start with a digit.

### Output
DBC file ready for entries.

### Quality Gate
- `python -c "import cantools; cantools.database.load_file('work/vehicle_re.dbc')"` exits without error on the header or copy.
- The original `existing_dbc` file's checksum (`sha256sum`) is unchanged.

---

## Phase 2: Write Entries

### Entry Criteria
- File loads.

### Actions
1. One `BO_` line per ID: `BO_ <decimal id> ID_<HEX>: <dlc> Vector__XXX`. For 29-bit IDs, the decimal id is the ID OR 0x80000000 (the DBC extended flag).
2. One `SG_` line per field, indented by one space:
   `SG_ <Name> : <start>|<length>@<order><sign> (<factor>,<offset>) [<min>|<max>] "<unit>" Vector__XXX`
   - `<order>` is `1` for Intel (start = least significant bit) and `0` for Motorola (start = most significant bit), from `typed_fields`.
   - `<sign>` is `+` unsigned or `-` two's complement. Sign-magnitude has no DBC sign code; write `+` for the magnitude bits and a separate one-bit sign signal, and note it in a comment.
   - Unscaled fields: factor 1, offset 0, unit `""`, range = raw range.
3. Counter: `SG_ Counter_<HEX> : <start>|<len>@1+ (1,0) [0|<2^len-1>] "" Vector__XXX`. Checksum likewise named `Checksum_<HEX>`.
4. State fields: add value tables, `VAL_ <decimal id> <SignalName> 0 "Released" 1 "Pressed" ;`, using the states seen in the capture labels only.
5. Comments carrying evidence, after all `BO_` blocks:
   `CM_ SG_ <decimal id> <SignalName> "action=<label>; ref=<source>; r2=<value>; lag_s=<value>; boundary_resolved=<true|false>";`
   For checksums include the algorithm, for example `"CRC-8 SAE J1850 over bytes 0-6"`.

### Output
Entries written.

### Quality Gate
- Every field in `typed_fields` and every counter and checksum in `counter_checksum_map` has an `SG_` line: count with `grep -c '^ SG_' work/vehicle_re.dbc`.
- Every `SG_` has a `CM_ SG_` comment line.

---

## Phase 3: Load Check

### Entry Criteria
- Entries written.

### Actions
1. Run `python -c "import cantools; db=cantools.database.load_file('work/vehicle_re.dbc'); print(len(db.messages))"`. cantools loads in strict mode by default and raises on overlapping signals or signals beyond the message length.
2. Run `cantools dump work/vehicle_re.dbc` and read each message's bit layout diagram: each signal's bits must sit where `typed_fields` placed them.
3. If `existing_dbc` was given, write the diff: `diff -u existing.dbc work/vehicle_re.dbc > work/dbc.diff`.
4. Emit `dbc_draft`.

### Output
`dbc_draft`.

### Quality Gate
- The load command prints the message count without an exception.
- The `cantools dump` layout for each message matches the bit positions in `typed_fields`.

---

## Worked Example

Illustrative only.

```
BO_ 708 ID_2C4: 8 Vector__XXX
 SG_ VehicleSpeed : 3|12@0+ (0.01,0.0049) [0.0049|40.9549] "km/h" Vector__XXX

BO_ 416 ID_1A0: 8 Vector__XXX
 SG_ Counter_1A0 : 48|4@1+ (1,0) [0|15] "" Vector__XXX
 SG_ Checksum_1A0 : 56|8@1+ (1,0) [0|255] "" Vector__XXX

BO_ 944 ID_3B0: 8 Vector__XXX
 SG_ BrakePedalPressed : 0|1@1+ (1,0) [0|1] "" Vector__XXX

CM_ SG_ 708 VehicleSpeed "action=drive_speed; ref=gps; r2=0.999731; lag_s=0.34; boundary_resolved=false";
CM_ SG_ 416 Checksum_1A0 "CRC-8 SAE J1850 over bytes 0-6";
VAL_ 944 BrakePedalPressed 0 "Released" 1 "Pressed" ;
```

`cantools dump` shows `VehicleSpeed` occupying byte 0 bits 3-0 and byte 1 bits 7-0.

---

## Exit Criteria

DONE when a copy-based DBC loads in cantools strict mode, every decoded field, counter and checksum has an `SG_` with an evidence comment, and state fields have value tables.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Existing DBC fails to load | **Stop**: report the cantools error; do not "fix" the user's file. |
| Phase 3 | cantools reports overlapping signals | **Return**: two fields share bits; recheck `sigre-bit-boundary-search`. |
| Phase 3 | Signal outside message length | **Adjust**: wrong Motorola start bit (start must be the MSB); recompute from `typed_fields`. |
| Phase 3 | Dump layout differs from `typed_fields` | **Adjust**: fix the `SG_` start or order; never edit `typed_fields` to match the file. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
