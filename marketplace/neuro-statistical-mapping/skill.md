# Neuro Statistical Mapping

Run statistical analyses on preprocessed neuroimaging data: model specification, contrast estimation, multiple comparison correction, and ROI extraction.

## Inputs

- `preprocessed-dataset`: Clean neuroimaging data
- `refined-hypothesis`: Contrasts to test
- `roi-list`: A priori regions for targeted analysis

## Outputs

- `statistical-maps`: Whole-brain activation maps with corrected thresholds
- `roi-results`: Effect sizes and p-values within each ROI
- `results-table`: Peak coordinates, cluster sizes, and statistics for significant activations

## Process

1. Specify the general linear model with task regressors and confounds
2. Estimate contrasts of interest at the individual and group level
3. Apply multiple comparison correction (FWE, FDR, or cluster-based)
4. Extract ROI statistics and compute effect sizes
5. Compile a results table with MNI coordinates and cluster information

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
