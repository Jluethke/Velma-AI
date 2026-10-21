# Bit-Level Signal Boundary Search

**One-line description:** Finds the start bit, length and significance order of each candidate signal from per-bit toggle counts and a carry test (a more significant bit only toggles when every less significant bit below it toggles too), and marks boundaries the capture could not resolve.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `capture_logs` (object, required): Output of `sigre-log-normalize-convert`.
- `candidate_bytes` (object[], required): Output of `sigre-byte-change-count-diff`.
- `counter_checksum_map` (object[], required): Output of `sigre-counter-checksum-detect`; its bits are excluded.

---

## Outputs

- `bit_fields` (object[]): Per candidate signal: ID, the active bits as global indexes (`byte*8 + bit`, bit 0 = least significant bit of byte 0), the significance order from least to most significant, toggle counts, the type (single-bit flag, multi-bit enum, numeric), and `boundary_resolved` true or false with the reason.

---

## Phase 1: Toggle Counts per Global Bit

### Entry Criteria
- `candidate_bytes` has at least one strict or ranked row.

### Actions
1. For each candidate ID, collect frames from all action windows of the target label (use `segments.tsv`).
2. Save as `~/canre/bits.py` and run `python ~/canre/bits.py norm/FILE.log 2C4 T_START T_END`:
   ```
   import re, sys, numpy as np
   rx = re.compile(r"^\(([\d.]+)\) \S+ ([0-9A-F]+)#([0-9A-F]*)$")
   f, cid, a, b = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
   rows = [bytes.fromhex(m[3]) for m in (rx.match(l.strip()) for l in open(f)) if m and m[2] == cid and a <= float(m[1]) <= b]
   B = np.unpackbits(np.frombuffer(b"".join(rows), dtype=np.uint8).reshape(len(rows), -1), axis=1, bitorder="little")
   X = np.diff(B, axis=0) != 0
   tog = X.sum(axis=0)
   print("bit toggles:", {i: int(t) for i, t in enumerate(tog) if t})
   act = [i for i, t in enumerate(tog) if t]
   for j in act:
       best = max(((X[:, i] & X[:, j]).sum() / X[:, j].sum(), i) for i in act if i != j and tog[i] >= tog[j]) if any(tog[i] >= tog[j] for i in act if i != j) else None
       if best: print("carry: when bit %d toggles, bit %d also toggles in %.3f of cases" % (j, best[1], best[0]))
   ```
   The carry print names, for each bit, the more frequently toggling bit that most often toggles with it. In a field that changes by one step at a time this fraction is 1; in a field that sometimes jumps several steps it is lower. Report the fraction; do not apply a cutoff.
   `bitorder="little"` makes column `i` equal global bit `i` with bit 0 the least significant bit of byte 0, matching the DBC Intel numbering.
3. Remove bits listed in `counter_checksum_map`.

### Output
Toggle counts and carry pairs per ID.

### Quality Gate
- Every candidate byte's bits appear in the toggle print or are recorded as zero toggles.
- Counter and checksum bits are absent from the remaining list.

---

## Phase 2: Assemble Fields

### Entry Criteria
- Toggle counts and carry pairs exist.

### Actions
1. Classify with this table:

| Evidence | Field type |
|---|---|
| One bit toggles, aligned with action start and end, no carry partners | single-bit flag |
| A few bits toggle together, values jump between a small set (check with `sigre-endianness-signedness-test` later) | multi-bit enum |
| Many bits toggle, toggle count falls as significance rises, carry pairs chain bits together | numeric |

2. For a numeric field, do not sort bits by toggle count alone. Inside one byte, significance always follows the bit index in both Intel and Motorola layouts (bit 0 of the byte is the lowest). Toggle counts and the carry print are needed only to decide which byte holds the more significant part and where the field ends. When a field moves several steps per frame, its lowest bits toggle in roughly half the frames and carry little order information; read the top bits of each byte instead: toggle counts fall steadily toward the top of the low byte and continue falling in the high byte, and the carry print links the lowest active bit of the high byte to a top bit of the low byte.
3. Read the order across bytes: if the chain continues from bit 7 of byte n to bit 0 of byte n+1, the layout is little endian (Intel); if it continues from bit 7 of byte n+1 to bit 0 of byte n (that is, byte n holds the more significant part), the layout is big endian (Motorola). Record which, as a hypothesis for the next flow.
4. Upper boundary: if the most significant active bit sits next to bits that never toggled, the true field may be longer. Set `boundary_resolved` false unless a neighbor bit belongs to another known field (counter, checksum, another signal) or the physical range in the capture should have reached it.

### Output
Assembled field list with order and resolution flags.

### Quality Gate
- Every numeric field lists bits in significance order, with the toggle counts and the carry line that decide which byte is more significant.
- Every field with `boundary_resolved` false states which neighbor bit is unproven.

---

## Phase 3: Resolve or Flag Boundaries

### Entry Criteria
- Assembled fields exist.

### Actions
1. For unresolved fields, check other captures (driving segments cover a larger range for speed-like signals) and rerun Phase 1 on them.
2. If still unresolved, keep the observed active bits as the field and record the open question; do not extend to a byte boundary just because it looks tidy.
3. Emit `bit_fields`.

### Output
`bit_fields`.

### Quality Gate
- Each field has a type, a bit list, an order, and `boundary_resolved` with a reason.
- No field overlaps a counter or checksum bit.

---

## Worked Example

Illustrative only.

```
$ python ~/canre/bits.py norm/20261021_drive.log 2C4 1729507000 1729507300
bit toggles: {0: 35, 1: 18, 2: 9, 3: 4, 8: 8840, 9: 4420, 10: 2210, 11: 1105, 12: 553, 13: 276, 14: 139, 15: 69}
carry: when bit 9 toggles, bit 8 also toggles in 0.998 of cases
...
carry: when bit 0 toggles, bit 15 also toggles in 1.000 of cases
carry: when bit 3 toggles, bit 2 also toggles in 1.000 of cases
```

Reading: within byte 1 counts fall from bit 8 up to bit 15, and they keep falling into bit 0 of byte 0; the carry print links bit 0 to bit 15. So the order runs up through global bit 15, then continues into bit 0 (byte 0). Byte 0 holds the more significant part: big endian (Motorola) numeric field. Active bits 8-15 and 0-3 (12 bits). Bits 4-7 of byte 0 never toggled and belong to no known field, so `boundary_resolved` = false: the field may be up to 16 bits; recheck with a higher-speed capture.

---

## Exit Criteria

DONE when every candidate signal has a typed field with a carry-proven bit order or a flagged open boundary, and no field overlaps counter or checksum bits.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Too few frames in the window for carries | **Adjust**: combine all repetitions of the action into one run. |
| Phase 2 | Carry chain breaks into two chains in one ID | **Adjust**: treat as two fields; confirm each against its own action. |
| Phase 2 | Noise toggles the low bits in rests | **Adjust**: keep them; low bits of a sensor are often noisy, the carry chain still holds. |
| Phase 3 | Boundary unresolved after all captures | **Return**: record it as an open question in the confidence report; recapture a wider physical range if possible. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
