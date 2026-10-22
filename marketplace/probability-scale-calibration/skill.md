# Probability Scale Calibration

Build an anchored probability scale with concrete reference points so that ratings are consistent across raters.

## Inputs

- `specific-risk-statements`: The filtered list of specific risk statements
- `scope-description`: The context for calibrating the scale

## Outputs

- `calibrated-probability-scale`: A 1-5 probability scale where each level has a concrete definition anchored to observable evidence
- `probability-ratings`: Each risk rated on the calibrated scale with a one-sentence justification

## Process

1. Define the 5 levels with concrete anchors: 1 = no evidence this has happened in comparable situations; 2 = has happened once in comparable situations; 3 = happens to roughly 1 in 5 comparable situations; 4 = happens to more than half of comparable situations; 5 = has already begun or is near-certain.
2. For each risk, find the closest anchor. If you lack data, mark the rating as 'estimated' and note what evidence would sharpen it.
3. Where two raters disagree by more than 1 point, surface the disagreement and resolve it by identifying the specific evidence each side is weighting.
4. Document the final rating and the justification for each risk.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
