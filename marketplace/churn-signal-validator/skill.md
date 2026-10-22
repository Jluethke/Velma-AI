# Churn Signal Validator

Validate the candidate churn signals on a holdout sample. A signal that works on the training data but not on new data is overfitted.

## Inputs

- `candidate-churn-signals`: The candidate predictive signals
- `user-activity-data`: A separate holdout dataset for validation

## Outputs

- `validated-signals`: The signals that predict churn on the holdout data, with their lead time (how far before churn the signal appears) and accuracy
- `churn-risk-scorecard`: A scoring system: users with [signal A + signal B] have [X%] probability of churning within [Y days]

## Process

1. Apply the candidate signals to the holdout data: do they correctly identify the users who later churned?
2. Measure the lead time: how many days before churn does each signal appear? A signal that appears 3 days before churn leaves no time to intervene. A signal at 60 days gives plenty of time.
3. Measure accuracy: what percentage of flagged users actually churned (precision)? What percentage of actual churners were flagged (recall)?
4. Build the scorecard: combine the validated signals into a risk score. Users with multiple signals are highest risk.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
