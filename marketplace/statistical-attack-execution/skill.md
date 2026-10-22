# Statistical Attack Execution

Execute statistical side-channel attacks on the acquired trace dataset: simple power analysis for visual key recovery, differential power analysis for statistical distinguishing, and correlation power analysis for efficient key byte extraction.

## Inputs

- `trace-dataset`: Aligned power traces with plaintext/ciphertext pairs
- `alignment-quality-report`: Trace quality metrics

## Outputs

- `attack-results`: Recovered key bytes with confidence metrics, correlation peaks per byte hypothesis, number of traces to disclosure
- `leakage-model`: Identified leakage model: Hamming weight, Hamming distance, or device-specific model with estimated SNR

## Process

1. SPA: Visually inspect mean traces for conditional branches dependent on key bits (RSA square-and-multiply pattern, conditional swap in ECC). Overlay traces for different known inputs to identify data-dependent timing or amplitude.
2. DPA (Kocher's original): Partition traces by a single bit of an intermediate value (e.g., one output bit of the first AES S-box). Compute difference of means between partitions. If the correct key byte hypothesis is used, the difference trace shows a peak at the time the targeted bit is processed. Repeat for all 256 key byte hypotheses.
3. CPA (Brier et al.): For each sample point in the trace and each of 256 key byte hypotheses, compute Pearson correlation between the measured power and a hypothetical intermediate value (Hamming weight of S-box output for AES). The correct key byte produces the highest absolute correlation. Track correlation vs. number of traces to determine the minimum traces for key recovery.
4. Determine the leakage model: compare attack success with Hamming weight model (proportional to number of 1-bits in the value) vs Hamming distance model (proportional to bit transitions from previous state). The model with higher peak correlation wins.
5. Compute the guessing entropy: rank the correct key byte among all 256 hypotheses as a function of number of traces. Plot the number of traces required for the correct key to reach rank 1 (success rate = 1). This is the key metric for attack efficiency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
