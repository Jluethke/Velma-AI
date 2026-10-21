# Effect Size Comparator

Compare the replication effect size to the original using confidence intervals, equivalence tests, and meta-analytic combination.

## Inputs

- `replication-data`: Data from the replication study
- `original-results`: Reported effect size, sample size, and test statistics from the original study
- `pre-registration`: Pre-registered analysis plan and success criteria

## Outputs

- `replication-results`: Effect size estimate with confidence interval from the replication
- `comparison-analysis`: Side-by-side comparison, equivalence test, and prediction interval check
- `meta-analytic-estimate`: Combined effect size from original and replication with heterogeneity assessment

## Process

1. Run the pre-registered primary analysis on the replication data
2. Calculate the replication effect size and its 95% confidence interval
3. Test whether the replication effect falls within the original's 95% prediction interval
4. Run a TOST equivalence test to assess whether effects are statistically equivalent
5. Compute a fixed-effect meta-analytic combination of original and replication

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
