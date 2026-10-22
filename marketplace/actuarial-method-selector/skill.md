# Actuarial Method Selector

Select and apply the actuarial methods appropriate for the analysis.

## Inputs

- `loss-triangles`: Loss development triangles
- `exposure-and-rate-data`: Exposure, premium, and rate data

## Outputs

- `method-results`: Results from each applied method (development, expected loss ratio, Bornhuetter-Ferguson, frequency-severity)
- `selected-estimate`: The selected point estimate with the rationale for the method weighting

## Process

1. Apply the chain ladder (loss development) method to the paid and incurred triangles.
2. Apply the expected loss ratio method using on-level premiums.
3. Apply the Bornhuetter-Ferguson method as a credibility blend.
4. Compare results across methods and select the final estimate with documented rationale.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
