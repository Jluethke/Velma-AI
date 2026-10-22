# Value Realization Tracking

Track whether customers are actually realizing the promised value after purchase, and adjust pricing or product if not.

## Inputs

- `roi-calculator`: The expected value model
- `value-proof-points`: Customer examples

## Outputs

- `realization-rate`: What percentage of the promised value customers actually capture (ideally 80%+)
- `value-gap-actions`: If realization is below 80%, specific changes to improve it (better onboarding, feature improvements, customer success intervention)

## Process

1. At 90 days and 12 months after purchase, check in with customers: are they seeing the expected savings, revenue increase, or risk reduction?
2. Calculate the realization rate: actual value captured divided by predicted value. If it is below 80%, there is a gap between promise and delivery.
3. If the gap is caused by low adoption (the customer is not using the product fully), invest in onboarding and customer success. If the gap is caused by overestimation (the value model was too generous), adjust the model downward and reprice.
4. High realization rates justify price increases. If customers consistently capture 120% of the expected value, you are underpriced.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
