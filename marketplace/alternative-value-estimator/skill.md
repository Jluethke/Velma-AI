# Alternative Value Estimator

Estimate the expected value of each alternative. Use the same metric for all options (dollars, impact, learning, whatever matters most). The estimate does not need to be precise; it needs to be in the right order of magnitude. A rough estimate of the right thing beats a precise estimate of the wrong thing.

## Inputs

- `alternative-options`: The alternatives you could pursue instead
- `proposed-commitment`: The original commitment for comparison

## Outputs

- `value-estimates`: Expected value estimate for each alternative and the proposed commitment, using the same metric
- `highest-value-alternative`: The single alternative with the highest expected value

## Process

1. Choose the metric that matters most for this decision (revenue, learning, optionality, relationships, health).
2. Estimate the expected value of the proposed commitment on that metric. Use a range, not a point estimate.
3. Estimate the expected value of each alternative on the same metric.
4. Rank all options (including the proposed commitment) by expected value.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
