# Analytical Epi Tester

Test the source hypothesis with an analytical study (case-control or cohort) and compute the measure of association.

## Inputs

- `hypothesis-list`: Hypotheses to test
- `line-list`: Case and non-case data

## Outputs

- `study-results`: Odds ratios or relative risks with confidence intervals and p-values for each exposure
- `dose-response-check`: Dose-response relationship if exposure has graded levels

## Process

1. Select the study design (case-control for rare outcome, cohort for defined population)
2. Enroll controls (matched or unmatched) or define the cohort
3. Compute the odds ratio or relative risk with 95% confidence intervals
4. Test for dose-response and confounding by stratified or multivariable analysis

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
