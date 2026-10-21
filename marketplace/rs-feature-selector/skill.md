# Rs Feature Selector

Select the most discriminating features from spectral bands, indices, and texture measures.

## Inputs

- `corrected-imagery`: Multi-band imagery with computed indices
- `training-samples`: Labeled training samples

## Outputs

- `selected-features`: Ranked feature set with importance scores
- `feature-space-visualization`: Scatter plots of top features colored by class

## Process

1. Extract pixel values for all bands, indices, and texture measures at training locations.
2. Compute feature importance using random forest variable importance or mutual information.
3. Remove highly correlated features (correlation > 0.95) keeping the more important one.
4. Visualize the top features in 2D scatter plots to check class separability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
