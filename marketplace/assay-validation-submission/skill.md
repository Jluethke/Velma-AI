# Assay Validation Submission

Validate assay precision, accuracy, linearity, interference, and clinical performance, then compile the analytical and clinical validation package for regulatory submission.

## Inputs

- `optimized-assay-protocol`: Final assay conditions
- `lod-loq-determination`: Sensitivity characterization
- `performance-targets`: Required analytical and clinical performance

## Outputs

- `analytical-validation-report`: Precision, accuracy, linearity, interference, and carryover study results
- `clinical-validation-report`: Clinical sensitivity and specificity vs reference method from clinical specimens
- `regulatory-submission-package`: Complete analytical and clinical evidence package for 510(k), De Novo, or PMA submission

## Process

1. Precision study per CLSI EP05: 2 levels (normal and abnormal), 2 runs per day, 2 replicates per run, 20 days. Calculate within-run, between-run, between-day, and total imprecision. Report as CV at each level. Compare to performance targets.
2. Method comparison per CLSI EP09: test 40+ clinical specimens spanning the reportable range against the reference method. Analyze by Passing-Bablok regression (slope and intercept with 95% CI) and Bland-Altman difference plot (bias and limits of agreement). Acceptable bias depends on clinical use.
3. Linearity per CLSI EP06: prepare mixtures of high and low patient pools at 5+ levels spanning the claimed range. Run in triplicate. Perform polynomial regression; if first-order (linear) fits within allowable error, the range is verified. If non-linear, restrict the reportable range.
4. Interference testing per CLSI EP07: test common endogenous interferents (hemoglobin, bilirubin, lipemia, biotin) and relevant exogenous substances (common medications) at concentrations encountered in clinical specimens. Report bias at each interferent concentration.
5. Clinical validation: test 100+ clinical specimens with known disease status (confirmed by clinical diagnosis or reference standard). Calculate clinical sensitivity (true positive rate) and clinical specificity (true negative rate) with 95% confidence intervals. For 510(k), demonstrate substantial equivalence to predicate device performance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
