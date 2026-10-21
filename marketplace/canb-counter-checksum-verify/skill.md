# Message Counter and Checksum Verification

**One-line description:** Verifies rolling message counters and per-frame checksums (for example CRC-8 SAE J1850 or an XOR/sum byte) on captured CAN frames against a written algorithm specification, after first proving the checksum implementation against the catalogue check value.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `decoded_signals` (object, required): From `canb-cantools-decode-log`; provides per-frame counter values and the raw log path.
- `dbc_file` (string, required): DBC naming the counter and checksum signals.
- `checksum_spec` (object, required): Per message: counter signal, counter range (for example 0..15), checksum signal, algorithm (CRC parameters width/poly/init/refin/refout/xorout, or "xor"/"sum" with the byte range), which bytes are covered, and any data ID mixed in. Source: the ECU or network specification (for AUTOSAR systems, the AUTOSAR E2E Protocol Specification profile in use). If the spec is unknown, this flow stops.

---

## Outputs

- `integrity_report` (object): Per message: counter step violations (repeats, skips), checksum mismatches with the frame and expected value, the algorithm self-test result, and the spec source.

---

## Phase 1: Prove the Checksum Implementation

### Entry Criteria
- `checksum_spec` has a cited source.

### Actions
1. Implement the algorithm exactly as specified in one function `checksum(data: bytes) -> int`.
2. For CRCs, use a parameterized implementation and test it against the standard check value: the CRC of the ASCII string "123456789" as listed in the CRC RevEng catalogue for that parameter set. Example: CRC-8/SAE-J1850 (width 8, poly 0x1D, init 0xFF, refin false, refout false, xorout 0xFF) has check 0x4B in that catalogue; verify this in the catalogue yourself.
3. Alternatively use a library such as `crcmod` or `crccheck` with the same parameters, and run the same check-value test.
4. Do not continue until the check value matches.

### Output
Self-tested checksum function.

### Quality Gate
- `checksum(b"123456789")` equals the catalogue check value (printed and recorded).

---

## Phase 2: Verify Counters

### Entry Criteria
- Counter signal decoded per frame.

### Actions
1. For each message, in timestamp order, compute `step = (c[i] - c[i-1]) mod (max+1)`.
2. step 1: correct. step 0: repeated counter (stale or duplicated frame). step > 1: `step - 1` frames lost or skipped. Record each with timestamps.
3. Cross-reference skips with the jitter missing-cycle count if `canb-tx-jitter-measure` ran: a skip without a timing gap means the sender skipped a value; a skip with a timing gap means frames were lost.

### Output
Counter violation list.

### Quality Gate
- Count of step-1 transitions plus violations equals frames minus 1, per message.

---

## Phase 3: Verify Checksums

### Entry Criteria
- Phase 1 passed.

### Actions
1. For each frame, build the covered byte sequence exactly as `checksum_spec` says (which bytes, whether the checksum byte is excluded or zeroed, whether a data ID is prepended).
2. Compare computed and received checksum. Record mismatches with frame timestamp, data, received, computed.
3. If every frame mismatches, the coverage or parameters are wrong, not the sender: go to Error Handling.
4. Write `integrity_report`.

### Output
`integrity_report`.

### Quality Gate
- Each mismatch row shows received and computed values.
- The report quotes the spec source.

---

## Worked Example

Illustrative. Message 0x1A0, counter in byte 6 low nibble (0..15), CRC-8/SAE-J1850 over bytes 0..6 in byte 7, per the user's bench ECU specification.

- Phase 1: `checksum(b"123456789")` prints 0x4b; matches the catalogue.
- Phase 2: 3000 frames; 2998 steps of 1; one step of 3 at t=41.220 (two frames missing), confirmed by a 0.060 s timing gap.
- Phase 3: 0 checksum mismatches.

---

## Exit Criteria

DONE when the checksum function passes its check-value test and every frame's counter step and checksum are verified or listed as violations.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No specification for the algorithm | **Stop**: report it as an open question; do not guess or brute-force parameters on someone else's ECU. |
| Phase 1 | Check value mismatch | **Retry**: recheck reflect and xorout parameters. |
| Phase 3 | All frames mismatch | **Adjust**: recheck covered bytes, checksum byte handling and data ID per the spec. |
| Phase 3 | Few frames mismatch | **Return**: report them; they indicate corruption or a sender defect. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
