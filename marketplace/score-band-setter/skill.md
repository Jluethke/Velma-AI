# Score Band Setter

Set the score bands and decision thresholds.

## Inputs

- `weighted-model`: Model with criteria and weights
- `score-range`: Min and max scores

## Outputs

- `score-bands`: Defined bands (excellent, good, fair, poor) with score ranges
- `decision-thresholds`: Approval, review, and decline thresholds

## Process

1. Divide the score range into bands based on risk tiers.
2. Set the approval, manual review, and decline thresholds.
3. Document the expected population distribution across bands.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
