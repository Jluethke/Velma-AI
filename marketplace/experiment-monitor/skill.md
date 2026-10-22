# Experiment Monitor

Monitor the running experiment for problems.

## Inputs

- `assignment-config`: The assignment configuration
- `metric-definitions`: Metrics to track during the experiment

## Outputs

- `monitoring-report`: Daily monitoring checks during the experiment
- `sample-ratio-check`: Verification that assignment ratios are correct

## Process

1. Check for sample ratio mismatch daily (chi-squared test).
2. Monitor guardrail metrics for unexpected degradation.
3. Check for novelty effects or time-based trends.
4. Flag any instrumentation issues or data collection gaps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
