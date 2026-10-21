# Cytometry Statistics Extractor

Extract population frequencies, MFIs, and other summary statistics from gated data.

## Inputs

- `gated-populations`: Named cell populations per sample

## Outputs

- `population-statistics`: Frequencies, absolute counts, MFI, and CV for each population per sample
- `statistics-table`: Tabular summary ready for downstream statistical testing

## Process

1. Compute the percentage of parent for each gated population
2. Calculate median fluorescence intensity for relevant markers
3. If bead-based counting was used, convert percentages to absolute counts
4. Assemble the summary table across all samples and populations

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
