# Dominant Error Identifier

Identify which input uncertainties contribute most to the output uncertainty and where improvement effort should be directed.

## Inputs

- `sensitivity-coefficients`: Each input's contribution to output uncertainty
- `classified-uncertainties`: Input uncertainties

## Outputs

- `uncertainty-ranking`: Inputs ranked by their contribution to the total uncertainty
- `improvement-targets`: Which measurements to improve and by how much to halve the output uncertainty

## Process

1. Compute each input's percentage contribution to the total variance.
2. Rank inputs from largest to smallest contributor.
3. For the top contributors, estimate how much their uncertainty would need to decrease to halve the output uncertainty.
4. Note whether the dominant source is Type A (can improve with more measurements) or Type B (needs better equipment or calibration).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
