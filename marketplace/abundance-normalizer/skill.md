# Abundance Normalizer

Quantify and normalize protein abundances across samples: sum peptide intensities, correct for systematic biases, and handle missing values.

## Inputs

- `validated-psms`: Validated peptide identifications with intensities
- `experimental-design`: Sample groups, replicates, and any labeling scheme (label-free, TMT, SILAC)

## Outputs

- `normalized-abundances`: Protein-level abundance matrix (proteins by samples) after normalization
- `normalization-report`: Method used, missing value handling, and before/after distributions

## Process

1. Aggregate peptide-level intensities to protein-level (sum, median, or top-N method).
2. Apply normalization to correct for loading and systematic biases (median centering, quantile, or VSN).
3. Handle missing values: distinguish missing-at-random from missing-not-at-random.
4. Log-transform abundances for downstream statistical analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
