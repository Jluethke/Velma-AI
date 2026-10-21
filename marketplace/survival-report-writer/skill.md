# Survival Report Writer

Produce the survival analysis report with KM curves, Cox results, assumption diagnostics, and forest plot.

## Inputs

- `km-estimates`: Kaplan-Meier survival estimates
- `prognostic-factors`: Ranked prognostic factor list
- `diagnostic-plots`: PH assumption diagnostic plots

## Outputs

- `survival-report`: Complete survival analysis report
- `survival-figures`: KM curves, forest plot, and diagnostic plots

## Process

1. Assemble all figures (KM curves, forest plot, Schoenfeld plots).
2. Write the results narrative covering group comparisons and prognostic factors.
3. Describe the methods including event definition, censoring, and model specification.
4. Compile the final report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
