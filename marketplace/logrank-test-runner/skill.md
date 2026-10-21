# Logrank Test Runner

Compare survival curves between groups using the log-rank test and its variants.

## Inputs

- `survival-dataset`: Time, event, and group membership
- `test-variant`: Standard log-rank, Wilcoxon (Peto-Prentice), or stratified log-rank

## Outputs

- `logrank-result`: Test statistic, degrees of freedom, and p-value
- `hazard-ratio-estimate`: Unadjusted hazard ratio from the log-rank framework

## Process

1. Select the appropriate test variant based on the expected hazard pattern.
2. Compute observed and expected events per group at each event time.
3. Calculate the test statistic and its p-value.
4. Estimate the unadjusted hazard ratio from the O/E ratio.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
