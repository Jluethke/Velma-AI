# Age Model Selection

Select the age-depth modeling approach based on the dating density and core type.

## Inputs

- `calibrated-dates`: Calibrated calendar age distributions
- `outlier-candidates`: Flagged potential outliers
- `core-log`: Lithology and sedimentation context

## Outputs

- `model-configuration`: Chosen model (Bacon, OxCal, clam, linear interpolation) with parameter settings
- `outlier-decisions`: Which flagged dates to include, downweight, or exclude and why

## Process

1. Assess dating density and decide if a Bayesian approach is justified
2. Choose the model: Bacon for flexible accumulation, OxCal for sequence models, clam for simple cases
3. Set model parameters: section thickness, accumulation rate prior, memory strength
4. Decide on outlier treatment: exclude, downweight, or model with an outlier probability

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
