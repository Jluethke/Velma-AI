# Snr Improvement Quantifier

Quantify the signal-to-noise ratio before and after extraction and compute the improvement factor.

## Inputs

- `raw-signal-data`: original data before filtering
- `filtered-signal`: signal after extraction
- `noise-profile`: baseline noise characterization

## Outputs

- `snr-before`: signal-to-noise ratio in the raw data
- `snr-after`: signal-to-noise ratio after filtering
- `improvement-factor`: dB improvement and confidence interval

## Process

1. Compute SNR in the raw data within the signal band
2. Compute SNR in the filtered output within the same band
3. Calculate the improvement in dB
4. Estimate confidence intervals on the improvement from segment-to-segment variation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
