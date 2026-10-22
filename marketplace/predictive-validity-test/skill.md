# Predictive Validity Test

Test whether each candidate leading indicator actually predicts the outcome. Use historical data if available. If not, design a prospective tracking period. A metric that moves before the outcome but has no causal relationship is a coincidence, not an indicator.

## Inputs

- `candidate-leading-indicators`: The candidate indicators with estimated lead times
- `current-baseline`: Current state of the outcome metric for comparison

## Outputs

- `validated-indicators`: Indicators that passed the predictive validity test, with correlation strength
- `rejected-indicators`: Indicators that failed the test, with the reason (no correlation, too noisy, unmeasurable)

## Process

1. For each candidate, gather at least 8 data points (weeks or months) of historical values for both the indicator and the outcome. Fewer than 8 points cannot distinguish signal from noise.
2. Plot the indicator values against the outcome values shifted by the estimated lead time. If the indicator went up and the outcome later went up (or the reverse, consistently), the correlation is real.
3. If no historical data exists, commit to a 4-8 week prospective tracking period before making decisions based on the indicator. Mark it as 'unvalidated' until then.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
