# Puf Design Enrollment

Design and implement a physically unclonable function for device-unique key generation: PUF cell selection, characterization, enrollment with error correction, and reliability verification across environmental conditions.

## Inputs

- `tpm-se-selection`: Root of trust component selection and integration
- `integration-design`: System integration architecture

## Outputs

- `puf-design`: PUF type, cell count, error correction scheme, enrollment procedure, helper data storage
- `puf-reliability-data`: Bit error rate vs. temperature and voltage, uniqueness (inter-device Hamming distance), stability over time

## Process

1. Select PUF type: SRAM PUF (power-up state of uninitialized SRAM, most widely used, reuses existing memory), arbiter PUF (race condition between delay paths, higher uniqueness per area but requires careful layout), ring oscillator PUF (frequency comparison, simple to implement in FPGA). SRAM PUF is the default choice for ASIC due to zero additional silicon area if SRAM already exists.
2. Characterize PUF: measure the response across N devices (minimum 100 for statistical significance). Compute inter-device Hamming distance (should be near 50% for maximum uniqueness) and intra-device Hamming distance across temperature (-40C to +125C for automotive) and voltage (Vdd +/-10%). Intra-device distance determines the raw bit error rate (BER).
3. Design error correction: given raw BER (typically 5-15% for SRAM PUF across full temperature range), select a fuzzy extractor. Scheme: during enrollment, generate a random key, XOR with PUF response to create helper data (stored in non-volatile memory, public). During reconstruction, read PUF response, XOR with helper data, apply error correction (BCH or repetition code) to recover the key. Helper data must not leak information about the key (information-theoretic security of the fuzzy extractor).
4. Enrollment procedure: power-cycle the device multiple times (minimum 10) at enrollment temperature. Identify stable bits (same value every time) vs unstable bits (flip between readings). Use stable bits preferentially or increase redundancy for unstable regions. Store helper data and a hash of the derived key for verification.
5. Verify across lifecycle: re-derive the key at temperature and voltage corners. Verify bit-exact match after error correction. Perform aging test (1000+ hours at elevated temperature) and re-verify. Document the BER margin: how close is the corrected BER to the code's correction capability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
