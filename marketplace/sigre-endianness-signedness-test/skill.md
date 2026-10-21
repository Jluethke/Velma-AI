# Endianness and Signedness Test

**One-line description:** Decodes each numeric field under little endian (Intel) and big endian (Motorola) layouts and under unsigned, two's complement and sign-magnitude readings, and picks the hypothesis whose time series is continuous, using the DBC start-bit convention for each layout.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `capture_logs` (object, required): Output of `sigre-log-normalize-convert`.
- `bit_fields` (object[], required): Output of `sigre-bit-boundary-search`.
- `capture_plan` (object, required): Output of `sigre-capture-plan-labeled-actions`; tells whether the physical quantity crosses zero during an action (steering through center, accelerating then braking).

---

## Outputs

- `typed_fields` (object[]): Per field: ID, byte order (`@1` Intel or `@0` Motorola), DBC start bit, length, value type (`+` unsigned or `-` signed two's complement, or sign-magnitude noted), the smoothness score for every hypothesis tested, and the raw value series file path.

---

## Phase 1: Build Both Layouts

### Entry Criteria
- `bit_fields` has numeric fields.

### Actions
1. Know the DBC conventions (Vector DBC format, as implemented by cantools):
   - Intel (`@1`): start bit = global index of the least significant bit; the field grows to higher global indexes.
   - Motorola (`@0`): start bit = global index of the most significant bit; the field walks down within a byte (bit 7 to bit 0) and continues at bit 7 of the next byte.
2. Save as `~/canre/layout.py`:
   ```
   import re, sys, numpy as np
   rx = re.compile(r"^\(([\d.]+)\) \S+ ([0-9A-F]+)#([0-9A-F]*)$")
   def moto(msb, n):
       out, p = [], msb
       for _ in range(n):
           out.append(p)
           p = p + 15 if p % 8 == 0 else p - 1
       return out
   def intel(lsb, n):
       return [lsb + k for k in range(n)][::-1]
   def series(f, cid, bits):
       T, V = [], []
       for l in open(f):
           m = rx.match(l.strip())
           if m and m[2] == cid:
               d = int.from_bytes(bytes.fromhex(m[3]), "little")
               v = 0
               for b in bits: v = (v << 1) | ((d >> b) & 1)
               T.append(float(m[1])); V.append(v)
       return np.array(T), np.array(V, dtype=np.int64)
   f, cid, order, start, n = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
   bits = moto(start, n) if order == "moto" else intel(start, n)
   T, U = series(f, cid, bits)
   S = np.where(U >= 1 << (n - 1), U - (1 << n), U)
   M = np.where(U >= 1 << (n - 1), -(U - (1 << (n - 1))), U)
   for name, X in (("unsigned", U), ("twos", S), ("signmag", M)):
       print("%s %s start=%d len=%d jump_sum=%d max_jump=%d" % (order, name, start, n, np.abs(np.diff(X)).sum(), np.abs(np.diff(X)).max()))
   np.savetxt("work/%s_%s_%d_%d.tsv" % (cid, order, start, n), np.c_[T, U, S], fmt="%.6f\t%d\t%d")
   ```
   `int.from_bytes(..., "little")` makes bit `b` of the integer equal global bit `b`. `bits` is listed from most to least significant.
3. For each field, derive both start bits from `bit_fields`: Intel start = the least significant active bit; Motorola start = the most significant active bit.

### Output
Layout script and start bits per hypothesis.

### Quality Gate
- Both hypotheses have a start bit and length written down per field.
- For Motorola, `moto(start, n)` returns a list whose last element is the field's least significant bit from `bit_fields` (print it to check).

---

## Phase 2: Score Hypotheses

### Entry Criteria
- Start bits known.

### Actions
1. Run both layouts on the action windows and driving logs: `python ~/canre/layout.py norm/FILE.log 2C4 moto 3 12` and `python ~/canre/layout.py norm/FILE.log 2C4 intel 8 12`.
2. Read `jump_sum` (sum of absolute frame-to-frame changes) and `max_jump`. A wrong byte order produces large jumps whenever a carry crosses the byte boundary. Pick the layout with the smaller `jump_sum`; record both numbers.
3. Signedness by the plan: if `capture_plan` says the quantity crosses zero, the correct reading has no jump near zero. Unsigned values that flip between near 0 and near `2^n - 1` mean two's complement; flips between near 0 and near `2^(n-1)` mean sign-magnitude. If the quantity never crosses zero in any capture, record signedness as unknown; do not default to signed or unsigned silently.
4. If both layouts score the same (field within one byte), the byte order does not matter for decoding; record `@1` and note it.

### Output
Chosen order and type per field with scores.

### Quality Gate
- Each field lists `jump_sum` for every hypothesis tested.
- Signedness is "unsigned", "twos", "signmag" or "unknown", with the capture that decided it.

---

## Phase 3: Emit

### Entry Criteria
- Scores recorded.

### Actions
1. For each field write `typed_fields`: ID, order, DBC start bit for the chosen order, length, type, scores, series file.
2. Keep the raw series file `work/<id>_<order>_<start>_<len>.tsv` for the regression flow.

### Output
`typed_fields`.

### Quality Gate
- Every numeric field from `bit_fields` has a row.
- Every row points to an existing series file (`ls` it).

---

## Worked Example

Illustrative only.

```
$ python ~/canre/layout.py norm/20261021_drive.log 2C4 moto 3 12
moto unsigned start=3 len=12 jump_sum=18210 max_jump=7
moto twos start=3 len=12 jump_sum=18210 max_jump=7
...
$ python ~/canre/layout.py norm/20261021_drive.log 2C4 intel 8 12
intel unsigned start=8 len=12 jump_sum=1904388 max_jump=3841
```

Motorola wins by two orders of magnitude. Speed never goes negative, so the twos and unsigned rows match; signedness `unsigned` recorded from the plan (speed is non-negative), with the note that the top bit was never set.

---

## Exit Criteria

DONE when every numeric field has a chosen byte order with DBC start bit, a signedness with its evidence, and a raw series file.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `moto()` check does not end at the expected LSB | **Adjust**: recheck the MSB start bit; Motorola start is the MSB in the sawtooth numbering. |
| Phase 2 | Both layouts jump | **Return**: the bit set is wrong; rerun `sigre-bit-boundary-search`. |
| Phase 2 | Quantity never crosses zero | **Adjust**: record signedness unknown; add a crossing action to the next capture plan if safe and passive. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
