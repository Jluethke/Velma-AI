# Message Format Extraction

Extract every message format from source code implementing a protocol. For each message type: field names, bit positions, byte ordering, scaling, offset, valid ranges, and integrity field algorithms. Produce a standalone catalog that does not reference the source code.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load key source files containing message logic
REASON  --> Parse construction and parsing functions
PLAN    --> Cross-reference pack/unpack, identify integrity fields
ACT     --> Output message catalog and encoding rules
```

## Inputs

- `key_files`: list[object] -- Source files containing message packing/unpacking logic from implementation-survey

## Outputs

- `message_catalog`: list[object] -- Every message type with fields, bit layout, encoding, valid range, and example values
- `encoding_rules`: object -- Byte order conventions, signedness rules, and scaling patterns used across the protocol

---

## Execution

### OBSERVE: Find Message Functions

1. Scan key files for message construction functions (functions that pack fields into byte arrays).
2. Scan for message parsing functions (functions that extract fields from byte arrays).
3. Scan for constant definitions: message IDs, field masks, scaling factors, default values.

### REASON: Extract Field Layouts

1. For each construction function:
   - Identify every field name and the packing logic (bit shifts, masks, byte positions)
   - Determine byte order (big-endian: high byte first; little-endian: low byte first)
   - Determine signedness (signed vs unsigned, and how negative values are encoded)
   - Extract scaling factor and offset (physical_value = raw_value * scale + offset)
   - Extract valid range (minimum and maximum raw or physical values)

2. For each parsing function:
   - Extract the unpacking logic (inverse of the packing)
   - Cross-reference with the construction side: every packed field should have a matching unpack
   - Mismatches indicate either dead code or undocumented fields

3. Identify integrity fields:
   - Checksum bytes: last byte computed from other bytes
   - Counter fields: incrementing nibbles or bytes
   - Sequence numbers: frame-level ordering
   - Extract the computation algorithm for each integrity field

### PLAN: Build the Catalog

1. For each message type, create a field table:
   ```
   Message: 0x292 (LKAS_COMMAND)  DLC: 6  Rate: 50 Hz
   +------+---+---+---+-------+--------+--------+---------+------+
   | Field|Byte|Bit|Len|Order  |Signed  |Scale   |Offset   |Range |
   +------+---+---+---+-------+--------+--------+---------+------+
   | TORQ | 0 | 2 | 11|big-end|signed  |1       |-1024    |-261..261|
   | CTRL | 2 | 4 | 1 |n/a    |unsigned|1       |0        |0..1  |
   | CNTR | 4 | 7 | 4 |n/a    |unsigned|1       |0        |0..15 |
   | CKSM | 5 | 7 | 8 |n/a    |unsigned|CRC-8   |n/a      |0..255|
   +------+---+---+---+-------+--------+--------+---------+------+
   ```

2. Document encoding rules that apply protocol-wide (not per-message): default byte order, default signedness, common scaling patterns.

### ACT: Deliver

1. Output the message catalog: one entry per message type, with field table and example raw bytes.
2. Output encoding rules as a protocol-level reference.
3. Flag any fields found in construction but not in parsing (write-only) or vice versa (read-only).

## Exit Criteria

1. Every message type in the key files has a field table
2. Every field has bit position, width, encoding, and range
3. Integrity field algorithms are documented
4. The catalog is standalone (no source code references)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
