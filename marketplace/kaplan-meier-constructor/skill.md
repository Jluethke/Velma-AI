# Kaplan Meier Constructor

Construct Kaplan-Meier survival curves for each group and estimate median survival times.

## Inputs

- `survival-dataset`: Time, event indicator, and group variable
- `grouping-variable`: Variable defining comparison groups (treatment vs. control)

## Outputs

- `km-curves`: Kaplan-Meier survival curves with 95% confidence intervals for each group
- `km-estimates`: Median survival, 1-year and 5-year survival rates per group

## Process

1. Compute the Kaplan-Meier estimator for each group.
2. Calculate the Greenwood confidence intervals at each event time.
3. Estimate median survival and landmark survival rates.
4. Plot the survival curves with number-at-risk table.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
