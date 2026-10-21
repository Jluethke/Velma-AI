# Ring Width Standardization

Remove the biological age trend from ring-width series to isolate the climate signal, producing dimensionless index values.

## Inputs

- `crossdated-series`: Verified annual ring-width series
- `detrending-method`: Choice of detrending curve (negative exponential, spline, regional curve standardization)

## Outputs

- `standardized-indices`: Dimensionless ring-width index series for each sample
- `detrending-parameters`: Fitted curve type and parameters for each series

## Process

1. Fit the chosen detrending function to each raw ring-width series
2. Divide the measured width by the fitted value to produce a dimensionless index
3. Inspect each standardized series for residual non-climatic trends
4. Document the detrending method and any manual adjustments

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
