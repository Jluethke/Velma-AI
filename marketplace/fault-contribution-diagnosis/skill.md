# Fault Contribution Diagnosis

Diagnose which process variables contributed to each out-of-control event using contribution plots.

## Inputs

- `alarm-log`: Timestamped control limit violations
- `pca-model`: PCA model with loadings
- `new-process-data`: Process data during the alarm periods

## Outputs

- `contribution-plots`: Variable contributions to T-squared and Q at each alarm time
- `root-cause-candidates`: Ranked list of variables most responsible for each alarm event

## Process

1. Compute the contribution of each variable to the T-squared statistic at the alarm time
2. Compute the contribution of each variable to the Q residual at the alarm time
3. Rank variables by contribution magnitude to identify the probable root cause
4. Cross-reference with process knowledge to confirm the diagnosis

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
