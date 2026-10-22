# Experiment Analyzer

Analyze experiment results with proper statistical methods.

## Inputs

- `monitoring-report`: Experiment monitoring data
- `experiment-hypothesis`: The hypothesis and metrics

## Outputs

- `statistical-results`: Test statistics, p-values, and confidence intervals
- `segment-analysis`: Results broken down by key segments

## Process

1. Compute the treatment effect with confidence intervals.
2. Run the statistical test (t-test, Mann-Whitney, or Bayesian posterior).
3. Correct for multiple comparisons if testing multiple metrics.
4. Break down results by pre-defined segments.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
