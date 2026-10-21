# Niche Projection Mapper

Project the model to new geographic areas or future climate scenarios.

## Inputs

- `trained-model`: Fitted niche model
- `predictor-stack`: Environmental layers for the projection scenario
- `threshold-selection`: Binary threshold for presence/absence mapping

## Outputs

- `suitability-map`: Continuous habitat suitability surface
- `binary-range-map`: Predicted presence/absence map at the chosen threshold

## Process

1. Apply the model to the target environmental layers
2. Flag areas of extrapolation where predictor values fall outside the training range (MESS map)
3. Apply the binary threshold to produce the range map
4. Overlay with known range boundaries or protected areas for context

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
