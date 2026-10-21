# Statistical Test Selector

Select the statistical test or model that will be used to test the hypothesis, based on the data type, design, and assumptions.

## Inputs

- `research-question`: The question being tested
- `variable-types`: Whether variables are continuous, categorical, ordinal, count, etc.

## Outputs

- `selected-test`: The test or model chosen (e.g., two-sample t-test, mixed-effects ANOVA, logistic regression)
- `assumption-checklist`: Assumptions required by the test and how they will be verified

## Process

1. Classify the outcome variable's measurement level and distribution.
2. Determine whether the design is between-subjects, within-subjects, or mixed.
3. Match the data type and design to the appropriate test family.
4. List the assumptions and plan how to verify each one before analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
