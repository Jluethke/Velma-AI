# Validation Cohort Tester

Test the biomarker cutoff in an independent validation cohort to confirm performance.

## Inputs

- `optimal-cutoff`: The cutoff derived from the discovery cohort
- `validation-cohort-data`: Independent cohort with biomarker measurements and diagnoses

## Outputs

- `validation-performance`: Sensitivity, specificity, PPV, NPV, and AUC in the validation cohort
- `calibration-assessment`: Observed vs predicted risk across deciles (calibration plot)

## Process

1. Apply the discovery cutoff to the validation cohort without re-optimization
2. Compute classification performance metrics
3. Construct the calibration plot to assess agreement between predicted and observed risk
4. Compare validation AUC to discovery AUC and test for significant degradation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
