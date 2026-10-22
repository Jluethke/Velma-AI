# Integrity Field Extraction

Reverse engineer the checksum and counter algorithms protecting messages on a communication bus by testing candidate algorithms against every recorded frame. Accept only algorithms with 100% match rate across the full capture dataset.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load transmitted messages and raw captures
REASON  --> Identify candidate integrity bytes, test algorithms
PLAN    --> Validate candidates against full dataset
ACT     --> Output proven algorithms in implementation-ready form
```

## Inputs

- `transmit_inventory`: list[object] -- Messages transmitted by the target controller with byte-level entropy analysis
- `bus_captures`: list[file] -- Raw recorded traffic for statistical validation (thousands to millions of frames)

## Outputs

- `checksum_algorithms`: list[object] -- For each message with a checksum: the algorithm name, polynomial, init value, XOR-out, byte coverage, and reference implementation
- `counter_formats`: list[object] -- For each message with a counter: bit position, width, increment pattern, wrap value, and behavior on discontinuity
- `validation_report`: object -- Match rate of each recovered algorithm against the full capture dataset

---

## Execution

### OBSERVE: Load and Profile Messages

**Entry criteria:** Transmit inventory and bus captures are provided.

**Actions:**

1. **Identify candidate checksum bytes.** For each message ID, find the byte (or nibble) whose value cannot be predicted from the other bytes alone:
   - Compute the conditional entropy of each byte given all other bytes
   - The byte with the lowest conditional entropy (its value is fully determined by the others) is the checksum
   - Common positions: last byte of the frame, or last nibble of the second-to-last byte

2. **Identify candidate counter fields.** Find nibbles or bytes that increment monotonically:
   - Extract each nibble and byte position across consecutive frames
   - A counter increments by exactly 1 each frame and wraps at a fixed value (typically 15 for 4-bit, 255 for 8-bit)
   - Common position: upper nibble of the second-to-last byte (bits [7:4])

3. **Extract test datasets.** For each message ID, collect at least 1000 frames (or all available if fewer). Split into:
   - Training set (70%): used to identify the algorithm
   - Validation set (30%): used to confirm 100% match

**Output:** Candidate checksum positions, candidate counter positions, test datasets.

---

### REASON: Test Candidate Algorithms

**Entry criteria:** Candidates identified, test datasets ready.

**Actions:**

1. **Test standard CRC algorithms.** For each message with a candidate checksum byte, test in order:
   - XOR of all non-checksum bytes
   - Sum modulo 256 of all non-checksum bytes
   - CRC-8 SAE J1850 (poly 0x1D, init 0xFF, XOR-out 0xFF)
   - CRC-8/AUTOSAR (poly 0x2F, init 0xFF, XOR-out 0xFF)
   - CRC-8/MAXIM (poly 0x31, init 0x00, XOR-out 0x00)
   - Bitwise CRC with custom polynomial (try poly 0x1D with different init/XOR-out combinations)
   - Nibble-wise CRC variants

2. **For each candidate algorithm:**
   - Compute expected checksum for every frame in the training set
   - Compare to the actual checksum byte
   - Record match count and total frame count
   - Accept ONLY if match rate is exactly 100% (every single frame matches)

3. **Test counter behavior.** For each candidate counter field:
   - Verify monotonic increment with wrap (0, 1, 2, ..., N, 0, 1, ...)
   - Determine wrap value (15 for 4-bit, 255 for 8-bit)
   - Check for skips: does the counter ever skip a value? If so, a frame was lost, not a counter error
   - Record the increment rate (should match the message transmission rate)

4. **Handle address-dependent checksums.** Some protocols include the message ID in the checksum computation:
   - If no standard algorithm matches, try including the arbitration ID as the first byte(s) of the checksum input
   - Try including the DLC
   - Try including a fixed address-dependent seed

**Output:** Matched algorithms with parameters, counter specifications.

---

### PLAN: Validate Against Full Dataset

**Entry criteria:** Candidate algorithms identified with 100% training match.

**Actions:**

1. **Run validation.** Apply each identified algorithm to the held-out 30% validation set:
   - Compute expected values for every frame
   - Compare to actual values
   - Any mismatch means the algorithm is WRONG, not "close enough"

2. **Run full-capture validation.** Apply to the ENTIRE capture dataset (all files, all frames):
   - Record total frames tested and match rate
   - A single mismatch requires investigation (corrupted frame? different firmware version? bus error?)

3. **Document edge cases.** For each algorithm:
   - What happens with all-zero data?
   - What happens with all-0xFF data?
   - Is the checksum computed over the DLC or just the data bytes?
   - Does the message ID affect the computation?

**Output:** Validation results per algorithm, edge case documentation.

---

### ACT: Deliver Implementation-Ready Specifications

**Entry criteria:** All algorithms validated at 100%.

**Actions:**

1. **Format checksum specifications.** For each proven algorithm:
   ```
   Message ID: 0x220 (8 bytes)
   Checksum position: byte 7 (last byte)
   Algorithm: CRC-8 SAE J1850
   Polynomial: 0x1D
   Init: 0xFF
   XOR-out: 0xFF
   Input bytes: bytes 0-6 (all except checksum)
   Validation: 100% match across 847,231 frames
   ```

2. **Format counter specifications.** For each proven counter:
   ```
   Message ID: 0x220 (8 bytes)
   Counter position: byte 6, bits [7:4]
   Width: 4 bits
   Wrap value: 15 (0x0F)
   Increment: +1 per frame
   Expected rate: 100 Hz
   ```

3. **Provide reference implementations.** Pseudocode for each algorithm that can be translated to any language. Include test vectors: at least 5 known input/output pairs from the captures.

**Output:** checksum_algorithms, counter_formats, validation_report.

## Exit Criteria

1. Every message with an integrity field has a proven algorithm (100% match on full dataset)
2. Every counter field has a proven format (position, width, wrap value)
3. Reference implementations with test vectors are provided
4. Any unresolved integrity fields are listed with the attempted algorithms and their failure modes

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | No candidate checksum bytes found | Message may not have integrity protection; document as "unprotected" |
| REASON | No standard algorithm matches | Try custom polynomials, address-dependent seeds, nibble-wise variants |
| REASON | Multiple algorithms match training set | Validate both on the full dataset; the wrong one will eventually mismatch |
| PLAN | Validation fails on a few frames | Investigate: bus errors, firmware version changes, or corrupted captures |
| PLAN | Validation fails broadly | Algorithm is wrong; return to REASON with additional candidates |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
