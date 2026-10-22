# Differential Fault Analysis

Apply differential fault analysis to recover secret keys from faulted cryptographic computations, using pairs of correct and faulted outputs to constrain key hypotheses.

## Inputs

- `injection-platform`: Configured fault injection setup
- `fault-sensitivity-map`: Parameter ranges for repeatable faults

## Outputs

- `dfa-key-recovery`: Recovered key bytes from DFA, number of fault pairs required, remaining key entropy
- `fault-model-characterization`: Observed fault model: single-bit, single-byte, random, stuck-at, with statistical distribution

## Process

1. For AES DFA (Piret-Quisquater attack): inject faults in round 8 (penultimate round) of AES-128. A single-byte fault in one state byte before MixColumns in round 8 affects 4 bytes of the round 9 output. With 2 correct/faulted pairs targeting different state columns, all 16 bytes of the round key can be recovered.
2. Collect correct/faulted output pairs: for each fault injection, record both the correct ciphertext (from an unfaulted run with the same input) and the faulted ciphertext. The input plaintext must be identical for each pair.
3. For each faulted pair, compute the difference in the ciphertext. The difference propagates through the last round's SubBytes and ShiftRows. For each key byte hypothesis (256 possibilities), check if the inverse operation produces a difference pattern consistent with the known fault model (single byte difference before MixColumns).
4. Intersect key hypotheses across multiple fault pairs. With a single-byte fault model, 2 pairs typically reduce the key space from 2^128 to a unique key. With noisier fault models (multi-byte corruption), more pairs are needed.
5. Verify the recovered key by encrypting a test plaintext and comparing to the device output. Document the fault model (which bytes were corrupted, single-bit vs byte-level, bias in fault values) for countermeasure design.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
