# Roc Curve Constructor

Construct the receiver operating characteristic curve and compute the area under the curve for the biomarker.

## Inputs

- `study-cohort`: Cases and controls with biomarker measurements
- `performance-targets`: Minimum performance thresholds

## Outputs

- `roc-curve-data`: Sensitivity and specificity at each threshold, AUC with 95% CI
- `auc-comparison`: AUC compared to existing biomarkers or clinical scores if available

## Process

1. Plot the ROC curve by sweeping the biomarker threshold
2. Compute the AUC with bootstrapped 95% confidence interval
3. Test if AUC differs significantly from chance (0.5) and from comparator biomarkers
4. Visualize the ROC curve with the operating point

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
