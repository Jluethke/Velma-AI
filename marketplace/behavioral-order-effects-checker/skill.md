# Behavioral Order Effects Checker

Check for unwanted order, practice, or fatigue effects that could confound the main analysis.

## Inputs

- `validated-trials`: Trial-level data with trial number and block information
- `subject-summaries`: Subject-level summaries

## Outputs

- `order-effects-report`: Tests for practice, fatigue, and sequence effects with p-values
- `detrended-data`: Data with significant order effects regressed out if needed

## Process

1. Plot RT and accuracy as a function of trial number or block to inspect for trends.
2. Test for a linear trend across blocks (learning/fatigue) using a regression on block number.
3. Test for condition-by-order interactions to check whether counterbalancing succeeded.
4. If significant order effects exist, decide whether to include block as a covariate or detrend.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
