# Dose Response Report Writer

Produce the dose-response analysis report with fitted curves, parameter table, threshold test results, and methods description.

## Inputs

- `parameter-estimates`: Potency metrics with confidence intervals
- `threshold-test-results`: Hormesis and threshold test outcomes
- `model-comparison`: Model selection summary

## Outputs

- `dose-response-report`: Complete dose-response analysis report
- `dose-response-figures`: Fitted curve plot, residual plot, and threshold test plot

## Process

1. Generate the fitted curve figure with data points, confidence band, and parameter annotations.
2. Build the parameter summary table.
3. Write the methods section covering model selection, fitting, and threshold testing.
4. Compile figures, tables, and narrative into the final report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
