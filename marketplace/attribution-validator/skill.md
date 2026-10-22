# Attribution Validator

Validate the attribution model against known outcomes.

## Inputs

- `attribution-results`: Model output
- `path-data`: Raw conversion paths for comparison

## Outputs

- `validation-results`: Model accuracy and bias assessment
- `model-adjustments`: Recommended adjustments to the model

## Process

1. Compare model predictions against holdout conversions
2. Check for channel bias (over- or under-attribution)
3. Recommend adjustments if needed

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
