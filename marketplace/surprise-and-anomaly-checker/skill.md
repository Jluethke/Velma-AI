# Surprise And Anomaly Checker

Check for surprises: evidence that moved the probability much more than expected, or evidence that pointed in the opposite direction from what you predicted. Surprises are the most informative data points. They indicate either that your model of the situation is wrong, or that something unusual is happening.

## Inputs

- `evidence-log`: The evidence and updates applied
- `updated-probability`: The current posterior probability

## Outputs

- `surprise-list`: Evidence that was surprising: moved the probability more than expected or in the opposite direction
- `model-revision-needed`: Whether the surprises indicate your model of the situation needs to change, not just the probability

## Process

1. Review the evidence log. Flag any evidence that moved the probability by more than 15 points in a single update.
2. Flag any evidence that moved in the opposite direction from your prior expectation.
3. For each surprise, ask: does this mean my model is wrong (not just my probability estimate)?
4. If the model might be wrong, consider whether you need to reformulate the hypothesis entirely, not just update the probability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
