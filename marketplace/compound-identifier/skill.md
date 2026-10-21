# Compound Identifier

Identify compounds by matching retention times to standards, or by retention index, or by spectral library matching if spectral data is available.

## Inputs

- `peak-list`: Detected peaks with retention times
- `reference-library`: Standard retention times, retention indices, or spectral library

## Outputs

- `identified-peaks`: Each peak with its compound assignment and confidence level
- `unidentified-peaks`: Peaks that could not be matched with sufficient confidence

## Process

1. Match each peak's retention time to the reference library within a tolerance window.
2. If retention indices are available, compute and match indices for temperature-independent identification.
3. If spectral data (UV, MS) is available, use library matching with a similarity score.
4. Assign confidence levels: confirmed (standard + spectrum), probable (retention time only), unknown.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
