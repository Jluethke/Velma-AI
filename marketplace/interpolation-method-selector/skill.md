# Interpolation Method Selector

Select the interpolation method based on data characteristics, variogram results, and analysis requirements.

## Inputs

- `variogram-model`: Spatial correlation structure
- `projected-point-dataset`: Sample data characteristics (count, distribution, regularity)

## Outputs

- `selected-method`: Chosen interpolation method with parameters (kriging type, IDW power, spline tension)
- `method-justification`: Why this method fits the data and analysis goals

## Process

1. If a clear variogram structure exists, select ordinary or universal kriging for optimal estimation with uncertainty.
2. If sample count is small or variogram is noisy, consider IDW or radial basis functions as alternatives.
3. If the variable has a known trend (e.g., elevation-dependent temperature), select universal kriging or regression kriging.
4. Document the method choice and parameter settings.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
