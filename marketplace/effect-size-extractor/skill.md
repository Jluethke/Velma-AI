# Effect Size Extractor

Extract or compute comparable effect sizes from each study's reported statistics.

## Inputs

- `study-results-table`: table of reported statistics per study (means, SDs, counts, p-values, CIs)
- `target-effect-measure`: desired effect measure (OR, RR, SMD, MD, correlation)

## Outputs

- `effect-size-table`: per-study effect size, variance, and sample size
- `conversion-notes`: documentation of any conversions or imputations applied

## Process

1. Identify the reported statistics available for each study
2. Convert to the target effect measure using standard formulas (Borenstein et al.)
3. Impute missing variances from p-values, confidence intervals, or sample sizes where needed
4. Document every conversion and imputation for transparency

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
