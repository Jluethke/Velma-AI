# Treatment Comparator

Compare dose-response curves across treatments: test whether EC50 values differ, whether curves are parallel, and whether maximum effects differ.

## Inputs

- `potency-table`: EC50 and curve parameters for each treatment
- `fit-results`: Full fit details for statistical comparison

## Outputs

- `comparison-results`: Statistical tests for EC50 differences, parallelism, and Emax differences
- `potency-ratios`: Relative potency ratios with confidence intervals

## Process

1. Test whether EC50 values differ between treatments (extra-sum-of-squares F-test).
2. Test whether curves are parallel (same Hill slope) by constraining and comparing fits.
3. If parallel, compute the relative potency ratio and its confidence interval.
4. Test whether maximum effects differ by comparing Emax parameters.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
