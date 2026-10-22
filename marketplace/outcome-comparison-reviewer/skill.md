# Outcome Comparison Reviewer

At the outcome check date, compare the prediction to what actually happened. Do not explain away the gap. Record the actual outcome and the delta. If you predicted 85% confidence and were wrong, that is a data point. Over enough entries, patterns emerge.

## Inputs

- `journal-entry`: The original journal entry with the prediction
- `outcome-check-date`: When to check

## Outputs

- `outcome-record`: The actual outcome compared to the predicted outcome, with the delta
- `confidence-accuracy`: Whether the confidence level was well-calibrated (was your 80% prediction right about 80% of the time?)

## Process

1. Look up the actual outcome using the same measurable terms from the prediction.
2. Record the delta: how far off was the prediction? Direction matters (too optimistic or too pessimistic).
3. Do not rationalize. If you were wrong, record that you were wrong. The value is in the pattern, not any single entry.
4. Note whether the information gap you identified at decision time turned out to be the thing that mattered.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
