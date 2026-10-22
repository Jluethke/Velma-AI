# Leading Indicator Validator

Validate that the candidate leading indicators actually predict the lagging outcome.

## Inputs

- `candidate-leading-indicators`: The candidates to validate
- `causal-chains`: The causal chain context

## Outputs

- `validated-leading-indicators`: Indicators that pass: they predict the outcome with reasonable accuracy and lead time
- `leading-indicator-dashboard`: The final set with measurement definitions, targets, and the lagging indicators they predict

## Process

1. Test the correlation: using historical data, does the leading indicator move before the lagging indicator?
2. Test the direction: does more of the leading indicator cause the expected change in the lagging indicator?
3. Test actionability: can you directly influence the leading indicator?
4. Build the dashboard: leading indicators on the left (manage daily), lagging on the right (check monthly).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
