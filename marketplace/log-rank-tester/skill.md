# Log Rank Tester

Test whether survival curves differ significantly between groups using the log-rank test and variants.

## Inputs

- `survival-dataset`: Time, event indicator, and group variable
- `km-curves`: Kaplan-Meier curves for reference

## Outputs

- `logrank-result`: Log-rank chi-squared, degrees of freedom, and p-value
- `test-variants`: Wilcoxon (Breslow) and Tarone-Ware test results for comparison

## Process

1. Compute the log-rank test statistic comparing observed vs. expected events per group.
2. Compute the Wilcoxon variant (weights early events more) and Tarone-Ware variant.
3. Report chi-squared statistics and p-values for each test.
4. Note whether the tests agree or suggest different timing of group divergence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
