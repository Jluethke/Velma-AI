# Optimal Cutoff Determiner

Determine the optimal cutoff for the biomarker using the Youden index or clinical utility criteria.

## Inputs

- `roc-curve-data`: Sensitivity and specificity at each threshold
- `performance-targets`: Minimum acceptable performance metrics

## Outputs

- `optimal-cutoff`: The selected cutoff value with sensitivity, specificity, PPV, and NPV
- `classification-table`: 2x2 contingency table at the chosen cutoff

## Process

1. Compute the Youden index (sensitivity + specificity - 1) at each threshold
2. Identify the threshold maximizing the Youden index
3. Check if this cutoff meets the minimum performance targets
4. Compute PPV and NPV at the chosen cutoff using the study prevalence

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
