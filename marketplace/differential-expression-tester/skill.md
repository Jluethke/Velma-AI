# Differential Expression Tester

Test for differentially expressed proteins between conditions: apply appropriate statistical tests with multiple testing correction.

## Inputs

- `normalized-abundances`: Protein abundance matrix
- `experimental-design`: Which samples belong to which condition

## Outputs

- `de-results`: Each protein with fold change, p-value, and adjusted p-value
- `volcano-plot-data`: Log2 fold change vs. -log10 p-value for all proteins

## Process

1. Apply a moderated t-test (limma) or similar method appropriate for the sample size.
2. Compute fold changes between conditions.
3. Correct p-values for multiple testing using Benjamini-Hochberg FDR.
4. Flag proteins as significantly changed based on adjusted p-value and fold change thresholds.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
