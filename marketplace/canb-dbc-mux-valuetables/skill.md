# DBC Multiplexed Signals and Value Tables

**One-line description:** Reads multiplexer (M), multiplexed (mN) and extended-multiplexing (SG_MUL_VAL_) definitions and VAL_ value tables in a DBC, checks how cantools decodes them, and verifies that every multiplexer value seen on the bus is defined.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dbc_file` (string, required): The DBC file.
- `dbc_report` (object, required): From `canb-dbc-lint-load`; lists multiplexed messages and signals with choices.
- `candump_log` (string, required): A log containing the multiplexed messages.

---

## Outputs

- `mux_report` (object): Per multiplexed message: the multiplexer signal, the defined mux values and their signals, mux values seen on the bus but undefined, and per value-table signal: the table and any raw values seen without a label.

---

## Phase 1: Read the Definitions

### Entry Criteria
- `dbc_report` loaded.

### Actions
1. In the DBC text, a multiplexer signal has `M` after its name: `SG_ PageId M : 0|8@1+ (1,0) [0|255] "" ECU`.
2. A multiplexed signal has `m<value>`: `SG_ CellVolt1 m0 : 8|16@1+ (0.001,0) [0|65.535] "V" ECU` is present only when PageId == 0.
3. Extended multiplexing (a signal that is both multiplexed and a multiplexer, written `m0M`, or ranges via `SG_MUL_VAL_`) is supported by cantools; confirm in `cantools dump` output, which prints a tree under the multiplexer.
4. Value tables: `VAL_ 416 Gear 0 "P" 1 "R" 2 "N" 3 "D" ;` (the message ID is written in decimal: 416 = 0x1A0; extended IDs also carry bit 0x80000000). In cantools these are `signal.choices`.
5. In Python: `msg.is_multiplexed()`, `sig.is_multiplexer`, `sig.multiplexer_ids`, `sig.multiplexer_signal`.

### Output
Table of multiplexers, mux values and value tables.

### Quality Gate
- Every multiplexed signal lists the mux value(s) it belongs to.
- Every value table is copied with all its entries.

---

## Phase 2: Decode Against the Log

### Entry Criteria
- Definitions tabulated.

### Actions
1. Decode the log: `cat <candump_log> | python3 -m cantools decode <dbc_file>`. cantools reads candump lines from stdin and prints decoded signals; by default it prints choice labels. Check `python3 -m cantools decode --help` for options such as single-line output and disabling choice decoding.
2. In Python: `db.decode_message(id, data, decode_choices=True)` returns labels (as `NamedSignalValue` objects in recent versions) for table values; `decode_choices=False` returns raw numbers.
3. For each multiplexed message, collect the set of multiplexer raw values seen in the log. Any value not in the DBC causes a decode error (`cantools` raises an error naming the multiplexer). Record those values.
4. For each value-table signal, collect raw values seen; values with no label decode as plain numbers. Record them.

### Output
`mux_report`.

### Quality Gate
- Undefined mux values list is present (empty is a valid result).
- Unlabeled raw values list is present per value-table signal.

---

## Worked Example

Illustrative. Battery monitor message 0x3C0, multiplexer PageId, pages 0..3 defined.

- Phase 1: PageId M; CellVolt1..3 m0; CellVolt4..6 m1; Temps m2; Status m3 with VAL_ table 0 "OK" 1 "WARN" 2 "FAULT".
- Phase 2: log shows PageId values {0,1,2,3,7}. Page 7 fails to decode: listed as undefined. Status raw values {0,1,4}; 4 has no label: listed.

---

## Exit Criteria

DONE when every multiplexed message and value table is tabulated and the undefined values seen on the bus are listed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Extended multiplexing not shown in the dump | **Adjust**: upgrade cantools to a version that documents SG_MUL_VAL_ support and recheck. |
| Phase 2 | Decode raises on an unknown mux value | **Adjust**: record it, catch the exception per frame in Python, and keep decoding the remaining frames; do not add a guessed page to the DBC. |
| Phase 2 | Labels expected but numbers printed | **Retry**: confirm `decode_choices=True` and that the VAL_ ID matches the message ID in decimal. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
