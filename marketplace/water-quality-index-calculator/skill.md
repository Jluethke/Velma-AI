# Water Quality Index Calculator

Compute a water quality index (WQI) that combines multiple parameters into a single score for communication and comparison.

## Inputs

- `compiled-results`: All measured parameters with values
- `index-specification`: Which WQI to use (CCME, NSF, or jurisdiction-specific) and its parameter weightings

## Outputs

- `wqi-scores`: Index score for each site and sampling event with the qualitative rating
- `parameter-contributions`: Which parameters contributed most to lowering the index

## Process

1. Select the sub-index functions for each parameter (how each value maps to a 0-100 sub-score).
2. Apply the specified weighting scheme (equal weights or parameter-specific).
3. Aggregate sub-scores into the composite index using the specified formula.
4. Classify each score into a qualitative category (good, fair, poor).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
