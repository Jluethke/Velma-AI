# Model Selection Reporter

Write the model selection report: which model was chosen, why, how it performed, and what its limitations are.

## Inputs

- `model-ranking`: Ranked models with scores
- `overfit-assessment`: Overfitting analysis
- `pairwise-tests`: Statistical comparisons

## Outputs

- `model-selection-report`: Structured report suitable for a methods section
- `selected-model`: The chosen model with its final performance estimate and confidence interval

## Process

1. State which model was selected and the criterion used.
2. Report the CV performance estimate with standard error and confidence interval.
3. Describe the overfitting assessment and why the selected model is trustworthy (or its caveats).
4. Note any runner-up models and the conditions under which they might be preferred.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
