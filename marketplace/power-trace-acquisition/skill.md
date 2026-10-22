# Power Trace Acquisition

Acquire a statistically sufficient set of power consumption traces from the target device executing cryptographic operations with known and random inputs, aligned and preprocessed for statistical analysis.

## Inputs

- `measurement-setup`: Lab configuration and probe placement
- `acquisition-parameters`: Sample rate, trace count, trigger settings

## Outputs

- `trace-dataset`: Aligned power traces with corresponding plaintext/ciphertext pairs, stored in standardized format
- `alignment-quality-report`: Cross-correlation peak statistics, percentage of traces with acceptable alignment

## Process

1. Generate input data: for CPA attacks, use random plaintexts and record both plaintext and ciphertext for each trace. For fixed-vs-random TVLA, alternate between a fixed input and random inputs.
2. Acquire N traces where N is determined by: N > (3 * noise_variance) / (signal_of_interest^2) for 99.7% detection confidence. For AES CPA on unprotected implementations, 1000-5000 traces is typical. For masked implementations, N scales quadratically with masking order.
3. Perform trace alignment using cross-correlation with a reference trace. Select a stable feature (clock edge, operation start) as alignment anchor. Discard traces with correlation coefficient below 0.95.
4. Apply preprocessing: static alignment correction, band-pass filtering to isolate frequency band of interest (typically 1-100 MHz for CMOS switching), DC offset removal, optional compression (principal component analysis for dimensionality reduction).
5. Verify dataset quality: compute mean trace and standard deviation envelope, check for bimodal distributions indicating clock jitter or misalignment, verify input coverage is uniform across the byte space.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
