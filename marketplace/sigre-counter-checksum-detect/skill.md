# Detect Rolling Counters and Checksums

**One-line description:** Tests free-running bit fields for rolling counters by modular step consistency (allowing for frames lost in timestamp gaps) and tests candidate checksum bytes against sum, XOR, CRC-8 SAE J1850 and CRC-8H2F, with CRC RevEng as the fallback search.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `capture_logs` (object, required): Output of `sigre-log-normalize-convert`.
- `candidate_bytes` (object[], required): Output of `sigre-byte-change-count-diff`, plus the free-running bytes listed in `id_inventory` that it excluded.

---

## Outputs

- `counter_checksum_map` (object[]): Per ID: counter field (byte, bit range, width, step, wrap value, match fraction), checksum field (byte, algorithm, parameters, data bytes covered, match fraction), or "none found" with the algorithms tried.

---

## Phase 1: Counter Test

### Entry Criteria
- Free-running bytes are known per ID (from `id_inventory` class "free-running").

### Actions
1. For each free-running byte, test every bit range that is a low nibble (bits 0-3), high nibble (bits 4-7), full byte, and 2-bit or 3-bit field at the byte's low end.
2. Save as `~/canre/counter.py` and run `python ~/canre/counter.py norm/FILE.log 1A0 6`:
   ```
   import re, sys, numpy as np
   rx = re.compile(r"^\(([\d.]+)\) \S+ ([0-9A-F]+)#([0-9A-F]*)$")
   f, cid, bi = sys.argv[1], sys.argv[2], int(sys.argv[3])
   T, V = [], []
   for l in open(f):
       m = rx.match(l.strip())
       if m and m[2] == cid: T.append(float(m[1])); V.append(bytes.fromhex(m[3])[bi])
   T, V = np.array(T), np.array(V); per = np.median(np.diff(T)); k = np.rint(np.diff(T) / per).astype(int)
   for lo, w in ((0, 4), (4, 4), (0, 8), (0, 2), (0, 3)):
       x = (V >> lo) & ((1 << w) - 1); d = np.diff(x) % (1 << w)
       for s in range(1, 1 << w):
           ok = np.mean(d == (s * k) % (1 << w))
           if ok > 0: print("bits %d-%d step %d match %.4f" % (lo, lo + w - 1, s, ok))
   ```
   The `k` term counts how many periods passed between two frames, so a frame lost in the log does not count as a counter error.
3. Read the output: the counter is the field and step with the highest match fraction. Report the fraction; do not round it up. A fraction below 1 means either lost frames not explained by gaps or the field is not a counter.

### Output
Counter candidates per ID with match fraction.

### Quality Gate
- Every free-running byte has a printed result or a "no step matched" note.
- The selected counter row shows its match fraction from the script output.

---

## Phase 2: Checksum Test

### Entry Criteria
- Counters located (so the checksum test includes them as data).

### Actions
1. Candidate checksum bytes are free-running bytes that are not counters, typically the first or last byte of the payload.
2. Test these algorithms over all other payload bytes, in byte order 0..N-1 excluding the candidate:

| Name | Definition |
|---|---|
| sum8 | sum of bytes mod 256 |
| sum8 inverted | 255 minus sum8 |
| xor8 | XOR of bytes |
| CRC-8 SAE J1850 | poly 0x1D, init 0xFF, xorout 0xFF, no reflection (SAE J1850; also listed in the AUTOSAR CRC library specification) |
| CRC-8H2F | poly 0x2F, init 0xFF, xorout 0xFF, no reflection (AUTOSAR CRC library specification) |

3. Run each variant with and without the low byte of the arbitration ID prepended, and with and without the ID high byte; some designs include an ID or a data ID in the computation.
4. Save as `~/canre/cksum.py` and run `python ~/canre/cksum.py norm/FILE.log 1A0 7` (ID, checksum byte index):
   ```
   import re, sys
   rx = re.compile(r"^\(([\d.]+)\) \S+ ([0-9A-F]+)#([0-9A-F]*)$")
   f, cid, ci = sys.argv[1], sys.argv[2], int(sys.argv[3])
   def crc8(data, poly, init, xorout):
       c = init
       for b in data:
           c ^= b
           for _ in range(8):
               c = ((c << 1) ^ poly) & 0xFF if c & 0x80 else (c << 1) & 0xFF
       return c ^ xorout
   algs = {"sum8": lambda d: sum(d) & 0xFF, "sum8_inv": lambda d: 0xFF - (sum(d) & 0xFF),
           "xor8": lambda d: __import__("functools").reduce(lambda a, b: a ^ b, d, 0),
           "crc8_j1850": lambda d: crc8(d, 0x1D, 0xFF, 0xFF), "crc8_h2f": lambda d: crc8(d, 0x2F, 0xFF, 0xFF)}
   idv = int(cid, 16); pre = {"none": b"", "id_lo": bytes([idv & 0xFF]), "id_hi_lo": bytes([idv >> 8 & 0xFF, idv & 0xFF])}
   msgs = [bytes.fromhex(m[3]) for m in (rx.match(l.strip()) for l in open(f)) if m and m[2] == cid]
   for pn, p in pre.items():
       for an, fn in algs.items():
           ok = sum(fn(p + d[:ci] + d[ci + 1:]) == d[ci] for d in msgs) / len(msgs)
           print("%-12s %-8s %.4f" % (an, pn, ok))
   ```
5. If no variant reaches a full match, use CRC RevEng: put the checksum byte last in each message (reorder bytes if it is first), take a sample of distinct messages, and run `reveng -w 8 -s <hex1> <hex2> <hex3> ...`. For a 4-bit checksum use `-w 4`. Read `reveng -h` for the bit order options before using them.

### Output
Checksum algorithm per ID or "none found".

### Quality Gate
- The accepted algorithm shows a printed match fraction across every frame of the ID in the log.
- "None found" entries list every algorithm and variant tried.

---

## Phase 3: Emit the Map

### Entry Criteria
- Phases 1 and 2 ran for every ID with free-running bytes.

### Actions
1. Write `counter_checksum_map` rows.
2. Mark counter and checksum bits as reserved; later flows must not treat them as physical signals.
3. Never use a found checksum to build frames for sending; this map is for decoding and DBC completeness only.

### Output
`counter_checksum_map`.

### Quality Gate
- Every row names byte, bit range and the match fraction.
- Every ID with a checksum also lists the bytes it covers.

---

## Worked Example

Illustrative only.

```
$ python ~/canre/counter.py norm/20261021_parked.log 1A0 6
bits 0-3 step 1 match 1.0000
bits 0-7 step 1 match 0.0623
$ python ~/canre/cksum.py norm/20261021_parked.log 1A0 7
sum8         none     0.0041
sum8_inv     none     0.0038
xor8         none     0.0039
crc8_j1850   none     1.0000
crc8_h2f     none     0.0040
...
```

Result: 0x1A0 byte 6 bits 0-3 rolling counter step 1 wrap 16; byte 7 CRC-8 SAE J1850 over bytes 0-6.

---

## Exit Criteria

DONE when every free-running byte is explained as a counter, a checksum with a named algorithm, or recorded as unexplained with the tests run.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Match fraction near but not equal to 1 | **Adjust**: check for log drops in that window; report the fraction as is. |
| Phase 2 | No algorithm matches | **Adjust**: run reveng; if it finds no model, record "unexplained" and keep the byte reserved. |
| Phase 2 | reveng reports several models | **Adjust**: test each on the full log with `crc8` and keep only the one with a full match. |
| Phase 3 | Someone asks to use the checksum to send frames | **Stop**: this domain never transmits on a vehicle. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
