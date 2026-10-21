# Spectral Processor Aligner

Process and align the raw spectral data across samples to produce a feature table.

## Inputs

- `raw-spectra`: Raw spectral data from all samples
- `processing-parameters`: Peak detection, alignment, and gap-filling parameters

## Outputs

- `feature-table`: Sample-by-feature matrix of peak areas or intensities
- `processing-report`: Number of features detected, alignment quality, and missing value rate

## Process

1. Detect peaks or bins across all samples (XCMS, MZmine, or NMR bucketing)
2. Align retention times or chemical shifts across the sample set
3. Fill gaps where a feature was detected in some samples but not others
4. Filter features by blank ratio, QC CV, and minimum detection frequency

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
